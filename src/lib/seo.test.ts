import { describe, expect, it } from 'vitest';
import { shortDescription } from './seo';

describe('shortDescription', () => {
  it('keeps a short description as it is', () => {
    expect(shortDescription('Format or minify SQL.')).toBe('Format or minify SQL.');
  });

  it('keeps only the first sentence', () => {
    expect(shortDescription('First sentence. Second sentence. Third one.')).toBe('First sentence.');
  });

  it('collapses whitespace', () => {
    expect(shortDescription('  Format\n or   minify.  ')).toBe('Format or minify.');
  });

  it('falls back to the whole text when there is no sentence mark', () => {
    expect(shortDescription('No punctuation here')).toBe('No punctuation here');
  });

  it('truncates a long sentence at a word boundary', () => {
    const text =
      'Count characters (with and without spaces), words, sentences, lines and paragraphs, plus an estimated reading time.';

    expect(shortDescription(text, 60)).toBe(
      'Count characters (with and without spaces), words, sentences…',
    );
  });

  it('keeps a word that ends exactly at the limit', () => {
    expect(shortDescription('Alpha beta gamma delta', 10)).toBe('Alpha beta…');
  });

  it('returns an empty string for empty input', () => {
    expect(shortDescription('   ')).toBe('');
  });

  it('uses a default limit of 120 characters', () => {
    const text = `${'word '.repeat(40)}end.`;
    const result = shortDescription(text);

    expect(result.length).toBeLessThanOrEqual(121);
    expect(result.endsWith('…')).toBe(true);
  });
});
