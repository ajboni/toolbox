export interface Occasion {
  slug: string;
  name: string;
  shortName: string;
  month: number;
  day: number;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  about: string;
}

export const OCCASIONS: Occasion[] = [
  {
    slug: 'new-year',
    name: "New Year's Day",
    shortName: 'New Year',
    month: 1,
    day: 1,
    seoTitle: "How Many Days Until New Year's Day? · Live Countdown",
    seoDescription:
      "Find out exactly how many days, weeks and months are left until New Year's Day. Free, instant and no sign-up required.",
    intro:
      "New Year's Day marks the first day of the Gregorian calendar and is celebrated around the world with fireworks, countdowns and fresh resolutions.",
    about:
      "This page counts down to the next 1 January. The number refreshes on its own, so the same link always shows the correct countdown no matter what year it is.",
  },
  {
    slug: 'christmas',
    name: 'Christmas Day',
    shortName: 'Christmas',
    month: 12,
    day: 25,
    seoTitle: 'How Many Days Until Christmas? · Live Christmas Countdown',
    seoDescription:
      "Count down the days, weeks and months until Christmas Day. A quick, free and always up-to-date Christmas countdown.",
    intro:
      "Christmas Day is celebrated on 25 December in much of the world, traditionally with family gatherings, gift-giving and festive meals.",
    about:
      "The countdown below always points to the next 25 December and updates automatically, so you can bookmark it and reuse it every year.",
  },
  {
    slug: 'valentines-day',
    name: "Valentine's Day",
    shortName: "Valentine's Day",
    month: 2,
    day: 14,
    seoTitle: "How Many Days Until Valentine's Day? · Day Countdown",
    seoDescription:
      "See how many days, weeks and months remain until Valentine's Day on 14 February. Free, fast and no sign-up needed.",
    intro:
      "Valentine's Day falls on 14 February and is dedicated to love, friendship and small gestures.",
    about:
      "This countdown targets the next 14 February and recalculates itself, so the same link stays accurate every year.",
  },
  {
    slug: 'halloween',
    name: 'Halloween',
    shortName: 'Halloween',
    month: 10,
    day: 31,
    seoTitle: 'How Many Days Until Halloween? · Spooky Countdown',
    seoDescription:
      'Find out how many days, weeks and months are left until Halloween on 31 October. Free and instant.',
    intro:
      "Halloween is observed on 31 October with costumes, trick-or-treating and jack-o'-lanterns.",
    about:
      "The counter below always targets the next 31 October and updates on its own, so you can share the link and forget about it.",
  },
  {
    slug: 'new-years-eve',
    name: "New Year's Eve",
    shortName: "New Year's Eve",
    month: 12,
    day: 31,
    seoTitle: "How Many Days Until New Year's Eve? · Countdown",
    seoDescription:
      "Count the days, weeks and months until New Year's Eve on 31 December. Free, live and no sign-up required.",
    intro:
      "New Year's Eve, on 31 December, is the last day of the year and the biggest night for parties, fireworks and countdowns.",
    about:
      "This page counts down to the next 31 December and refreshes automatically, so the same link is always correct.",
  },
  {
    slug: 'earth-day',
    name: 'Earth Day',
    shortName: 'Earth Day',
    month: 4,
    day: 22,
    seoTitle: 'How Many Days Until Earth Day? · Countdown',
    seoDescription:
      'See how many days, weeks and months remain until Earth Day on 22 April. Free, instant and no sign-up.',
    intro:
      "Earth Day is marked on 22 April and is dedicated to environmental protection and climate awareness.",
    about:
      "The countdown below always points to the next 22 April and updates itself, so one link works every year.",
  },
];

export function findOccasion(slug: string): Occasion | undefined {
  return OCCASIONS.find((occasion) => occasion.slug === slug);
}
