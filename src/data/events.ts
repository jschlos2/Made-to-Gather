import { defineEvent, validateEventRegistry, type EventTheme, type InvitationEvent } from './event-schema.ts';
export { eventStatuses, type EventStatus, type EventTheme, type InvitationEvent } from './event-schema.ts';

const graduationTheme: EventTheme = {
  name: 'theme-graduation',
  decorativeClasses: ['paper-grain', 'retro-postcard'],
  buttonStyle: 'postcard',
  backgroundTreatment: 'paper-grain',
  colors: {
    paper: '#f4e9d2', paperDeep: '#dfd1b5', ink: '#274c5a', inkSoft: '#264d59',
    accent: '#c5644e', action: '#df6841', panel: '#5e7948', panelDeep: '#456c3e',
    light: '#fffaf0', surround: '#d9c8aa',
  },
  fonts: {
    display: "'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive",
    body: "'Avenir Next', Avenir, 'Century Gothic', sans-serif",
    label: "'Arial Narrow', 'Avenir Next Condensed', Impact, sans-serif",
  },
};

const birthdayTheme: EventTheme = {
  name: 'theme-birthday',
  decorativeClasses: ['birthday-one', 'playful-balloons'],
  buttonStyle: 'pill',
  backgroundTreatment: 'birthday-sprinkles',
  colors: {
    paper: '#fff4dc', paperDeep: '#f4c7c3', ink: '#593247', inkSoft: '#754d61',
    accent: '#c84f59', action: '#7d3e54', panel: '#456f6b', panelDeep: '#345a56',
    light: '#fffaf2', surround: '#dfbbb8',
  },
  fonts: {
    display: "'Cooper Black', 'Rockwell Extra Bold', Georgia, serif",
    body: "'Trebuchet MS', 'Avenir Next', sans-serif",
    label: "'Trebuchet MS', 'Avenir Next', sans-serif",
  },
};

export const events: InvitationEvent[] = [
  defineEvent({
    internalId: 'jennifer-graduation-2026',
    slug: 'graduation',
    hostFacingName: 'Jennifer graduation celebration — August 2026',
    publishReviewComplete: true,
    eyebrow: 'The details',
    title: "Jennifer Robertson’s Graduation Celebration",
    subtitle: 'Wish you were here!',
    artwork: {
      src: '/artwork/graduation-poster.jpg',
      alt: 'A retro illustration of a blue slip-and-slide on a green hill beneath a sunny sky',
      width: 1400,
      height: 1095,
    },
    date: { weekday: 'Saturday', monthDay: 'August 29', year: '2026' },
    time: '12–4 PM',
    calendar: { start: '20260829T120000', end: '20260829T160000', timeZone: 'America/Los_Angeles' },
    location: {
     
      address: '10485 NW Green View Ln',
      mapUrl: 'https://maps.google.com/?q=10485+NW+Green+View+Ln',
    },
    description: ['Come celebrate Jennifer’s graduation with drinks, walking tacos, and a slip ’n slide.'],
    details: [
      { label: 'Where', text: '10485 NW Green View Ln' },
      { label: 'Bring', text: 'Swimsuit and a towel' },
      { label: 'Food', text: 'Walking tacos, cool drinks, and sweet treats' },
    ],
    rsvpDeadline: 'August 20',
    hosts: 'The Robertson Family',
    lifecycle: {
      status: 'rsvp_open',
      rsvpOpen: true,
      photoUploadsOpen: true,
      archiveSummary: 'A sunny afternoon celebrating Jennifer’s graduation with family, tacos, and plenty of backyard fun.',
    },
    photos: {
      uploadsEnabled: true,
      galleryEnabled: true,
      uploadTokenEnv: 'PHOTO_UPLOAD_TOKEN_GRADUATION',
    },
    theme: graduationTheme,
  }),
  defineEvent({
    internalId: 'theo-first-birthday-2026',
    slug: 'theo-first-birthday',
    hostFacingName: 'Theo’s first birthday — October 2026',
    publishReviewComplete: false,
    eyebrow: 'First birthday · Details to come',
    title: 'Theo’s First Birthday',
    subtitle: 'Invitation headline — host to edit',
    artwork: {
      src: '/artwork/birthday-balloons.png',
      alt: 'Placeholder artwork with colorful coral, gold, teal, and lavender balloons',
      width: 1400,
      height: 1095,
    },
    date: { weekday: 'October', monthDay: 'Date TBD', year: '2026' },
    time: 'Time TBD',
    calendar: { timeZone: 'America/Los_Angeles' },
    location: {
      name: 'Location TBD',
      address: 'Host to add venue and address',
    },
    description: ['Birthday description placeholder — host to edit before sharing this invitation.'],
    details: [
      { label: 'Location', text: 'TBD — host to add venue details' },
      { label: 'Parking', text: 'TBD — host to add parking instructions' },
      { label: 'Food', text: 'TBD — host to add food details' },
      { label: 'What to bring', text: 'TBD — host to add guest guidance' },
    ],
    rsvpDeadline: 'TBD — host to set deadline',
    hosts: 'Host name — edit before sharing',
    lifecycle: {
      status: 'draft',
      rsvpOpen: false,
      photoUploadsOpen: false,
      archiveSummary: 'Theo’s first birthday gathering — summary to be added after the event.',
    },
    photos: {
      uploadsEnabled: false,
      galleryEnabled: false,
      uploadTokenEnv: 'PHOTO_UPLOAD_TOKEN_THEO_FIRST_BIRTHDAY',
    },
    theme: birthdayTheme,
  }),
];

validateEventRegistry(events);

export function getEventBySlug(slug: string): InvitationEvent | undefined {
  return events.find((event) => event.slug === slug);
}

export function getThemeStyle(theme: EventTheme): string {
  return [
    `--color-paper:${theme.colors.paper}`,
    `--color-paper-deep:${theme.colors.paperDeep}`,
    `--color-ink:${theme.colors.ink}`,
    `--color-ink-soft:${theme.colors.inkSoft}`,
    `--color-coral:${theme.colors.accent}`,
    `--color-orange:${theme.colors.action}`,
    `--color-green:${theme.colors.panel}`,
    `--color-green-deep:${theme.colors.panelDeep}`,
    `--color-white:${theme.colors.light}`,
    `--color-surround:${theme.colors.surround}`,
    `--font-display:${theme.fonts.display}`,
    `--font-body:${theme.fonts.body}`,
    `--font-label:${theme.fonts.label}`,
  ].join(';');
}

export function getThemeClasses(theme: EventTheme): string {
  return [
    theme.name,
    `button-${theme.buttonStyle}`,
    `background-${theme.backgroundTreatment}`,
    ...(theme.decorativeClasses ?? []),
  ].join(' ');
}
