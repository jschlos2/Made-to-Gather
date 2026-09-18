import { defineEvent, validateEventRegistry, type EventTheme, type InvitationEvent } from './event-schema.ts';
export { eventStatuses, type EventStatus, type EventTheme, type InvitationEvent } from './event-schema.ts';

const correspondenceColors: EventTheme['colors'] = {
  paper: '#F7F2E8',
  paperDeep: '#D2C2A6',
  ink: '#285D5B',
  inkSoft: '#6F8E87',
  accent: '#8C6A4A',
  action: '#285D5B',
  panel: '#D2C2A6',
  panelDeep: '#6F8E87',
  light: '#F7F2E8',
  surround: '#D2C2A6',
};

const correspondenceFonts: EventTheme['fonts'] = {
  display: 'Sunflora, Georgia, serif',
  body: "'Serious Sans', 'Avenir Next', Arial, sans-serif",
  label: "'Serious Sans', 'Avenir Next', Arial, sans-serif",
};

const graduationTheme: EventTheme = {
  name: 'theme-graduation',
  decorativeClasses: ['paper-grain', 'retro-postcard'],
  buttonStyle: 'postcard',
  backgroundTreatment: 'paper-grain',
  colors: correspondenceColors,
  fonts: correspondenceFonts,
};

const birthdayTheme: EventTheme = {
  name: 'theme-birthday',
  decorativeClasses: ['birthday-one', 'oktoberfest'],
  buttonStyle: 'ticket',
  backgroundTreatment: 'paper-grain',
  colors: correspondenceColors,
  fonts: correspondenceFonts,
};

