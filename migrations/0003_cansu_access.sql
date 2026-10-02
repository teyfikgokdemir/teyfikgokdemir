CREATE TABLE IF NOT EXISTS cansu_access_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hash TEXT NOT NULL,
  requested_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  requester_ip_hash TEXT,
  requester_ua TEXT
);
CREATE INDEX IF NOT EXISTS idx_cansu_access_codes_expires ON cansu_access_codes(expires_at);

CREATE TABLE IF NOT EXISTS cansu_access_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  ip_hash TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_cansu_access_sessions_expires ON cansu_access_sessions(expires_at);
