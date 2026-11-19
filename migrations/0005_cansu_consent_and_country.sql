CREATE TABLE IF NOT EXISTS consent_actions_daily (
  site TEXT NOT NULL,
  day TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, day, action)
);

CREATE INDEX IF NOT EXISTS idx_consent_actions_day_site
  ON consent_actions_daily (day, site);

CREATE TABLE IF NOT EXISTS privacy_country_daily (
  site TEXT NOT NULL,
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  is_bot INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site, day, country, is_bot)
);

CREATE INDEX IF NOT EXISTS idx_privacy_country_day_site
  ON privacy_country_daily (day, site);
