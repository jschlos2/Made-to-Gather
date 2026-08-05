import { getLifecycle } from './lib/lifecycle.js';

const eventHeaders = {
  'Cache-Control': 'private, no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;
  const match = pathname.match(/^\/events\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|$)/);
  if (!match) return context.next();
  const state = await getLifecycle(context.env, match[1]);
  if (!state || state.status === 'draft') return new Response('Event not found.', { status: 404, headers: eventHeaders });
  const response = await context.next();
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(eventHeaders)) secured.headers.set(name, value);
  return secured;
}
