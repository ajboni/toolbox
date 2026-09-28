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
];

export function toolsInCategory(category: string): Tool[] {
  return TOOLS.filter((tool) => tool.category === category);
}
