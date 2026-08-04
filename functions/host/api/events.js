import { events, getEventBySlug } from '../../../src/data/events.ts';
import { EVENT_STATUSES, getLifecycle, lifecycleJson } from '../../lib/lifecycle.js';

function eventDate(event) {
  return `${event.date.weekday}, ${event.date.monthDay}, ${event.date.year}`;
}

export async function onRequest(context) {
  if (!context.env.DB?.prepare) return lifecycleJson({ ok: false, message: 'The event database binding is unavailable.' }, 503);
  if (context.request.method === 'GET') {
    const requested = new URL(context.request.url).searchParams.get('event');
    const selected = requested ? events.filter((event) => event.slug === requested) : events;
    if (requested && !selected.length) return lifecycleJson({ ok: false, message: 'Event not found.' }, 404);
    try {
      const [rsvpResult, photoResult] = await Promise.all([
        context.env.DB.prepare('SELECT event_slug, COUNT(*) AS count FROM rsvps GROUP BY event_slug').all(),
        context.env.DB.prepare(`SELECT event_slug,
          SUM(CASE WHEN moderation_status = 'approved' THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN moderation_status = 'pending' THEN 1 ELSE 0 END) AS pending
          FROM event_photos GROUP BY event_slug`).all().catch(() => ({ results: [] })),
      ]);
      const rsvps = new Map((rsvpResult.results || []).map((row) => [row.event_slug, Number(row.count)]));
      const photos = new Map((photoResult.results || []).map((row) => [row.event_slug, { approved: Number(row.approved), pending: Number(row.pending) }]));
      const output = await Promise.all(selected.map(async (event) => {
        const state = await getLifecycle(context.env, event.slug);
        return {
          slug: event.slug, title: event.title, date: eventDate(event), timeZone: event.calendar.timeZone,
          artwork: event.artwork, status: state.status, rsvpOpen: state.rsvpOpen,
          photoUploadsOpen: state.photoUploadsOpen, source: state.source,
          rsvpCount: rsvps.get(event.slug) || 0,
          approvedPhotoCount: photos.get(event.slug)?.approved || 0,
          pendingPhotoCount: photos.get(event.slug)?.pending || 0,
        };
      }));
      return lifecycleJson({ ok: true, events: output });
    } catch {
      return lifecycleJson({ ok: false, message: 'Events could not be loaded.' }, 500);
    }
  }

  if (context.request.method !== 'POST') return lifecycleJson({ ok: false, message: 'Method not allowed.' }, 405);
  const origin = context.request.headers.get('Origin');
  if (origin && origin !== new URL(context.request.url).origin) return lifecycleJson({ ok: false, message: 'Cross-origin updates are not accepted.' }, 403);
  const body = await context.request.json().catch(() => null);
  const event = getEventBySlug(body?.eventSlug);
  if (!event || !EVENT_STATUSES.has(body?.status) || typeof body.rsvpOpen !== 'boolean' || typeof body.photoUploadsOpen !== 'boolean') {
    return lifecycleJson({ ok: false, message: 'The lifecycle update is invalid.' }, 400);
  }
  if (body.status === 'archived' && body.confirmArchive !== true) return lifecycleJson({ ok: false, message: 'Archiving requires confirmation.' }, 400);
  const current = await getLifecycle(context.env, event.slug);
  if (current.rsvpOpen && !body.rsvpOpen && body.confirmClose !== true) return lifecycleJson({ ok: false, message: 'Closing RSVPs requires confirmation.' }, 400);
  const photoUploadsOpen = body.photoUploadsOpen && event.photos.uploadsEnabled;
  try {
    await context.env.DB.prepare(`INSERT INTO event_lifecycle (event_slug, status, rsvp_open, photo_uploads_open, updated_at)
      VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(event_slug) DO UPDATE SET status = excluded.status, rsvp_open = excluded.rsvp_open,
      photo_uploads_open = excluded.photo_uploads_open, updated_at = excluded.updated_at`)
      .bind(event.slug, body.status, body.rsvpOpen ? 1 : 0, photoUploadsOpen ? 1 : 0).run();
    const state = await getLifecycle(context.env, event.slug);
    return lifecycleJson({ ok: true, event: { slug: event.slug, status: state.status, rsvpOpen: state.rsvpOpen, photoUploadsOpen: state.photoUploadsOpen } });
  } catch {
    return lifecycleJson({ ok: false, message: 'The lifecycle update could not be saved.' }, 500);
  }
}
