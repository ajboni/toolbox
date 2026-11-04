import type { CodeFormat } from './codeFormat';
import type { DiffSummary, DiffType } from './diff';

export const DIFF_ROW_BASE = 'flex min-h-5 text-xs leading-5';
export const DIFF_GUTTER =
  'w-10 shrink-0 select-none border-r border-zinc-200 px-2 text-right text-xs leading-5 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500';
export const DIFF_SIGN_CELL = 'w-6 shrink-0 select-none px-2 text-center';
export const DIFF_TEXT =
  'whitespace-pre-wrap break-all px-2 text-zinc-800 dark:text-zinc-200';

export const DIFF_SPLIT_ROW = 'grid grid-cols-2';
export const DIFF_SPLIT_CELL = 'flex min-h-5 text-xs leading-5';
export const DIFF_SPLIT_LEFT = 'border-r border-zinc-200 dark:border-zinc-800';
export const DIFF_SPLIT_GUTTER =
  'w-9 shrink-0 select-none px-1.5 text-right text-xs leading-5 text-zinc-400 dark:text-zinc-500';
export const DIFF_SPLIT_TEXT =
  'min-w-0 flex-1 whitespace-pre-wrap break-all px-2 text-zinc-800 dark:text-zinc-200';
export const DIFF_SPLIT_EMPTY = 'bg-zinc-50 dark:bg-zinc-900/60';

export const VIEW_BUTTON_BASE = 'rounded-full px-3 py-1 text-xs font-medium transition';
export const VIEW_BUTTON_ACTIVE =
  'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900';
export const VIEW_BUTTON_INACTIVE =
  'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';

export const DIFF_TOO_LARGE = 'Input is too large to compare line by line';

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

export function describeDetectedFormat(format: CodeFormat | null, enabled: boolean): string {
  if (!format) return 'Plain text';
  const label = format === 'json' ? 'JSON' : 'XML';
  return enabled ? `${label} · formatted for comparison` : `${label} · shown raw`;
}
