import { describe, expect, it } from 'vitest';
import {
  findMatchRanges,
  groupByCategory,
  groupResults,
  highlightSegments,
  parseSearchItems,
  searchItems,
  tokenize,
  type SearchItem,
} from './search';

const ITEMS: SearchItem[] = [
  {
    path: '/math/percent-of/',
    title: 'Percent Of',
    description: 'Work out what X percent of any number is.',
    category: 'math',
    categoryName: 'Math & Numbers',
    accent: 'emerald',
  },
  {
    path: '/math/percent-change/',
    title: 'Percentage Change',
    description: 'Measure the percentage increase or decrease between two values.',
    category: 'math',
    categoryName: 'Math & Numbers',
    accent: 'emerald',
  },
  {
    path: '/dates/world-clock/',
    title: 'World Clock',
    description: 'Watch the current time in several time zones at once.',
    category: 'dates',
    categoryName: 'Dates & Time',
    accent: 'violet',
  },
  {
    path: '/music/metronome/',
    title: 'Online Metronome',
    description: 'Keep time with tap tempo and subdivisions.',
    category: 'music',
    categoryName: 'Music',
    accent: 'fuchsia',
  },
  {
    path: '/music/tuner/',
    title: 'Instrument Tuner',
    description: 'Tune a guitar, bass, ukulele or violin.',
    category: 'music',
    categoryName: 'Music',
    accent: 'fuchsia',
  },
];

const ORDER = ['dates', 'math', 'music'];

describe('tokenize', () => {
  it('folds accents and splits on punctuation', () => {
    expect(tokenize('  Café,  con-Leche ')).toEqual(['cafe', 'con', 'leche']);
  });

  it('returns no tokens for an empty query', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('searchItems', () => {
  it('returns nothing for an empty query', () => {
    expect(searchItems(ITEMS, '')).toEqual([]);
  });

  it('ranks a title match above a description match', () => {
    const ranked = searchItems(ITEMS, 'percent');
    expect(ranked[0].item.title).toBe('Percent Of');
  });

  it('requires every token to match', () => {
    const ranked = searchItems(ITEMS, 'world clock');
    expect(ranked).toHaveLength(1);
    expect(ranked[0].item.title).toBe('World Clock');
  });

  it('matches category names', () => {
    const ranked = searchItems(ITEMS, 'music');
    expect(ranked.map((entry) => entry.item.title).sort()).toEqual([
      'Instrument Tuner',
      'Online Metronome',
    ]);
  });

  it('tolerates typos through subsequence matching', () => {
    const ranked = searchItems(ITEMS, 'percnt');
    expect(ranked.some((entry) => entry.item.title === 'Percent Of')).toBe(true);
  });

  it('does not fuzzy match descriptions', () => {
    const items = [{ ...ITEMS[0], title: 'Plain title', description: 'precnt' }];
    expect(searchItems(items, 'percnt')).toHaveLength(0);
  });

  it('does not stretch fuzzy matches across unrelated words', () => {
    const items = [{ ...ITEMS[0], title: 'Data Converter', description: 'Convert data.' }];
    expect(searchItems(items, 'date')).toHaveLength(0);
  });

  it('honours the result limit', () => {
    expect(searchItems(ITEMS, 'time', 1)).toHaveLength(1);
  });

  it('ignores accents in both directions', () => {
    const items = [{ ...ITEMS[0], title: 'Café Converter' }];
    expect(searchItems(items, 'cafe')).toHaveLength(1);
    expect(searchItems(items, 'CAFÉ')).toHaveLength(1);
  });
});

describe('findMatchRanges', () => {
  it('keeps indices aligned when accents are folded', () => {
    expect(findMatchRanges('Café au lait', ['cafe'])).toEqual([{ start: 0, end: 4 }]);
  });

  it('merges adjacent matches', () => {
    expect(findMatchRanges('World Clock', ['world', 'clock'])).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 11 },
    ]);
  });

  it('finds every occurrence of a token', () => {
    expect(findMatchRanges('time after time', ['time'])).toEqual([
      { start: 0, end: 4 },
      { start: 11, end: 15 },
    ]);
  });
});

describe('highlightSegments', () => {
  it('splits text into plain and matched parts', () => {
    expect(highlightSegments('World Clock', [{ start: 0, end: 5 }])).toEqual([
      { text: 'World', match: true },
      { text: ' Clock', match: false },
    ]);
  });

  it('returns a single plain segment without ranges', () => {
    expect(highlightSegments('World Clock', [])).toEqual([{ text: 'World Clock', match: false }]);
  });
});

describe('groupResults', () => {
  it('orders groups by their best match and keeps the site order as a tie-break', () => {
    const ranked = searchItems(ITEMS, 'time');
    const groups = groupResults(ranked, ORDER);
    expect(groups.map((group) => group.category)).toEqual(['dates', 'music']);
  });
});

describe('groupByCategory', () => {
  it('groups every item in site order and sorts titles inside each group', () => {
    const groups = groupByCategory(ITEMS, ORDER);
    expect(groups.map((group) => group.category)).toEqual(['dates', 'math', 'music']);
    expect(groups[2].items.map((entry) => entry.item.title)).toEqual([
      'Instrument Tuner',
      'Online Metronome',
    ]);
  });
});

describe('parseSearchItems', () => {
  it('rejects malformed entries', () => {
    const parsed = parseSearchItems([
      ITEMS[0],
      { title: 'Missing path' },
      { ...ITEMS[1], accent: 'not-a-colour' },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].path).toBe('/math/percent-of/');
  });

  it('returns an empty list for non-array payloads', () => {
    expect(parseSearchItems({ nope: true })).toEqual([]);
  });
});
