import type { APIRoute } from 'astro';
import { CATEGORIES, SITE } from '../data/site';
import { toolsInCategory } from '../data/tools';

export const prerender = true;

export const GET: APIRoute = () => {
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `Site: ${SITE.url}`,
    '',
  ];

  for (const category of CATEGORIES) {
    lines.push(`## ${category.name}`, '');

    for (const tool of toolsInCategory(category.slug)) {
      const url = new URL(tool.path, SITE.url).href;
      lines.push(`- [${tool.title}](${url}): ${tool.description}`);
    }

    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  });
};
