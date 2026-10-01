const MS_THRESHOLD = 100_000_000_000;

export function epochToMillis(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  const millis = Math.abs(value) >= MS_THRESHOLD ? value : value * 1000;
  return Number.isFinite(millis) ? millis : null;
}

export function millisToEpoch(date: Date): { seconds: number; milliseconds: number } {
  const milliseconds = date.getTime();
  return { seconds: Math.floor(milliseconds / 1000), milliseconds };
}

export function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export function formatRelative(millis: number, now: number = Date.now()): string {
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let duration = (millis - now) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatter.format(Math.round(duration), 'year');
}
