import { describe, expect, it } from 'vitest';
import {
  formatDiceNotation,
  normalizeSpec,
  parseDiceNotation,
  rollDice,
  rollDie,
  type Uint32Source,
} from './dice';

const zero: Uint32Source = () => 0;

describe('parseDiceNotation', () => {
  it('parses a bare die', () => {
    expect(parseDiceNotation('d6')).toEqual({ count: 1, sides: 6, modifier: 0 });
  });

  it('parses a count and a positive modifier', () => {
    expect(parseDiceNotation('2d6+3')).toEqual({ count: 2, sides: 6, modifier: 3 });
  });

  it('tolerates spaces and a negative modifier', () => {
    expect(parseDiceNotation(' 3 d8 - 2 ')).toEqual({
      count: 3,
      sides: 8,
      modifier: -2,
    });
  });

  it('accepts every standard die', () => {
    for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
      expect(parseDiceNotation(`d${sides}`)?.sides).toBe(sides);
    }
  });

  it('rejects unsupported dice, counts and modifiers', () => {
    for (const input of ['d7', '0d6', '21d6', '2d6+100', '2d6*3', '', 'hello']) {
      expect(parseDiceNotation(input)).toBeNull();
    }
  });
});

describe('formatDiceNotation', () => {
  it('omits a count of one and a zero modifier', () => {
    expect(formatDiceNotation({ count: 1, sides: 20, modifier: 0 })).toBe('d20');
  });

  it('writes counts and signed modifiers', () => {
    expect(formatDiceNotation({ count: 2, sides: 6, modifier: 3 })).toBe('2d6+3');
    expect(formatDiceNotation({ count: 3, sides: 8, modifier: -2 })).toBe('3d8-2');
  });

  it('round-trips through the parser', () => {
    for (const input of ['d4', '2d6+3', '3d8-2', '1d100']) {
      const parsed = parseDiceNotation(input);
      expect(parsed).not.toBeNull();
      expect(parseDiceNotation(formatDiceNotation(parsed!))).toEqual(parsed);
    }
  });
});

describe('normalizeSpec', () => {
  it('falls back to a d6', () => {
    expect(normalizeSpec({ sides: 7 })).toEqual({ count: 1, sides: 6, modifier: 0 });
  });

  it('clamps count and modifier', () => {
    expect(normalizeSpec({ sides: 20, count: 99, modifier: -500 })).toEqual({
      count: 20,
      sides: 20,
      modifier: -99,
    });
  });
});

describe('rollDie', () => {
  it('maps the source to the die range', () => {
    expect(rollDie(6, zero)).toBe(1);
    expect(rollDie(6, () => 5)).toBe(6);
    expect(rollDie(4, () => 5)).toBe(2);
  });

  it('rejects values outside the unbiased range', () => {
    const limit = Math.floor(4_294_967_296 / 6) * 6;
    const values = [limit, limit + 1, 0];
    let index = 0;
    const next: Uint32Source = () => values[index++];
    expect(rollDie(6, next)).toBe(1);
    expect(index).toBe(3);
  });

  it('throws for invalid dice', () => {
    expect(() => rollDie(1, zero)).toThrow(RangeError);
  });
});

describe('rollDice', () => {
  it('rolls every die and adds the modifier', () => {
    const result = rollDice({ count: 3, sides: 6, modifier: 2 }, zero);
    expect(result.rolls).toEqual([1, 1, 1]);
    expect(result.total).toBe(5);
  });

  it('normalizes the spec before rolling', () => {
    const result = rollDice({ count: 2, sides: 7, modifier: 200 }, zero);
    expect(result.spec).toEqual({ count: 2, sides: 6, modifier: 99 });
    expect(result.rolls).toHaveLength(2);
    expect(result.total).toBe(101);
  });
});
