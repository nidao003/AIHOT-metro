// Nightly rollup: collapse one day of raw events into the aggregates the admin page reads. Raw rows are
// kept forever, so a day can always be recomputed — the upsert makes re-running safe.
import { sql } from "../db.ts";

/** Days are calendar days in Asia/Shanghai, the same calendar the site publishes on. */
const TZ = "Asia/Shanghai";

export async function rollupDay(day: string): Promise<void> {
  await sql`
    WITH scoped AS (
      SELECT * FROM analytics_events
      WHERE (created_at AT TIME ZONE ${TZ})::date = ${day}::date
    ),
    sessions AS (
      SELECT session_id,
        count(*) FILTER (WHERE event_type = 'pageview') AS views,
        EXTRACT(EPOCH FROM (max(created_at) - min(created_at))) * 1000 AS duration_ms
      FROM scoped GROUP BY session_id
    )
    INSERT INTO analytics_daily (day, pv, uv, sessions, bounces, shares, outbound, searches, avg_duration_ms, updated_at)
    SELECT ${day}::date,
      count(*) FILTER (WHERE event_type = 'pageview'),
      count(DISTINCT visitor_id),
      (SELECT count(*) FROM sessions),
      (SELECT count(*) FROM sessions WHERE views <= 1),
      count(*) FILTER (WHERE event_type = 'share'),
      count(*) FILTER (WHERE event_type = 'outbound'),
      count(*) FILTER (WHERE event_type = 'search'),
      (SELECT coalesce(round(avg(duration_ms)), 0) FROM sessions),
      now()
    FROM scoped
    ON CONFLICT (day) DO UPDATE SET
      pv = excluded.pv, uv = excluded.uv, sessions = excluded.sessions, bounces = excluded.bounces,
      shares = excluded.shares, outbound = excluded.outbound, searches = excluded.searches,
      avg_duration_ms = excluded.avg_duration_ms, updated_at = now()`;

  // Every dimension slice the page shows, from the same scoped day.
  await sql`
    WITH scoped AS (
      SELECT * FROM analytics_events
      WHERE event_type = 'pageview' AND (created_at AT TIME ZONE ${TZ})::date = ${day}::date
    ),
    slices AS (
      SELECT 'path' AS dimension, path AS value, visitor_id, session_id FROM scoped
      UNION ALL SELECT 'referrer', coalesce(referrer_host, '(direct)'), visitor_id, session_id FROM scoped
      UNION ALL SELECT 'device', coalesce(device_type, 'unknown'), visitor_id, session_id FROM scoped
      UNION ALL SELECT 'browser', coalesce(browser, 'unknown'), visitor_id, session_id FROM scoped
      UNION ALL SELECT 'region', coalesce(country, '??') || '|' || coalesce(region, ''), visitor_id, session_id FROM scoped
      UNION ALL SELECT 'city', coalesce(city, '(unknown)'), visitor_id, session_id FROM scoped
      UNION ALL SELECT 'article', article_id, visitor_id, session_id FROM scoped WHERE article_id IS NOT NULL
    )
    INSERT INTO analytics_daily_dim (day, dimension, value, pv, uv, sessions)
    SELECT ${day}::date, dimension, value, count(*), count(DISTINCT visitor_id), count(DISTINCT session_id)
    FROM slices GROUP BY dimension, value
    ON CONFLICT (day, dimension, value) DO UPDATE SET
      pv = excluded.pv, uv = excluded.uv, sessions = excluded.sessions`;
}

/** Yesterday, re-rolled every night so late-arriving events and the tail of the day are included. */
export async function rollupRecent(days = 2): Promise<string[]> {
  const done: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const [row] = await sql<{ day: string }[]>`
      SELECT ((now() AT TIME ZONE ${TZ})::date - ${i}::int)::text AS day`;
    if (!row?.day) continue;
    await rollupDay(row.day);
    done.push(row.day);
  }
  return done;
}
