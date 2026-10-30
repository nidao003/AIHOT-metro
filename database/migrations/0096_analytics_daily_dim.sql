-- Per-day breakdowns behind the source, device, region and page tables; dimension names the slice.
CREATE TABLE analytics_daily_dim (
  day       date NOT NULL,
  dimension text NOT NULL,
  value     text NOT NULL,
  pv        bigint NOT NULL DEFAULT 0,
  uv        bigint NOT NULL DEFAULT 0,
  sessions  bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (day, dimension, value)
);
