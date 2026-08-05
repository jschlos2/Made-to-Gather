import { onRequest as submitRsvp } from '../functions/api/rsvp.js';
import { createHostMessage, createSmsUri } from '../functions/lib/host-message.js';
import { maskUsMobileNumber, normalizeUsMobileNumber } from '../functions/lib/phone.js';
import { copyMessage } from '../src/scripts/copy-message.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const input of ['5035551234', '503-555-1234', '(503) 555-1234', '+1 503 555 1234']) {
  assert(normalizeUsMobileNumber(input).value === '+15035551234', `Failed to normalize ${input}`);
}
for (const input of ['', '555-1234', '+44 20 7946 0958', '123-555-1234', '503-CALL-NOW']) {
  assert(Boolean(normalizeUsMobileNumber(input).error), `Accepted invalid number ${input}`);
}
assert(maskUsMobileNumber('+15035551234') === '(***) ***-1234', 'Mobile masking failed.');

const attending = createHostMessage({ event_slug: 'graduation', guest_name: 'Taylor Guest', attendance_status: 'attending' });
const declining = createHostMessage({ event_slug: 'theo-first-birthday', guest_name: 'Morgan Guest', attendance_status: 'declines' });
assert(attending?.includes('Hi Taylor!') && attending.includes('attending') && attending.includes('can’t wait'), 'Attending message failed.');
assert(declining?.includes('Hi Morgan!') && declining.includes('unable to attend') && !declining.includes('can’t wait'), 'Decline message failed.');
const smsUri = createSmsUri('+15035551234', attending);
assert(smsUri.startsWith('sms:+15035551234?&body='), 'SMS URI recipient was not safely normalized.');
assert(decodeURIComponent(smsUri.split('body=')[1]) === attending, 'SMS message did not round-trip.');

let copied = '';
Object.defineProperties(globalThis, {
  navigator: { configurable: true, value: { clipboard: { writeText: async (value) => { copied = value; } } } },
  window: { configurable: true, value: { isSecureContext: true } },
});
assert(await copyMessage(attending) === true && copied === attending, 'Clipboard fallback helper failed.');
delete globalThis.navigator;
delete globalThis.window;
Object.defineProperties(globalThis, {
  navigator: { configurable: true, value: {} },
  window: { configurable: true, value: { isSecureContext: false } },
});
assert(await copyMessage(declining) === false, 'Clipboard unavailability was not reported.');
delete globalThis.navigator;
delete globalThis.window;

let boundValues;
const statement = {
  bind(...values) { boundValues = values; return this; },
  async run() { return { success: true, meta: { changes: 1 } }; },
};
const response = await submitRsvp({
  request: new Request('https://example.com/api/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
    body: JSON.stringify({
      submissionId: crypto.randomUUID(), eventSlug: 'graduation', guestName: 'Test Guest',
      mobileNumber: '(503) 555-1234', attendance: 'attending', adults: 1, children: 0,
      dietaryRestrictions: '', message: '',
    }),
  }),
  env: { DB: { prepare: () => statement } },
});
assert(response.status === 201 && boundValues?.[3] === '+15035551234', 'Successful RSVP did not store normalized E.164 number.');

const invalidResponse = await submitRsvp({
  request: new Request('https://example.com/api/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
    body: JSON.stringify({
      submissionId: crypto.randomUUID(), eventSlug: 'graduation', guestName: 'Test Guest',
      mobileNumber: '555-12', attendance: 'attending', adults: 1, children: 0,
      dietaryRestrictions: '', message: '',
    }),
  }),
  env: { DB: { prepare: () => { throw new Error('Invalid submission reached the database.'); } } },
});
const invalidBody = await invalidResponse.json();
assert(invalidResponse.status === 400 && invalidBody.errors?.mobileNumber, 'Invalid RSVP mobile number was not rejected.');

console.log('Messaging verification passed: phone validation, normalization, masking, both message variants, SMS URI encoding, clipboard copy fallback, and successful RSVP storage.');
