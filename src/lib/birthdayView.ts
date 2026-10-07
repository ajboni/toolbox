import {
  WEEKDAYS,
  birthdayOccurrences,
  mostCommonWeekday,
  weekdayCounts,
  type BirthdayOccurrence,
  type WeekdayCount,
} from './birthday';
import { startOfDay } from './dates';

export const BIRTHDAY_YEARS = 100;

export interface BirthdayView {
  occurrences: BirthdayOccurrence[];
  counts: WeekdayCount[];
  mostCommon: WeekdayCount | null;
  total: number;
  firstYear: number;
  lastYear: number;
  currentYear: number;
  nextIndex: number;
  summary: string;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function buildBirthdayView(
  birth: Date,
  years: number = BIRTHDAY_YEARS,
  today: Date = new Date(),
): BirthdayView {
  const firstYear = birth.getFullYear();
  const occurrences = birthdayOccurrences(birth, firstYear, firstYear + years - 1);
  const counts = weekdayCounts(occurrences);
  const mostCommon = mostCommonWeekday(occurrences);
  const now = startOfDay(today).getTime();
  const nextIndex = occurrences.findIndex((item) => item.date.getTime() >= now);

  const summary = mostCommon
    ? `Across ${occurrences.length} birthdays, ${mostCommon.name} shows up most often, ${mostCommon.count} times.`
    : 'Pick a birth date to see the weekday of every birthday.';

  return {
    occurrences,
    counts,
    mostCommon,
    total: occurrences.length,
    firstYear,
    lastYear: occurrences.length ? occurrences[occurrences.length - 1].year : firstYear,
    currentYear: today.getFullYear(),
    nextIndex,
    summary,
  };
}

export function weekdayCountsHtml(
  view: BirthdayView,
  highlightClass = '',
): string {
  return view.counts
    .map((item) => {
      const isTop = view.mostCommon != null && item.count === view.mostCommon.count;
      const classes = [
        'flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm',
        isTop
          ? `border-transparent ${highlightClass}`
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
      ].join(' ');
      return `<li class="${classes}"><span class="font-medium">${item.name}</span><span class="tabular-nums text-zinc-600 dark:text-zinc-400">${item.count}</span></li>`;
    })
    .join('');
}

export function birthdayTableHtml(
  view: BirthdayView,
  options: { currentClass?: string; nextClass?: string } = {},
): string {
  const { currentClass = '', nextClass = '' } = options;
  return view.occurrences
    .map((item, index) => {
      const isNext = index === view.nextIndex;
      const isCurrent = item.year === view.currentYear;
      const rowClass = isNext
        ? nextClass
        : isCurrent
          ? currentClass
          : '';
      const dateLabel = item.isClamped
        ? `${formatShortDate(item.date)} (Feb 29)`
        : formatShortDate(item.date);
      return `<tr class="border-t border-zinc-200 dark:border-zinc-800 ${rowClass}"><td class="px-3 py-2 tabular-nums">${item.year}</td><td class="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">${item.age}</td><td class="px-3 py-2 whitespace-nowrap">${dateLabel}</td><td class="px-3 py-2">${weekdayName(item.weekday)}</td></tr>`;
    })
    .join('');
}

export function weekdayName(weekday: number): string {
  return WEEKDAYS[weekday] ?? '';
}
