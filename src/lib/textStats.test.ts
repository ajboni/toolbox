import { describe, expect, it } from 'vitest';
import { textStats } from './textStats';

describe('textStats', () => {
  it('returns zeros for empty text', () => {
    expect(textStats('')).toMatchObject({
      characters: 0,
      words: 0,
      sentences: 0,
      lines: 0,
      paragraphs: 0,
      readingMinutes: 0,
    });
  });

  it('counts characters, words and sentences', () => {
    const stats = textStats('Hello world. This is fine!');
    expect(stats.words).toBe(5);
    expect(stats.sentences).toBe(2);
    expect(stats.characters).toBe(26);
  });

  it('counts lines and paragraphs', () => {
    const stats = textStats('One\n\nTwo\nThree');
    expect(stats.lines).toBe(4);
    expect(stats.paragraphs).toBe(2);
  });

  it('ignores spaces for charactersNoSpaces', () => {
    expect(textStats('a b c').charactersNoSpaces).toBe(3);
  });

  it('estimates reading time', () => {
    const text = 'word '.repeat(201);
    expect(textStats(text).readingMinutes).toBe(2);
  });
});
