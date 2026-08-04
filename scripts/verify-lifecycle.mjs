import assert from 'node:assert/strict';
import { events } from '../src/data/events.ts';
import { publicLifecycle } from '../functions/lib/lifecycle.js';
import { onRequest as eventGuard } from '../functions/_middleware.js';
import { onRequest as hostEvents } from '../functions/host/api/events.js';

const event = events.find((item) => item.slug === 'graduation');
const expected = {
  draft: { rsvpOpen: false, photoUploadsOpen: false, galleryEnabled: false },
  rsvp_open: { rsvpOpen: true, photoUploadsOpen: false, galleryEnabled: true },
  rsvp_closed: { rsvpOpen: false, photoUploadsOpen: false, galleryEnabled: true },
  event_day: { rsvpOpen: false, photoUploadsOpen: true, galleryEnabled: true },
  photos_open: { rsvpOpen: false, photoUploadsOpen: true, galleryEnabled: true },
  archived: { rsvpOpen: false, photoUploadsOpen: false, galleryEnabled: true },
};
for (const [status, behavior] of Object.entries(expected)) {
  const state = publicLifecycle({ event, status, rsvpOpen: status === 'rsvp_open', photoUploadsOpen: ['event_day', 'photos_open'].includes(status) });
  assert.deepEqual({ rsvpOpen: state.rsvpOpen, photoUploadsOpen: state.photoUploadsOpen, galleryEnabled: state.galleryEnabled }, behavior, status);
}

const draftResponse = await eventGuard({ env: {}, request: new Request('https://example.com/events/birthday/'), next: async () => new Response('should not render') });
assert.equal(draftResponse.status, 404);
const openResponse = await eventGuard({ env: {}, request: new Request('https://example.com/events/graduation/'), next: async () => new Response('invitation') });
assert.equal(openResponse.status, 200);
assert.equal(openResponse.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');

const prepared = [];
const db = { prepare(sql) { prepared.push(sql); return { bind() { return this; }, async first() { return null; }, async run() { return { success: true }; }, async all() { return { success: true, results: [] }; } }; } };
const unconfirmedArchive = await hostEvents({
  env: { DB: db },
  request: new Request('http://localhost/host/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventSlug: 'graduation', status: 'archived', rsvpOpen: false, photoUploadsOpen: false, confirmClose: true }) }),
});
assert.equal(unconfirmedArchive.status, 400);
const confirmedArchive = await hostEvents({
  env: { DB: db },
  request: new Request('http://localhost/host/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventSlug: 'graduation', status: 'archived', rsvpOpen: false, photoUploadsOpen: false, confirmClose: true, confirmArchive: true }) }),
});
assert.equal(confirmedArchive.status, 200);
assert.ok(prepared.some((sql) => sql.includes('ON CONFLICT(event_slug)')));

console.log('All six lifecycle states, draft route protection, noindex headers, confirmation enforcement, and parameterized lifecycle writes passed.');
