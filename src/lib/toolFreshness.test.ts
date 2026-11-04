import { describe, expect, it } from 'vitest';
import type { Tool } from '../data/tools';
import {
  NEW_TOOL_COUNT,
  formatAdded,
  isIsoDate,
  latestTools,
  newToolPaths,
} from './toolFreshness';

function tool(path: string, added: string): Tool {
  return {
    slug: path.replaceAll('/', ''),
    category: 'dates',
    title: path,
    description: '',
    path,
    added,
  };
}

describe('isIsoDate', () => {
  it('accepts real calendar dates', () => {
    expect(isIsoDate('2026-11-04')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
  });

  it('rejects malformed or impossible dates', () => {
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2025-02-29')).toBe(false);
    expect(isIsoDate('2026-11-4')).toBe(false);
    expect(isIsoDate('04/11/2026')).toBe(false);
  });
});

describe('latestTools', () => {
  it('sorts newest first and caps the list', () => {
    const tools = [
      tool('/a/', '2026-09-01'),
      tool('/b/', '2026-11-04'),
      tool('/c/', '2026-10-15'),
      tool('/d/', '2026-11-05'),
      tool('/e/', '2026-09-28'),
      tool('/f/', '2026-10-21'),
    ];

    expect(latestTools(tools, 3).map((item) => item.path)).toEqual(['/d/', '/b/', '/f/']);
  });

  it('keeps registry order for tools added on the same day', () => {
    const tools = [
      tool('/first/', '2026-11-04'),
      tool('/second/', '2026-11-04'),
      tool('/older/', '2026-10-01'),
    ];

    expect(latestTools(tools, 2).map((item) => item.path)).toEqual(['/first/', '/second/']);
  });

  it('ignores invalid dates and does not mutate the input', () => {
    const tools = [tool('/a/', 'soon'), tool('/b/', '2026-10-01')];
    const before = tools.map((item) => item.path);

    expect(latestTools(tools).map((item) => item.path)).toEqual(['/b/']);
    expect(tools.map((item) => item.path)).toEqual(before);
  });

  it('returns an empty list when the count is zero', () => {
    expect(latestTools([tool('/a/', '2026-10-01')], 0)).toEqual([]);
  });

  it('uses five tools by default', () => {
    const tools = Array.from({ length: NEW_TOOL_COUNT + 2 }, (_, index) =>
      tool(`/tool-${index}/`, `2026-10-${String(index + 1).padStart(2, '0')}`),
    );

    expect(latestTools(tools)).toHaveLength(NEW_TOOL_COUNT);
  });
});

describe('newToolPaths', () => {
  it('returns the paths of the latest tools', () => {
    const tools = [tool('/a/', '2026-10-01'), tool('/b/', '2026-11-04'), tool('/c/', '2026-10-15')];

    expect(newToolPaths(tools, 2)).toEqual(new Set(['/b/', '/c/']));
  });
});

describe('formatAdded', () => {
  it('formats a date without timezone drift', () => {
    expect(formatAdded('2026-11-04')).toBe('Nov 4');
  });

  it('falls back to a dash for invalid dates', () => {
    expect(formatAdded('soon')).toBe('–');
  });
});
