export interface Category {
  slug: string;
  name: string;
  description: string;
}

export const SITE = {
  name: 'Aboni Toolbox',
  url: 'https://toolbox.aboni.dev',
  tagline: 'Small, fast tools for everyday tasks.',
  description:
    'A growing collection of tiny, no-nonsense web tools. No sign-up, no bloat — just open a page and get the answer.',
  author: '@ajboni',
  locale: 'en',
} as const;

export const CATEGORIES: Category[] = [
  {
    slug: 'dates',
    name: 'Dates & Time',
    description: 'Countdowns, day counters and other quick date math.',
  },
];
