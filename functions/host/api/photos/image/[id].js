import { photoBindings, photoHeaders, validPhotoId } from '../../../../lib/photos.js';
export async function onRequest(context) {
  if (context.request.method !== 'GET' || !validPhotoId(context.params.id) || !photoBindings(context.env)) return new Response('Not found', { status: 404, headers: photoHeaders });
  const photo = await context.env.DB.prepare("SELECT object_key, mime_type FROM event_photos WHERE id = ?").bind(context.params.id).first();
  const object = photo && await context.env.PHOTOS.get(photo.object_key);
  if (!photo || !object) return new Response('Not found', { status: 404, headers: photoHeaders });
  return new Response(object.body, { headers: { 'Cache-Control': 'no-store', 'Content-Type': photo.mime_type, 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow, noarchive' } });
}
