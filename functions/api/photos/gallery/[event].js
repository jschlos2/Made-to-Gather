import { photoBindings, photoEvent, photoJson } from '../../../lib/photos.js';
import { getLifecycle, publicLifecycle } from '../../../lib/lifecycle.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') return photoJson({ ok: false, message: 'Method not allowed.' }, 405);
  const event = photoEvent(context.params.event);
  if (!event?.photos.galleryEnabled) return photoJson({ ok: false, message: 'Gallery unavailable.' }, 404);
  const lifecycle = await getLifecycle(context.env, event.slug);
  if (!lifecycle || !publicLifecycle(lifecycle).galleryEnabled) return photoJson({ ok: false, message: 'Gallery unavailable.' }, 404);
  if (!photoBindings(context.env)) return photoJson({ ok: false, message: 'Photo storage is not configured.' }, 503);
  const result = await context.env.DB.prepare(`SELECT id, mime_type, uploaded_at FROM event_photos
    WHERE event_slug = ? AND moderation_status = 'approved' ORDER BY uploaded_at DESC LIMIT 250`).bind(event.slug).all();
  return photoJson({ ok: true, photos: (result.results || []).map((photo) => ({ id: photo.id, uploadedAt: photo.uploaded_at, src: `/api/photos/image/${photo.id}` })) });
}
