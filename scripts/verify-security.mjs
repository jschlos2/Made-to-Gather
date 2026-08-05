import assert from 'node:assert/strict';
import { onRequest as deleteRsvp } from '../functions/host/api/rsvps/[id].js';
import { onRequest as uploadPhoto } from '../functions/api/photos/upload/[event].js';
import { onRequest as publicGallery } from '../functions/api/photos/gallery/[event].js';

const id = '018f8af0-67e9-4d23-8d2d-8b9c33f24121';
let deletedWith = null;
const deleteEnv = { DB:{ prepare(sql){ assert.match(sql, /DELETE FROM rsvps WHERE id = \?/); return { bind(value){ deletedWith=value; return this; }, async run(){ return { success:true, meta:{ changes:1 } }; } }; } } };

const crossOriginDelete = await deleteRsvp({ request:new Request(`https://example.com/host/api/rsvps/${id}`, { method:'DELETE', headers:{ Origin:'https://attacker.example', 'Content-Type':'application/json' }, body:JSON.stringify({ confirm:'DELETE' }) }), params:{ id }, env:deleteEnv });
assert.equal(crossOriginDelete.status, 403);
const unconfirmedDelete = await deleteRsvp({ request:new Request(`https://example.com/host/api/rsvps/${id}`, { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body:'{}' }), params:{ id }, env:deleteEnv });
assert.equal(unconfirmedDelete.status, 400);
const confirmedDelete = await deleteRsvp({ request:new Request(`https://example.com/host/api/rsvps/${id}`, { method:'DELETE', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ confirm:'DELETE' }) }), params:{ id }, env:deleteEnv });
assert.equal(confirmedDelete.status, 200); assert.equal(deletedWith, id);

let galleryQuery = '';
const photoEnv = {
  PHOTO_UPLOAD_TOKEN_GRADUATION:'a'.repeat(32),
  PHOTOS:{ async get(){ return null; }, async put(){} },
  DB:{ prepare(sql){
    if (sql.includes('event_lifecycle')) return { bind(){ return this; }, async first(){ return { status:'photos_open', rsvp_open:0, photo_uploads_open:1 }; } };
    galleryQuery=sql; return { bind(){ return this; }, async all(){ return { success:true, results:[{ id, mime_type:'image/jpeg', uploaded_at:'2026-08-04T00:00:00Z' }] }; } };
  } },
};
const invalidToken = await uploadPhoto({ request:new Request('https://example.com/api/photos/upload/graduation', { headers:{ 'X-Upload-Token':'wrong-token' } }), params:{ event:'graduation' }, env:photoEnv });
assert.equal(invalidToken.status, 403);
const validToken = await uploadPhoto({ request:new Request('https://example.com/api/photos/upload/graduation', { headers:{ 'X-Upload-Token':'a'.repeat(32) } }), params:{ event:'graduation' }, env:photoEnv });
assert.equal(validToken.status, 200);
const gallery = await publicGallery({ request:new Request('https://example.com/api/photos/gallery/graduation'), params:{ event:'graduation' }, env:photoEnv });
assert.equal(gallery.status, 200); assert.match(galleryQuery, /moderation_status = 'approved'/); assert.doesNotMatch(galleryQuery, /object_key/);

console.log('Security verification passed: RSVP deletion confirmation, cross-origin rejection, upload-token rejection, and approved-only gallery queries.');
