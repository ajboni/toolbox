import { describe, expect, it } from 'vitest';
import {
  diffIsTooLarge,
  diffLines,
  diffSummary,
  diffText,
  numberDiffLines,
  splitDiffLines,
} from './diff';
import { describeDiff, describeDetectedFormat } from './diffView';

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

describe('diffLines options', () => {
  it('normalises CRLF line endings', () => {
    expect(diffLines('a\r\nb', 'a\nb')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'same', text: 'b' },
    ]);
  });

  it('ignores trailing whitespace when asked', () => {
    expect(diffLines('a  \nb\t', 'a\nb', { ignoreTrailingWhitespace: true })).toEqual([
      { type: 'same', text: 'a' },
      { type: 'same', text: 'b' },
    ]);
  });

  it('keeps trailing whitespace differences by default', () => {
    expect(diffLines('a  ', 'a').map((line) => line.type)).toEqual(['remove', 'add']);
  });
});

describe('diffIsTooLarge', () => {
  it('accepts small inputs', () => {
    expect(diffIsTooLarge('a\nb', 'a\nc')).toBe(false);
  });

  it('rejects inputs above the cell budget', () => {
    const big = new Array(2001).fill('line').join('\n');
    expect(diffIsTooLarge(big, big)).toBe(true);
  });
});

describe('splitDiffLines', () => {
  it('pairs a changed line on both sides', () => {
    expect(splitDiffLines(diffLines('one\ntwo\nthree', 'one\n2\nthree'))).toEqual([
      {
        left: { line: 1, text: 'one', type: 'same' },
        right: { line: 1, text: 'one', type: 'same' },
      },
      {
        left: { line: 2, text: 'two', type: 'remove' },
        right: { line: 2, text: '2', type: 'add' },
      },
      {
        left: { line: 3, text: 'three', type: 'same' },
        right: { line: 3, text: 'three', type: 'same' },
      },
    ]);
  });

  it('leaves the right side empty when there are more removals', () => {
    expect(splitDiffLines(diffLines('a\nb', 'c'))).toEqual([
      {
        left: { line: 1, text: 'a', type: 'remove' },
        right: { line: 1, text: 'c', type: 'add' },
      },
      {
        left: { line: 2, text: 'b', type: 'remove' },
        right: null,
      },
    ]);
  });

  it('leaves the left side empty when there are more additions', () => {
    expect(splitDiffLines(diffLines('a', 'b\nc'))).toEqual([
      {
        left: { line: 1, text: 'a', type: 'remove' },
        right: { line: 1, text: 'b', type: 'add' },
      },
      {
        left: null,
        right: { line: 2, text: 'c', type: 'add' },
      },
    ]);
  });

  it('numbers each side independently across blocks', () => {
    const rows = splitDiffLines(diffLines('a\nb', 'a\nc'));
    expect(rows.map((row) => [row.left?.line ?? null, row.right?.line ?? null])).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });
});

describe('diffText', () => {
  it('prefixes additions, removals and unchanged lines', () => {
    expect(diffText(diffLines('one\ntwo', 'one\n2\nthree'))).toBe(
      ' one\n-two\n+2\n+three',
    );
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

describe('describeDetectedFormat', () => {
  it('describes the format and the formatter state', () => {
    expect(describeDetectedFormat('json', true)).toBe('JSON · formatted for comparison');
    expect(describeDetectedFormat('xml', false)).toBe('XML · shown raw');
    expect(describeDetectedFormat(null, true)).toBe('Plain text');
  });
});
