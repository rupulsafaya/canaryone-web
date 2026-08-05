/**
 * Data layer for the Time Machine chart at /prices.
 *
 * Reads the `model_snapshots` table that the nightly cron populates, and reshapes it into
 * aligned series ready to hand to Chart.js. This module runs IN THE BROWSER — it is
 * imported by the bundled client script on the page, so it must not touch anything
 * server-only.
 */

import iconSlugs from './model-icon-slugs.json';

/**
 * The anon key is read-only and row-level security keeps SELECT the only thing it can do,
 * so it ships in the client bundle deliberately rather than through a PUBLIC_ env var.
 * Hardcoding it means a fresh clone builds and runs with no .env setup at all, which is
 * how the rest of this repo behaves.
 */
const SUPABASE_URL = 'https://riiypeociifzrxxkfixj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaXlwZW9jaWlmenJ4eGtmaXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjYzNjksImV4cCI6MjEwMTUwMjM2OX0.EuGRIlFDrHa0C8izhiMgy5o9lMG3OgPdl85SwgAQxz8';

/** Deliberately high. At 20 models a night this covers about eight months of history. */
const ROW_LIMIT = 5000;

/**
 * Rows the cron wrote while it was being tested, which are not real models and must never
 * reach the chart. Matched on model_id exactly.
 */
const EXCLUDED_MODEL_IDS = new Set(['test/fake-model']);

/** One row of `model_snapshots`, narrowed to the columns the chart reads. */
export interface SnapshotRow {
  collected_at: string;
  model_id: string;
  model_label: string | null;
  prompt_price: number | null;
  completion_price: number | null;
  weighted_input_price: number | null;
  weighted_cache_hit_rate: number | null;
  provider_count: number | null;
}

export type MetricKey = 'listed_input' | 'listed_output' | 'effective_input';

export interface MetricDef {
  key: MetricKey;
  /** Label for the toggle button. */
  label: string;
  /** Label for the y-axis, which needs the unit spelled out. */
  axisLabel: string;
  /** Sentence shown under the toggle, so the reader knows what they are looking at. */
  note: string;
  /** Pulls the raw per-token price out of a row, or null when the row does not report it. */
  read: (row: SnapshotRow) => number | null;
}

/**
 * Prices land in the table as dollars per single token, which is unreadable on an axis —
 * every value would be some multiple of 1e-7. Everything the chart displays is therefore
 * dollars per million tokens.
 */
const PER_MILLION = 1_000_000;

export const METRICS: MetricDef[] = [
  {
    key: 'listed_input',
    label: 'Listed input',
    axisLabel: 'Listed input price ($ per million tokens)',
    note: 'The input price as listed, before any caching discount. This is the only metric currently reported for every model, which is why it is the default.',
    read: (row) => row.prompt_price,
  },
  {
    key: 'listed_output',
    label: 'Listed output',
    axisLabel: 'Listed output price ($ per million tokens)',
    note: 'The output price as listed. Output costs several times input on most models, so the axis rescales when you switch to it.',
    read: (row) => row.completion_price,
  },
  {
    key: 'effective_input',
    label: 'Effective input',
    axisLabel: 'Effective input price after caching ($ per million tokens)',
    note: 'What input actually costs once the cache hit rate is taken into account. Most models report this as exactly zero, which means "not measured" rather than "free", so those models are dropped from this view instead of being drawn along the axis floor.',
    /**
     * A weighted price of exactly 0 is the cron saying it has no cache data for this
     * model, not a claim that the model is free. Plotting it as zero would be a lie, so
     * it becomes a gap.
     */
    read: (row) => (row.weighted_input_price ? row.weighted_input_price : null),
  },
];

export const DEFAULT_METRIC: MetricKey = 'listed_input';

export function metricByKey(key: MetricKey): MetricDef {
  return METRICS.find((m) => m.key === key) ?? METRICS[0];
}

