CREATE TABLE IF NOT EXISTS conversion_events (
  site TEXT NOT NULL,
  day TEXT NOT NULL,
  event_type TEXT NOT NULL,
  landing_path TEXT NOT NULL DEFAULT '/',
  source TEXT NOT NULL DEFAULT 'unknown',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, day, event_type, landing_path, source)
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_day_site
ON conversion_events(day, site);

CREATE INDEX IF NOT EXISTS idx_conversion_events_type
ON conversion_events(event_type, day);
