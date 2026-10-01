import { describe, expect, it } from 'vitest';
import { splitTip } from './tip';

describe('splitTip', () => {
  it('computes tip, total and per-person amounts', () => {
    const result = splitTip(100, 20, 2);
    expect(result).toEqual({
      tipAmount: 20,
      total: 120,
      perPerson: 60,
      tipPerPerson: 10,
    });
  });

  it('handles a zero tip', () => {
    const result = splitTip(50, 0, 4);
    expect(result).toMatchObject({ tipAmount: 0, total: 50, perPerson: 12.5 });
  });

  it('floors fractional people', () => {
    const result = splitTip(90, 10, 2.9);
    expect(result?.perPerson).toBe(49.5);
  });

  it('rejects invalid input', () => {
    expect(splitTip(100, 15, 0)).toBeNull();
    expect(splitTip(-1, 15, 2)).toBeNull();
    expect(splitTip(100, -5, 2)).toBeNull();
    expect(splitTip(Number.NaN, 15, 2)).toBeNull();
  });
});
