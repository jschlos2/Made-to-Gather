CREATE TABLE IF NOT EXISTS rsvps (
  id TEXT PRIMARY KEY NOT NULL,
  event_slug TEXT NOT NULL CHECK (length(event_slug) BETWEEN 1 AND 64),
  guest_name TEXT NOT NULL CHECK (length(guest_name) BETWEEN 1 AND 120),
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('attending', 'declines')),
  adults INTEGER NOT NULL DEFAULT 0 CHECK (adults BETWEEN 0 AND 12),
  children INTEGER NOT NULL DEFAULT 0 CHECK (children BETWEEN 0 AND 12),
  dietary_restrictions TEXT CHECK (dietary_restrictions IS NULL OR length(dietary_restrictions) <= 500),
  message TEXT CHECK (message IS NULL OR length(message) <= 1000),
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS rsvps_event_submitted_at_idx
  ON rsvps (event_slug, submitted_at DESC);
