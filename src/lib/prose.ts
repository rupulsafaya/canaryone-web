/**
 * Every number-to-text helper the site uses, in one file.
 *
 * COPY.md § Prose says multipliers are spelled out in prose because "three and a half times"
 * reads aloud and "3.5×" does not, and that the compact form is fine inside a table cell, a
 * chart label or a heading. That means most figures need two renderings of the same value,
 * and a page that writes both by hand eventually disagrees with itself.
 *
 * These were written for /market and copied into /evals, and for a while both pages carried
 * their own `times()` — the same six-branch banding in two places, on a site with a number
 * gate, where the two copies deciding to round a ratio differently is a published error rather
 * than an inconsistency. /market's copies were deleted on 2026-08-13 in favour of these, along
 * with its date, currency and integer formatters, so a figure is formatted one way site-wide.
 *
 * Anything that turns a number into words or into a rendered string belongs here. Anything
 * that decides which number to show belongs in the page.
 */

const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];

/** Spelled out to twenty, digits above it. Beyond twenty a word is harder to read than a numeral. */
export const spell = (n: number): string => (n <= 20 ? WORDS[n] : String(n));

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * A ratio in words. The banding is inherited from /market and each branch is there because a
 * plainer rule got a real figure wrong:
 *
 *   Under two, a ratio reads better as the gap than as the multiple — a 1.25 spread is a
 *   quarter more, and "more than one times" is not English.
 *   The 0.28-to-0.4 branch is bounded above on purpose: without the bound, 4.62 came out as
 *   "nearly four and a half times" when it is past four and a half, and rounding down is the
 *   wrong direction on a page with a number gate.
 *   Past the half, the sentence names the half it has cleared, because "more than two times"
 *   for 2.69 reads as an understatement beside a table cell saying 2.7.
 */
export const times = (r: number): string => {
  if (r < 1.95) return `${Math.round((r - 1) * 100)} per cent above`;
  const f = Math.floor(r), frac = r - f;
  if (frac >= 0.4 && frac <= 0.6) return `${spell(f)} and a half times`;
  if (frac > 0.85) return `nearly ${spell(f + 1)} times`;
  if (frac < 0.15) return `${spell(f)} times`;
  if (frac >= 0.28 && frac < 0.4) return `nearly ${spell(f)} and a half times`;
  if (frac > 0.6) return `more than ${spell(f)} and a half times`;
  return `more than ${spell(f)} times`;
};

/** The compact form, for a table cell, a chart label or a heading. Never for prose. */
export const mult = (n: number): string => `${n < 10 ? n.toFixed(1) : Math.round(n)}×`;

/**
 * A date in visible copy. Every figure on the site carries its run date beside it, so this is
 * the format that appears next to a number rather than a general-purpose formatter.
 */
export const day = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

/**
 * A date and a time, for a figure read from a live source several times a day. The " UTC" is
 * part of the string because a reader in another timezone has no way to know otherwise.
 */
export const stamp = (iso: string): string =>
  `${new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  })} UTC`;

/**
 * Money in a sentence: two places above a dollar and three below, so a price reads the way it
 * would be said. Never in a column — see `usdCol`.
 */
export const usd = (n: number): string => (n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`);

/**
 * Three decimals, fixed, for a price column. `usd` switches precision above a dollar, which is
 * right in a sentence and wrong in a column: $2.80 beside $0.021 put the decimal points out of
 * line down a whole table, which DESIGN.md § Tables says a cost table must not do.
 */
export const usdCol = (n: number): string => `$${n.toFixed(3)}`;

/**
 * Four decimals, fixed. Cost per completed task runs to hundredths of a cent, and dropping
 * trailing zeros puts $0.069 beside $0.1852 with the points ragged.
 */
export const usd4 = (n: number): string => `$${n.toFixed(4)}`;

/** A price in words, because "$0.150" belongs in a column rather than in a sentence. */
export const priceWords = (n: number): string =>
  (n < 1 ? `${Math.round(n * 100)} cents` : usd(n));

/** A grouped integer, for a token count large enough that the digits need separating. */
export const int = (n: number): string => Math.round(n).toLocaleString('en-GB');

/** A percentage gap, for "cost 46 per cent more" where `times()` would read "46 per cent above". */
export const pctMore = (r: number): string => `${Math.round((r - 1) * 100)} per cent more`;

/** Seconds, for a latency figure that is far past the point where milliseconds mean anything. */
export const secs = (ms: number): string => `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
