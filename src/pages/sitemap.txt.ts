import type { APIRoute } from 'astro';
import { SITE_URL } from '../layouts/Layout.astro';

/**
 * A plain-text sitemap, which is a format search engines accept and which needs no
 * dependency. One entry per page, held by hand now that the generated run pages are gone.
 *
 * This previously enumerated every run report and never listed /evals at all, so the page
 * the repositioning moved all the benchmark detail onto went unindexed from the day it
 * landed. Add a line here whenever a page lands.
 */
export const GET: APIRoute = async () => {
  const urls = [`${SITE_URL}/`, `${SITE_URL}/evals`, `${SITE_URL}/prices`];
  return new Response(`${urls.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
