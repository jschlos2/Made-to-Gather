import assert from 'node:assert/strict';
import { magicMatches, readBoundedBody, safeFilename, tokenIsValid, validPhotoId } from '../functions/lib/photos.js';
import { onRequest as moderate } from '../functions/host/api/photos/[id].js';

const id = '018f8af0-67e9-4d23-8d2d-8b9c33f24121';
assert.equal(validPhotoId(id), true);
assert.equal(validPhotoId('../photo'), false);
assert.equal(safeFilename(encodeURIComponent('../family photo.jpg')), 'family photo.jpg');
assert.equal(magicMatches('image/jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0])), true);
assert.equal(magicMatches('image/png', Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])), true);
assert.equal(magicMatches('image/webp', Uint8Array.from([...Buffer.from('RIFF'),0,0,0,0,...Buffer.from('WEBP')])), true);
assert.equal(magicMatches('image/jpeg', Uint8Array.from([0x89, 0x50, 0x4e])), false);
assert.equal(await tokenIsValid('a'.repeat(32), 'a'.repeat(32)), true);
assert.equal(await tokenIsValid('a'.repeat(32), 'b'.repeat(32)), false);
assert.deepEqual(Array.from(await readBoundedBody(new Request('http://localhost', { method: 'POST', body: new Uint8Array([1, 2, 3]), duplex: 'half' }), 3)), [1, 2, 3]);
await assert.rejects(() => readBoundedBody(new Request('http://localhost', { method: 'POST', body: new Uint8Array(4), duplex: 'half' }), 3), RangeError);

let query = '';
const env = {
  PHOTOS: { put() {}, get() {}, async delete() {} },
  DB: { prepare(sql) { query = sql; return { bind() { return this; }, async first() { return { id, object_key: `events/graduation/${id}.jpg` }; }, async run() { return { success: true }; } }; } },
};
const response = await moderate({ request: new Request(`http://localhost/host/api/photos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) }), params: { id }, env });
assert.equal(response.status, 200);
assert.match(query, /moderation_status = \?/);
assert.doesNotMatch(query, new RegExp(id));
const rejected = await moderate({ request: new Request(`http://localhost/host/api/photos/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }), params: { id }, env });
assert.equal(rejected.status, 400);
console.log('Photo validation, signature checks, constant-time token comparison, parameterized moderation, and confirmed deletion checks passed.');
