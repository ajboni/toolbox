import { describe, expect, it } from 'vitest';
import { ascendingMidi, frequencyForMidi, midiForPitchClass, notesMidi } from './audio';
import { renderScaleChords } from './view';

describe('midiForPitchClass', () => {
  it('maps C4 to 60', () => {
    expect(midiForPitchClass(0)).toBe(60);
  });

  it('maps A4 to 69', () => {
    expect(midiForPitchClass(9)).toBe(69);
  });
});

describe('frequencyForMidi', () => {
  it('uses A4 = 440 Hz', () => {
    expect(frequencyForMidi(69)).toBeCloseTo(440, 5);
  });

  it('computes middle C', () => {
    expect(frequencyForMidi(60)).toBeCloseTo(261.6256, 3);
  });
});

describe('ascendingMidi', () => {
  it('builds a C major scale from pitch classes', () => {
    expect(ascendingMidi([0, 2, 4, 5, 7, 9, 11])).toEqual([60, 62, 64, 65, 67, 69, 71]);
  });

  it('crosses the octave when the pitch class wraps', () => {
    expect(ascendingMidi([11, 0, 2])).toEqual([71, 72, 74]);
  });

  it('keeps each note at or above the previous one', () => {
    expect(ascendingMidi([0, 7, 4])).toEqual([60, 67, 76]);
  });
});

describe('notesMidi', () => {
  it('plays the scale rendered for a key', () => {
    const view = renderScaleChords({ root: 'C', scale: 'major' });
    expect(notesMidi(view.notes)).toEqual([60, 62, 64, 65, 67, 69, 71]);
  });

  it('plays a chord ascending', () => {
    const view = renderScaleChords({ root: 'C', scale: 'major', sev: '1' });
    expect(notesMidi(view.chords[0].notes)).toEqual([60, 64, 67, 71]);
  });
});
