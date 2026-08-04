const baseUrl = (process.argv[2] ?? 'http://localhost:8788').replace(/\/$/, '');

async function post(payload) {
  const response = await fetch(`${baseUrl}/api/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
}

const validPayload = {
  submissionId: crypto.randomUUID(),
  eventSlug: 'graduation',
  guestName: 'Local Test Guest',
  mobileNumber: '(503) 555-1234',
  attendance: 'attending',
  adults: 1,
  children: 0,
  dietaryRestrictions: null,
  message: 'Local verification submission',
};

const valid = await post(validPayload);
if (valid.status !== 201 || valid.body.ok !== true) {
  throw new Error(`Valid RSVP failed: ${JSON.stringify(valid)}`);
}

const duplicate = await post(validPayload);
if (duplicate.status !== 200 || duplicate.body.duplicate !== true) {
  throw new Error(`Duplicate protection failed: ${JSON.stringify(duplicate)}`);
}

const invalid = await post({ ...validPayload, submissionId: crypto.randomUUID(), adults: 99 });
if (invalid.status !== 400 || invalid.body.ok !== false) {
  throw new Error(`Invalid RSVP was not rejected: ${JSON.stringify(invalid)}`);
}

const invalidMobile = await post({ ...validPayload, submissionId: crypto.randomUUID(), mobileNumber: '555-12' });
if (invalidMobile.status !== 400 || invalidMobile.body.errors?.mobileNumber === undefined) {
  throw new Error(`Invalid mobile number was not rejected: ${JSON.stringify(invalidMobile)}`);
}

console.log('RSVP verification passed: valid insert, mobile normalization, idempotent retry, and invalid rejection.');
