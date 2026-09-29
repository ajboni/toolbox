import { describe, expect, it } from 'vitest';
import {
  applyPercent,
  formatNumber,
  formatPercent,
  percentChange,
  percentOf,
  whatPercent,
} from './percent';

describe('percentOf', () => {
  it('computes a percentage of a value', () => {
    expect(percentOf(20, 25000)).toBe(5000);
    expect(percentOf(0, 100)).toBe(0);
    expect(percentOf(100, 42)).toBe(42);
  });
});

describe('whatPercent', () => {
  it('expresses a part as a percentage of a whole', () => {
    expect(whatPercent(25000, 10000)).toBe(250);
    expect(whatPercent(25, 100)).toBe(25);
  });

  it('returns null when the whole is zero', () => {
    expect(whatPercent(1, 0)).toBeNull();
  });
});

describe('percentChange', () => {
  it('reports increases and decreases', () => {
    expect(percentChange(100, 125)).toBe(25);
    expect(percentChange(125, 100)).toBe(-20);
    expect(percentChange(50, 50)).toBe(0);
  });

  it('returns null when the starting value is zero', () => {
    expect(percentChange(0, 5)).toBeNull();
  });
});

describe('applyPercent', () => {
  it('adds a percentage by default', () => {
    expect(applyPercent(1000, 21)).toBeCloseTo(1210, 6);
  });

  it('subtracts a percentage', () => {
    expect(applyPercent(1000, 15, 'subtract')).toBeCloseTo(850, 6);
  });
});

describe('formatNumber', () => {
  it('formats with thousands separators', () => {
    expect(formatNumber(25000)).toBe('25,000');
    expect(formatNumber(13.3333333333, 2)).toBe('13.33');
  });
});

describe('formatPercent', () => {
  it('appends a percent sign', () => {
    expect(formatPercent(250)).toBe('250%');
  });
});
