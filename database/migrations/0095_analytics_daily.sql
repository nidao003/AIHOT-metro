-- One row per calendar day (Asia/Shanghai), refreshed by the nightly rollup job. The admin page reads
-- this instead of scanning analytics_events, which is kept forever and only grows.
CREATE TABLE analytics_daily (
  day             date PRIMARY KEY,
  pv              bigint NOT NULL DEFAULT 0,
  uv              bigint NOT NULL DEFAULT 0,
  sessions        bigint NOT NULL DEFAULT 0,
  bounces         bigint NOT NULL DEFAULT 0,
  shares          bigint NOT NULL DEFAULT 0,
  outbound        bigint NOT NULL DEFAULT 0,
  searches        bigint NOT NULL DEFAULT 0,
  avg_duration_ms bigint NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
