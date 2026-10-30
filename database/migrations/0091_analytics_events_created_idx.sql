-- Timeline and retention queries scan by time across all event types.
CREATE INDEX CONCURRENTLY IF NOT EXISTS analytics_events_created_idx
  ON analytics_events (created_at);
