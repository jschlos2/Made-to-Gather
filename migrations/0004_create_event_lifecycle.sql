CREATE TABLE IF NOT EXISTS event_lifecycle (
  event_slug TEXT PRIMARY KEY NOT NULL CHECK (length(event_slug) BETWEEN 1 AND 64),
  status TEXT NOT NULL CHECK (status IN ('draft', 'rsvp_open', 'rsvp_closed', 'event_day', 'photos_open', 'archived')),
  rsvp_open INTEGER NOT NULL DEFAULT 0 CHECK (rsvp_open IN (0, 1)),
  photo_uploads_open INTEGER NOT NULL DEFAULT 0 CHECK (photo_uploads_open IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS event_lifecycle_status_idx ON event_lifecycle (status);
