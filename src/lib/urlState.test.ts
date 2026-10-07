import { describe, expect, it } from 'vitest';
import { buildSearch, readUrlState } from './urlState';

const schema = { date: 'date', count: 'number' } as const;

describe('readUrlState', () => {
  it('parses known params', () => {
    expect(readUrlState(schema, '?date=2026-12-25&count=3')).toEqual({
      date: '2026-12-25',
      count: 3,
    });
  });

  it('ignores unknown, empty and invalid params', () => {
    expect(readUrlState(schema, '?foo=bar&date=&count=abc')).toEqual({});
  });
});

describe('buildSearch', () => {
  it('omits values equal to defaults', () => {
    expect(
      buildSearch({ date: 'date' }, { date: '2026-01-01' }, { date: '2026-01-01' }),
    ).toBe('');
  });

  it('keeps non-default values', () => {
    expect(
      buildSearch({ date: 'date' }, { date: '2026-12-25' }, { date: '2026-01-01' }),
    ).toBe('date=2026-12-25');
  });

  it('drops null and empty values', () => {
    expect(buildSearch(schema, { date: null, count: 0 })).toBe('count=0');
  });

  it('keeps commas and slashes when pretty is set', () => {
    expect(
      buildSearch(
        { clock: 'string' },
        { clock: 'Europe/Prague,America/New_York' },
        {},
        { pretty: true },
      ),
    ).toBe('clock=Europe/Prague,America/New_York');
  });
});
