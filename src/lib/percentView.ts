import {
  applyPercent,
  formatNumber,
  formatPercent,
  percentChange,
  percentOf,
  whatPercent,
} from './percent';
import {
  solveProportion,
  type ProportionTerm,
  type ProportionValues,
} from './proportion';
import type { ParamSchema } from './urlState';

export type PercentMode =
  | 'percent-of'
  | 'what-percent'
  | 'change'
  | 'add-subtract'
  | 'rule-of-three';

export const PERCENT_SCHEMAS: Record<PercentMode, ParamSchema> = {
  'percent-of': { p: 'number', v: 'number' },
  'what-percent': { part: 'number', whole: 'number' },
  change: { from: 'number', to: 'number' },
  'add-subtract': { v: 'number', p: 'number', op: 'string' },
  'rule-of-three': {
    a: 'number',
    b: 'number',
    c: 'number',
    x: 'number',
    unknown: 'string',
  },
};

export const PERCENT_DEFAULTS: Record<PercentMode, Record<string, string | number>> = {
  'percent-of': { p: 20, v: 100 },
  'what-percent': { part: 25, whole: 100 },
  change: { from: 100, to: 125 },
  'add-subtract': { v: 100, p: 20, op: 'add' },
  'rule-of-three': { a: 3, b: 5, c: 8, unknown: 'x' },
};

export interface PercentResult {
  value: string;
  unit: string;
  detail: string;
}

const TERMS: ProportionTerm[] = ['a', 'b', 'c', 'x'];

const INVALID: PercentResult = {
  value: '—',
  unit: '',
  detail: 'Enter all values to see the result.',
};

function asNumber(value: string | number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function renderPercent(
  mode: PercentMode,
  values: Record<string, string | number | null | undefined>,
): PercentResult {
  switch (mode) {
    case 'percent-of': {
      const p = asNumber(values.p);
      const v = asNumber(values.v);
      if (p == null || v == null) return INVALID;
      const result = percentOf(p, v);
      return {
        value: formatNumber(result),
        unit: '',
        detail: `${formatPercent(p)} of ${formatNumber(v)} is ${formatNumber(result)}.`,
      };
    }
    case 'what-percent': {
      const part = asNumber(values.part);
      const whole = asNumber(values.whole);
      if (part == null || whole == null) return INVALID;
      const result = whatPercent(part, whole);
      if (result == null) {
        return { value: '—', unit: '', detail: 'The whole cannot be zero.' };
      }
      return {
        value: formatNumber(result),
        unit: '%',
        detail: `${formatNumber(part)} is ${formatPercent(result)} of ${formatNumber(whole)}.`,
      };
    }
    case 'change': {
      const from = asNumber(values.from);
      const to = asNumber(values.to);
      if (from == null || to == null) return INVALID;
      const result = percentChange(from, to);
      if (result == null) {
        return { value: '—', unit: '', detail: 'The starting value cannot be zero.' };
      }
      if (result === 0) {
        return {
          value: '0',
          unit: '%',
          detail: `No change from ${formatNumber(from)} to ${formatNumber(to)}.`,
        };
      }
      return {
        value: formatNumber(result),
        unit: '%',
        detail: `${result > 0 ? 'Increase' : 'Decrease'} of ${formatPercent(Math.abs(result))} from ${formatNumber(from)} to ${formatNumber(to)}.`,
      };
    }
    case 'add-subtract': {
      const v = asNumber(values.v);
      const p = asNumber(values.p);
      if (v == null || p == null) return INVALID;
      const op = values.op === 'subtract' ? 'subtract' : 'add';
      const result = applyPercent(v, p, op);
      return {
        value: formatNumber(result),
        unit: '',
        detail: `${formatNumber(v)} ${op === 'subtract' ? '−' : '+'} ${formatPercent(p)} = ${formatNumber(result)}.`,
      };
    }
    case 'rule-of-three': {
      const unknown: ProportionTerm =
        typeof values.unknown === 'string' &&
        TERMS.includes(values.unknown as ProportionTerm)
          ? (values.unknown as ProportionTerm)
          : 'x';
      const known: ProportionValues = {};
      for (const term of TERMS) {
        if (term === unknown) continue;
        const value = asNumber(values[term]);
        if (value == null) return INVALID;
        known[term] = value;
      }
      const result = solveProportion(known, unknown);
      if (result == null) {
        return { value: '—', unit: '', detail: 'Cannot divide by zero.' };
      }
      const resolved = { ...known, [unknown]: result } as Record<ProportionTerm, number>;
      return {
        value: formatNumber(result),
        unit: '',
        detail: `${formatNumber(resolved.a)} / ${formatNumber(resolved.b)} = ${formatNumber(resolved.c)} / ${formatNumber(resolved.x)} — solved for ${unknown.toUpperCase()}.`,
      };
    }
  }
}
