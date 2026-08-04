import { getLifecycle, lifecycleJson, publicLifecycle } from '../../../../lib/lifecycle.js';

export async function onRequest(context) {
  if (context.request.method !== 'GET') return lifecycleJson({ ok: false, message: 'Method not allowed.' }, 405);
  const state = await getLifecycle(context.env, context.params.event);
  if (!state || state.status === 'draft') return lifecycleJson({ ok: false, message: 'Event not found.' }, 404);
  return lifecycleJson({ ok: true, lifecycle: publicLifecycle(state) });
}
