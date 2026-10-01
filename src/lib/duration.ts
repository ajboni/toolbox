import { diffYmd, startOfDay, toISODate, type YmdDiff } from './dates';

const MS_PER_DAY = 86_400_000;

export interface DurationResult extends YmdDiff {
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  backwards: boolean;
}

export function durationBetween(from: Date, to: Date): DurationResult {
  const negative = to.getTime() < from.getTime();
  const start = startOfDay(negative ? to : from);
  const end = startOfDay(negative ? from : to);

  const { years, months, days } = diffYmd(start, end);
  const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalHours: totalDays * 24,
    backwards: negative,
  };
}

export function weeksAndDays(totalDays: number): { weeks: number; days: number } {
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

export { toISODate };
