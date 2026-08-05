-- Rebuild the RSVP table to replace the original character-by-character GLOB
-- expression, which Cloudflare D1 can reject as "pattern too complex".
-- Existing rows and IDs are copied unchanged.
-- D1 keeps foreign-key enforcement enabled. Defer checks until the table
-- rebuild finishes so event_photos can continue referencing rsvps safely.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE rsvps_repaired (
  id TEXT PRIMARY KEY NOT NULL,
  event_slug TEXT NOT NULL CHECK (length(event_slug) BETWEEN 1 AND 64),
  guest_name TEXT NOT NULL CHECK (length(guest_name) BETWEEN 1 AND 120),
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('attending', 'declines')),
  adults INTEGER NOT NULL DEFAULT 0 CHECK (adults BETWEEN 0 AND 12),
  children INTEGER NOT NULL DEFAULT 0 CHECK (children BETWEEN 0 AND 12),
  dietary_restrictions TEXT CHECK (dietary_restrictions IS NULL OR length(dietary_restrictions) <= 500),
  message TEXT CHECK (message IS NULL OR length(message) <= 1000),
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  mobile_number TEXT CHECK (
    mobile_number IS NULL OR (
      length(mobile_number) = 12
      AND substr(mobile_number, 1, 2) = '+1'
      AND substr(mobile_number, 3, 1) BETWEEN '2' AND '9'
      AND substr(mobile_number, 6, 1) BETWEEN '2' AND '9'
      AND substr(mobile_number, 3) NOT GLOB '*[^0-9]*'
    )
  )
);

INSERT INTO rsvps_repaired (
  id, event_slug, guest_name, attendance_status, adults, children,
  dietary_restrictions, message, submitted_at, mobile_number
)
SELECT
  id, event_slug, guest_name, attendance_status, adults, children,
  dietary_restrictions, message, submitted_at, mobile_number
FROM rsvps;

DROP TABLE rsvps;
ALTER TABLE rsvps_repaired RENAME TO rsvps;

CREATE INDEX rsvps_event_submitted_at_idx
  ON rsvps (event_slug, submitted_at DESC);

PRAGMA foreign_key_check;
