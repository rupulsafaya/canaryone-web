#!/usr/bin/env node
/**
 * Reads the shipped router and direct-provider registry out of the canaryone package and
 * writes src/data/adapters.json.
 *
 *   pnpm extract:adapters
 *
 * WHY THIS EXISTS. The coverage section on /evals used to hard-code its counts and its logo
 * list, and it drifted: the page claimed nine direct provider APIs while the registry
 * carried fourteen. A count of what we support is a claim, and a claim should be read off
 * the thing it describes.
 *
 * SOURCE. ../canaryone/src/proxy/providers.ts, which is the registry the CLI itself reads:
 * ROUTERS and DIRECT_PROVIDERS, each entry carrying a displayName and a shipped flag. That
 * repository is a sibling and is not present on Vercel, so this runs by hand and its output
 * is committed — the same arrangement as every other generated asset here. The build never
 * touches it.
 *
 * Regex rather than a TypeScript parse, deliberately: the two arrays are plain literals and
 * a parser would mean a dependency for eight fields. The tradeoff is that a reshape of those
 * literals breaks this script, so it throws on anything it cannot account for rather than
 * writing a short list.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, '../canaryone/src/proxy/providers.ts');
const OUT = resolve(ROOT, 'src/data/adapters.json');
const ICONS = resolve(ROOT, 'node_modules/@lobehub/icons-static-svg/icons');
const MARKS_DIR = resolve(ROOT, 'public/logos/providers');

if (!existsSync(SRC)) {
  console.error(
    `No registry at ${SRC}.\n` +
    'The canaryone repository has to sit beside this one for this script to run. ' +
    'src/data/adapters.json is committed, so a build does not need it.',
  );
  process.exit(1);
}

const ts = readFileSync(SRC, 'utf8');

/** The literal array assigned to `name`, from its opening bracket to the line closing it. */
const arrayBody = (name) => {
  const start = ts.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`No ${name} in ${SRC}`);
  const open = ts.indexOf('[', start);
  const close = ts.indexOf('\n];', open);
  if (open < 0 || close < 0) throw new Error(`Could not bound ${name}`);
  return ts.slice(open + 1, close);
};

/* Entries are split on the object boundary rather than on a brace count, because several of
   them contain nested braces in comments and in template placeholders. */
const parseEntries = (name) =>
  arrayBody(name)
    .split(/\n\s*\{\n/)
    .map((chunk) => {
      const slug = chunk.match(/\bslug:\s*'([^']+)'/);
      const display = chunk.match(/\bdisplayName:\s*'([^']+)'/);
      const status = chunk.match(/\bstatus:\s*'([^']+)'/);
      if (!slug || !display) return null;
      return {
        slug: slug[1],
        name: display[1],
        /* Anything not explicitly shipped is treated as not shipped. A missing status is a
           registry edit this script has not seen, and the safe reading of an unknown status
           is the one that keeps a name off the page. */
        shipped: status?.[1] === 'shipped',
      };
    })
    .filter(Boolean);

const routers = parseEntries('ROUTERS');
const direct = parseEntries('DIRECT_PROVIDERS');

if (!routers.length || !direct.length) {
  throw new Error(`Parsed ${routers.length} routers and ${direct.length} direct providers`);
}
/* The registry's own type union names the routers, so it is a free cross-check on the parse:
   a router present in the type and missing from the list means the split above lost an
   entry. Cloudflare is deliberately in the type and out of the list — see the file's header
   comment — so a type name with no entry is reported rather than fatal. */
const typed = ts.match(/export type RouterSlug\s*=\s*([^;]+);/)?.[1] ?? '';
const typedSlugs = [...typed.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const absent = typedSlugs.filter((s) => !routers.some((r) => r.slug === s));

/* ---------------------------------------------------------------------------
   The marks, copied out of the icon library into public/logos/providers/.

   MONOCHROME, WHICH IS THE POINT. public/logos/models/ already holds this library and prefers
   each brand's COLOUR variant, because those render at 16px beside a model name where a brand
   is recognised by its colour before its shape. A coverage row is the opposite problem:
   seventeen brands at once, where seventeen palettes and seventeen typefaces is noise. Every
   brand here ships a variant filled with currentColor, so the whole row can take one ink and
   the company's name can be set in our own type beside it. That also settles the contrast
   check DESIGN.md asks for — OpenRouter's colour mark is #C8FF00, which measures about 1.3:1
   on cream and would have been invisible.

   Committed rather than resolved at build time, like everything else in public/logos/: the
   icon library is a devDependency and a Vercel deploy must not need it.
   --------------------------------------------------------------------------- */

/* Where a registry slug does not reduce to an icon name by rule. Only one today: stripping
   `direct:google-gemini` to its first segment finds `google.svg`, which is the Google G rather
   than the Gemini mark, so it is named explicitly. */
const ICON_ALIAS = { 'direct:google-gemini': 'gemini' };

const markFor = (slug) => {
  const bare = slug.replace(/^direct:/, '');
  /* Alias first, then the whole name, then progressively shorter prefixes, which is what turns
     `moonshot-intl` and `moonshot-cn` into one Moonshot mark. */
  const parts = bare.split('-');
  const candidates = [
    ICON_ALIAS[slug],
    bare,
    ...parts.map((_p, i) => parts.slice(0, parts.length - i - 1).join('-')),
  ].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(resolve(ICONS, `${c}.svg`))) return c;
  }
  return null;
};

mkdirSync(MARKS_DIR, { recursive: true });
const unmarked = [];
let copied = 0;
for (const a of [...routers, ...direct]) {
  const icon = markFor(a.slug);
  if (!icon) { unmarked.push(a.slug); continue; }
  const svg = readFileSync(resolve(ICONS, `${icon}.svg`), 'utf8');
  if (!svg.includes('currentColor')) {
    /* A mark that carries its own colour cannot be made to match the row, and a row where one
       brand is coloured is worse than one where every brand is not. Reported rather than
       silently copied, because the page would render it and nobody would know why it stood
       out. */
    unmarked.push(`${a.slug} (no monochrome variant)`);
    continue;
  }
  /* Same normalisation sync-model-icons.mjs applies: drop width and height from the root tag
     only, so CSS sizes the mark and the viewBox still carries its proportions. */
  const out = svg
    .replace(/(<svg\b[^>]*?)(\s+width="[^"]*")([^>]*>)/, '$1$3')
    .replace(/(<svg\b[^>]*?)(\s+height="[^"]*")([^>]*>)/, '$1$3');
  writeFileSync(resolve(MARKS_DIR, `${icon}.svg`), out);
  a.mark = `${icon}.svg`;
  copied += 1;
}

const payload = {
  source: '../canaryone/src/proxy/providers.ts',
  generator: 'scripts/extract-adapters.mjs',
  marks: 'public/logos/providers/ — monochrome, filled with currentColor',
  routers,
  direct,
  counts: {
    routers: routers.filter((r) => r.shipped).length,
    direct: direct.filter((d) => d.shipped).length,
  },
};

writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `adapters.json ← ${payload.counts.routers} routers · ${payload.counts.direct} direct providers` +
  ` · ${copied} marks` +
  (absent.length ? ` · in the type but not the registry: ${absent.join(', ')}` : '') +
  (unmarked.length ? `\nNo mark for: ${unmarked.join(', ')}` : ''),
);
