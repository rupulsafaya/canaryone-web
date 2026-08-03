#!/usr/bin/env node
/**
 * Copies run reports from the fantastic-dollop repository into this one.
 *
 * Vercel builds only from canaryone-web and cannot see a sibling checkout, so the
 * published site needs its own copy of each report committed here. The source of truth
 * stays in fantastic-dollop/outreach/results/ — nothing in src/content/runs/ should ever
 * be edited by hand, because the next import overwrites it.
 *
 * Run it by hand whenever a results file is added or changed:
 *   pnpm import:runs                 # report and write
 *   pnpm import:runs -- --dry-run    # report only
 *   pnpm import:runs -- --prune      # also delete copies whose source is gone
 *
 * Re-running with no upstream change writes nothing and reports every file unchanged.
 *
 * What it does to each file, and nothing else:
 *   1. Prepends frontmatter derived from the file itself and from the results index.
 *   2. Rewrites links between run files to /runs/<slug>.
 *   3. Turns links pointing outside results/ into plain text, since those targets are
 *      not published anywhere a reader could follow them.
 *   4. Replaces absolute home-directory paths with <repo>, which is the same redaction
 *      results/README.md asks for on screenshots.
 * The prose is otherwise copied verbatim, including every "what this does not support"
 * caveat. Those caveats are the reason a run page is citable.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEST = resolve(ROOT, 'src/content/runs');

const SOURCE = process.env.RESULTS_DIR
  ? resolve(process.env.RESULTS_DIR)
  : resolve(ROOT, '../fantastic-dollop/outreach/results');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PRUNE = args.includes('--prune');

/** Not runs. The index and the blank template both live in the same directory. */
const NOT_A_RUN = new Set(['README.md', 'TEMPLATE.md']);
/** A run file is dated, and the date prefix is the sort key. */
const RUN_FILENAME = /^(\d{4}-\d{2}-\d{2})-.+\.md$/;

// ---------- read the source directory ----------

if (!existsSync(SOURCE)) {
  console.error(`No results directory at ${SOURCE}`);
  console.error('Point RESULTS_DIR at fantastic-dollop/outreach/results if it lives elsewhere.');
  process.exit(1);
}

const sourceFiles = readdirSync(SOURCE)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => {
    if (NOT_A_RUN.has(f)) return false;
    if (!RUN_FILENAME.test(f)) {
      console.warn(`  skipped ${f} — no YYYY-MM-DD- prefix, so it is not a run file`);
      return false;
    }
    return true;
  })
  .sort()
  .reverse();

if (!sourceFiles.length) {
  console.error(`No run files found in ${SOURCE}`);
  process.exit(1);
}

const slugOf = (filename) => basename(filename, '.md');
const knownSlugs = new Set(sourceFiles.map(slugOf));

// ---------- the results index carries the curated one-line summary ----------

/**
 * README.md holds a row per run: file link, date, "What it is", "Status". Those two
 * prose cells are better written than anything derivable from the run file itself, so
 * use them when the row exists.
 */
function readIndex() {
  const path = resolve(SOURCE, 'README.md');
  if (!existsSync(path)) return new Map();
  const rows = new Map();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*\[([^\]]+\.md)\]\([^)]*\)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|/);
    if (m) rows.set(m[1].trim(), { what: m[3].trim(), status: m[4].trim() });
  }
  return rows;
}

const index = readIndex();

// ---------- internal-only passages ----------

/**
 * The results files are working documents, so they carry passages written to a colleague
 * about how to use a result rather than facts about the run — "concede immediately if a
 * reply pushes on this", "where the best post lives". Those belong in fantastic-dollop and
 * not on a public page, where they read as marketing technique and undercut the very
 * caveats that make a run page worth citing.
 *
 * The source marks them and keeps them; the web copy drops them:
 *
 *   <!-- internal:start -->
 *   Everything in here stays in fantastic-dollop.
 *   <!-- internal:end -->
 *
 * Fences work mid-sentence and mid-heading too, because this runs on the raw text before
 * any markdown parsing.
 */
const INTERNAL_BLOCK = /<!--\s*internal:start\s*-->[\s\S]*?<!--\s*internal:end\s*-->/g;
const STRAY_FENCE = /<!--\s*internal:(start|end)\s*-->/;

