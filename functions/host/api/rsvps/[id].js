import { lifecycleJson } from '../../../lib/lifecycle.js';
import { mutationRequestError } from '../../../lib/request-security.js';

const RSVP_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequest(context) {
  if (context.request.method !== 'DELETE') return lifecycleJson({ ok:false, message:'Method not allowed.' }, 405);
  if (!RSVP_ID.test(context.params.id) || !context.env.DB?.prepare) return lifecycleJson({ ok:false, message:'RSVP not found.' }, 404);
  const requestError = mutationRequestError(context.request);
  if (requestError) return lifecycleJson({ ok:false, message:requestError }, 403);
  const body = await context.request.json().catch(() => null);
  if (body?.confirm !== 'DELETE') return lifecycleJson({ ok:false, message:'Deletion confirmation is required.' }, 400);
  const result = await context.env.DB.prepare('DELETE FROM rsvps WHERE id = ?').bind(context.params.id).run();
  if (!result.success) return lifecycleJson({ ok:false, message:'The RSVP could not be deleted.' }, 500);
  return lifecycleJson({ ok:true, deleted:Number(result.meta?.changes || 0) > 0 });
}
