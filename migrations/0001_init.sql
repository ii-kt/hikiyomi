CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  adult_confirmed INTEGER NOT NULL DEFAULT 0,
  birth_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_fortunes (
  user_id TEXT NOT NULL,
  fortune_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, fortune_date)
);

CREATE TABLE IF NOT EXISTS processed_events (
  webhook_event_id TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_fortunes_date
  ON daily_fortunes (fortune_date);
