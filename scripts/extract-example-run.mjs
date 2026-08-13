#!/usr/bin/env node
/**
 * Reads the published example report and writes its lane table to src/data/example-run.json.
 *
 *   pnpm extract:example-run
 *
 * WHY THIS EXISTS. /evals cites run e860167a and the full report ships at
 * public/demo-report/index.html so a reader can check every figure. The page used to carry
 * those figures as hand-typed constants, which is how a page ends up disagreeing with the
 * artefact it links to. The report is the source; this script is the only way a number from
 * it reaches the page.
 *
 * It reads nothing but public/demo-report/index.html and it changes no value. Every figure
 * comes off a `data-sort-value` attribute rather than off the rendered cell text, so the
 * numbers are the report's own full-precision ones and the page does its own rounding.
 *
 * Run it after `pnpm redact:report` whenever a new report is published. It is idempotent.
 * It throws rather than writing a partial file, because a silently short lane list would
 * look exactly like a run with fewer lanes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = resolve(ROOT, 'public/demo-report/index.html');
const OUT = resolve(ROOT, 'src/data/example-run.json');

const html = readFileSync(REPORT, 'utf8');

const need = (re, what) => {
  const m = html.match(re);
  if (!m) throw new Error(`Could not find ${what} in ${REPORT}`);
  return m;
};

/* ---------- the run's own identity ---------- */

/* The header prints the id inside a <code>, and each meta-table value inside its own <td>
   with a <strong> around the ones it emphasises, so the patterns below allow one inline tag
   between the label and the figure rather than assuming bare text. */
const runId = need(/Run\s*<code>([0-9a-f-]{36})<\/code>/, 'run id')[1];
const generatedAt = need(/<meta name="generated-at" content="([^"]+)"/, 'generated-at')[1];
/* The header prints the run's start next to the id: "· 2026-07-29T20:05:06.013Z ·". */
const startedAt = need(/·\s*(\d{4}-\d\d-\d\dT[\d:.]+Z)\s*·/, 'run start')[1];
const wallClock = need(/·\s*(\d+m\d+s)\s+wall-clock/, 'wall clock')[1];

/* "120 = 4 tasks × 10 lanes × 3 repeats" — the shape of the matrix, which is what makes the
   pass counts readable. A lane's 12 attempts are 4 tasks at 3 repeats each. */
const shape = need(
  /(\d+)\s*(?:<[^>]+>\s*)*=\s*(\d+)\s*tasks?\s*×\s*(\d+)\s*lanes?\s*×\s*(\d+)\s*repeats?/,
  'session shape',
);
const spend = need(/Total spend<\/td>\s*<td[^>]*>(?:<[^>]+>)*\s*\$([\d.]+)/, 'total spend');
const passRate = need(/Pass rate<\/td>\s*<td[^>]*>(?:<[^>]+>)*\s*(\d+)\/(\d+)/, 'pass rate');

/* ---------- the lane table ---------- */

/* One object per <tr> of the lane table, keyed off the data-sort-value attributes the
   report's own sorting uses. Reading those rather than the cell text keeps the full
   precision and sidesteps the "$" and "ms" suffixes entirely. */
const tbody = html.slice(html.indexOf('<table class="lb">'));
const rows = tbody.slice(0, tbody.indexOf('</table>')).match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? [];

const cell = (row, key) => {
  const m = row.match(new RegExp(`data-sort-key="${key}" data-sort-value="([^"]*)"`))
    ?? row.match(new RegExp(`data-sort-value="([^"]*)"[^>]*data-sort-key="${key}"`));
  return m ? m[1] : null;
};

const lanes = rows
  .map((row) => {
    const slug = cell(row, 'lane');
    if (!slug) return null;               /* the header row */
    /* "6/12" is the only figure with no numeric sort value of its own — its sort value is
       the ratio — so the two counts come off the rendered cell. */
    const pass = row.match(/data-sort-key="pass"[^>]*>\s*(\d+)\s*\/\s*(\d+)/);
    if (!pass) throw new Error(`Lane ${slug} has no pass cell`);
    return {
      slug,
      model: cell(row, 'model'),
      router: cell(row, 'router'),
      passed: Number(pass[1]),
      attempted: Number(pass[2]),
      costPerPass: Number(cell(row, 'cost_per_pass')),
      judge: Number(cell(row, 'traj')),
      weightedCostPerPass: Number(cell(row, 'weighted')),
      p50Ms: Number(cell(row, 'p50')),
      p95Ms: Number(cell(row, 'p95')),
      winner: /class="winner"/.test(row),
    };
  })
  .filter(Boolean);

const laneCount = Number(shape[3]);
if (lanes.length !== laneCount) {
  throw new Error(`Header says ${laneCount} lanes, parsed ${lanes.length}`);
}
for (const l of lanes) {
  for (const [k, v] of Object.entries(l)) {
    if (typeof v === 'number' && !Number.isFinite(v)) {
      throw new Error(`Lane ${l.slug} has a non-numeric ${k}`);
    }
  }
}

const payload = {
  /* Provenance first, so anyone reading the file knows it is derived and from what. */
  source: 'public/demo-report/index.html',
  generator: 'scripts/extract-example-run.mjs',
  runId,
  reportUrl: '/demo-report/index.html',
  startedAt,
  generatedAt,
  wallClock,
  totals: {
    sessions: Number(shape[1]),
    tasks: Number(shape[2]),
    lanes: laneCount,
    repeats: Number(shape[4]),
    passed: Number(passRate[1]),
    attempted: Number(passRate[2]),
    spendUsd: Number(spend[1]),
  },
  lanes,
};

writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `example-run.json ← ${runId} · ${lanes.length} lanes · ` +
  `${payload.totals.passed}/${payload.totals.attempted} sessions passed`,
);
