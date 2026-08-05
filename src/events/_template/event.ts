import { defineEvent, type EventTheme } from '../../data/event-schema.ts';

// Copy this folder to src/events/<your-slug>/ and edit this file.
// Store only environment-variable NAMES here. Never paste a share/upload token.
const eventTheme: EventTheme = {
  name: 'theme-new-event',
  decorativeClasses: [],
  buttonStyle: 'ticket',
  backgroundTreatment: 'plain',
  colors: {
    paper:'#f7f0e2', paperDeep:'#e3d5bd', ink:'#243f46', inkSoft:'#476068',
    accent:'#b85d4b', action:'#a94f3e', panel:'#647957', panelDeep:'#43553b',
    light:'#fffdf7', surround:'#d8c9b1',
  },
  fonts: {
    display:"Georgia, 'Times New Roman', serif",
    body:"'Avenir Next', Avenir, sans-serif",
    label:"'Avenir Next', Avenir, sans-serif",
  },
};

export const newEvent = defineEvent({
  internalId: 'replace-with-stable-internal-id',
  slug: 'replace-with-public-slug',
  privateShareTokenEnv: 'EVENT_SHARE_TOKEN_REPLACE_ME',
  hostFacingName: 'Host-only event name — edit me',
  publishReviewComplete: false,
  indexing: 'noindex',
  eyebrow: 'The details',
  title: 'Invitation title — edit me',
  subtitle: 'Invitation subtitle — edit me',
  artwork: { src:'/events/replace-with-public-slug/hero-placeholder.svg', alt:'Describe the final event artwork', width:1200, height:900 },
  date: { weekday:'Month', monthDay:'Date TBD', year:'2027' },
  time: 'Time TBD',
  calendar: { timeZone:'America/Los_Angeles' },
  location: { name:'Location TBD', address:'Address shared with invited guests after review' },
  hostOnly: { privateStreetAddress:'HOST TO EDIT — never returned by public archive APIs' },
  description: ['Event description — host to edit.'],
  details: [
    { label:'Parking', text:'TBD — host to edit' },
    { label:'Food', text:'TBD — host to edit' },
    { label:'What to bring', text:'TBD — host to edit' },
  ],
  rsvpDeadline: 'TBD — host to edit',
  hosts: 'Host display name — edit me',
  rsvp: {
    mobileRequired:true,
    adultCount:{ label:'Adults attending', minimum:0, maximum:12, defaultValue:1 },
    childCount:{ label:'Children attending', minimum:0, maximum:12, defaultValue:0 },
    dietaryRestrictions:{ label:'Dietary restrictions', enabled:true },
    message:{ label:'Optional note', enabled:true },
  },
  lifecycle: { status:'draft', rsvpOpen:false, photoUploadsOpen:false },
  photos: { uploadsEnabled:false, galleryEnabled:false, uploadTokenEnv:'PHOTO_UPLOAD_TOKEN_REPLACE_ME' },
  theme:eventTheme,
});
