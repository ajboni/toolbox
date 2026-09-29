import { describe, expect, it } from 'vitest';
import { solveProportion } from './proportion';

describe('solveProportion', () => {
  it('solves for each unknown in a / b = c / x', () => {
    expect(solveProportion({ a: 3, b: 5, c: 8 }, 'x')).toBeCloseTo(13.3333333, 6);
    expect(solveProportion({ b: 5, c: 8, x: 10 }, 'a')).toBe(4);
    expect(solveProportion({ a: 3, c: 8, x: 10 }, 'b')).toBeCloseTo(3.75, 6);
    expect(solveProportion({ a: 3, b: 5, x: 10 }, 'c')).toBe(6);
  });

  it('handles percentage framing', () => {
    expect(solveProportion({ a: 10000, b: 25.5, c: 100 }, 'x')).toBeCloseTo(0.255, 6);
  });

  it('returns null on division by zero', () => {
    expect(solveProportion({ a: 0, b: 5, c: 8 }, 'x')).toBeNull();
    expect(solveProportion({ b: 5, c: 8, x: 0 }, 'a')).toBeNull();
    expect(solveProportion({ a: 3, c: 0, x: 10 }, 'b')).toBeNull();
    expect(solveProportion({ a: 3, b: 0, x: 10 }, 'c')).toBeNull();
  });

  it('returns null when the known values are incomplete', () => {
    expect(solveProportion({ a: 3, b: 5 }, 'x')).toBeNull();
  });
});
