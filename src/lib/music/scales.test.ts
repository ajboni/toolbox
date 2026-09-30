import { describe, expect, it } from 'vitest';
import { buildScale, findScale } from './scales';

function names(root: string, scale: string): string[] {
  return buildScale(root, scale).notes.map((note) => note.name);
}

describe('buildScale', () => {
  it('builds C major', () => {
    expect(names('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('spells F# major with E#', () => {
    expect(names('F#', 'major')).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
  });

  it('builds Bb dorian', () => {
    expect(names('Bb', 'dorian')).toEqual(['Bb', 'C', 'Db', 'Eb', 'F', 'G', 'Ab']);
  });

  it('builds A harmonic minor with G#', () => {
    expect(names('A', 'harmonic-minor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
  });

  it('builds C melodic minor with Eb, A and B natural', () => {
    expect(names('C', 'melodic-minor')).toEqual(['C', 'D', 'Eb', 'F', 'G', 'A', 'B']);
  });

  it('throws on an unknown scale', () => {
    expect(() => buildScale('C', 'nope')).toThrow();
  });
});

describe('findScale', () => {
  it('finds known scales', () => {
    expect(findScale('mixolydian')?.intervals).toHaveLength(7);
    expect(findScale('missing')).toBeUndefined();
  });
});
