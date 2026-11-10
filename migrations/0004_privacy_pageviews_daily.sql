CREATE TABLE IF NOT EXISTS privacy_pageviews_daily (
  site TEXT NOT NULL,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  is_bot INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, day, path, is_bot)
);

CREATE INDEX IF NOT EXISTS idx_privacy_pageviews_site_day
  ON privacy_pageviews_daily (site, day);
