import { describe, expect, it } from 'vitest';
import {
  compareLists,
  comparisonText,
  describeComparison,
  formatEntry,
  formatGroup,
} from './listCompare';

describe('compareLists', () => {
  it('splits the lists into only A, both and only B', () => {
    const result = compareLists('1\n2\n3', '3\n4\n5');
    expect(result.onlyA.map((entry) => entry.value)).toEqual(['1', '2']);
    expect(result.both.map((entry) => entry.value)).toEqual(['3']);
    expect(result.onlyB.map((entry) => entry.value)).toEqual(['4', '5']);
    expect(result.totalA).toBe(3);
    expect(result.totalB).toBe(3);
  });

  it('counts repeated values on each side', () => {
    const result = compareLists('1\n1\n2', '2\n2\n2');
    expect(result.onlyA).toEqual([{ value: '1', inA: 2, inB: 0 }]);
    expect(result.both).toEqual([{ value: '2', inA: 1, inB: 3 }]);
    expect(result.duplicatesA).toBe(1);
    expect(result.duplicatesB).toBe(2);
  });

  it('trims values by default', () => {
    const result = compareLists(' 1 \n2', '1');
    expect(result.both.map((entry) => entry.value)).toEqual(['1']);
  });

  it('can keep whitespace when trimming is off', () => {
    const result = compareLists(' 1', '1', { trim: false });
    expect(result.onlyA.map((entry) => entry.value)).toEqual([' 1']);
    expect(result.onlyB.map((entry) => entry.value)).toEqual(['1']);
  });

  it('can ignore case', () => {
    const result = compareLists('ABC\nabc', 'abc', { ignoreCase: true });
    expect(result.both).toEqual([{ value: 'ABC', inA: 2, inB: 1 }]);
  });

  it('splits on commas when asked', () => {
    const result = compareLists('1, 2, 3', '2,3', { separators: 'commas' });
    expect(result.both.map((entry) => entry.value)).toEqual(['2', '3']);
    expect(result.onlyA.map((entry) => entry.value)).toEqual(['1']);
  });

  it('splits on tabs and semicolons in wide mode', () => {
    const result = compareLists('1\t2;3', '3', { separators: 'wide' });
    expect(result.onlyA.map((entry) => entry.value)).toEqual(['1', '2']);
    expect(result.both).toHaveLength(1);
  });

  it('handles empty input', () => {
    const result = compareLists('', '');
    expect(result.onlyA).toEqual([]);
    expect(result.both).toEqual([]);
    expect(result.onlyB).toEqual([]);
    expect(result.totalA).toBe(0);
  });

  it('sorts naturally when asked', () => {
    const result = compareLists('10\n2\n1', '', { sort: true });
    expect(result.onlyA.map((entry) => entry.value)).toEqual(['1', '2', '10']);
  });
});

describe('formatEntry / formatGroup', () => {
  it('hides counts when they are off', () => {
    expect(formatEntry({ value: '1', inA: 3, inB: 0 }, 'onlyA', false)).toBe('1');
  });

  it('shows a count for repeated values', () => {
    expect(formatEntry({ value: '1', inA: 3, inB: 0 }, 'onlyA', true)).toBe('1  ×3');
    expect(formatEntry({ value: '1', inA: 1, inB: 0 }, 'onlyA', true)).toBe('1');
  });

  it('shows both counts for shared values', () => {
    expect(formatEntry({ value: '1', inA: 2, inB: 3 }, 'both', true)).toBe('1  (A: 2, B: 3)');
    expect(formatEntry({ value: '1', inA: 1, inB: 1 }, 'both', true)).toBe('1');
  });

  it('joins the entries with newlines', () => {
    const entries = [
      { value: '1', inA: 1, inB: 0 },
      { value: '2', inA: 2, inB: 0 },
    ];
    expect(formatGroup(entries, 'onlyA', true)).toBe('1\n2  ×2');
  });
});

describe('describeComparison / comparisonText', () => {
  it('summarizes both sides', () => {
    const result = compareLists('1\n1\n2', '2\n3');
    expect(describeComparison(result)).toBe('A: 3 items (1 duplicate) · B: 2 items · 1 shared');
  });

  it('exports every group with a header', () => {
    const result = compareLists('1\n2', '2\n3');
    expect(comparisonText(result, false)).toBe(
      '# Only in A (1)\n1\n\n# In both (1)\n2\n\n# Only in B (1)\n3\n',
    );
  });
});
