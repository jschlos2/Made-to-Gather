import { defineEvent, validateEventRegistry, type EventTheme, type InvitationEvent } from './event-schema.ts';
export { eventStatuses, type EventStatus, type EventTheme, type InvitationEvent } from './event-schema.ts';

const graduationTheme: EventTheme = {
  name: 'theme-graduation',
  decorativeClasses: ['paper-grain', 'retro-postcard'],
  buttonStyle: 'postcard',
  backgroundTreatment: 'paper-grain',
  colors: {
    paper: '#f4e9d2',
    paperDeep: '#dfd1b5',
    ink: '#274c5a',
    inkSoft: '#264d59',
    accent: '#c5644e',
    action: '#df6841',
    panel: '#5e7948',
    panelDeep: '#456c3e',
    light: '#fffaf0',
    surround: '#d9c8aa',
  },
  fonts: {
    display: "'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive",
    body: "'Avenir Next', Avenir, 'Century Gothic', sans-serif",
    label: "'Arial Narrow', 'Avenir Next Condensed', Impact, sans-serif",
  },
};

const birthdayTheme: EventTheme = {
  name: 'theme-birthday',
  decorativeClasses: ['birthday-one', 'oktoberfest'],
  buttonStyle: 'ticket',
  backgroundTreatment: 'paper-grain',
  colors: {
    paper: '#fbf1d4',
    paperDeep: '#ead9ad',
    ink: '#0f648b',
    inkSoft: '#244f5f',
    accent: '#e7ae20',
    action: '#0f6b94',
    panel: '#176f96',
    panelDeep: '#0f5879',
    light: '#fff9e8',
    surround: '#d5c295',
  },
  fonts: {
    display: "'Alfa Slab One', Rockwell, serif",
    body: "Lora, Georgia, serif",
    label: "Lora, Georgia, serif",
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
