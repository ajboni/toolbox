import { CONVERTER_PAGES } from './converters';

export interface Tool {
  slug: string;
  category: string;
  title: string;
  description: string;
  path: string;
  added: string;
}

const CORE_TOOLS: Tool[] = [
  {
    slug: 'days-until',
    category: 'dates',
    title: 'Days Until…',
    description:
      'Count the days, weeks and months between today and any date you pick.',
    path: '/dates/days-until/',
    added: '2026-09-28',
  },
  {
    slug: 'days-from',
    category: 'dates',
    title: 'Days From Today',
    description:
      'Find the exact date that falls a given number of days from today or from any start date.',
    path: '/dates/days-from/',
    added: '2026-09-28',
  },
  {
    slug: 'age',
    category: 'dates',
    title: 'Age Calculator',
    description:
      'Get an exact age in years, months and days from any date of birth.',
    path: '/dates/age/',
    added: '2026-10-01',
  },
  {
    slug: 'duration',
    category: 'dates',
    title: 'Date Duration',
    description: 'Measure the time between two dates in days, weeks and months.',
    path: '/dates/duration/',
    added: '2026-10-01',
  },
  {
    slug: 'unix',
    category: 'dates',
    title: 'Unix Timestamp',
    description: 'Convert Unix epoch timestamps to dates and back, local and UTC.',
    path: '/dates/unix/',
    added: '2026-10-01',
  },
  {
    slug: 'sunrise-sunset',
    category: 'dates',
    title: 'Sunrise & Sunset',
    description:
      'Sunrise, sunset, solar noon, day length and twilight for any place and date.',
    path: '/dates/sunrise-sunset/',
    added: '2026-10-07',
  },
  {
    slug: 'world-clock',
    category: 'dates',
    title: 'World Clock',
    description:
      'Watch the current time in several time zones at once, with offsets and a shareable board.',
    path: '/dates/world-clock/',
    added: '2026-10-07',
  },
  {
    slug: 'shadow',
    category: 'dates',
    title: 'Shadow Length & Solar Compass',
    description:
      'Drag the sun across a compass dial to see how long a shadow is and which way it points.',
    path: '/dates/shadow/',
    added: '2026-11-04',
  },
  {
    slug: 'birthday-weekday',
    category: 'dates',
    title: 'Birthday Weekday',
    description:
      'See which day of the week every one of your birthdays falls on, past and future.',
    path: '/dates/birthday-weekday/',
    added: '2026-10-07',
  },
  {
    slug: 'percent-of',
    category: 'math',
    title: 'Percent Of',
    description: 'Work out what X percent of any number is.',
    path: '/math/percent-of/',
    added: '2026-09-29',
  },
  {
    slug: 'what-percent',
    category: 'math',
    title: 'X Is What Percent of Y?',
    description: 'Find out what percentage one number is of another.',
    path: '/math/what-percent/',
    added: '2026-09-29',
  },
  {
    slug: 'percent-change',
    category: 'math',
    title: 'Percentage Change',
    description: 'Measure the percentage increase or decrease between two values.',
    path: '/math/percent-change/',
    added: '2026-09-29',
  },
  {
    slug: 'add-percent',
    category: 'math',
    title: 'Add or Subtract a Percentage',
    description: 'Increase or decrease a value by a percentage in one step.',
    path: '/math/add-percent/',
    added: '2026-09-29',
  },
  {
    slug: 'rule-of-three',
    category: 'math',
    title: 'Rule of Three',
    description: 'Solve any proportion a / b = c / x for the missing value.',
    path: '/math/rule-of-three/',
    added: '2026-09-29',
  },
  {
    slug: 'tip-splitter',
    category: 'math',
    title: 'Tip & Bill Splitter',
    description: 'Add a tip and split the bill between any number of people.',
    path: '/math/tip-splitter/',
    added: '2026-10-01',
  },
  {
    slug: 'base-converter',
    category: 'math',
    title: 'Number Base Converter',
    description: 'Convert numbers between binary, octal, decimal and hexadecimal.',
    path: '/math/base-converter/',
    added: '2026-10-01',
  },
  {
    slug: 'dice',
    category: 'math',
    title: 'Dice Roller',
    description:
      'Roll d4, d6, d8, d10, d12, d20 or d100 dice with modifiers and a roll history.',
    path: '/math/dice/',
    added: '2026-10-21',
  },
  {
    slug: 'chord-finder',
    category: 'music',
    title: 'Scale & Chord Finder',
    description:
      'Pick a root and a scale to get its notes and the seven diatonic chords.',
    path: '/music/chord-finder/',
    added: '2026-09-30',
  },
  {
    slug: 'circle-of-fifths',
    category: 'music',
    title: 'Circle of Fifths',
    description:
      'Explore all twelve major keys, their relative minors, key signatures and chords.',
    path: '/music/circle-of-fifths/',
    added: '2026-09-30',
  },
  {
    slug: 'metronome',
    category: 'music',
    title: 'Online Metronome',
    description:
      'Keep time with tap tempo, time signatures, accents, subdivisions and a shareable setup.',
    path: '/music/metronome/',
    added: '2026-10-21',
  },
  {
    slug: 'tuner',
    category: 'music',
    title: 'Instrument Tuner',
    description:
      'Tune a guitar, bass, ukulele, violin or cello with a chromatic needle and string targets.',
    path: '/music/tuner/',
    added: '2026-11-04',
  },
  {
    slug: 'case-converter',
    category: 'text',
    title: 'Case Converter',
    description: 'Switch text between camelCase, snake_case, kebab-case and more.',
    path: '/text/case-converter/',
    added: '2026-10-01',
  },
  {
    slug: 'base64',
    category: 'text',
    title: 'Base64 Encoder',
    description: 'Encode text to Base64 or decode it back, with a URL-safe option.',
    path: '/text/base64/',
    added: '2026-10-01',
  },
  {
    slug: 'url-encode',
    category: 'text',
    title: 'URL Encoder',
    description: 'Percent-encode text for URLs or decode encoded strings.',
    path: '/text/url-encode/',
    added: '2026-10-01',
  },
  {
    slug: 'json',
    category: 'text',
    title: 'JSON Formatter',
    description: 'Pretty-print or minify JSON with clear, line-aware error messages.',
    path: '/text/json/',
    added: '2026-10-07',
  },
  {
    slug: 'diff',
    category: 'text',
    title: 'Diff Checker',
    description:
      'Compare two blocks of text side by side, with automatic JSON and XML formatting.',
    path: '/text/diff/',
    added: '2026-10-07',
  },
  {
    slug: 'list-compare',
    category: 'text',
    title: 'List Compare',
    description:
      'Compare two lists with a Venn diagram to see what only one side has and what both share.',
    path: '/text/list-compare/',
    added: '2026-11-04',
  },
  {
    slug: 'counter',
    category: 'text',
    title: 'Word Counter',
    description: 'Count characters, words, sentences, lines and paragraphs.',
    path: '/text/counter/',
    added: '2026-10-01',
  },
  {
    slug: 'uuid',
    category: 'text',
    title: 'UUID Generator',
    description: 'Generate random version 4 UUIDs, one or many at a time.',
    path: '/text/uuid/',
    added: '2026-10-01',
  },
  {
    slug: 'hash',
    category: 'text',
    title: 'Hash Generator',
    description: 'Compute SHA-1, SHA-256, SHA-384 and SHA-512 digests of text.',
    path: '/text/hash/',
    added: '2026-10-01',
  },
  {
    slug: 'lorem-ipsum',
    category: 'text',
    title: 'Lorem Ipsum',
    description: 'Generate placeholder paragraphs, sentences or words.',
    path: '/text/lorem-ipsum/',
    added: '2026-10-01',
  },
  {
    slug: 'subnet',
    category: 'networking',
    title: 'Subnet Calculator',
    description:
      'Turn a CIDR block into its network, broadcast, host range and netmask.',
    path: '/networking/subnet/',
    added: '2026-10-07',
  },
  {
    slug: 'download-time',
    category: 'networking',
    title: 'Download Time Calculator',
    description:
      'Work out how long a file takes to download from its size and your connection speed.',
    path: '/networking/download-time/',
    added: '2026-10-15',
  },
  {
    slug: 'password',
    category: 'security',
    title: 'Password & Passphrase Generator',
    description:
      'Create strong random passwords or word-based passphrases, with an entropy estimate.',
    path: '/security/password/',
    added: '2026-10-09',
  },
];

const CONVERTER_TOOLS: Tool[] = CONVERTER_PAGES.map((page) => ({
  slug: page.slug,
  category: 'converters',
  title: page.title,
  description: page.description,
  path: `/converters/${page.slug}/`,
  added: page.added,
}));

export const TOOLS: Tool[] = [...CORE_TOOLS, ...CONVERTER_TOOLS];

export function toolsInCategory(category: string): Tool[] {
  return TOOLS.filter((tool) => tool.category === category);
}
