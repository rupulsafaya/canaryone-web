/**
 * Resolves the brand mark for an OpenRouter-style model id.
 *
 * RECOVERED RATHER THAN REWRITTEN. This is the resolver from `src/lib/prices.ts`, which was
 * deleted along with the /prices page; `src/lib/model-icon-slugs.json` and
 * `public/logos/models/` both survived it, so the only missing piece was the lookup. It
 * lives in its own module now because it is the one part of that file with nothing to do
 * with Supabase or with the chart that page drew, and /market is the second page to want it.
 *
 * The icons themselves are mirrored from @lobehub/icons-static-svg by
 * scripts/sync-model-icons.mjs, which copies the whole 323-brand library rather than the
 * vendors we happen to track today. That is what lets a model the capture starts reporting
 * next month get its mark with no code change.
 */

import iconSlugs from './model-icon-slugs.json';

/**
 * Every brand slug public/logos/models/ holds. Checked before rendering an <img> so an
 * uncovered vendor shows no icon rather than a broken image.
 */
const ICON_SLUGS = new Set<string>(iconSlugs);

/**
 * Guesses which brand a model id belongs to, in descending order of specificity.
 *
 * Nothing here names a vendor. The rules work off the shape of an OpenRouter-style
 * `vendor/model-family-version` id, so a vendor the capture starts reporting later resolves
 * on its own. Worked examples against the ids currently on /market:
 *
 *   z-ai/glm-5.2                       -> "zai"       (punctuation stripped)
 *   deepseek/deepseek-v4-pro           -> "deepseek"
 *   moonshotai/kimi-k3                 -> "kimi"      (family beats vendor)
 *   openai/gpt-oss-120b                -> "openai"    (no "gpt" mark, so the vendor carries it)
 *   qwen/qwen3-coder-next              -> "qwen"
 *   nvidia/nemotron-3-super-120b-a12b  -> "nvidia"    ("nemotron" matches nothing)
 *   minimax/minimax-m3                 -> "minimax"
 *   anthropic/claude-opus-5            -> "claude"    (Anthropic ships no colour mark, Claude does)
 *
 * The model family is tried first because it is usually the better-known mark. The risk is a
 * family name colliding with an unrelated brand in a 323-entry library; it is the first
 * token of the name rather than any token, which keeps that unlikely.
 */
function brandSlugCandidates(modelId: string): string[] {
  const alnum = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const slash = modelId.indexOf('/');
  const vendorRaw = slash === -1 ? '' : modelId.slice(0, slash);
  const modelRaw = slash === -1 ? modelId : modelId.slice(slash + 1);

  const vendor = alnum(vendorRaw);
  const family = alnum(modelRaw.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean)[0] ?? '');

  const candidates = [
    family,
    vendor + family,
    vendor,
    vendor.replace(/ai$/, ''),
    alnum(vendorRaw.split('-')[0]),
  ];

  // Single characters are never a brand, and the dedupe keeps a repeated guess from costing
  // a second lookup.
  return [...new Set(candidates.filter((c) => c.length > 1))];
}

/**
 * Path to the brand icon for a model, or null when the library covers none of its
 * candidates. Resolved from the id, so the icon set follows the data.
 */
export function brandIconFor(modelId: string): string | null {
  for (const candidate of brandSlugCandidates(modelId)) {
    if (ICON_SLUGS.has(candidate)) return `/logos/models/${candidate}.svg`;
  }
  return null;
}
