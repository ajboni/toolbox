export interface Tool {
  slug: string;
  category: string;
  title: string;
  description: string;
  path: string;
}

export const TOOLS: Tool[] = [
  {
    slug: 'days-until',
    category: 'dates',
    title: 'Days Until…',
    description:
      'Count the days, weeks and months between today and any date you pick.',
    path: '/dates/days-until/',
  },
  {
    slug: 'days-from',
    category: 'dates',
    title: 'Days From Today',
    description:
      'Find the exact date that falls a given number of days from today or from any start date.',
    path: '/dates/days-from/',
  },
  {
    slug: 'age',
    category: 'dates',
    title: 'Age Calculator',
    description:
      'Get an exact age in years, months and days from any date of birth.',
    path: '/dates/age/',
  },
  {
    slug: 'duration',
    category: 'dates',
    title: 'Date Duration',
    description: 'Measure the time between two dates in days, weeks and months.',
    path: '/dates/duration/',
  },
  {
    slug: 'unix',
    category: 'dates',
    title: 'Unix Timestamp',
    description: 'Convert Unix epoch timestamps to dates and back, local and UTC.',
    path: '/dates/unix/',
  },
  {
    slug: 'sunrise-sunset',
    category: 'dates',
    title: 'Sunrise & Sunset',
    description:
      'Sunrise, sunset, solar noon, day length and twilight for any place and date.',
    path: '/dates/sunrise-sunset/',
  },
  {
    slug: 'percent-of',
    category: 'math',
    title: 'Percent Of',
    description: 'Work out what X percent of any number is.',
    path: '/math/percent-of/',
  },
  {
    slug: 'what-percent',
    category: 'math',
    title: 'X Is What Percent of Y?',
    description: 'Find out what percentage one number is of another.',
    path: '/math/what-percent/',
  },
  {
    slug: 'percent-change',
    category: 'math',
    title: 'Percentage Change',
    description: 'Measure the percentage increase or decrease between two values.',
    path: '/math/percent-change/',
  },
  {
    slug: 'add-percent',
    category: 'math',
    title: 'Add or Subtract a Percentage',
    description: 'Increase or decrease a value by a percentage in one step.',
    path: '/math/add-percent/',
  },
  {
    slug: 'rule-of-three',
    category: 'math',
    title: 'Rule of Three',
    description: 'Solve any proportion a / b = c / x for the missing value.',
    path: '/math/rule-of-three/',
  },
  {
    slug: 'tip-splitter',
    category: 'math',
    title: 'Tip & Bill Splitter',
    description: 'Add a tip and split the bill between any number of people.',
    path: '/math/tip-splitter/',
  },
  {
    slug: 'base-converter',
    category: 'math',
    title: 'Number Base Converter',
    description: 'Convert numbers between binary, octal, decimal and hexadecimal.',
    path: '/math/base-converter/',
  },
  {
    slug: 'chord-finder',
    category: 'music',
    title: 'Scale & Chord Finder',
    description:
      'Pick a root and a scale to get its notes and the seven diatonic chords.',
    path: '/music/chord-finder/',
  },
  {
    slug: 'circle-of-fifths',
    category: 'music',
    title: 'Circle of Fifths',
    description:
      'Explore all twelve major keys, their relative minors, key signatures and chords.',
    path: '/music/circle-of-fifths/',
  },
  {
    slug: 'case-converter',
    category: 'text',
    title: 'Case Converter',
    description: 'Switch text between camelCase, snake_case, kebab-case and more.',
    path: '/text/case-converter/',
  },
  {
    slug: 'base64',
    category: 'text',
    title: 'Base64 Encoder',
    description: 'Encode text to Base64 or decode it back, with a URL-safe option.',
    path: '/text/base64/',
  },
  {
    slug: 'url-encode',
    category: 'text',
    title: 'URL Encoder',
    description: 'Percent-encode text for URLs or decode encoded strings.',
    path: '/text/url-encode/',
  },
  {
    slug: 'counter',
    category: 'text',
    title: 'Word Counter',
    description: 'Count characters, words, sentences, lines and paragraphs.',
    path: '/text/counter/',
  },
  {
    slug: 'uuid',
    category: 'text',
    title: 'UUID Generator',
    description: 'Generate random version 4 UUIDs, one or many at a time.',
    path: '/text/uuid/',
  },
  {
    slug: 'hash',
    category: 'text',
    title: 'Hash Generator',
    description: 'Compute SHA-1, SHA-256, SHA-384 and SHA-512 digests of text.',
    path: '/text/hash/',
  },
  {
    slug: 'lorem-ipsum',
    category: 'text',
    title: 'Lorem Ipsum',
    description: 'Generate placeholder paragraphs, sentences or words.',
    path: '/text/lorem-ipsum/',
  },
];

export function toolsInCategory(category: string): Tool[] {
  return TOOLS.filter((tool) => tool.category === category);
}
