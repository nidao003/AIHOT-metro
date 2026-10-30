-- Session reconstruction (duration and bounce) groups by session.
CREATE INDEX CONCURRENTLY IF NOT EXISTS analytics_events_session_idx
  ON analytics_events (session_id);
