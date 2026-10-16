import { describe, expect, it } from 'vitest';
import {
  convert,
  convertAll,
  findUnit,
  formatUnitValue,
  isDimension,
  unitsFor,
} from './units';

describe('unitsFor', () => {
  it('returns units for each dimension', () => {
    expect(unitsFor('length').length).toBeGreaterThan(0);
    expect(unitsFor('temperature').map((unit) => unit.id)).toEqual(['c', 'f', 'k']);
    expect(unitsFor('bandwidth').map((unit) => unit.id)).toContain('mbps');
  });

  it('finds known units', () => {
    expect(findUnit('length', 'm')?.symbol).toBe('m');
    expect(findUnit('length', 'nope')).toBeUndefined();
  });
});

describe('isDimension', () => {
  it('guards dimension ids', () => {
    expect(isDimension('length')).toBe(true);
    expect(isDimension('volume')).toBe(true);
    expect(isDimension('weight')).toBe(false);
  });
});

describe('convert', () => {
  it('converts length', () => {
    expect(convert('length', 1, 'm', 'ft')).toBeCloseTo(3.280839895, 6);
    expect(convert('length', 1, 'mi', 'km')).toBeCloseTo(1.609344, 6);
    expect(convert('length', 1, 'in', 'cm')).toBeCloseTo(2.54, 6);
  });

  it('converts mass', () => {
    expect(convert('mass', 1, 'kg', 'lb')).toBeCloseTo(2.2046226218, 6);
    expect(convert('mass', 1000, 'g', 'kg')).toBeCloseTo(1, 9);
  });

  it('converts temperature with offsets', () => {
    expect(convert('temperature', 0, 'c', 'f')).toBeCloseTo(32, 9);
    expect(convert('temperature', 100, 'c', 'f')).toBeCloseTo(212, 9);
    expect(convert('temperature', 0, 'c', 'k')).toBeCloseTo(273.15, 9);
    expect(convert('temperature', 32, 'f', 'c')).toBeCloseTo(0, 9);
    expect(convert('temperature', -40, 'c', 'f')).toBeCloseTo(-40, 9);
  });

  it('converts decimal and binary data units', () => {
    expect(convert('data', 1, 'mib', 'b')).toBeCloseTo(1048576, 6);
    expect(convert('data', 1, 'mb', 'kb')).toBeCloseTo(1000, 6);
    expect(convert('data', 8, 'bit', 'b')).toBeCloseTo(1, 9);
  });

  it('converts data transfer rates', () => {
    expect(convert('bandwidth', 1, 'MBps', 'mbps')).toBeCloseTo(8, 9);
    expect(convert('bandwidth', 1, 'mbps', 'MBps')).toBeCloseTo(0.125, 9);
    expect(convert('bandwidth', 1, 'gbps', 'Mbps')).toBeNull();
    expect(convert('bandwidth', 1, 'gbps', 'MBps')).toBeCloseTo(125, 9);
    expect(convert('bandwidth', 1000, 'mbps', 'gbps')).toBeCloseTo(1, 9);
  });

  it('round-trips between units', () => {
    const there = convert('length', 42, 'km', 'mi');
    expect(there).not.toBeNull();
    expect(convert('length', there as number, 'mi', 'km')).toBeCloseTo(42, 9);
  });

  it('returns null for unknown units or values', () => {
    expect(convert('length', 1, 'm', 'nope')).toBeNull();
    expect(convert('length', 1, 'nope', 'm')).toBeNull();
    expect(convert('length', Number.NaN, 'm', 'ft')).toBeNull();
  });
});

describe('convertAll', () => {
  it('lists every unit in the dimension', () => {
    const conversions = convertAll('length', 1, 'm');
    expect(conversions).not.toBeNull();
    expect(conversions).toHaveLength(unitsFor('length').length);
    const feet = conversions?.find((item) => item.unit.id === 'ft');
    expect(feet?.value).toBeCloseTo(3.280839895, 6);
  });

  it('returns null for an unknown source unit', () => {
    expect(convertAll('length', 1, 'nope')).toBeNull();
  });
});

describe('formatUnitValue', () => {
  it('formats regular numbers', () => {
    expect(formatUnitValue(3.280839895)).toBe('3.28084');
    expect(formatUnitValue(1000)).toBe('1,000');
  });

  it('uses exponential for extreme values', () => {
    expect(formatUnitValue(1e-9)).toContain('e');
    expect(formatUnitValue(1e20)).toContain('e');
  });

  it('handles non-finite values', () => {
    expect(formatUnitValue(Number.NaN)).toBe('–');
  });
});
