import { SITE } from '../data/site';

interface WebApplicationInput {
  name: string;
  description: string;
  path: string;
}

export function webApplication({
  name,
  description,
  path,
}: WebApplicationInput): Record<string, unknown> {
  const url = new URL(path, SITE.url).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbs(items: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE.url).href,
    })),
  };
}
