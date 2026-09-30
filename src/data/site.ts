export const ACCENTS = [
  'violet',
  'cyan',
  'emerald',
  'amber',
  'rose',
  'sky',
  'teal',
  'fuchsia',
] as const;

export type AccentName = (typeof ACCENTS)[number];

export interface AccentClasses {
  text: string;
  textHover: string;
  bg: string;
  bgSoft: string;
  borderHover: string;
}

export const ACCENT_CLASSES: Record<AccentName, AccentClasses> = {
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    textHover: 'hover:text-violet-700 dark:hover:text-violet-300',
    bg: 'bg-violet-600 dark:bg-violet-500',
    bgSoft: 'bg-violet-50 dark:bg-violet-950/50',
    borderHover: 'hover:border-violet-400 dark:hover:border-violet-500',
  },
  cyan: {
    text: 'text-cyan-600 dark:text-cyan-400',
    textHover: 'hover:text-cyan-700 dark:hover:text-cyan-300',
    bg: 'bg-cyan-600 dark:bg-cyan-500',
    bgSoft: 'bg-cyan-50 dark:bg-cyan-950/50',
    borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-500',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    textHover: 'hover:text-emerald-700 dark:hover:text-emerald-300',
    bg: 'bg-emerald-600 dark:bg-emerald-500',
    bgSoft: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-500',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    textHover: 'hover:text-amber-700 dark:hover:text-amber-300',
    bg: 'bg-amber-500 dark:bg-amber-400',
    bgSoft: 'bg-amber-50 dark:bg-amber-950/50',
    borderHover: 'hover:border-amber-400 dark:hover:border-amber-500',
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-400',
    textHover: 'hover:text-rose-700 dark:hover:text-rose-300',
    bg: 'bg-rose-600 dark:bg-rose-500',
    bgSoft: 'bg-rose-50 dark:bg-rose-950/50',
    borderHover: 'hover:border-rose-400 dark:hover:border-rose-500',
  },
  sky: {
    text: 'text-sky-600 dark:text-sky-400',
    textHover: 'hover:text-sky-700 dark:hover:text-sky-300',
    bg: 'bg-sky-600 dark:bg-sky-500',
    bgSoft: 'bg-sky-50 dark:bg-sky-950/50',
    borderHover: 'hover:border-sky-400 dark:hover:border-sky-500',
  },
  teal: {
    text: 'text-teal-600 dark:text-teal-400',
    textHover: 'hover:text-teal-700 dark:hover:text-teal-300',
    bg: 'bg-teal-600 dark:bg-teal-500',
    bgSoft: 'bg-teal-50 dark:bg-teal-950/50',
    borderHover: 'hover:border-teal-400 dark:hover:border-teal-500',
  },
  fuchsia: {
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    textHover: 'hover:text-fuchsia-700 dark:hover:text-fuchsia-300',
    bg: 'bg-fuchsia-600 dark:bg-fuchsia-500',
    bgSoft: 'bg-fuchsia-50 dark:bg-fuchsia-950/50',
    borderHover: 'hover:border-fuchsia-400 dark:hover:border-fuchsia-500',
  },
};

export const DEFAULT_ACCENT: AccentName = 'violet';

export function accentClasses(accent: AccentName = DEFAULT_ACCENT): AccentClasses {
  return ACCENT_CLASSES[accent] ?? ACCENT_CLASSES[DEFAULT_ACCENT];
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  accent: AccentName;
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
    accent: 'violet',
  },
  {
    slug: 'math',
    name: 'Math & Numbers',
    description: 'Percentages, proportions and everyday number crunching.',
    accent: 'emerald',
  },
  {
    slug: 'music',
    name: 'Music',
    description: 'Scales, chords and key relationships for musicians.',
    accent: 'fuchsia',
  },
];

export function findCategory(slug: string): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}
