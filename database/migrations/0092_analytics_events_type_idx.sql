-- Per-day, per-type rollups read the type first and then the window.
CREATE INDEX CONCURRENTLY IF NOT EXISTS analytics_events_type_created_idx
  ON analytics_events (event_type, created_at);
