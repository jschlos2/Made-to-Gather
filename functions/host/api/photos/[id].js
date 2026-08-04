import { photoBindings, photoJson, validPhotoId } from '../../../lib/photos.js';
export async function onRequest(context) {
  if (!validPhotoId(context.params.id) || !photoBindings(context.env)) return photoJson({ ok: false, message: 'Photo not found.' }, 404);
  if (!['PATCH', 'DELETE'].includes(context.request.method)) return photoJson({ ok: false, message: 'Method not allowed.' }, 405);
  const body = await context.request.json().catch(() => ({}));
  const photo = await context.env.DB.prepare('SELECT id, object_key FROM event_photos WHERE id = ?').bind(context.params.id).first();
  if (!photo) return photoJson({ ok: false, message: 'Photo not found.' }, 404);
  if (context.request.method === 'DELETE') {
    if (body.confirm !== 'DELETE') return photoJson({ ok: false, message: 'Deletion confirmation is required.' }, 400);
    await context.env.PHOTOS.delete(photo.object_key);
    await context.env.DB.prepare('DELETE FROM event_photos WHERE id = ?').bind(photo.id).run();
    return photoJson({ ok: true, deleted: true });
  }
  if (!['approve', 'remove', 'restore'].includes(body.action)) return photoJson({ ok: false, message: 'Invalid moderation action.' }, 400);
  const status = body.action === 'approve' ? 'approved' : body.action === 'remove' ? 'removed' : 'pending';
  await context.env.DB.prepare(`UPDATE event_photos SET moderation_status = ?, approved_at = ${status === 'approved' ? "datetime('now')" : 'NULL'} WHERE id = ?`).bind(status, photo.id).run();
  return photoJson({ ok: true, status });
}
