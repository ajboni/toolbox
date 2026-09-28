const MS_PER_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysUntil(target: Date, now: Date = new Date()): number {
  const diff = startOfDay(target).getTime() - startOfDay(now).getTime();
  return Math.round(diff / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  const base = startOfDay(date);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + Math.trunc(days));
}

export function nextAnnualOccurrence(
  month: number,
  day: number,
  now: Date = new Date(),
): Date {
  const today = startOfDay(now);
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  if (thisYear.getTime() < today.getTime()) {
    return new Date(today.getFullYear() + 1, month - 1, day);
  }
  return thisYear;
}

export function nextNewYear(now: Date = new Date()): Date {
  return nextAnnualOccurrence(1, 1, now);
}

export interface HumanizedDuration {
  days: number;
  weeks: number;
  remainderDays: number;
  months: number;
}

export function humanizeDays(days: number): HumanizedDuration {
  const abs = Math.abs(days);
  return {
    days: abs,
    weeks: Math.floor(abs / 7),
    remainderDays: abs % 7,
    months: Math.floor(abs / 30.4375),
  };
}
