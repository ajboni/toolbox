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

export interface NumberedDiffLine extends DiffLine {
  oldLine: number | null;
  newLine: number | null;
}

function lcsMatrix(a: string[], b: string[]): number[][] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

export function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const dp = lcsMatrix(aLines, bLines);
  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < aLines.length && j < bLines.length) {
    if (aLines[i] === bLines[j]) {
      diff.push({ type: 'same', text: aLines[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
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
