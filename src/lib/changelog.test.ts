import { describe, expect, it } from 'vitest';
import type { Tool } from '../data/tools';
import { formatChangelogDate, resolveChangelog } from './changelog';

function tool(path: string, added = '2026-10-01'): Tool {
  return {
    slug: path.replaceAll('/', ''),
    category: 'dates',
    title: `Title ${path}`,
    description: '',
    path,
    added,
  };
}

const TOOLS = [tool('/a/'), tool('/b/'), tool('/c/')];

describe('resolveChangelog', () => {
  it('sorts entries newest first', () => {
    const entries = [
      { date: '2026-10-01', notes: ['Old'] },
      { date: '2026-11-04', notes: ['New'] },
      { date: '2026-10-15', notes: ['Middle'] },
    ];

    expect(resolveChangelog(entries, TOOLS).map((entry) => entry.date)).toEqual([
      '2026-11-04',
      '2026-10-15',
      '2026-10-01',
    ]);
  });

  it('merges entries that share a date', () => {
    const entries = [
      { date: '2026-11-04', notes: ['First'], tools: ['/a/'] },
      { date: '2026-11-04', notes: ['Second'], tools: ['/b/'] },
    ];

    const [entry] = resolveChangelog(entries, TOOLS);

    expect(entry.notes).toEqual(['First', 'Second']);
    expect(entry.tools.map((item) => item.path)).toEqual(['/a/', '/b/']);
  });

  it('drops duplicate notes and tools', () => {
    const entries = [
      { date: '2026-11-04', notes: ['Same', 'Same'], tools: ['/a/', '/a/'] },
    ];

    const [entry] = resolveChangelog(entries, TOOLS);

    expect(entry.notes).toEqual(['Same']);
    expect(entry.tools.map((item) => item.path)).toEqual(['/a/']);
  });

  it('drops invalid dates and unknown tools', () => {
    const entries = [
      { date: 'soon', notes: ['Nope'] },
      { date: '2026-11-04', tools: ['/a/', '/missing/'] },
    ];

    const resolved = resolveChangelog(entries, TOOLS);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].tools.map((item) => item.path)).toEqual(['/a/']);
  });

  it('drops empty entries', () => {
    expect(resolveChangelog([{ date: '2026-11-04', notes: ['  '] }], TOOLS)).toEqual([]);
  });

  it('keeps a single copy of the tool data', () => {
    const [entry] = resolveChangelog([{ date: '2026-11-04', tools: ['/b/'] }], TOOLS);

    expect(entry.tools[0].title).toBe('Title /b/');
  });
});

describe('formatChangelogDate', () => {
  it('formats a date in UTC', () => {
    expect(formatChangelogDate('2026-11-04')).toBe('November 4, 2026');
  });

  it('returns invalid input unchanged', () => {
    expect(formatChangelogDate('soon')).toBe('soon');
  });
});
