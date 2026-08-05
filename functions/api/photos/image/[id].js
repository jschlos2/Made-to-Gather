import { photoBindings, photoHeaders, validPhotoId } from '../../../lib/photos.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET' || !validPhotoId(context.params.id) || !photoBindings(context.env)) return new Response('Not found', { status: 404, headers: photoHeaders });
  const photo = await context.env.DB.prepare("SELECT object_key, mime_type FROM event_photos WHERE id = ? AND moderation_status = 'approved'").bind(context.params.id).first();
  if (!photo) return new Response('Not found', { status: 404, headers: photoHeaders });
  const object = await context.env.PHOTOS.get(photo.object_key);
  if (!object) return new Response('Not found', { status: 404, headers: photoHeaders });
  return new Response(object.body, { headers: { 'Cache-Control': 'private, no-store', 'Content-Type': photo.mime_type, 'Content-Disposition': 'inline', 'Cross-Origin-Resource-Policy':'same-origin', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options':'DENY', 'X-Robots-Tag': 'noindex, nofollow, noarchive' } });
}
