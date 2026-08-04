import { getEventBySlug } from '../../src/data/events.ts';
import { normalizeUsMobileNumber } from '../lib/phone.js';
import { getLifecycle, publicLifecycle } from '../lib/lifecycle.js';

const MAX_BODY_BYTES = 8_192;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, ...extraHeaders },
  });
}

async function readJsonBody(request) {
  if (!request.body) return { error: 'The RSVP request body is empty.' };
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return { tooLarge: true };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { error: 'The RSVP contains invalid JSON.' };
  }
}

function normalizeSingleLine(value, field, maximum, errors, required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) errors[field] = 'This field is required.';
    return null;
  }
  if (typeof value !== 'string') {
    errors[field] = 'This field must be text.';
    return null;
  }
  const normalized = value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (required && normalized.length === 0) errors[field] = 'This field is required.';
  if (normalized.length > maximum) errors[field] = `This field must be ${maximum} characters or fewer.`;
  return normalized || null;
}

function normalizeMultiline(value, field, maximum, errors) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    errors[field] = 'This field must be text.';
    return null;
  }
  const normalized = value.normalize('NFKC').replace(/\r\n?/g, '\n').trim();
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) {
    errors[field] = 'This field contains unsupported characters.';
  }
  if (normalized.length > maximum) errors[field] = `This field must be ${maximum} characters or fewer.`;
  return normalized || null;
}

function normalizeCount(value, field, errors) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 12) {
    errors[field] = 'Enter a whole number from 0 to 12.';
    return 0;
  }
  return value;
}

function validateSubmission(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: { form: 'The request body must be a JSON object.' } };
  }

  const submissionId = typeof input.submissionId === 'string' ? input.submissionId.trim() : '';
  if (!UUID_PATTERN.test(submissionId)) errors.form = 'The submission identifier is invalid.';

  const eventSlug = typeof input.eventSlug === 'string' ? input.eventSlug.trim().toLowerCase() : '';
  if (!SLUG_PATTERN.test(eventSlug) || !getEventBySlug(eventSlug)) errors.eventSlug = 'This event is not available.';

  const guestName = normalizeSingleLine(input.guestName, 'guestName', 120, errors, true);
  const normalizedMobile = normalizeUsMobileNumber(input.mobileNumber);
  if (normalizedMobile.error) errors.mobileNumber = normalizedMobile.error;
  const attendance = input.attendance;
  if (attendance !== 'attending' && attendance !== 'declines') {
    errors.attendance = 'Choose whether you are attending.';
  }

  let adults = normalizeCount(input.adults, 'adults', errors);
  let children = normalizeCount(input.children, 'children', errors);
  if (attendance === 'declines') {
    adults = 0;
    children = 0;
  } else if (attendance === 'attending' && adults + children < 1) {
    errors.adults = 'Include at least one attending guest.';
  } else if (adults + children > 20) {
    errors.adults = 'The total party size cannot exceed 20.';
  }

  const dietaryRestrictions = normalizeSingleLine(input.dietaryRestrictions, 'dietaryRestrictions', 500, errors);
  const message = normalizeMultiline(input.message, 'message', 1000, errors);

  if (Object.keys(errors).length > 0) return { errors };
  return {
    value: {
      submissionId,
      eventSlug,
      guestName,
      mobileNumber: normalizedMobile.value,
      attendance,
      adults,
      children,
      dietaryRestrictions,
      message,
    },
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Method not allowed.' }, 405, { Allow: 'POST' });
  }

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ ok: false, message: 'Cross-origin submissions are not accepted.' }, 403);
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return json({ ok: false, message: 'Send the RSVP as JSON.' }, 415);
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ ok: false, message: 'The RSVP is too large.' }, 413);
  }

  const parsed = await readJsonBody(request);
  if (parsed.tooLarge) return json({ ok: false, message: 'The RSVP is too large.' }, 413);
  if (parsed.error) return json({ ok: false, message: parsed.error }, 400);

  const validated = validateSubmission(parsed.value);
  if (!validated.value) {
    return json({ ok: false, message: 'Please correct the highlighted RSVP details.', errors: validated.errors }, 400);
  }

  if (!env.DB || typeof env.DB.prepare !== 'function') {
    console.error(JSON.stringify({ message: 'RSVP D1 binding is unavailable', binding: 'DB' }));
    return json({ ok: false, message: 'RSVPs are temporarily unavailable. Please try again later.' }, 503);
  }

  const value = validated.value;
  const lifecycle = await getLifecycle(env, value.eventSlug);
  if (!lifecycle || !publicLifecycle(lifecycle).rsvpOpen) {
    return json({ ok: false, message: 'RSVPs are currently closed for this event.' }, 409);
  }
  try {
    const result = await env.DB.prepare(`
      INSERT INTO rsvps (
        id, event_slug, guest_name, mobile_number, attendance_status, adults, children,
        dietary_restrictions, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(
      value.submissionId,
      value.eventSlug,
      value.guestName,
      value.mobileNumber,
      value.attendance,
      value.adults,
      value.children,
      value.dietaryRestrictions,
      value.message,
    ).run();

    if (!result.success) throw new Error('D1 reported an unsuccessful write.');
    return json({
      ok: true,
      id: value.submissionId,
      duplicate: result.meta?.changes === 0,
      attendance: value.attendance,
    }, result.meta?.changes === 0 ? 200 : 201);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'RSVP database write failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return json({ ok: false, message: 'We could not save your RSVP. Please try again.' }, 500);
  }
}
