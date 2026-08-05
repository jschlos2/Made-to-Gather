export const eventStatuses = ['draft', 'rsvp_open', 'rsvp_closed', 'event_day', 'photos_open', 'archived'] as const;
export type EventStatus = typeof eventStatuses[number];
export type IndexingPreference = 'noindex';

export interface EventDetail { label: string; text: string }
export interface EventArtwork { src: string; alt: string; width: number; height: number }
export interface EventTheme {
  name: string;
  decorativeClasses?: string[];
  buttonStyle: 'postcard' | 'pill' | 'ticket';
  backgroundTreatment: 'paper-grain' | 'birthday-sprinkles' | 'plain';
  colors: { paper:string; paperDeep:string; ink:string; inkSoft:string; accent:string; action:string; panel:string; panelDeep:string; light:string; surround:string };
  fonts: { display:string; body:string; label:string };
}
export interface CountQuestion { label:string; minimum:number; maximum:number; defaultValue:number }
export interface TextQuestion { label:string; enabled:boolean; required?:boolean }
export interface EventRsvp {
  mobileRequired: boolean;
  adultCount: CountQuestion;
  childCount: CountQuestion;
  dietaryRestrictions: TextQuestion;
  message: TextQuestion;
}
export interface InvitationEvent {
  internalId: string;
  slug: string;
  privateShareTokenEnv?: string;
  hostFacingName: string;
  publishReviewComplete: boolean;
  indexing: IndexingPreference;
  eyebrow: string;
  title: string;
  subtitle: string;
  artwork: EventArtwork;
  date: { weekday:string; monthDay:string; year:string };
  time: string;
  calendar: { start?:string; end?:string; timeZone:string };
  location: { name:string; address:string; mapUrl?:string };
  hostOnly?: { privateStreetAddress?:string };
  description: string[];
  details: EventDetail[];
  rsvpDeadline: string;
  hosts: string;
  rsvp: EventRsvp;
  lifecycle: { status:EventStatus; rsvpOpen:boolean; photoUploadsOpen:boolean; archiveSummary?:string };
  photos: { uploadsEnabled:boolean; galleryEnabled:boolean; uploadTokenEnv:string };
  theme: EventTheme;
}

export type EventDefinition = Omit<InvitationEvent, 'indexing' | 'rsvp'> & {
  indexing?: IndexingPreference;
  rsvp?: Partial<EventRsvp>;
};

const defaultRsvp: EventRsvp = {
  mobileRequired: true,
  adultCount: { label: 'Adults attending', minimum: 0, maximum: 12, defaultValue: 1 },
  childCount: { label: 'Children attending', minimum: 0, maximum: 12, defaultValue: 0 },
  dietaryRestrictions: { label: 'Dietary restrictions', enabled: true },
  message: { label: 'Notes', enabled: true },
};

function required(value: unknown, path: string, errors: string[]) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} is required.`);
}

export function validateEvent(event: InvitationEvent): string[] {
  const errors: string[] = [];
  required(event.internalId, 'internalId', errors); required(event.slug, 'slug', errors);
  required(event.hostFacingName, 'hostFacingName', errors); required(event.title, 'title', errors);
  required(event.subtitle, 'subtitle', errors); required(event.time, 'time', errors);
  required(event.calendar.timeZone, 'calendar.timeZone', errors); required(event.location.name, 'location.name', errors);
  required(event.rsvpDeadline, 'rsvpDeadline', errors); required(event.artwork.src, 'artwork.src', errors);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.internalId)) errors.push('internalId must use lowercase letters, numbers, and hyphens.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug)) errors.push('slug must be URL-safe lowercase kebab-case.');
  if (!event.artwork.src.startsWith('/')) errors.push('artwork.src must be a root-relative public path.');
  if (!event.artwork.alt.trim()) errors.push('artwork.alt is required.');
  if (!Number.isInteger(event.artwork.width) || event.artwork.width < 1 || !Number.isInteger(event.artwork.height) || event.artwork.height < 1) errors.push('artwork width and height must be positive integers.');
  if (!event.description.length || event.description.some((item) => !item.trim())) errors.push('description must contain at least one non-empty paragraph.');
  if (!event.details.length || event.details.some((item) => !item.label.trim() || !item.text.trim())) errors.push('details must contain labeled, non-empty sections.');
  if ((event.calendar.start && !event.calendar.end) || (!event.calendar.start && event.calendar.end)) errors.push('calendar.start and calendar.end must be provided together.');
  try { new Intl.DateTimeFormat('en-US', { timeZone:event.calendar.timeZone }).format(); } catch { errors.push('calendar.timeZone must be a valid IANA timezone.'); }
  if (event.lifecycle.status === 'draft' && event.lifecycle.rsvpOpen) errors.push('Draft events cannot have RSVPs open.');
  if (event.lifecycle.status !== 'draft' && !event.publishReviewComplete) errors.push('Set publishReviewComplete to true before moving an event out of Draft.');
  if (event.lifecycle.photoUploadsOpen && !event.photos.uploadsEnabled) errors.push('Photo uploads cannot be open when uploadsEnabled is false.');
  if (event.photos.uploadsEnabled && !/^[A-Z][A-Z0-9_]+$/.test(event.photos.uploadTokenEnv)) errors.push('photos.uploadTokenEnv must be an environment-variable name, never a secret value.');
  if (event.privateShareTokenEnv && !/^[A-Z][A-Z0-9_]+$/.test(event.privateShareTokenEnv)) errors.push('privateShareTokenEnv must be an environment-variable name, never a token value.');
  for (const [name, count] of [['adultCount', event.rsvp.adultCount], ['childCount', event.rsvp.childCount]] as const) {
    if (!Number.isInteger(count.minimum) || !Number.isInteger(count.maximum) || count.minimum < 0 || count.maximum > 20 || count.minimum > count.maximum || count.defaultValue < count.minimum || count.defaultValue > count.maximum) errors.push(`rsvp.${name} has invalid count limits or defaultValue.`);
  }
  return errors;
}

export function defineEvent(input: EventDefinition): InvitationEvent {
  const event: InvitationEvent = {
    ...input,
    indexing: input.indexing ?? 'noindex',
    rsvp: {
      ...defaultRsvp,
      ...input.rsvp,
      adultCount: { ...defaultRsvp.adultCount, ...input.rsvp?.adultCount },
      childCount: { ...defaultRsvp.childCount, ...input.rsvp?.childCount },
      dietaryRestrictions: { ...defaultRsvp.dietaryRestrictions, ...input.rsvp?.dietaryRestrictions },
      message: { ...defaultRsvp.message, ...input.rsvp?.message },
    },
  };
  const errors = validateEvent(event);
  if (errors.length) throw new Error(`Invalid event "${input.slug || input.internalId || 'unknown'}":\n- ${errors.join('\n- ')}`);
  return event;
}

export function validateEventRegistry(events: InvitationEvent[]): void {
  const ids = new Set<string>(); const slugs = new Set<string>();
  for (const event of events) {
    if (ids.has(event.internalId)) throw new Error(`Duplicate event internalId: ${event.internalId}`);
    if (slugs.has(event.slug)) throw new Error(`Duplicate event slug: ${event.slug}`);
    ids.add(event.internalId); slugs.add(event.slug);
  }
}
