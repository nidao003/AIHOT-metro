-- Per-article traffic rankings only touch rows that name an article.
CREATE INDEX CONCURRENTLY IF NOT EXISTS analytics_events_article_idx
  ON analytics_events (article_id, created_at)
  WHERE article_id IS NOT NULL;
