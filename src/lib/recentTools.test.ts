import { describe, expect, it } from 'vitest';
import { MAX_RECENTS, pushRecent, sanitizeRecents } from './recentTools';

describe('sanitizeRecents', () => {
  it('keeps unique internal paths only', () => {
    expect(sanitizeRecents(['/a/', '/a/', 'https://evil.test', 42, '/b/'])).toEqual(['/a/', '/b/']);
  });

  it('caps the list', () => {
    const paths = Array.from({ length: MAX_RECENTS + 3 }, (_, index) => `/tool-${index}/`);
    expect(sanitizeRecents(paths)).toHaveLength(MAX_RECENTS);
  });

  it('handles non-array values', () => {
    expect(sanitizeRecents(null)).toEqual([]);
  });
});

describe('pushRecent', () => {
  it('moves an existing path to the front', () => {
    expect(pushRecent(['/a/', '/b/'], '/b/')).toEqual(['/b/', '/a/']);
  });

  it('ignores invalid paths', () => {
    expect(pushRecent(['/a/'], 'nope')).toEqual(['/a/']);
  });
});
