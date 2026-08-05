#!/usr/bin/env node
/**
 * Mirrors the brand icons from @lobehub/icons-static-svg into public/logos/models/, one file
 * per brand, and writes the slug manifest the page uses to resolve them.
 *
 * This script knows nothing about which models we track. It copies the whole library, and
 * the page picks an icon at runtime from whatever model_id the data actually contains — so a
 * vendor the nightly cron starts reporting next month gets its icon with no code change and
 * no redeploy. The alternative, a hand-written map of the vendors we happen to have today,
 * silently drops the icon for every model added later.
 *
 * Where each brand ships both a colour and a monochrome mark, the colour one wins: these
 * render at 16px beside a model name, where a brand is recognised by its colour before its
 * shape. Brands with only a monochrome mark (Anthropic, OpenAI) stay monochrome.
 *
 * The output is committed rather than generated during the build. lobehub is a
 * devDependency, so this keeps the deploy from depending on it, and it matches how
 * public/logos/ already works: files in git, with a script to refresh them.
 *
 * Run after bumping @lobehub/icons-static-svg:
 *   pnpm sync:model-icons
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE_DIR = resolve(ROOT, 'node_modules', '@lobehub', 'icons-static-svg', 'icons');
const OUT_DIR = resolve(ROOT, 'public', 'logos', 'models');
const MANIFEST = resolve(ROOT, 'src', 'lib', 'model-icon-slugs.json');

/**
 * Variant suffixes we never want. The wordmarks (-text, -text-cn) are unreadable at 16px,
 * and the -brand variants are full lockups rather than marks.
 */
const VARIANT = /-(color|text|brand|brand-color|text-cn)\.svg$/;

/** Strips width/height from the first <svg> tag only, leaving viewBox intact so CSS sizes it. */
function normalize(svg) {
  return svg
    .replace(/(<svg\b[^>]*?)(\s+width="[^"]*")([^>]*>)/, '$1$3')
    .replace(/(<svg\b[^>]*?)(\s+height="[^"]*")([^>]*>)/, '$1$3');
}

let sources;
try {
  sources = readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.svg'));
} catch {
  console.error(
    `Cannot read ${SOURCE_DIR}.\nInstall the icon set first: pnpm add -D @lobehub/icons-static-svg`,
  );
  process.exit(1);
}

/**
 * Some colour marks are drawn for a dark background: the shape itself is filled white and
 * only an accent is coloured. Kimi is the clearest case — its body is fill="#fff" and only a
 * corner dot is blue, so on this cream page the logo all but disappears. Where that happens
 * the monochrome variant is used instead, which fills with currentColor and therefore renders
 * as dark ink inside an <img>.
 *
 * This is a property of the file, not a list of brands, so brands added upstream get the
 * same treatment without anyone revisiting this script.
 */
const WHITE_FILL = /(?:fill|stroke)\s*=\s*"(?:#fff(?:fff)?|white)"/i;

// One file per brand slug: the colour mark when it is safe on a light surface, the
// monochrome mark when it is not, and whichever exists when there is no choice.
const chosen = new Map();
let downgraded = 0;
const slugs_ = new Set(sources.map((f) => f.replace(VARIANT, '').replace(/\.svg$/, '')));

for (const slug of slugs_) {
  const color = `${slug}-color.svg`;
  const mono = `${slug}.svg`;
  const hasColor = sources.includes(color);
  const hasMono = sources.includes(mono);

  if (hasColor) {
    const needsMono =
      hasMono && WHITE_FILL.test(readFileSync(resolve(SOURCE_DIR, color), 'utf8'));
    if (needsMono) {
      chosen.set(slug, mono);
      downgraded++;
    } else {
      chosen.set(slug, color);
    }
  } else if (hasMono) {
    chosen.set(slug, mono);
  }
}

mkdirSync(OUT_DIR, { recursive: true });

for (const [slug, file] of chosen) {
  writeFileSync(resolve(OUT_DIR, `${slug}.svg`), normalize(readFileSync(resolve(SOURCE_DIR, file))
    .toString('utf8')));
}

// Drop icons for brands the library no longer ships, so the directory never keeps orphans.
let removed = 0;
for (const file of readdirSync(OUT_DIR).filter((f) => f.endsWith('.svg'))) {
  if (!chosen.has(file.replace(/\.svg$/, ''))) {
    rmSync(resolve(OUT_DIR, file));
    removed++;
  }
}

// The manifest lets the page check whether an icon exists before rendering an <img>, so a
// model whose vendor the library does not cover renders cleanly with no icon instead of a
// broken image and a 404 in the console.
const slugs = [...chosen.keys()].sort();
writeFileSync(MANIFEST, `${JSON.stringify(slugs, null, 0)}\n`);

console.log(`${slugs.length} brand icons written to public/logos/models/`);
console.log(`${downgraded} used the monochrome mark because the colour one is white-filled`);
if (removed) console.log(`${removed} orphan(s) removed`);
console.log(`manifest: src/lib/model-icon-slugs.json`);