function stripInternal(text, label) {
  const count = (text.match(INTERNAL_BLOCK) || []).length;
  let out = text.replace(INTERNAL_BLOCK, '');

  // An unmatched fence means a passage meant to stay internal would ship. Refuse.
  if (STRAY_FENCE.test(out)) {
    throw new Error(
      `${label}: unmatched <!-- internal:start --> / <!-- internal:end --> fence. ` +
        `Fix the pairing in the source before importing.`
    );
  }

  // Tidy what removal leaves behind: doubled spaces mid-sentence, orphaned space before
  // punctuation, a comma left stranded against the terminator that followed the removed
  // clause, and runs of blank lines where a whole paragraph came out.
  out = out
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/[^\S\n]+([.,;:!?])/g, '$1')
    .replace(/,(\s*[.;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+$/gm, '');

  return { text: out, count };
}

/** Reads a source file with its internal-only passages already removed. */
function readSource(filename) {
  const raw = readFileSync(resolve(SOURCE, filename), 'utf8');
  return stripInternal(raw, filename);
}

/** The first sentence, which is what a card has room for. */
function firstSentence(text) {
  if (!text) return '';
  const m = text.match(/^.*?[.!?](?=\s+[A-Z"“]|\s*$)/s);
  return (m ? m[0] : text).trim();
}

// ---------- derive the frontmatter fields ----------

function tableCell(body, label) {
  const m = body.match(new RegExp(`^\\|\\s*${label}\\s*\\|\\s*(.+?)\\s*\\|\\s*$`, 'im'));
  return m ? m[1].trim() : null;
}

/** Strip the emphasis and footnote prose the source tables carry inside a cell. */
function plainCell(value) {
  if (!value) return null;
  return value.replace(/\*\*/g, '').replace(/`/g, '').trim();
}

/**
 * The three kinds of run, which decide what the run can support. The rules are in
 * results/README.md § "What kind of run supports what kind of claim".
 */
function classifyKind(cell, filename) {
  // Classify on the cell's opening declaration only. The rest of the cell routinely
  // names a different run — the 31 July local run's cell says "Cite the 28 July
  // commissioned sweep", and a substring match on the whole cell reads that as a
  // commissioned sweep, which would overstate on the page what the run can support.
  const declaration = firstSentence((cell || '').replace(/\*\*/g, '')).toLowerCase();
  if (/local tool runs?\b/.test(declaration)) return 'local-tool-run';
  if (/commissioned( hosted)? sweep/.test(declaration)) return 'commissioned-sweep';
  if (/metadata scan/.test(declaration)) return 'metadata-scan';
  throw new Error(
    `${filename}: could not classify "Kind of run" from its opening sentence: ${JSON.stringify(declaration)}`
  );
}

function deriveTitle(body, filename) {
  const m = body.match(/^#\s+(.+)$/m);
  if (!m) throw new Error(`${filename}: no H1 to take a title from.`);
  // The source H1s read "Run — five routes, one model" or "Scan — host count and price
  // spread", so the prefix comes off and the title arrives lowercase.
  const title = m[1].replace(/^(Run|Scan)\s*[—–-]\s*/i, '').trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/** The first sentence of the run's own opening paragraph, used when the index has no row. */
function fallbackSummary(body) {
  const afterH1 = body.replace(/^#\s+.+$/m, '');
  const para = afterH1.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('#') && !p.startsWith('|'));
  return firstSentence((para || '').replace(/\*\*/g, '').replace(/\n/g, ' '));
}

// ---------- rewrite the links and redact the paths ----------

/**
 * Readable stand-ins for the working documents these files cross-reference. A reader
 * cannot open any of them, so the link has to go; leaving the raw relative path as body
 * text on a public page reads as a broken export.
 */
const OFF_SITE_LABELS = [
  [/numbers\.md$/, 'the verified-numbers file'],
  [/pre-registration\.md$/, 'the pre-registration log'],
  [/reference\/canaryone-one-pager\.md$/, 'the internal one-pager'],
  [/Strategy\/positioning\.md$/, 'the positioning document'],
  [/^README\.md$/, 'the results index'],
  [/^TEMPLATE\.md$/, 'the run template'],
];

/** True when the link text is itself a path or filename rather than a phrase. */
const looksLikeAPath = (text) => /\.md|\//.test(text.replace(/[`*]/g, ''));

function transformBody(body, filename, titles) {
  const notes = [];

  // Links between run files become site routes. A filename used as link text becomes
  // the run's own title, which is what a reader can actually act on.
  body = body.replace(/\[([^\]]+)\]\((\d{4}-\d{2}-\d{2}-[^)]+)\.md\)/g, (whole, text, target) => {
    if (!knownSlugs.has(target)) {
      notes.push(`de-linked "${text}" — ${target}.md is not in the import set`);
      return text;
    }
    const label = looksLikeAPath(text) ? titles.get(target) || text : text;
    if (label !== text) notes.push(`relinked "${text}" as "${label}"`);
    return `[${label}](/runs/${target})`;
  });

  // Anything else points into a repository the reader cannot open. Keep the sentence
  // working, drop the link, and report every one so nothing is silently rewritten.
  body = body.replace(
    /\[([^\]]+)\]\((\.\.?\/[^)]+|README\.md|TEMPLATE\.md)\)/g,
    (whole, text, target) => {
      const clean = text.replace(/[`*]/g, '');
      if (!looksLikeAPath(text)) {
        notes.push(`de-linked "${clean}" — ${target} is not published`);
        return text;
      }
      const label = (OFF_SITE_LABELS.find(([re]) => re.test(target)) || [])[1] || clean;
      notes.push(`de-linked "${clean}" as "${label}" — ${target} is not published`);
      return label;
    }
  );

  // Same redaction results/README.md asks for on screenshots.
  body = body.replace(/\/Users\/[A-Za-z0-9._-]+\/[A-Za-z0-9._\/-]*/g, (p) => {
    const repo = p.split('/').filter(Boolean).pop();
    notes.push(`redacted an absolute home path to <repo>/${repo}`);
    return `<repo>/${repo}`;
  });

  return { body: body.trim(), notes };
}

// ---------- build one file ----------

const yaml = (v) => JSON.stringify(v);

/** Every run's title, keyed by slug, so a cross-reference can be relabelled. */
const titles = new Map(
  sourceFiles.map((f) => [slugOf(f), deriveTitle(readSource(f).text, f)])
);

function build(filename) {
  const { text: raw, count: internalBlocks } = readSource(filename);
  const slug = slugOf(filename);
  const date = filename.match(RUN_FILENAME)[1];

  const identity = index.get(filename);
  const summary = firstSentence(identity?.what) || fallbackSummary(raw);
  if (!summary) throw new Error(`${filename}: no summary in the results index and none derivable.`);

  const fields = [
    // Quoted, so YAML hands the schema a string rather than a Date. Formatting a Date
    // west of UTC would render 2026-07-27 as the 26th.
    `date: ${yaml(date)}`,
    `title: ${yaml(deriveTitle(raw, filename))}`,
    `summary: ${yaml(summary)}`,
    `kind: ${yaml(classifyKind(tableCell(raw, 'Kind of run'), filename))}`,
  ];

  const routes = plainCell(tableCell(raw, 'Routes'));
  if (routes) fields.push(`routes: ${yaml(routes)}`);

  const spend = plainCell(tableCell(raw, 'Total spend'));
  if (spend) fields.push(`spend: ${yaml(spend)}`);

  // The results index "Status" cell is deliberately not carried across. "Fully
  // publishable. This is the one to cite to a skeptic." is a note to ourselves about
  // whether we may post a figure; a reader needs to know how much weight the run carries,
  // which the run page states from `kind` instead.

  fields.push(`sourceFile: ${yaml(`outreach/results/${filename}`)}`);

  const { body, notes } = transformBody(raw, filename, titles);
  if (internalBlocks) {
    notes.push(
      `dropped ${internalBlocks} internal-only passage${internalBlocks === 1 ? '' : 's'}`
    );
  }
  const content = `---\n${fields.join('\n')}\n---\n\n${body}\n`;
  return { slug, filename, content, notes };
}

// ---------- write, and report what changed ----------

if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

console.log(`Importing from ${SOURCE}`);
console.log(`             to ${DEST}${DRY_RUN ? '  (dry run, nothing written)' : ''}\n`);

let added = 0;
let updated = 0;
let unchanged = 0;

for (const filename of sourceFiles) {
  const { slug, content, notes } = build(filename);
  const target = resolve(DEST, `${slug}.md`);
  const before = existsSync(target) ? readFileSync(target, 'utf8') : null;

  let verb;
  if (before === null) {
    verb = 'added';
    added++;
  } else if (before !== content) {
    verb = 'updated';
    updated++;
  } else {
    verb = 'unchanged';
    unchanged++;
  }

  if (!DRY_RUN && verb !== 'unchanged') writeFileSync(target, content);

  console.log(`  ${verb.padEnd(9)} ${slug}`);
  for (const note of notes) console.log(`            · ${note}`);
}

// Copies whose source has gone are reported, and only deleted when asked, because a
// missing source is more often a moved checkout than a deleted run.
const orphans = readdirSync(DEST)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => !knownSlugs.has(basename(f, '.md')));

for (const orphan of orphans) {
  if (PRUNE && !DRY_RUN) {
    unlinkSync(resolve(DEST, orphan));
    console.log(`  pruned    ${basename(orphan, '.md')}`);
  } else {
    console.log(`  orphaned  ${basename(orphan, '.md')} — no source file; pass --prune to delete`);
  }
}

console.log(
  `\n${sourceFiles.length} runs: ${added} added, ${updated} updated, ${unchanged} unchanged` +
    (orphans.length ? `, ${orphans.length} orphaned` : '')
);
