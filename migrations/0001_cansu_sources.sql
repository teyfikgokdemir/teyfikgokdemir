CREATE TABLE IF NOT EXISTS source_events (
  site TEXT NOT NULL,
  day TEXT NOT NULL,
  source TEXT NOT NULL,
  landing_path TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, day, source, landing_path)
);

CREATE INDEX IF NOT EXISTS idx_source_events_day_site ON source_events(day, site);
