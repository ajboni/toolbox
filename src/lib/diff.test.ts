import { describe, expect, it } from 'vitest';
import { diffLines, diffSummary, numberDiffLines } from './diff';
import { describeDiff } from './diffView';

describe('diffLines', () => {
  it('marks identical input as unchanged', () => {
    const lines = diffLines('one\ntwo\nthree', 'one\ntwo\nthree');
    expect(lines.map((line) => line.type)).toEqual(['same', 'same', 'same']);
    expect(lines.map((line) => line.text)).toEqual(['one', 'two', 'three']);
  });

  it('detects an added line', () => {
    const lines = diffLines('a', 'a\nb');
    expect(lines).toEqual([
      { type: 'same', text: 'a' },
      { type: 'add', text: 'b' },
    ]);
  });

  it('detects a removed line', () => {
    const lines = diffLines('a\nb', 'a');
    expect(lines).toEqual([
      { type: 'same', text: 'a' },
      { type: 'remove', text: 'b' },
    ]);
  });

  it('reports a changed line as a removal followed by an addition', () => {
    const lines = diffLines('one\ntwo\nthree', 'one\n2\nthree');
    expect(lines).toEqual([
      { type: 'same', text: 'one' },
      { type: 'remove', text: 'two' },
      { type: 'add', text: '2' },
      { type: 'same', text: 'three' },
    ]);
  });

  it('handles a trailing newline', () => {
    const lines = diffLines('a\n', 'a');
    expect(lines).toEqual([
      { type: 'same', text: 'a' },
      { type: 'remove', text: '' },
    ]);
  });

  it('handles two empty strings', () => {
    expect(diffLines('', '')).toEqual([{ type: 'same', text: '' }]);
  });
});

describe('diffSummary', () => {
  it('counts additions, removals and unchanged lines', () => {
    const summary = diffSummary(diffLines('one\ntwo\nthree', 'one\n2\nthree'));
    expect(summary).toEqual({ added: 1, removed: 1, unchanged: 2 });
  });

  it('returns zeros for identical input', () => {
    expect(diffSummary(diffLines('a\nb', 'a\nb'))).toEqual({
      added: 0,
      removed: 0,
      unchanged: 2,
    });
  });
});

describe('numberDiffLines', () => {
  it('numbers the original and changed sides independently', () => {
    const rows = numberDiffLines(diffLines('one\ntwo\nthree', 'one\n2\nthree'));
    expect(rows).toEqual([
      { type: 'same', text: 'one', oldLine: 1, newLine: 1 },
      { type: 'remove', text: 'two', oldLine: 2, newLine: null },
      { type: 'add', text: '2', oldLine: null, newLine: 2 },
      { type: 'same', text: 'three', oldLine: 3, newLine: 3 },
    ]);
  });
});

describe('describeDiff', () => {
  it('summarises changes with correct pluralisation', () => {
    expect(describeDiff({ added: 1, removed: 1, unchanged: 2 })).toBe(
      '1 addition, 1 removal',
    );
    expect(describeDiff({ added: 3, removed: 0, unchanged: 5 })).toBe(
      '3 additions, 0 removals',
    );
  });

  it('reports no changes for identical input', () => {
    expect(describeDiff(diffSummary(diffLines('a', 'a')))).toBe('No changes');
  });
});
