import { photoBindings, photoJson, validPhotoId } from '../../../lib/photos.js';
import { mutationRequestError } from '../../../lib/request-security.js';
export async function onRequest(context) {
  if (context.request.method !== 'POST') return photoJson({ ok: false, message: 'Method not allowed.' }, 405);
  if (!photoBindings(context.env)) return photoJson({ ok: false, message: 'Photo storage is not configured.' }, 503);
  const requestError = mutationRequestError(context.request);
  if (requestError) return photoJson({ ok:false, message:requestError }, 403);
  const body = await context.request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids)].filter(validPhotoId) : [];
  if (body.action !== 'approve' || ids.length < 1 || ids.length > 50) return photoJson({ ok: false, message: 'Select 1–50 valid pending photos.' }, 400);
  const placeholders = ids.map(() => '?').join(',');
  await context.env.DB.prepare(`UPDATE event_photos SET moderation_status = 'approved', approved_at = datetime('now') WHERE moderation_status = 'pending' AND id IN (${placeholders})`).bind(...ids).run();
  return photoJson({ ok: true });
}
