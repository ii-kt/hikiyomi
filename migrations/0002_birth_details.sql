ALTER TABLE users ADD COLUMN birth_time TEXT;
ALTER TABLE users ADD COLUMN birth_time_known INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN birth_timezone TEXT;
ALTER TABLE users ADD COLUMN birth_location_json TEXT;
