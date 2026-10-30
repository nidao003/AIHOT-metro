// Public traffic intake and the admin reads behind /admin/analytics.
// /api/track is unauthenticated by design — it is called by the reader's browser — so it carries its
// own per-address rate limit and leans on the bot filter and dedupe inside recordEvent.
import type { FastifyInstance } from "fastify";
import { articleTitles, deepLanding, dimension, realtime, resolveRange, timeline } from "@aihot/backend/analytics/query";
import { channelName } from "@aihot/backend/analytics/channel";
import { cityName, countryName, deviceName, pathName, referrerName } from "@aihot/backend/analytics/locale";
import { config } from "@aihot/backend/config";
import { recordEvent, type EventType } from "@aihot/backend/analytics/track";
import { adminHandler } from "./admin-auth.ts";
import { q } from "./admin.ts";

const EVENTS = new Set<EventType>(["pageview", "heartbeat", "share", "outbound", "search"]);
const PER_MINUTE = 60;
const buckets = new Map<string, { count: number; resetAt: number }>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    // Keep the map from growing without bound on a hostile day.
    if (buckets.size > 5000) buckets.clear();
    buckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= PER_MINUTE;
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function registerAnalytics(app: FastifyInstance) {
  app.post("/api/track", async (req, reply) => {
    const ip = req.ip;
    if (!allowed(ip)) return reply.code(204).send();
    const b = (req.body ?? {}) as Record<string, unknown>;
    const eventType = str(b.eventType) as EventType | null;
    if (!eventType || !EVENTS.has(eventType)) return reply.code(400).send({ ok: false });
    try {
      await recordEvent({
        eventType,
        path: str(b.path) ?? "",
        visitorId: str(b.visitorId) ?? "",
        sessionId: str(b.sessionId) ?? "",
        articleId: str(b.articleId),
        referrer: str(b.referrer),
        utmSource: str(b.utmSource),
        utmMedium: str(b.utmMedium),
        utmCampaign: str(b.utmCampaign),
        ip,
        userAgent: req.headers["user-agent"] ?? null,
        durationMs: num(b.durationMs),
        scrollPct: num(b.scrollPct),
        shareTarget: str(b.shareTarget),
      });
    } catch (error) {
      req.log.warn({ err: error }, "track insert failed");
    }
    // Always 204: a reader's page must never surface a stats failure.
    return reply.code(204).send();
  });

  app.get("/api/admin/analytics/overview", adminHandler(async (req) => {
    const range = resolveRange(q(req));
    const rows = await timeline(range);
    const sum = rows.reduce((acc, r) => ({
      pv: acc.pv + r.pv, uv: acc.uv + r.uv, sessions: acc.sessions + r.sessions,
      bounces: acc.bounces + r.bounces, shares: acc.shares + r.shares,
      outbound: acc.outbound + r.outbound, searches: acc.searches + r.searches,
    }), { pv: 0, uv: 0, sessions: 0, bounces: 0, shares: 0, outbound: 0, searches: 0 });
    const todayStr = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    return {
      range,
      timeline: rows,
      totals: sum,
      today: rows.find((r) => r.day === todayStr) ?? null,
      realtime: await realtime(),
      deepLanding: await deepLanding(range),
    };
  }));

  app.get("/api/admin/analytics/dimension", adminHandler(async (req) => {
    const f = q(req);
    const name = (f.name ?? "referrer") as "referrer" | "channel" | "device" | "browser" | "country" | "city" | "path" | "article";
    const rows = await dimension(name, resolveRange(f), 30);
    const siteHost = new URL(config.siteUrl).hostname;
    const localize = (value: string): string => name === "city" ? cityName(value)
      : name === "country" ? countryName(value)
      : name === "device" ? deviceName(value)
      : name === "path" ? pathName(value)
      : name === "channel" ? channelName(value)
      : name === "referrer" ? (value === siteHost ? "站内跳转" : referrerName(value))
      : value;
    if (name === "article") {
      const titles = await articleTitles(rows.map((r) => r.value));
      return rows.map((r) => ({ ...r, label: titles[r.value] ?? r.value }));
    }
    return rows.map((r) => ({ ...r, label: localize(r.value) }));
  }));
}
