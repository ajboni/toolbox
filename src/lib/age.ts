import { diffYmd, formatYmd, startOfDay, type YmdDiff } from './dates';

export const formatAge = formatYmd;

const MS_PER_DAY = 86_400_000;

export interface AgeResult extends YmdDiff {
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
}

export function ageBetween(birth: Date, on: Date = new Date()): AgeResult | null {
  const from = startOfDay(birth);
  const to = startOfDay(on);
  if (from.getTime() > to.getTime()) return null;

  const { years, months, days } = diffYmd(from, to);
  const totalDays = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
  };
}

function clampToMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export function nextBirthday(birth: Date, on: Date = new Date()): Date {
  const b = startOfDay(birth);
  const today = startOfDay(on);
  let candidate = clampToMonth(today.getFullYear(), b.getMonth(), b.getDate());
  if (candidate.getTime() < today.getTime()) {
    candidate = clampToMonth(today.getFullYear() + 1, b.getMonth(), b.getDate());
  }
  return candidate;
}

export function daysUntilBirthday(birth: Date, on: Date = new Date()): number {
  const today = startOfDay(on);
  const next = nextBirthday(birth, on);
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}


