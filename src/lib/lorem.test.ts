import { describe, expect, it } from 'vitest';
import { generateLorem } from './lorem';

describe('generateLorem', () => {
  it('is deterministic for a given seed', () => {
    const a = generateLorem({ units: 'words', count: 10, seed: 42 });
    const b = generateLorem({ units: 'words', count: 10, seed: 42 });
    expect(a).toBe(b);
  });

  it('changes with the seed', () => {
    const a = generateLorem({ units: 'words', count: 10, seed: 1 });
    const b = generateLorem({ units: 'words', count: 10, seed: 2 });
    expect(a).not.toBe(b);
  });

  it('honours the word count', () => {
    expect(generateLorem({ units: 'words', count: 7, seed: 1 }).split(' ')).toHaveLength(7);
  });

  it('starts with lorem ipsum when asked', () => {
    const text = generateLorem({
      units: 'sentences',
      count: 1,
      seed: 1,
      startWithLorem: true,
    });
    expect(text.startsWith('Lorem ipsum dolor sit amet')).toBe(true);
  });

  it('separates paragraphs with a blank line', () => {
    const text = generateLorem({ units: 'paragraphs', count: 2, seed: 3 });
    expect(text.split('\n\n')).toHaveLength(2);
  });
});
