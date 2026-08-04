import { getEventBySlug } from '../../src/data/events.ts';

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS_PER_BATCH = 5;
export const DAILY_UPLOAD_LIMIT = 20;
export const PHOTO_TYPES = new Map([
  ['image/jpeg', { extension: 'jpg', label: 'JPEG' }],
  ['image/png', { extension: 'png', label: 'PNG' }],
  ['image/webp', { extension: 'webp', label: 'WebP' }],
]);

export const photoHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export function photoJson(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: photoHeaders });
}

export function photoEvent(slug) {
  const event = getEventBySlug(slug);
  return event?.photos?.uploadsEnabled || event?.photos?.galleryEnabled ? event : null;
}

export function safeFilename(value) {
  if (!value) return null;
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* retain original */ }
  const leaf = decoded.normalize('NFKC').split(/[\\/]/).pop();
  const clean = leaf?.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, 180) : null;
}

export function validPhotoId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function digestBytes(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

export async function tokenIsValid(supplied, expected) {
  if (!supplied || !expected || supplied.length > 512 || expected.length < 24) return false;
  const [a, b] = await Promise.all([digestBytes(supplied), digestBytes(expected)]);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

export async function uploadFingerprint(token, request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const bytes = await digestBytes(`${token}\0${ip}`);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function magicMatches(type, bytes) {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((b, i) => bytes[i] === b);
  if (type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export async function readBoundedBody(request, limit = MAX_PHOTO_BYTES) {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new RangeError('PHOTO_TOO_LARGE'); }
    chunks.push(value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
  return output;
}

export function photoBindings(env) {
  return env.DB?.prepare && env.PHOTOS?.put && env.PHOTOS?.get;
}