/**
 * The categorical palette, in fixed slot order. These are the eight hues validated against
 * this site's cream surface for colour-vision separation and lightness — the order is
 * load-bearing, so add to the end or not at all.
 *
 * Canary yellow itself is deliberately absent: --accent is the brand's interface colour for
 * calls to action and active states, and reusing it as a data colour would make one
 * arbitrary model look like the highlighted one.
 */
export const SERIES_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
] as const;

/**
 * How many models can be drawn at once. This is the palette length and not an arbitrary
 * cap: past eight hues the lines stop being reliably distinguishable, and cycling the
 * palette would give two models the same colour. Twenty-one models therefore cannot all be
 * on screen together, and the picker enforces it.
 */
export const MAX_SERIES = SERIES_COLORS.length;

/** A single plotted point. The extra fields ride along for the tooltip to read. */
export interface Point {
  x: number;
  y: number | null;
  providers: number | null;
  hitRate: number | null;
}

export interface Series {
  modelId: string;
  label: string;
  points: Point[];
  /** Most recent non-null value, used to order the picker. Null if the model has none. */
  latest: number | null;
}

export interface PriceData {
  /** Every distinct snapshot time, ascending, as epoch milliseconds. */
  timestamps: number[];
  /** One entry per model that reports the requested metric at least once. */
  series: Series[];
}

/**
 * Fetches every snapshot, oldest first. Throws on a non-2xx so the page can show a real
 * error rather than an empty chart that looks like "no data".
 */
