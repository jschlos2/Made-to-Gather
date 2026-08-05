import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { events } from '../src/data/events.ts';
import { defineEvent } from '../src/data/event-schema.ts';

for (const event of events) {
  const artworkPath = new URL(`../public${event.artwork.src}`, import.meta.url);
  assert.ok(existsSync(artworkPath), `${event.slug}: artwork file not found at public${event.artwork.src}`);
  assert.equal(event.indexing, 'noindex', `${event.slug}: personal events must default to noindex`);
  assert.ok(!('privateStreetAddress' in event.location), `${event.slug}: privateStreetAddress must stay inside hostOnly`);
}

const validDraft = { ...events[1], internalId:'validation-draft', slug:'validation-draft', publishReviewComplete:false, lifecycle:{ status:'draft', rsvpOpen:false, photoUploadsOpen:false } };
assert.equal(defineEvent(validDraft).slug, 'validation-draft');

assert.throws(
  () => defineEvent({ ...validDraft, slug:'Invalid Slug', lifecycle:{ status:'draft', rsvpOpen:true, photoUploadsOpen:false } }),
  /slug must be URL-safe|Draft events cannot have RSVPs open/,
  'Invalid event configurations must fail with actionable errors.',
);

console.log(`Validated ${events.length} registered events and rejected an intentionally invalid draft.`);
