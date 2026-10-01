export interface Offset {
  slug: string;
  days: number;
  label: string;
  context: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  about: string;
}

const OFFSET_DAYS = [30, 60, 90, 120, 180, 365] as const;

const CONTEXTS: Record<number, string> = {
  30: 'about a month',
  60: 'about two months',
  90: 'about three months',
  120: 'about four months',
  180: 'about six months',
  365: 'about a year',
};

export const OFFSETS: Offset[] = OFFSET_DAYS.map((days) => {
  const context = CONTEXTS[days] ?? `${days} days`;
  return {
    slug: `${days}-days`,
    days,
    label: `${days} days`,
    context,
    seoTitle: `What Is ${days} Days From Today? · Date Calculator`,
    seoDescription: `See the exact date ${days} days from today, including the weekday. Free, instant and shareable. No sign-up required.`,
    intro: `${days} days from today is ${context}. The exact date moves every day, so this page calculates it for the moment you open it.`,
    about: `The result counts ${days} calendar days forward from today's date, then shows the weekday and how that breaks down into weeks. Open the page on any day and it updates itself.`,
  };
});

export function findOffset(slug: string): Offset | undefined {
  return OFFSETS.find((offset) => offset.slug === slug);
}
