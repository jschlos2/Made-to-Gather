export interface EventDetail {
  label: string;
  text: string;
}

export interface EventArtwork {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface EventTheme {
  name: string;
  decorativeClasses?: string[];
  colors: {
    paper: string;
    paperDeep: string;
    ink: string;
    inkSoft: string;
    accent: string;
    action: string;
    panel: string;
    panelDeep: string;
    light: string;
    surround: string;
  };
  fonts: {
    display: string;
    body: string;
    label: string;
  };
}

export interface InvitationEvent {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  artwork: EventArtwork;
  date: {
    weekday: string;
    monthDay: string;
    year: string;
  };
  time: string;
  location: {
    name: string;
    address: string;
    mapUrl: string;
  };
  description: string[];
  details: EventDetail[];
  rsvpDeadline: string;
  hosts: string;
  theme: EventTheme;
  demonstration?: boolean;
}

const graduationTheme: EventTheme = {
  name: 'theme-graduation',
  decorativeClasses: ['paper-grain', 'retro-postcard'],
  colors: {
    paper: '#f3eddd', paperDeep: '#dfd1b5', ink: '#16475a', inkSoft: '#315b68',
    accent: '#d96750', action: '#eb6b3d', panel: '#5e824b', panelDeep: '#456c3e',
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
  decorativeClasses: ['paper-grain', 'playful-balloons'],
  colors: {
    paper: '#fff4dc', paperDeep: '#f4c7c3', ink: '#593247', inkSoft: '#754d61',
    accent: '#c84f59', action: '#7d3e54', panel: '#6da6a0', panelDeep: '#4f817c',
    light: '#fffaf2', surround: '#dfbbb8',
  },
  fonts: {
    display: "'Cooper Black', 'Rockwell Extra Bold', Georgia, serif",
    body: "'Trebuchet MS', 'Avenir Next', sans-serif",
    label: "'Trebuchet MS', 'Avenir Next', sans-serif",
  },
};

export const events: InvitationEvent[] = [
  {
    slug: 'graduation',
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
    time: '2–6 PM',
    location: {
      name: 'The Robertson Home',
      address: '10485 NW Green View Ln',
      mapUrl: 'https://maps.google.com/?q=10485+NW+Green+View+Ln',
    },
    description: ['Come celebrate Jennifer’s graduation with drinks, walking tacos, and a slip ’n slide.'],
    details: [
      { label: 'Where', text: '10485 NW Green View Ln' },
      { label: 'Bring', text: 'Swimsuit and a towel' },
      { label: 'Food', text: 'Walking tacos, cool drinks, and sweet treats' },
      { label: 'Parking', text: 'Please park along Green View Lane and leave driveways clear' },
    ],
    rsvpDeadline: 'August 20',
    hosts: 'The Robertson Family',
    theme: graduationTheme,
  },
  {
    slug: 'birthday',
    eyebrow: 'Demo event · Party details',
    title: 'A Very Happy Birthday Picnic',
    subtitle: 'Cake, balloons, and an afternoon in the park',
    artwork: {
      src: '/artwork/birthday-balloons.png',
      alt: 'A colorful arrangement of coral, gold, teal, and lavender balloons',
      width: 1400,
      height: 1095,
    },
    date: { weekday: 'Sunday', monthDay: 'October 11', year: '2026' },
    time: '1–4 PM',
    location: {
      name: 'Laurel Grove Park',
      address: '18 Garden Path, Portland, Oregon',
      mapUrl: 'https://maps.google.com/?q=Laurel+Grove+Park+Portland+Oregon',
    },
    description: ['This clearly labeled demonstration event shows how new invitations can reuse the same page components with entirely different content, artwork, and styling.'],
    details: [
      { label: 'Where', text: 'Picnic lawn beside the rose garden' },
      { label: 'Bring', text: 'A picnic blanket and your party spirit' },
      { label: 'Food', text: 'Lunch, birthday cake, and lemonade provided' },
      { label: 'Weather', text: 'The covered pavilion is reserved in case of rain' },
    ],
    rsvpDeadline: 'October 1',
    hosts: 'The Demo Party Committee',
    theme: birthdayTheme,
    demonstration: true,
  },
];

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
