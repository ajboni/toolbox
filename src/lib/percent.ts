export type ApplyOp = 'add' | 'subtract';

export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value;
}

export function whatPercent(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return (part / whole) * 100;
}

export function percentChange(from: number, to: number): number | null {
  if (from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

export function applyPercent(
  value: number,
  percent: number,
  op: ApplyOp = 'add',
): number {
  const factor = op === 'subtract' ? 1 - percent / 100 : 1 + percent / 100;
  return value * factor;
}

export function formatNumber(value: number, maxFractionDigits = 6): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

export function formatPercent(value: number, maxFractionDigits = 6): string {
  return `${formatNumber(value, maxFractionDigits)}%`;
}
