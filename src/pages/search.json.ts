import type { APIRoute } from 'astro';
import { SEARCH_INDEX } from '../data/searchIndex';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(SEARCH_INDEX), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
