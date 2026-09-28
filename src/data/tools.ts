export interface Tool {
  slug: string;
  category: string;
  title: string;
  description: string;
  path: string;
}

export const TOOLS: Tool[] = [
  {
    slug: 'days-until',
    category: 'dates',
    title: 'Days Until…',
    description:
      'Count the days, weeks and months between today and any date you pick.',
    path: '/dates/days-until/',
  },
  {
    slug: 'days-from',
    category: 'dates',
    title: 'Days From Today',
    description:
      'Find the exact date that falls a given number of days from today or from any start date.',
    path: '/dates/days-from/',
  },
];

export function toolsInCategory(category: string): Tool[] {
  return TOOLS.filter((tool) => tool.category === category);
}