export async function fetchSnapshots(): Promise<SnapshotRow[]> {
  const params = new URLSearchParams({
    select:
      'collected_at,model_id,model_label,prompt_price,completion_price,weighted_input_price,weighted_cache_hit_rate,provider_count',
    order: 'collected_at.asc',
    limit: String(ROW_LIMIT),
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/model_snapshots?${params}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase returned ${response.status} ${response.statusText}`);
  }

  const rows: SnapshotRow[] = await response.json();
  return rows.filter((row) => !EXCLUDED_MODEL_IDS.has(row.model_id));
}

/**
 * Reshapes raw rows into one series per model for the chosen metric.
 *
 * Every series gets a point for every snapshot time, with y null where that model has no
 * value. Chart.js needs that alignment for the shared crosshair tooltip to line up across
 * models, and it makes a model that appeared partway through the history read as a line
 * that starts late rather than one that slides left.
 */
export function toSeries(rows: SnapshotRow[], metricKey: MetricKey): PriceData {
  const metric = metricByKey(metricKey);

  const timestamps = [...new Set(rows.map((row) => Date.parse(row.collected_at)))].sort(
    (a, b) => a - b,
  );
  const indexOfTime = new Map(timestamps.map((t, i) => [t, i]));

  interface Bucket {
    label: string;
    values: (Point | undefined)[];
  }
  const buckets = new Map<string, Bucket>();

  for (const row of rows) {
    const value = metric.read(row);
    if (value === null || value === undefined) continue;

    let bucket = buckets.get(row.model_id);
    if (!bucket) {
      bucket = { label: row.model_label || row.model_id, values: [] };
      buckets.set(row.model_id, bucket);
    }

    const index = indexOfTime.get(Date.parse(row.collected_at));
    if (index === undefined) continue;

    // Last row wins, so a re-run that rewrites a timestamp supersedes the earlier value
    // rather than being silently averaged with it.
    bucket.values[index] = {
      x: timestamps[index],
      y: value * PER_MILLION,
      providers: row.provider_count,
      hitRate: row.weighted_cache_hit_rate,
    };
  }

  const series: Series[] = [...buckets.entries()].map(([modelId, bucket]) => {
    const points: Point[] = timestamps.map(
      (t, i) => bucket.values[i] ?? { x: t, y: null, providers: null, hitRate: null },
    );
    const withValues = points.filter((p) => p.y !== null);
    return {
      modelId,
      label: bucket.label,
      points,
      latest: withValues.length ? withValues[withValues.length - 1].y : null,
    };
  });

  // Most expensive first. This is the picker's order and the default selection, and it is
  // recomputed per metric so the list always reflects what is actually being plotted.
  series.sort((a, b) => (b.latest ?? -Infinity) - (a.latest ?? -Infinity));

  return { timestamps, series };
}

/**
 * Every brand slug public/logos/models/ holds, written by scripts/sync-model-icons.mjs.
 * Checked before rendering an <img> so an uncovered vendor shows no icon rather than a
 * broken image.
 */
const ICON_SLUGS = new Set<string>(iconSlugs);

/**
 * Guesses which brand a model_id belongs to, in descending order of specificity.
 *
 * Nothing here names a vendor. The rules work off the shape of an OpenRouter-style
 * `vendor/model-family-version` id, so a vendor the cron starts reporting later resolves on
 * its own. Worked examples against the ids currently in the table:
 *
 *   anthropic/claude-opus-4.7  -> "claude"      (model family beats vendor: Anthropic ships
 *                                                no colour mark, Claude does)
 *   google/gemini-2.5-flash    -> "gemini"      (likewise more specific than "google")
 *   moonshotai/kimi-k3         -> "kimi"
 *   deepseek/deepseek-v4-pro   -> "deepseek"
 *   openai/gpt-5.5             -> "openai"      (no "gpt" mark, so the vendor carries it)
 *   stepfun/step-3.7-flash     -> "stepfun"
 *   tencent/hy3                -> "tencent"     ("hy3" matches nothing)
 *   xiaomi/mimo-v2.5           -> "xiaomimimo"  (vendor and family joined)
 *   z-ai/glm-5.2               -> "zai"         (punctuation stripped)
 *   mistralai/mistral-large    -> "mistral"     (not in our data; shows the rules generalise)
 *   meta-llama/llama-4         -> "meta"        (first segment of a compound vendor)
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
 * candidates. Resolved from the model_id at runtime, so the icon set follows the data.
 */
export function brandIconFor(modelId: string): string | null {
  for (const candidate of brandSlugCandidates(modelId)) {
    if (ICON_SLUGS.has(candidate)) return `/logos/models/${candidate}.svg`;
  }
  return null;
}

/** Formats a dollars-per-million value for a tooltip, axis tick or table cell. */
export function formatUsdPerM(value: number | null): string {
  if (value === null) return '—';
  if (value === 0) return '$0';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  if (value < 100) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(0)}`;
}

/**
 * Formats a snapshot time for an axis tick. The cron currently runs several times within a
 * single day while it settles, so the time is included — a date alone would render six
 * identical ticks.
 */
export function formatSnapshotTick(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/** The full timestamp, spelled out, for tooltip titles and the table header. */
export function formatSnapshotFull(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })} UTC`;
}

/**
 * Describes how much history the chart actually has, so the page can be honest when the
 * answer is "one morning". Returns null when there is nothing to describe.
 */
export function describeCoverage(timestamps: number[]): string | null {
  if (!timestamps.length) return null;
  if (timestamps.length === 1) {
    return `A single snapshot, taken ${formatSnapshotFull(timestamps[0])}. There is no history to plot yet.`;
  }

  const first = timestamps[0];
  const last = timestamps[timestamps.length - 1];
  const spanHours = (last - first) / 36e5;
  const count = `${timestamps.length} snapshots`;

  if (spanHours < 24) {
    return `${count}, all within ${spanHours < 1 ? 'the same hour' : `${Math.round(spanHours)} hours`} on ${formatSnapshotFull(first)}. Until the nightly run has covered several days there is no real trend here — flat lines mean prices have not been observed changing, not that they never will.`;
  }

  const spanDays = Math.round(spanHours / 24);
  return `${count} spanning ${spanDays} ${spanDays === 1 ? 'day' : 'days'}, from ${formatSnapshotFull(first)} to ${formatSnapshotFull(last)}.`;
}
