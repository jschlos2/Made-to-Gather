import { getEventBySlug } from '../../../../src/data/events.ts';
import { photoBindings, photoJson } from '../../../lib/photos.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') return photoJson({ ok: false, message: 'Method not allowed.' }, 405);
  if (!photoBindings(context.env)) return photoJson({ ok: false, message: 'Photo storage is not configured.' }, 503);
  const url = new URL(context.request.url);
  const event = url.searchParams.get('event') || 'all';
  const status = url.searchParams.get('status') || 'all';
  if (event !== 'all' && !getEventBySlug(event)) return photoJson({ ok: false, message: 'Invalid event.' }, 400);
  if (!['all', 'pending', 'approved', 'removed'].includes(status)) return photoJson({ ok: false, message: 'Invalid status.' }, 400);
  const clauses = [], values = [];
  if (event !== 'all') { clauses.push('event_slug = ?'); values.push(event); }
  if (status !== 'all') { clauses.push('moderation_status = ?'); values.push(status); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await context.env.DB.prepare(`SELECT id, event_slug, original_filename, mime_type, file_size, moderation_status, uploaded_at, approved_at
    FROM event_photos ${where} ORDER BY uploaded_at DESC LIMIT 500`).bind(...values).all();
  const counts = await context.env.DB.prepare(`SELECT moderation_status, COUNT(*) AS count FROM event_photos GROUP BY moderation_status`).all();
  return photoJson({ ok: true, photos: (result.results || []).map((p) => ({ ...p, previewUrl: `/host/api/photos/image/${p.id}` })), counts: Object.fromEntries((counts.results || []).map((r) => [r.moderation_status, r.count])) });
}
