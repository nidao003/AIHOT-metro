import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/** Anonymous reader id: random, kept in localStorage, never derived from anything personal. */
const VISITOR_KEY = "mh_visitor";
/** A session ends after this much inactivity, matching how the analytics page counts sessions. */
const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_KEY = "mh_session";

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function visitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = randomId();
    localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

function sessionId(): string {
  const now = Date.now();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; at?: number };
      if (parsed.id && typeof parsed.at === "number" && now - parsed.at < SESSION_TTL_MS) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, at: now }));
        return parsed.id;
      }
    }
    const created = randomId();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: created, at: now }));
    return created;
  } catch {
    return randomId();
  }
}

function send(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through to fetch
  }
  void fetch("/api/track", {
    method: "POST",
    body,
    keepalive: true,
    headers: { "content-type": "application/json" },
  }).catch(() => {});
}

function scrollDepth(): number {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.round((window.scrollY / scrollable) * 100));
}

/** Sends pageview on every route change, and a heartbeat with dwell time and scroll depth when the
 *  reader leaves the page or the tab is hidden. Renders nothing. */
export function Tracker() {
  const location = useLocation();
  const enteredAt = useRef<number>(Date.now());
  const maxScroll = useRef<number>(0);
  const path = useRef<string>("");

  useEffect(() => {
    const onScroll = () => {
      maxScroll.current = Math.max(maxScroll.current, scrollDepth());
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const current = location.pathname + location.search;
    if (current === path.current) return;

    // Close out the previous page before starting a new one.
    if (path.current) {
      send({
        eventType: "heartbeat",
        path: path.current,
        visitorId: visitorId(),
        sessionId: sessionId(),
        durationMs: Date.now() - enteredAt.current,
        scrollPct: maxScroll.current,
      });
    }

    path.current = current;
    enteredAt.current = Date.now();
    maxScroll.current = 0;

    const params = new URLSearchParams(location.search);
    const articleMatch = /^\/items\/([A-Za-z0-9_-]+)/.exec(location.pathname);
    send({
      eventType: "pageview",
      path: current,
      articleId: articleMatch?.[1] ?? null,
      visitorId: visitorId(),
      sessionId: sessionId(),
      referrer: document.referrer || null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden" || !path.current) return;
      send({
        eventType: "heartbeat",
        path: path.current,
        visitorId: visitorId(),
        sessionId: sessionId(),
        durationMs: Date.now() - enteredAt.current,
        scrollPct: maxScroll.current,
      });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  return null;
}

/** Fired by share and outbound links; kept here so every caller reports the same shape. */
export function trackAction(eventType: "share" | "outbound" | "search", detail: { path?: string; articleId?: string | null; shareTarget?: string | null } = {}): void {
  send({
    eventType,
    path: detail.path ?? window.location.pathname + window.location.search,
    articleId: detail.articleId ?? null,
    shareTarget: detail.shareTarget ?? null,
    visitorId: visitorId(),
    sessionId: sessionId(),
  });
}
