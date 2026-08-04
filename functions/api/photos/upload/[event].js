import { DAILY_UPLOAD_LIMIT, MAX_PHOTO_BYTES, PHOTO_TYPES, magicMatches, photoBindings, photoEvent, photoJson, readBoundedBody, safeFilename, tokenIsValid, uploadFingerprint, validPhotoId } from '../../../lib/photos.js';

export async function onRequest(context) {
  if (!['GET', 'POST'].includes(context.request.method)) return photoJson({ ok: false, message: 'Method not allowed.' }, 405);
  const event = photoEvent(context.params.event);
  if (!event?.photos.uploadsEnabled) return photoJson({ ok: false, message: 'Photo uploads are unavailable.' }, 404);
  const token = context.request.headers.get('X-Upload-Token') || '';
  if (!await tokenIsValid(token, context.env[event.photos.uploadTokenEnv])) return photoJson({ ok: false, message: 'This private upload link is invalid or has expired.' }, 403);
  if (!photoBindings(context.env)) return photoJson({ ok: false, message: 'Photo storage is not configured.' }, 503);
  if (context.request.method === 'GET') return photoJson({ ok: true, event: { slug: event.slug, title: event.title }, limits: { maxBytes: MAX_PHOTO_BYTES, maxFiles: 5 } });

  const type = (context.request.headers.get('Content-Type') || '').split(';')[0].toLowerCase();
  const typeInfo = PHOTO_TYPES.get(type);
  if (!typeInfo) return photoJson({ ok: false, message: 'Choose a JPEG, PNG, or WebP image.' }, 415);
  const declaredSize = Number(context.request.headers.get('Content-Length') || 0);
  if (declaredSize > MAX_PHOTO_BYTES) return photoJson({ ok: false, message: 'Each photo must be 8 MB or smaller.' }, 413);
  const id = context.request.headers.get('X-Photo-Id');
  if (!validPhotoId(id)) return photoJson({ ok: false, message: 'The upload identifier is invalid.' }, 400);
  let buffer;
  try { buffer = await readBoundedBody(context.request); }
  catch (error) { if (error instanceof RangeError) return photoJson({ ok: false, message: 'Each photo must be 8 MB or smaller.' }, 413); throw error; }
  if (!buffer.byteLength) return photoJson({ ok: false, message: 'The selected photo is empty.' }, 400);
  if (buffer.byteLength > MAX_PHOTO_BYTES) return photoJson({ ok: false, message: 'Each photo must be 8 MB or smaller.' }, 413);
  if (!magicMatches(type, new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16)))) return photoJson({ ok: false, message: 'The file contents do not match its image type.' }, 415);

  const existing = await context.env.DB.prepare('SELECT id, event_slug, moderation_status FROM event_photos WHERE id = ?').bind(id).first();
  if (existing) return existing.event_slug === event.slug
    ? photoJson({ ok: true, photo: { id: existing.id, status: existing.moderation_status }, duplicate: true })
    : photoJson({ ok: false, message: 'The upload identifier is invalid.' }, 409);

  const fingerprint = await uploadFingerprint(token, context.request);
  const recent = await context.env.DB.prepare("SELECT COUNT(*) AS count FROM event_photos WHERE upload_fingerprint = ? AND uploaded_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')").bind(fingerprint).first();
  if (Number(recent?.count || 0) >= DAILY_UPLOAD_LIMIT) return photoJson({ ok: false, message: 'This private link has reached its daily upload limit.' }, 429);

  const objectKey = `events/${event.slug}/${id}.${typeInfo.extension}`;
  const filename = safeFilename(context.request.headers.get('X-Photo-Filename'));
  const rsvpId = validPhotoId(context.request.headers.get('X-RSVP-Id')) ? context.request.headers.get('X-RSVP-Id') : null;
  try {
    await context.env.DB.prepare(`INSERT INTO event_photos
      (id, event_slug, object_key, original_filename, mime_type, file_size, associated_rsvp_id, upload_fingerprint)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, event.slug, objectKey, filename, type, buffer.byteLength, rsvpId, fingerprint).run();
  } catch {
    return photoJson({ ok: false, message: 'The photo could not be saved. Please try again.' }, 409);
  }
  try {
    await context.env.PHOTOS.put(objectKey, buffer, { httpMetadata: { contentType: type, cacheControl: 'private, no-store' }, customMetadata: { event: event.slug, photo: id } });
    return photoJson({ ok: true, photo: { id, status: 'pending' } }, 201);
  } catch {
    await context.env.DB.prepare('DELETE FROM event_photos WHERE id = ? AND object_key = ?').bind(id, objectKey).run().catch(() => {});
    return photoJson({ ok: false, message: 'The photo could not be saved. Please try again.' }, 500);
  }
}
