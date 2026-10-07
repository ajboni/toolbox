import { startOfDay } from './dates';

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export interface BirthdayOccurrence {
  year: number;
  age: number;
  date: Date;
  weekday: number;
  isClamped: boolean;
}

export interface WeekdayCount {
  weekday: number;
  name: string;
  count: number;
}

function clampToMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export function birthdayOccurrences(
  birth: Date,
  fromYear: number,
  toYear: number,
): BirthdayOccurrence[] {
  const b = startOfDay(birth);
  const birthYear = b.getFullYear();
  const start = Math.max(Math.trunc(fromYear), birthYear);
  const end = Math.trunc(toYear);
  const isLeapDayBirth = b.getMonth() === 1 && b.getDate() === 29;

  const occurrences: BirthdayOccurrence[] = [];
  for (let year = start; year <= end; year += 1) {
    const date = clampToMonth(year, b.getMonth(), b.getDate());
    occurrences.push({
      year,
      age: year - birthYear,
      date,
      weekday: date.getDay(),
      isClamped: isLeapDayBirth && date.getDate() !== 29,
    });
  }
  return occurrences;
}

export function weekdayCounts(
  occurrences: BirthdayOccurrence[],
): WeekdayCount[] {
  const counts = new Array<number>(7).fill(0);
  for (const occurrence of occurrences) counts[occurrence.weekday] += 1;
  return WEEKDAYS.map((name, weekday) => ({
    weekday,
    name,
    count: counts[weekday],
  }));
}

export function mostCommonWeekday(
  occurrences: BirthdayOccurrence[],
): WeekdayCount | null {
  if (occurrences.length === 0) return null;
  return weekdayCounts(occurrences).reduce((best, current) =>
    current.count > best.count ? current : best,
  );
}
