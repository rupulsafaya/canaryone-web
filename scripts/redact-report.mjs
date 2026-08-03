#!/usr/bin/env node
/**
 * Prepares a generated canaryone run report for publication at /demo-report.
 *
 * The report is a real artefact and the site cites it as evidence, so this script makes
 * the smallest possible set of changes, changes no measurement, and discloses itself
 * inside the report. Run it on any report freshly copied into public/demo-report/:
 *
 *   pnpm redact:report
 *
 * It is idempotent — running it on an already-prepared report writes nothing.
 *
 * Two changes, and only these two:
 *
 * 1. Absolute home paths become <repo>. The report header prints the target repository's
 *    full path, which includes the home directory of whoever ran it.
 *    outreach/results/README.md asks for this redaction on screenshots; a published HTML
 *    report is the same exposure with a permanent URL.
 *
 * 2. "Nothing leaves your machine." is replaced. outreach/numbers.md blocks that claim
 *    family outright, because the judge sends each session transcript to a gateway, the
 *    scan summariser sends your test files there, and a gateway key is mandatory. The
 *    replacement is the phrasing numbers.md prescribes, plus the honest short answer.
 *
 * The real fix for the second one is upstream in the canaryone report template. This
 * script stops the false claim being served from canaryone.ai in the meantime; delete
 * the rule once the generator no longer emits it.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REPORT = resolve(ROOT, 'public/demo-report/index.html');

if (!existsSync(REPORT)) {
  console.error(`No report at ${REPORT}`);
  process.exit(1);
}

const before = readFileSync(REPORT, 'utf8');
let html = before;
const done = [];

// ---------- 1. Absolute home paths ----------

// Match a home path up to the repository directory, so deeper paths keep their tail:
// /Users/someone/Documents/GitHub/canaryone-demo/.c1/... becomes <repo>/.c1/...
const HOME_PATH = /\/Users\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*?\/([A-Za-z0-9._-]*canaryone[A-Za-z0-9._-]*)(?=[/<"\s)]|$)/g;
const pathHits = (html.match(HOME_PATH) || []).length;
if (pathHits) {
  html = html.replace(HOME_PATH, '&lt;repo&gt;');
  done.push(`replaced ${pathHits} absolute home path${pathHits === 1 ? '' : 's'} with <repo>`);
}

// Anything left means the pattern above missed a shape; fail loudly rather than ship it.
const leftover = html.match(/\/Users\/[A-Za-z0-9._-]+/g);
if (leftover) {
  console.error(`Still ${leftover.length} absolute path(s) after redaction, e.g. ${leftover[0]}`);
  console.error('Widen HOME_PATH in this script rather than publishing the report.');
  process.exit(1);
}

// ---------- 2. The blocked outbound claim ----------

// The sentences before this one already establish "a local CLI" pointed at "your
// codebase" running "your own tests", so the replacement only has to correct the
// outbound claim rather than restate what is already there.
const BLOCKED = 'Nothing leaves your machine.';
const REPLACEMENT =
  'The judge is an outbound call: it sends each session transcript to a gateway to be ' +
  'scored, and <code>--disable-judge</code> turns it off.';

if (html.includes(BLOCKED)) {
  html = html.split(BLOCKED).join(REPLACEMENT);
  done.push('replaced the "nothing leaves your machine" claim with the prescribed phrasing');
}

// ---------- 3. Disclose both changes inside the report ----------

const DISCLOSURE_MARK = 'data-published-copy';
const DISCLOSURE = `    <tr ${DISCLOSURE_MARK}><td class="label">Published copy</td><td class="muted">Prepared for publication: absolute paths replaced with <code>&lt;repo&gt;</code>, and one sentence about outbound traffic corrected. No measured value was changed. See <code>scripts/redact-report.mjs</code> in canaryone-web.</td></tr>\n`;

if (!html.includes(DISCLOSURE_MARK)) {
  const tableStart = html.indexOf('<table class="meta-table">');
  const tableEnd = tableStart === -1 ? -1 : html.indexOf('</table>', tableStart);
  if (tableEnd === -1) {
    console.error('Could not find the hero meta-table to add the disclosure row to.');
    process.exit(1);
  }
  html = html.slice(0, tableEnd) + DISCLOSURE + html.slice(tableEnd);
  done.push('added a "Published copy" row disclosing both changes');
}

// ---------- report ----------

if (!done.length) {
  console.log('Report already prepared. Nothing to change.');
  process.exit(0);
}

writeFileSync(REPORT, html);
console.log(`Prepared ${REPORT}`);
for (const line of done) console.log(`  · ${line}`);
console.log(`  ${before.length} bytes -> ${html.length} bytes`);
