import type { DiffSummary, DiffType } from './diff';

export const DIFF_ROW_BASE = 'flex min-h-6 leading-6';
export const DIFF_GUTTER =
  'w-10 shrink-0 select-none border-r border-zinc-200 px-2 text-right text-xs leading-6 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500';
export const DIFF_SIGN_CELL = 'w-6 shrink-0 select-none px-2 text-center';
export const DIFF_TEXT = 'whitespace-pre-wrap break-all px-2 text-zinc-800 dark:text-zinc-200';

export const DIFF_ROW_TINT: Record<DiffType, string> = {
  same: '',
  add: 'bg-emerald-50 dark:bg-emerald-950/40',
  remove: 'bg-rose-50 dark:bg-rose-950/40',
};

export const DIFF_SIGN: Record<DiffType, string> = {
  same: '',
  add: '+',
  remove: '-',
};

export const DIFF_SIGN_COLOR: Record<DiffType, string> = {
  same: '',
  add: 'text-emerald-600 dark:text-emerald-400',
  remove: 'text-rose-600 dark:text-rose-400',
};

export function describeDiff(summary: DiffSummary): string {
  if (summary.added === 0 && summary.removed === 0) return 'No changes';
  const additions = `${summary.added} addition${summary.added === 1 ? '' : 's'}`;
  const removals = `${summary.removed} removal${summary.removed === 1 ? '' : 's'}`;
  return `${additions}, ${removals}`;
}
