import { isLoopbackRequest, verifyAccessJwt } from '../lib/access-auth.js';

const securityHeaders = {
  'Cache-Control': 'no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function onRequest(context) {
  const localBypass = isLoopbackRequest(context.request) && context.env.HOST_AUTH_DISABLED === 'true';
  if (!localBypass) {
    try {
      context.data.access = await verifyAccessJwt(
        context.request.headers.get('Cf-Access-Jwt-Assertion'),
        context.env,
      );
    } catch (error) {
      console.warn(JSON.stringify({
        message: 'Host dashboard authorization rejected',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return new Response('Forbidden', { status: 403, headers: securityHeaders });
    }
  }

  const response = await context.next();
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(securityHeaders)) secured.headers.set(name, value);
  return secured;
}
