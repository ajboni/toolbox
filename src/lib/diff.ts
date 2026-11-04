export type DiffType = 'same' | 'add' | 'remove';

export interface DiffLine {
  type: DiffType;
  text: string;
}

export interface DiffSummary {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DiffOptions {
  ignoreTrailingWhitespace?: boolean;
}

export interface NumberedDiffLine extends DiffLine {
  oldLine: number | null;
  newLine: number | null;
}

export interface SplitCell {
  line: number;
  text: string;
  type: DiffType;
}

export interface SplitRow {
  left: SplitCell | null;
  right: SplitCell | null;
}

export const MAX_DIFF_CELLS = 4_000_000;

const TRAILING_WHITESPACE = /[ \t]+$/;

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

function normalizeLine(line: string, ignoreTrailingWhitespace: boolean): string {
  return ignoreTrailingWhitespace ? line.replace(TRAILING_WHITESPACE, '') : line;
}

function lcsMatrix(a: string[], b: string[]): Uint32Array {
  const width = b.length + 1;
  const dp = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i * width + j] =
        a[i] === b[j]
          ? dp[(i + 1) * width + j + 1] + 1
          : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    }
  }
  return dp;
}

export function diffLines(a: string, b: string, options: DiffOptions = {}): DiffLine[] {
  const ignoreTrailingWhitespace = options.ignoreTrailingWhitespace ?? false;
  const aLines = splitLines(a).map((line) => normalizeLine(line, ignoreTrailingWhitespace));
  const bLines = splitLines(b).map((line) => normalizeLine(line, ignoreTrailingWhitespace));
  const width = bLines.length + 1;
  const dp = lcsMatrix(aLines, bLines);
  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < aLines.length && j < bLines.length) {
    if (aLines[i] === bLines[j]) {
      diff.push({ type: 'same', text: aLines[i] });
      i += 1;
      j += 1;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      diff.push({ type: 'remove', text: aLines[i] });
      i += 1;
    } else {
      diff.push({ type: 'add', text: bLines[j] });
      j += 1;
    }
  }
  while (i < aLines.length) {
    diff.push({ type: 'remove', text: aLines[i] });
    i += 1;
  }
  while (j < bLines.length) {
    diff.push({ type: 'add', text: bLines[j] });
    j += 1;
  }

  return diff;
}

export function diffIsTooLarge(a: string, b: string): boolean {
  return splitLines(a).length * splitLines(b).length > MAX_DIFF_CELLS;
}

export function diffSummary(lines: DiffLine[]): DiffSummary {
  const summary: DiffSummary = { added: 0, removed: 0, unchanged: 0 };
  for (const line of lines) {
    if (line.type === 'add') summary.added += 1;
    else if (line.type === 'remove') summary.removed += 1;
    else summary.unchanged += 1;
  }
  return summary;
}

export function numberDiffLines(lines: DiffLine[]): NumberedDiffLine[] {
  let oldLine = 1;
  let newLine = 1;
  return lines.map((line) => {
    const row: NumberedDiffLine = {
      ...line,
      oldLine: line.type === 'add' ? null : oldLine,
      newLine: line.type === 'remove' ? null : newLine,
    };
    if (line.type !== 'add') oldLine += 1;
    if (line.type !== 'remove') newLine += 1;
    return row;
  });
}

export function splitDiffLines(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let oldLine = 1;
  let newLine = 1;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.type === 'same') {
      rows.push({
        left: { line: oldLine, text: line.text, type: 'same' },
        right: { line: newLine, text: line.text, type: 'same' },
      });
      oldLine += 1;
      newLine += 1;
      index += 1;
      continue;
    }

    const removals: string[] = [];
    const additions: string[] = [];
    while (index < lines.length && lines[index].type !== 'same') {
      if (lines[index].type === 'remove') removals.push(lines[index].text);
      else additions.push(lines[index].text);
      index += 1;
    }

    const pairs = Math.max(removals.length, additions.length);
    for (let pair = 0; pair < pairs; pair += 1) {
      const removed = removals[pair];
      const added = additions[pair];
      rows.push({
        left:
          removed === undefined ? null : { line: oldLine, text: removed, type: 'remove' },
        right: added === undefined ? null : { line: newLine, text: added, type: 'add' },
      });
      if (removed !== undefined) oldLine += 1;
      if (added !== undefined) newLine += 1;
    }
  }

  return rows;
}
