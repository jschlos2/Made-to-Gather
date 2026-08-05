import { eventStatuses, getEventBySlug } from '../../src/data/events.ts';

export const EVENT_STATUSES = new Set(eventStatuses);
export const lifecycleHeaders = {
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Frame-Options': 'DENY',
};

export function lifecycleJson(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: lifecycleHeaders });
}

export function defaultLifecycle(event) {
  return {
    status: event.lifecycle.status,
    rsvpOpen: event.lifecycle.rsvpOpen,
    photoUploadsOpen: event.lifecycle.photoUploadsOpen && event.photos.uploadsEnabled,
  };
}

export async function getLifecycle(env, slug) {
  const event = getEventBySlug(slug);
  if (!event) return null;
  const fallback = defaultLifecycle(event);
  if (!env.DB?.prepare) return { event, ...fallback, source: 'configuration' };
  try {
    const row = await env.DB.prepare('SELECT status, rsvp_open, photo_uploads_open, updated_at FROM event_lifecycle WHERE event_slug = ?').bind(slug).first();
    if (!row || !EVENT_STATUSES.has(row.status)) return { event, ...fallback, source: 'configuration' };
    return {
      event,
      status: row.status,
      rsvpOpen: row.rsvp_open === 1,
      photoUploadsOpen: row.photo_uploads_open === 1 && event.photos.uploadsEnabled,
      updatedAt: row.updated_at,
      source: 'database',
    };
  } catch {
    return { event, ...fallback, source: 'configuration' };
  }
}

export function publicLifecycle(state) {
  return {
    status: state.status,
    rsvpOpen: state.status !== 'draft' && state.status !== 'archived' && state.rsvpOpen,
    photoUploadsOpen: state.status !== 'draft' && state.status !== 'archived' && state.photoUploadsOpen,
    galleryEnabled: state.status !== 'draft' && state.event.photos.galleryEnabled,
  };
}
