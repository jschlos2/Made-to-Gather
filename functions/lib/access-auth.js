const encoder = new TextEncoder();

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

function validTeamDomain(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.cloudflareaccess.com')) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function isLoopbackRequest(request) {
  const hostname = new URL(request.url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export async function verifyAccessJwt(token, env) {
  const teamDomain = validTeamDomain(env.TEAM_DOMAIN);
  const audience = typeof env.POLICY_AUD === 'string' ? env.POLICY_AUD.trim() : '';
  if (!teamDomain || !audience) throw new Error('Access authentication is not configured.');
  if (typeof token !== 'string') throw new Error('Cloudflare Access token is missing.');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Cloudflare Access token is malformed.');

  let header;
  let payload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    throw new Error('Cloudflare Access token cannot be decoded.');
  }

  if (header?.alg !== 'RS256' || typeof header.kid !== 'string') {
    throw new Error('Cloudflare Access token uses an unsupported signing key.');
  }

  const certsResponse = await fetch(`${teamDomain}/cdn-cgi/access/certs`, {
    headers: { Accept: 'application/json' },
  });
  if (!certsResponse.ok) throw new Error('Cloudflare Access signing keys are unavailable.');
  const keySet = await certsResponse.json();
  const signingKey = Array.isArray(keySet?.keys)
    ? keySet.keys.find((key) =>
        key?.kid === header.kid
        && key?.kty === 'RSA'
        && (key.alg === undefined || key.alg === 'RS256')
        && (key.use === undefined || key.use === 'sig'))
    : null;
  if (!signingKey) throw new Error('Cloudflare Access signing key was not found.');

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    signingKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    decodeBase64Url(parts[2]),
    encoder.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!verified) throw new Error('Cloudflare Access token signature is invalid.');

  const now = Math.floor(Date.now() / 1000);
  const tokenAudiences = Array.isArray(payload?.aud) ? payload.aud : [payload?.aud];
  if (payload?.iss !== teamDomain) throw new Error('Cloudflare Access token issuer is invalid.');
  if (!tokenAudiences.includes(audience)) throw new Error('Cloudflare Access token audience is invalid.');
  if (!Number.isInteger(payload?.exp) || payload.exp <= now) throw new Error('Cloudflare Access token has expired.');
  if (payload?.nbf !== undefined && (!Number.isInteger(payload.nbf) || payload.nbf > now)) {
    throw new Error('Cloudflare Access token is not active yet.');
  }

  return payload;
}
