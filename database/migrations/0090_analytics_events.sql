-- Reader traffic, one row per tracked event. Kept permanently: the admin analytics page reads
-- day aggregates, while raw rows answer the ad-hoc questions those aggregates cannot.
CREATE TABLE analytics_events (
  id            bigserial PRIMARY KEY,
  event_type    text NOT NULL,
  visitor_id    text NOT NULL,
  session_id    text NOT NULL,
  path          text NOT NULL,
  article_id    text,
  referrer      text,
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  ip            text,
  country       text,
  region        text,
  city          text,
  latitude      double precision,
  longitude     double precision,
  device_type   text,
  browser       text,
  os            text,
  duration_ms   integer,
  scroll_pct    smallint,
  share_target  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
