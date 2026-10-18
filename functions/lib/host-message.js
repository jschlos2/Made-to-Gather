import { getEventBySlug } from '../../src/data/events.ts';

export function firstName(guestName) {
  const name = typeof guestName === 'string' ? guestName.trim().split(/\s+/)[0] : '';
  return name || 'there';
}

export function createHostMessage(rsvp) {
  const event = getEventBySlug(rsvp.event_slug);
  if (!event) return null;
  const attendance = rsvp.attendance_status === 'attending' ? 'attending' : 'unable to attend';
  const celebration = rsvp.attendance_status === 'attending' ? ' We can’t wait to celebrate with you!' : '';
  return `Made to Gather: Hi ${firstName(rsvp.guest_name)}! We received your RSVP for ${event.title}. You’re marked as ${attendance} for ${event.date.monthDay}, ${event.date.year} at ${event.time}.${celebration}`;
}

export function createSmsUri(mobileNumber, message) {
  return `sms:${mobileNumber}?&body=${encodeURIComponent(message)}`;
}

export function createPostEventMessage(rsvp, uploadUrl) {
  const event = getEventBySlug(rsvp.event_slug);
  const template = event?.hostMessages?.postEventPhotoRequest;
  if (rsvp.attendance_status !== 'attending' || !template || !uploadUrl) return null;
  return template
    .replaceAll('{firstName}', firstName(rsvp.guest_name))
    .replaceAll('{uploadUrl}', uploadUrl);
}
