import { onRequest } from '../functions/host/_middleware.js';

function base64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const teamDomain = 'https://test-team.cloudflareaccess.com';
const audience = 'test-audience';
const keys = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
);
const jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
jwk.kid = 'test-key';
jwk.alg = 'RS256';
jwk.use = 'sig';

async function tokenFor(tokenAudience = audience) {
  const header = base64Url(JSON.stringify({ alg: 'RS256', kid: jwk.kid, typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: teamDomain,
    aud: [tokenAudience],
    exp: Math.floor(Date.now() / 1000) + 300,
    email: 'host@example.com',
  }));
  const input = `${header}.${payload}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, new TextEncoder().encode(input));
  return `${input}.${base64Url(signature)}`;
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => Response.json({ keys: [jwk] });

async function run(token) {
  let nextCalled = false;
  const headers = token ? { 'Cf-Access-Jwt-Assertion': token } : {};
  const response = await onRequest({
    request: new Request('https://made-to-gather.pages.dev/host/', { headers }),
    env: { TEAM_DOMAIN: teamDomain, POLICY_AUD: audience },
    data: {},
    next: async () => {
      nextCalled = true;
      return new Response('authorized');
    },
  });
  return { response, nextCalled };
}

try {
  const unauthorized = await run(null);
  const wrongAudience = await run(await tokenFor('wrong-audience'));
  const authorized = await run(await tokenFor());
  if (unauthorized.response.status !== 403 || unauthorized.nextCalled) throw new Error('Missing token was not rejected.');
  if (wrongAudience.response.status !== 403 || wrongAudience.nextCalled) throw new Error('Wrong audience was not rejected.');
  if (authorized.response.status !== 200 || !authorized.nextCalled) throw new Error('Valid token was not accepted.');
  console.log('Host authentication verification passed: missing and wrong-audience tokens rejected; valid signed token accepted.');
} finally {
  globalThis.fetch = originalFetch;
}
