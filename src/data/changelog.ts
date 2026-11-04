import type { ChangelogEntry } from '../lib/changelog';

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-11-04',
    tools: ['/dates/shadow/', '/music/tuner/', '/text/list-compare/'],
    notes: [
      'Decode Base64 into real files and download them, or encode a local file to Base64.',
      'Add a command palette with recent tools, plus a search page with category filters.',
    ],
  },
  {
    date: '2026-10-21',
    tools: ['/math/dice/', '/music/metronome/'],
    notes: [
      'Add a dice roller with modifiers and roll history.',
      'Add a metronome with tap tempo, accents and subdivisions.',
    ],
  },
  {
    date: '2026-10-15',
    tools: ['/networking/download-time/', '/converters/bandwidth/'],
    notes: [
      'Split converters into one page per dimension, each with its own URL.',
      'Add a decimal and binary prefix table to the data and bandwidth converters.',
    ],
  },
  {
    date: '2026-10-09',
    tools: ['/security/password/'],
    notes: ['Add a password and passphrase generator that never leaves the browser.'],
  },
  {
    date: '2026-10-08',
    notes: [
      'Remember the world clock board between visits.',
      'Add a reset button for the saved board.',
    ],
  },
  {
    date: '2026-10-07',
    tools: [
      '/text/json/',
      '/text/diff/',
      '/networking/subnet/',
      '/dates/sunrise-sunset/',
      '/dates/world-clock/',
      '/dates/birthday-weekday/',
      '/converters/length/',
      '/converters/mass/',
      '/converters/temperature/',
      '/converters/area/',
      '/converters/volume/',
      '/converters/speed/',
      '/converters/time/',
      '/converters/data/',
    ],
    notes: [
      'Add a JSON formatter and a line diff checker.',
      'Add a subnet calculator with CIDR and netmask input.',
      'Add sunrise, sunset and twilight times for any place and date.',
      'Add a world clock board with multiple time zones and watchfaces.',
      'Show the weekday of every birthday, past and future.',
    ],
  },
  {
    date: '2026-10-01',
    tools: [
      '/dates/age/',
      '/dates/duration/',
      '/dates/unix/',
      '/math/tip-splitter/',
      '/math/base-converter/',
      '/text/case-converter/',
      '/text/base64/',
      '/text/url-encode/',
      '/text/counter/',
      '/text/uuid/',
      '/text/hash/',
      '/text/lorem-ipsum/',
    ],
    notes: [
      'Add the Text & Code category with seven tools that run entirely in the browser.',
      'Add age, duration and Unix timestamp calculators.',
      'Add a tip splitter and a number base converter.',
    ],
  },
  {
    date: '2026-09-30',
    tools: ['/music/chord-finder/', '/music/circle-of-fifths/'],
    notes: [
      'Add the Music category with scales, diatonic chords and the circle of fifths.',
      'Play scales and chords with the Web Audio API.',
    ],
  },
  {
    date: '2026-09-29',
    tools: [
      '/math/percent-of/',
      '/math/what-percent/',
      '/math/percent-change/',
      '/math/add-percent/',
      '/math/rule-of-three/',
    ],
    notes: ['Add the Math & Numbers category with five percentage and proportion tools.'],
  },
  {
    date: '2026-09-28',
    tools: ['/dates/days-until/', '/dates/days-from/'],
    notes: [
      'Launch bajtools with the Days Until countdown and the Days From Today calculator.',
      'Add ready-made countdown pages for common dates.',
    ],
  },
];
