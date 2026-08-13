/**
 * Number-to-words helpers, for the copy rules that are really formatting.
 *
 * COPY.md § Prose says multipliers are spelled out in prose because "three and a half times"
 * reads aloud and "3.5×" does not, and that the compact form is fine inside a table cell, a
 * chart label or a heading. That means most figures need two renderings of the same value,
 * and a page that writes both by hand eventually disagrees with itself.
 *
 * These were written for /market, where they still live inline in the page. They are here
 * because /evals-v2 needs the same three, and a third copy of `times()` is how two pages end
 * up rounding the same ratio in two directions. Nothing about them is /evals-specific; when
 * /market is next touched, its copies should be deleted in favour of these.
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
 * Four decimals, fixed. A formatter that drops trailing zeros puts $0.069 beside $0.1852 and
 * the decimal points go ragged down a column, which DESIGN.md § Tables says a cost table must
 * not do.
 */
export const usd4 = (n: number): string => `$${n.toFixed(4)}`;

/** Seconds, for a latency figure that is far past the point where milliseconds mean anything. */
export const secs = (ms: number): string => `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
