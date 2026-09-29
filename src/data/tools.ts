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
  {
    slug: 'percent-of',
    category: 'math',
    title: 'Percent Of',
    description: 'Work out what X percent of any number is.',
    path: '/math/percent-of/',
  },
  {
    slug: 'what-percent',
    category: 'math',
    title: 'X Is What Percent of Y?',
    description: 'Find out what percentage one number is of another.',
    path: '/math/what-percent/',
  },
  {
    slug: 'percent-change',
    category: 'math',
    title: 'Percentage Change',
    description: 'Measure the percentage increase or decrease between two values.',
    path: '/math/percent-change/',
  },
  {
    slug: 'add-percent',
    category: 'math',
    title: 'Add or Subtract a Percentage',
    description: 'Increase or decrease a value by a percentage in one step.',
    path: '/math/add-percent/',
  },
  {
    slug: 'rule-of-three',
    category: 'math',
    title: 'Rule of Three',
    description: 'Solve any proportion a / b = c / x for the missing value.',
    path: '/math/rule-of-three/',
  },
];

export function toolsInCategory(category: string): Tool[] {
  return TOOLS.filter((tool) => tool.category === category);
}
