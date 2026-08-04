-- Nullable so existing RSVP records remain valid. The API requires this field for new responses.
ALTER TABLE rsvps ADD COLUMN mobile_number TEXT
  CHECK (
    mobile_number IS NULL OR (
      length(mobile_number) = 12
      AND mobile_number GLOB '+1[2-9][0-9][0-9][2-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    )
  );
