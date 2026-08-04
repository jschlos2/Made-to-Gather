CREATE TABLE IF NOT EXISTS event_photos (
  id TEXT PRIMARY KEY NOT NULL,
  event_slug TEXT NOT NULL CHECK (length(event_slug) BETWEEN 1 AND 64),
  object_key TEXT NOT NULL UNIQUE CHECK (length(object_key) BETWEEN 1 AND 240),
  original_filename TEXT CHECK (original_filename IS NULL OR length(original_filename) <= 180),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size INTEGER NOT NULL CHECK (file_size BETWEEN 1 AND 8388608),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'removed')),
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  approved_at TEXT,
  associated_rsvp_id TEXT,
  upload_fingerprint TEXT NOT NULL CHECK (length(upload_fingerprint) = 64),
  FOREIGN KEY (associated_rsvp_id) REFERENCES rsvps(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS event_photos_event_status_uploaded_idx
  ON event_photos (event_slug, moderation_status, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS event_photos_upload_rate_idx
  ON event_photos (upload_fingerprint, uploaded_at DESC);
