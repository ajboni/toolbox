import { findCategory } from './site';
import { TOOLS } from './tools';
import type { SearchItem } from '../lib/search';

export const SEARCH_INDEX: SearchItem[] = TOOLS.map((tool) => {
  const category = findCategory(tool.category);

  return {
    path: tool.path,
    title: tool.title,
    description: tool.description,
    category: tool.category,
    categoryName: category?.name ?? tool.category,
    accent: category?.accent ?? 'violet',
  };
});
