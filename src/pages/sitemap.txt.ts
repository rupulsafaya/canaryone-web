import type { APIRoute } from 'astro';
import { SITE_URL } from '../layouts/Layout.astro';
import { getRuns } from '../lib/runs';

/**
 * A plain-text sitemap, which is a format search engines accept and which needs no
 * dependency. Every run page is listed, so a new import shows up here automatically.
 */
export const GET: APIRoute = async () => {
  const runs = await getRuns();
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/runs/`,
    ...runs.map((run) => `${SITE_URL}/runs/${run.id}/`),
  ];
  return new Response(`${urls.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
