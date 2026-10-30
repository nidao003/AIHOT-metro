// One row per reader event. Bots are dropped, a repeat pageview inside the same session and path is
// dropped, and everything else is written as-is: the raw table is the source of truth, and day
// rollups are derived from it rather than replacing it.
import { sql } from "../db.ts";
import { classifyReferrer } from "./channel.ts";
import { parseClient } from "./client.ts";
import { locate, normalizeIp } from "./locate.ts";

export type EventType = "pageview" | "heartbeat" | "share" | "outbound" | "search";

export interface TrackInput {
  eventType: EventType;
  path: string;
  visitorId: string;
  sessionId: string;
  articleId?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  ip: string | null;
  userAgent: string | null;
  durationMs?: number | null;
  scrollPct?: number | null;
  shareTarget?: string | null;
}

/** A reader who reloads, or whose SPA route re-renders, should not log a second view. */
const DEDUPE_WINDOW = "5 minutes";
const MAX_TEXT = 512;

const clip = (v: string | null | undefined): string | null => {
  const s = (v ?? "").trim();
  return s ? s.slice(0, MAX_TEXT) : null;
};

const id = (v: string | null | undefined): string | null => {
  const s = (v ?? "").trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(s) ? s : null;
};

function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.slice(0, 128);
  } catch {
    return null;
  }
}

export async function recordEvent(input: TrackInput): Promise<boolean> {
  const visitor = id(input.visitorId);
  const session = id(input.sessionId);
  const path = clip(input.path);
  if (!visitor || !session || !path) return false;

  const client = parseClient(input.userAgent);
  if (client.isBot) return false;

  if (input.eventType === "pageview") {
    const [seen] = await sql<{ hit: number }[]>`
      SELECT 1 AS hit FROM analytics_events
      WHERE event_type = 'pageview' AND session_id = ${session} AND path = ${path}
        AND created_at > now() - interval '5 minutes'
      LIMIT 1`;
    if (seen) return false;
  }

  const ip = normalizeIp(input.ip);
  const geo = locate(ip);
  const referrer = clip(input.referrer);
  const host = referrerHost(referrer);
  const duration = typeof input.durationMs === "number" && input.durationMs >= 0
    ? Math.min(Math.round(input.durationMs), 24 * 3600 * 1000)
    : null;
  const scroll = typeof input.scrollPct === "number" && input.scrollPct >= 0
    ? Math.min(Math.round(input.scrollPct), 100)
    : null;

  await sql`
    INSERT INTO analytics_events (
      event_type, visitor_id, session_id, path, article_id, referrer, referrer_host, referrer_channel,
      utm_source, utm_medium, utm_campaign, ip, country, region, city, latitude, longitude,
      device_type, browser, os, duration_ms, scroll_pct, share_target
    ) VALUES (
      ${input.eventType}, ${visitor}, ${session}, ${path}, ${clip(input.articleId)},
      ${referrer}, ${host}, ${classifyReferrer(host)},
      ${clip(input.utmSource)}, ${clip(input.utmMedium)}, ${clip(input.utmCampaign)},
      ${ip}, ${geo.country}, ${geo.region}, ${geo.city}, ${geo.latitude}, ${geo.longitude},
      ${client.deviceType}, ${client.browser}, ${client.os}, ${duration}, ${scroll}, ${clip(input.shareTarget)}
    )`;
  return true;
}
