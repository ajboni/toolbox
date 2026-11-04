import { accentClasses, type AccentName } from '../data/site';

const BASE =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition';
const INACTIVE =
  'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100';

export function searchPillClasses(accent: AccentName | null, active: boolean): string {
  if (!accent) {
    return active
      ? `${BASE} border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900`
      : `${BASE} ${INACTIVE}`;
  }

  if (!active) return `${BASE} ${INACTIVE}`;

  const colors = accentClasses(accent);
  return `${BASE} border-transparent ${colors.bgSoft} ${colors.text}`;
}
