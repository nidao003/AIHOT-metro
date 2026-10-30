// Admin reads. These scan analytics_events directly: at this site's volume the indexes make that
// cheaper than keeping two sources in sync, and the aggregates in analytics_daily stay available for
// reports that need a settled day. Days are Asia/Shanghai calendar days, matching what readers see.
import { sql } from "../db.ts";

const TZ = "Asia/Shanghai";

export interface DayRow { day: string; pv: number; uv: number; sessions: number; bounces: number; shares: number; outbound: number; searches: number; avgDurationMs: number }

/** Inclusive calendar-day range in the reader calendar, so a custom range means what the admin picked. */
export interface Range { from: string; to: string }

export function resolveRange(params: { days?: string; from?: string; to?: string } = {}): Range {
  const input = params ?? {};
  const day = /^\d{4}-\d{2}-\d{2}$/;
  // Beijing has no DST: shifting by 8h and reading the UTC date is the calendar date readers see.
  // (toLocaleDateString depends on bundled ICU data, which a stripped image may not carry.)
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  if (input.from && input.to && day.test(input.from) && day.test(input.to)) {
    // Swap reversed input rather than returning an empty table.
    return input.from <= input.to ? { from: input.from, to: input.to } : { from: input.to, to: input.from };
  }
  const days = Math.min(Math.max(Number(input.days) || 7, 1), 365);
  const start = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * 86400_000);
  return { from: start.toISOString().slice(0, 10), to: today };
}

export async function timeline(range: Range): Promise<DayRow[]> {
  const rows = await sql<{ day: string; pv: string; uv: string; sessions: string; bounces: string; shares: string; outbound: string; searches: string; avg_duration_ms: string }[]>`
    WITH scoped AS (
      SELECT * FROM analytics_events
      WHERE (created_at AT TIME ZONE ${TZ})::date BETWEEN ${range.from}::date AND ${range.to}::date
    ),
    per_session AS (
      SELECT (created_at AT TIME ZONE ${TZ})::date AS day, session_id,
        count(*) FILTER (WHERE event_type = 'pageview') AS views,
        EXTRACT(EPOCH FROM (max(created_at) - min(created_at))) * 1000 AS duration_ms
      FROM scoped GROUP BY 1, 2
    ),
    per_day AS (
      SELECT (created_at AT TIME ZONE ${TZ})::date AS day,
        count(*) FILTER (WHERE event_type = 'pageview') AS pv,
        count(DISTINCT visitor_id) AS uv,
        count(DISTINCT session_id) AS sessions,
        count(*) FILTER (WHERE event_type = 'share') AS shares,
        count(*) FILTER (WHERE event_type = 'outbound') AS outbound,
        count(*) FILTER (WHERE event_type = 'search') AS searches
      FROM scoped GROUP BY 1
    ),
    session_stats AS (
      SELECT day,
        count(*) FILTER (WHERE views <= 1) AS bounces,
        coalesce(round(avg(duration_ms)), 0) AS avg_duration_ms
      FROM per_session GROUP BY day
    )
    SELECT d.day::text AS day, d.pv::text AS pv, d.uv::text AS uv, d.sessions::text AS sessions,
      coalesce(s.bounces, 0)::text AS bounces, d.shares::text AS shares,
      d.outbound::text AS outbound, d.searches::text AS searches,
      coalesce(s.avg_duration_ms, 0)::text AS avg_duration_ms
    FROM per_day d LEFT JOIN session_stats s ON s.day = d.day
    ORDER BY d.day`;
  return rows.map((r) => ({
    day: r.day,
    pv: Number(r.pv), uv: Number(r.uv), sessions: Number(r.sessions), bounces: Number(r.bounces),
    shares: Number(r.shares), outbound: Number(r.outbound), searches: Number(r.searches),
    avgDurationMs: Number(r.avg_duration_ms),
  }));
}

export async function dimension(name: "referrer" | "channel" | "device" | "browser" | "country" | "city" | "path" | "article", range: Range, limit = 30) {
  const expr = {
    referrer: sql`coalesce(referrer_host, '(direct)')`,
    channel: sql`coalesce(referrer_channel, 'direct')`,
    device: sql`coalesce(device_type, 'unknown')`,
    browser: sql`coalesce(browser, 'unknown')`,
    country: sql`coalesce(country, '??')`,
    city: sql`coalesce(city, '(unknown)')`,
    path: sql`path`,
    article: sql`article_id`,
  }[name];
  const rows = await sql<{ value: string | null; pv: string; uv: string }[]>`
    SELECT ${expr} AS value, count(*)::text AS pv, count(DISTINCT visitor_id)::text AS uv
    FROM analytics_events
    WHERE event_type = 'pageview'
      AND (created_at AT TIME ZONE ${TZ})::date BETWEEN ${range.from}::date AND ${range.to}::date
      ${name === "article" ? sql`AND article_id IS NOT NULL` : sql`AND true`}
    GROUP BY 1 ORDER BY count(*) DESC LIMIT ${limit}`;
  return rows.map((r) => ({ value: r.value ?? "", pv: Number(r.pv), uv: Number(r.uv) }));
}

/** Titles for the article ranking, so the table reads as stories rather than IDs. */
export async function articleTitles(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, string>;
  const rows = await sql<{ id: string; title: string }[]>`
    SELECT id, title FROM articles WHERE id IN ${sql(ids)}`;
  return Object.fromEntries(rows.map((r) => [r.id, r.title]));
}

export async function realtime() {
  const [row] = await sql<{ visitors: string; views: string }[]>`
    SELECT count(DISTINCT visitor_id)::text AS visitors, count(*)::text AS views
    FROM analytics_events
    WHERE event_type = 'pageview' AND created_at > now() - interval '5 minutes'`;
  return { visitors: Number(row?.visitors ?? 0), views: Number(row?.views ?? 0) };
}

/** Sessions whose first view was an article page and carried no referrer. AI assistants and chat
 *  apps open links this way, so this ratio is the only signal we have for that traffic. */
export async function deepLanding(range: Range) {
  const [row] = await sql<{ deep: string; total: string }[]>`
    WITH firsts AS (
      SELECT DISTINCT ON (session_id) session_id, path, coalesce(referrer_channel, 'direct') AS channel
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND (created_at AT TIME ZONE ${TZ})::date BETWEEN ${range.from}::date AND ${range.to}::date
      ORDER BY session_id, created_at
    )
    SELECT count(*) FILTER (WHERE path LIKE '/items/%' AND channel = 'direct')::text AS deep,
      count(*)::text AS total
    FROM firsts`;
  return { deep: Number(row?.deep ?? 0), sessions: Number(row?.total ?? 0) };
}
