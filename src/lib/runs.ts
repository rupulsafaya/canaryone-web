import { getCollection, type CollectionEntry } from 'astro:content';

export type Run = CollectionEntry<'runs'>;

/**
 * How each kind of run is named on the page. The distinction is load-bearing: it decides
 * what the run can support, so it is never abbreviated away.
 */
export const KIND_LABEL: Record<Run['data']['kind'], string> = {
  'commissioned-sweep': 'Commissioned hosted sweep',
  'local-tool-run': 'Local tool run',
  'metadata-scan': 'Metadata scan',
};

/** The short form used on cards, where there is no room for the full label. */
export const KIND_SHORT: Record<Run['data']['kind'], string> = {
  'commissioned-sweep': 'commissioned sweep',
  'local-tool-run': 'local tool run',
  'metadata-scan': 'metadata scan',
};

/**
 * How much weight each kind of run can carry, said to the reader rather than to us. This
 * replaces the internal "publication status" note, which answered a different question —
 * whether we may post a figure, not how far a reader should trust one.
 */
export const KIND_WEIGHT: Record<Run['data']['kind'], string> = {
  'commissioned-sweep':
    'A commissioned hosted sweep, with a committed write-up behind it. Someone outside the company can in principle check these figures, so this is the run to hold a contested number against.',
  'local-tool-run':
    'A local tool run, executed on our own machine against our own target. A reader cannot reproduce it, so treat it as a demonstration of the method rather than as a settled finding about any named host or gateway.',
  'metadata-scan':
    'A metadata scan, which reads a gateway’s endpoint listings without running any inference. Anyone with a gateway key can reproduce it for nothing, and it goes stale within days — check the run date before quoting a price or a host count.',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Formats a YYYY-MM-DD string without going through Date, which would shift the day
 * backwards for any reader west of UTC.
 */
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/**
 * The route count on its own, for cards. The full matrix is a sentence in some runs —
 * "12 routes reached through 2 routers and 5 providers" — which is the right thing on the
 * run page and too much on a card.
 */
export function routeCount(routes: string | undefined): string | null {
  if (!routes) return null;
  const m = routes.match(/^\s*(\d+)/);
  return m ? m[1] : null;
}

/** Every run, newest first. The filename date prefix is the sort key. */
export async function getRuns(): Promise<Run[]> {
  const runs = await getCollection('runs');
  return runs.sort((a, b) => b.data.date.localeCompare(a.data.date));
}