const frankieBirthdayTheme: EventTheme = {
  name: 'theme-frankie-birthday',
  decorativeClasses: ['birthday-three', 'placeholder-artwork'],
  buttonStyle: 'pill',
  backgroundTreatment: 'plain',
  colors: correspondenceColors,
  fonts: correspondenceFonts,
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

    date: {
      weekday: 'Saturday',
      monthDay: 'August 29',
      year: '2026',
    },

    time: '12–4 PM',

    calendar: {
      start: '20260829T120000',
      end: '20260829T160000',
      timeZone: 'America/Los_Angeles',
    },

    location: {
      name: 'Private Residence',
      address: '10485 NW Green View Ln',
      mapUrl: 'https://maps.google.com/?q=10485+NW+Green+View+Ln',
    },

    description: [
      'Come celebrate Jennifer’s graduation with drinks, walking tacos, and a slip ’n slide.',
    ],

    details: [
      {
        label: 'Where',
        text: '10485 NW Green View Ln',
      },
      {
        label: 'Bring',
        text: 'Swimsuit and a towel',
      },
      {
        label: 'Food',
        text: 'Walking tacos, cool drinks, and sweet treats',
      },
    ],

    rsvpDeadline: 'August 20',

    hosts: 'The Robertson Family',

    lifecycle: {
      status: 'rsvp_open',
      rsvpOpen: true,
      photoUploadsOpen: true,
      archiveSummary:
        'A sunny afternoon celebrating Jennifer’s graduation with family, tacos, and plenty of backyard fun.',
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
    publishReviewComplete: true,
    eyebrow: 'Prost to one year!',
    title: 'Theo’s First Birthday',
    subtitle: 'Birthtoberfest',

    artwork: {
      src: '/events/theo-first-birthday/hero.jpg',
      alt: 'Theo’s first Birthtoberfest invitation featuring a stein, pretzel, blue diamonds, and alpine flowers',
      width: 1200,
      height: 1680,
    },

    audio: {
      src: '/events/theo-first-birthday/oktoberfest-party.mp3',
      title: 'Oktoberfest party music',
      autoplay: true,
      loop: true,
    },

    date: {
      weekday: 'Saturday',
      monthDay: 'October 17',
      year: '2026',
    },

    time: '1–5:30 PM',

    calendar: {
      start: '20261017T130000',
      end: '20261017T173000',
      timeZone: 'America/Los_Angeles',
    },

    location: {
      name: '',
      address: '12819 NW Lorraine Dr, Portland',
      mapUrl: 'https://maps.google.com/?q=12819+NW+Lorraine+Dr+Portland',
    },

    description: [
      'Raise a stein and shout hooray,',
      'Theo is ONE on this special day!',
      'With pretzels, pints and plenty of cheer,',
      'come help us toast his very first year.',
    ],

    details: [
      {
        label: 'Where',
        text: '12819 NW Lorraine Dr, Portland',
      },
      {
        label: 'Food',
        text: 'Brats, pretzels and festive sips for all ages',
      },
    ],

    links: [
      {
        label: 'View Theo’s wishlist',
        href: 'https://www.amazon.com/hz/wishlist/ls/2UULM6O60MDQM?ref_=wl_share',
      },
    ],

    rsvpDeadline: 'October 10',

    hosts: 'The Robertson’s',

    lifecycle: {
      status: 'rsvp_open',
      rsvpOpen: true,
      photoUploadsOpen: false,
      archiveSummary:
        'Theo’s first birthday gathering — summary to be added after the event.',
    },

    photos: {
      uploadsEnabled: false,
      galleryEnabled: false,
      uploadTokenEnv: 'PHOTO_UPLOAD_TOKEN_THEO_FIRST_BIRTHDAY',
    },

    theme: birthdayTheme,
  }),

  defineEvent({
    internalId: 'frankie-third-birthday-2027',
    slug: 'frankie-third-birthday',
    privateShareTokenEnv: 'EVENT_SHARE_TOKEN_FRANKIE_THIRD_BIRTHDAY',
    hostFacingName: 'Frankie’s third birthday — January 2027',
    publishReviewComplete: false,
    indexing: 'noindex',
    eyebrow: 'Three cheers for Frankie',
    title: 'Frankie’s Third Birthday',
    subtitle: 'January 2027 · Details TBD',

    artwork: {
      src: '/events/frankie-third-birthday/hero-placeholder.svg',
      alt: 'Placeholder artwork for Frankie’s third birthday invitation',
      width: 1200,
      height: 900,
    },

    date: {
      weekday: 'January',
      monthDay: 'Date TBD',
      year: '2027',
    },

    time: 'Time TBD',

    calendar: {
      timeZone: 'America/Los_Angeles',
    },

    location: {
      name: 'Location TBD',
      address: 'Address TBD',
    },

    hostOnly: {
      privateStreetAddress: 'HOST TO ADD BEFORE PUBLISHING',
    },

    description: [
      'Birthday invitation details are being planned. Host to replace this placeholder copy before publishing.',
    ],

    details: [
      { label: 'Where', text: 'TBD — host to edit' },
      { label: 'Food', text: 'TBD — host to edit' },
      { label: 'What to bring', text: 'TBD — host to edit' },
    ],

    rsvpDeadline: 'TBD — host to edit',
    hosts: 'The Robertson Family',

    rsvp: {
      mobileRequired: true,
      adultCount: { label: 'Adults attending', minimum: 0, maximum: 12, defaultValue: 1 },
      childCount: { label: 'Children attending', minimum: 0, maximum: 12, defaultValue: 0 },
      dietaryRestrictions: { label: 'Dietary restrictions', enabled: true },
      message: { label: 'Optional note', enabled: true },
    },

    lifecycle: {
      status: 'draft',
      rsvpOpen: false,
      photoUploadsOpen: false,
      archiveSummary: 'Frankie’s third birthday — host to add a keepsake summary after the event.',
    },

    photos: {
      uploadsEnabled: false,
      galleryEnabled: false,
      uploadTokenEnv: 'PHOTO_UPLOAD_TOKEN_FRANKIE_THIRD_BIRTHDAY',
    },

    theme: frankieBirthdayTheme,
  }),
];

validateEventRegistry(events);

export function getEventBySlug(
  slug: string,
): InvitationEvent | undefined {
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
