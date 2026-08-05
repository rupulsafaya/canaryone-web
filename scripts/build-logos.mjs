#!/usr/bin/env node
/**
 * Builds every third-party partner logo in public/logos/ from one of two sources, and
 * normalises all of them so that one CSS height means one optical size.
 *
 * Replaces normalize-logos.mjs, which only stripped the root width/height attributes. That
 * was not enough, and the reason is worth recording because the symptom looked like a CSS
 * problem and was not.
 *
 * ---------------------------------------------------------------- what was wrong
 *
 * The logos arrived from three different places with three different conventions, and the
 * pages then set a CSS height and trusted it:
 *
 *   - The lobehub `-text` lockups are drawn to a 24-unit-tall viewBox, but the ink inside
 *     that box ranges from 83% to 100% of it. At `height: 24px`, Fireworks rendered 20px of
 *     actual ink while nscale rendered 24px.
 *   - The hand-dropped files were worse. CoreWeave's export carries 45% dead vertical
 *     padding inside its viewBox, so at `height: 20px` its wordmark drew 11px tall next to
 *     Vultr's 17.5px. Scaleway's carries so much that it read as a speck.
 *   - `.dt-logo` tried to stop wide lockups running off the row with `max-width: 110px`.
 *     Because the CSS constraint table recomputes height when width is clamped, that
 *     silently overrode `height: 20px`: nscale is 8.88:1, wanted 178px at 20px tall, got
 *     clamped to 110px, and collapsed to 12.4px tall. The clamp defeated the height.
 *
 * So three files disagreed about their own size, and a fourth rule quietly resized a fifth.
 * Cropping every viewBox to its ink makes `height: 20px` mean 20px of ink, which makes the
 * clamp unnecessary and deletable rather than something to tune.
 *
 * ---------------------------------------------------------------- the two sources
 *
 * LOCKUPS come from @lobehub/icons-static-svg's `-text` variants wherever the library has
 * the brand. That is a devDependency, so the output is committed and the deploy never
 * depends on it — the same arrangement sync-model-icons.mjs already uses.
 *
 * PARTNER_SOURCES in brand/partners/ covers the four brands lobehub does not ship at all.
 * Those are hand-sourced from each company's own brand page and must not be edited in
 * place: this script rewrites public/logos/, so brand/partners/ is the copy that survives.
 *
 * ---------------------------------------------------------------- optical size
 *
 * Cropping to ink gets the gross errors out, but equal ink height is still not equal optical
 * size. A wordmark with a descender spends part of its height below the baseline, and a
 * lockup with a tall mark spends part of it on the mark, so equalising total ink height
 * leaves the letters at visibly different sizes. LangChain beside LlamaIndex, and Lambda
 * beside CoreWeave, were both that.
 *
 * So the size each logo is normalised on is not its ink height but its *body band*: the
 * shortest run of pixel rows holding 80% of its ink, which lands on the capitals and the
 * x-height and ignores a lone descender. measureBand() computes it, and each logo is then
 * padded until that band is TARGET_BAND of its box. The band is a property of the artwork,
 * so this needs no table of hand-tuned numbers and does not go stale when a logo is
 * replaced — swap the file, re-run, and the new one is normalised with the rest.
 *
 * NUDGE exists for artwork the metric reads wrong, and is currently empty.
 *
 * Run after bumping @lobehub/icons-static-svg, or after adding a brand:
 *   pnpm build:logos
 */
import sharp from 'sharp';
import { writeFileSync, readdirSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { openSvg, measureInk, r } from './lib/svg-ink.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOBEHUB_DIR = resolve(ROOT, 'node_modules', '@lobehub', 'icons-static-svg', 'icons');
const PARTNER_DIR = resolve(ROOT, 'brand', 'partners');
const OUT_DIR = resolve(ROOT, 'public', 'logos');
const MARKS_OUT_DIR = resolve(ROOT, 'public', 'logos', 'marks');

/**
 * The brands lobehub covers, mapped to the variant to take. Every one is a `-text` lockup:
 * a horizontal mark-plus-wordmark. The bare marks are deliberately not used here — a row
 * that says "we deploy to these people" has to name them, and half a row of unlabelled
 * icons beside half a row of wordmarks cannot be made to look like one system.
 *
 * Two of these were previously something else and are called out because the swap is the
 * visible part of this change:
 *   baseten  was a hand-dropped 3236x1080 export with the brand's green background plate
 *            baked in, so it rendered as a green pill among bare black wordmarks, on the
 *            home page and in the /evals hub both. `baseten-text.svg` has no plate.
 *   cerebras was `cerebras-brand-color.svg`, the compact coloured mark, which read as a
 *            small red smudge beside nine black wordmarks.
 */
const LOCKUPS = {
  baseten: 'baseten-text.svg',
  bedrock: 'bedrock-text.svg',
  cerebras: 'cerebras-text.svg',
  deepseek: 'deepseek-text.svg',
  fireworks: 'fireworks-text.svg',
  groq: 'groq-text.svg',
  lambda: 'lambda-text.svg',
  langchain: 'langchain-text.svg',
  llamaindex: 'llamaindex-text.svg',
  moonshot: 'moonshot-text.svg',
  nebius: 'nebius-text.svg',
  openrouter: 'openrouter-text.svg',
  together: 'together-text.svg',
  vercel: 'vercel-text.svg',
};

/**
 * Brands lobehub does not ship, hand-sourced into brand/partners/. Recorded with where each
 * came from, because a logo with no provenance is a logo nobody dares replace.
 *
 *   coreweave  the export already in this repo, origin not recorded before this script
 *   nscale     the export already in this repo, origin not recorded before this script
 *   scaleway   scaleway.com's own header lockup, 166x32
 *   vultr      vultr.com/media/logo_onwhite.svg, the company's own on-white lockup
 *
 * Take these from the company rather than from a logo aggregator. The first Scaleway
 * candidate here came from vectorlogo.zone and shipped viewBox="0 0 0 0 750 0 200", which
 * is not a viewBox; openSvg now rejects it by name rather than letting a 0x0 box reach the
 * rasteriser as "bad dimensions".
 */
const PARTNER_SOURCES = ['coreweave', 'nscale', 'scaleway', 'vultr'];

/**
 * The open-weight model marks in the home page hero, which are a different kind of artwork
 * and get a different normalisation. These are square-ish marks with no wordmark, shown on
 * the dark band, and they are the one place bare marks are right: the row is decoration under
 * a headline rather than a list of names, and six wordmarks there would compete with the h1.
 *
 * They go to public/logos/marks/ rather than into public/logos/ because public/logos/models/
 * belongs to sync-model-icons.mjs, which mirrors the whole library at 16px for /prices and
 * must not be reshaped for this one row.
 */
const MARKS = {
  meta: 'meta-color.svg',
  mistral: 'mistral-color.svg',
  qwen: 'qwen-color.svg',
  deepseek: 'deepseek-color.svg',
  gemma: 'gemma-color.svg',
  chatglm: 'chatglm-color.svg',
};

/**
 * Fraction of a mark's square box that its longer side fills. Marks normalise on the longer
 * side rather than on a body band: there are no letterforms to measure, and a mark that is
 * wider than it is tall should keep that proportion rather than be stretched to a common
 * height. This is the same rule build-logo.mjs applies to the favicon.
 *
 * Below 1.0 so that a mark drawn hard to its own edges does not sit flush against its
 * neighbour's optical bounds while a rounder one appears inset.
 */
const MARK_SCALE = 0.94;

/**
 * The share of a logo's ink mass that defines its "body" — the band a reader actually
 * measures the logo by. 80% is enough to include the capitals and the x-height and to
 * exclude a lone descender, a stray ascender or a tall mark beside a short wordmark.
 */
const BAND_MASS = 0.8;

/**
 * Target height of that body band, as a fraction of the rendered box. Every logo is padded
 * until its band matches this, which is what makes one CSS height look like one size.
 *
 * The ceiling on this number is set by whichever logo has the smallest band relative to its
 * own ink — Together and OpenRouter, both at 0.46 — because padding can only ever make a
 * logo smaller. Raising it past that point cannot be honoured, so the script fails rather
 * than silently leaving those two undersized. Lowering it shrinks every logo, which is what
 * --logo-h in the stylesheet is for.
 */
const TARGET_BAND = 0.46;

/** Ceiling for the computed ratio. Above 1.0 the ink would overflow its viewBox and clip. */
const MAX_INK_RATIO = 1.0;

/**
 * The surfaces these two groups sit on. The contrast floor is meaningless without them: the
 * lockups sit on cream (--bg) and the hero marks on near-black (--dark), so a white logo is
 * a failure in one group and correct in the other. Checking everything against cream would
 * have rejected the entire hero row.
 */
const CREAM_BG = { r: 0xfa, g: 0xfa, b: 0xf7 };
const DARK_BG = { r: 0x0f, g: 0x0f, b: 0x10 };
const INK_COLOUR = '#0f0f10';

/**
 * Brands whose artwork is a single flat colour, where that colour is white because the
 * source is the company's dark-header variant. Their fills are rewritten to --text.
 *
 * Recolouring someone else's logo needs a reason, and the reason is that a one-colour
 * lockup is one-colour by design: every brand that ships a white-on-dark version ships a
 * dark-on-light version of the same artwork, and this produces that second version rather
 * than inventing a treatment. It is only ever applied to artwork that is entirely white,
 * never to a logo with real brand colour in it — Vultr's blue mark and CoreWeave's are left
 * exactly as drawn.
 *
 *   scaleway  scaleway.com serves only the white lockup from its own header
 */
const RECOLOUR_WHITE_TO_INK = new Set(['scaleway']);

/** Matches the white a monochrome export fills with, in any of the forms SVG allows. */
const WHITE_FILL = /(fill|stroke)\s*=\s*"(#fff(?:fff)?|white|rgb\(255,\s*255,\s*255\))"/gi;

/**
 * Minimum contrast between a logo's ink and the cream page, as a WCAG ratio. This is a
 * legibility floor rather than a text-contrast requirement — a logo is not body copy — and
 * it exists because two logos have already shipped that failed it: Scaleway's white lockup
 * measured 1.05:1 and was invisible, and Baseten's export carried its own green background
 * plate. Both looked like CSS problems and neither was.
 */
const MIN_CONTRAST = 1.6;

/**
 * Manual nudges applied on top of the computed ratio, as a multiplier. Empty on purpose:
 * the band measurement handles every logo in the current set, and an entry here should
 * carry the reason the measurement was wrong for that specific piece of artwork rather
 * than being a knob to turn when a row looks off. If a row looks off, check --logo-h first.
 */
const NUDGE = {};

/**
 * Measures the height of a logo's body band, as a fraction of its own ink height.
 *
 * Total ink height is the wrong thing to normalise on. A wordmark with a descender spends
 * part of its height below the baseline and a lockup with a tall mark spends part of it on
 * the mark, so equalising total height leaves the letters at visibly different sizes — which
 * is what LangChain beside LlamaIndex and Lambda beside CoreWeave both looked like.
 *
 * So instead: render the artwork, sum ink per pixel row weighted by alpha, then find the
 * shortest contiguous band of rows holding BAND_MASS of the total. Antialiasing is included
 * by weight rather than thresholded away, because at these sizes a thin wordmark is mostly
 * edge and a hard alpha cutoff discards most of the glyph.
 *
 * The result is a property of the artwork, not of any render size, so it is stable and the
 * ratio derived from it does not need to be committed to a table by hand.
 */
async function measureBand(svgText, label) {
  const RENDER_H = 176; // 8x the page's --logo-h, enough rows for a clean profile
  const { data, info } = await sharp(Buffer.from(svgText))
    .resize({ height: RENDER_H })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels: ch } = info;
  const rowMass = new Array(h).fill(0);
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * ch + ch - 1] / 255;
      rowMass[y] += a;
      total += a;
    }
  }
  if (!total) throw new Error(`The ${label} rendered with no ink to profile.`);

  // Shortest window holding BAND_MASS of the mass, by advancing the window's start and
  // growing it only until the target is met. Each start needs at most one pass.
  let shortest = h;
  for (let y0 = 0; y0 < h; y0++) {
    let acc = 0;
    for (let y1 = y0; y1 < h; y1++) {
      acc += rowMass[y1];
      if (acc >= total * BAND_MASS) {
        if (y1 - y0 + 1 < shortest) shortest = y1 - y0 + 1;
        break;
      }
    }
  }
  return shortest / h;
}

/** WCAG relative luminance for an sRGB triple in 0-255. */
function luminance({ r: R, g: G, b: B }) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(R) + 0.7152 * lin(G) + 0.0722 * lin(B);
}

/** WCAG contrast ratio between two sRGB triples. */
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Renders a logo and returns the mean colour of its ink, weighted by alpha, plus that
 * colour's contrast against the surface it is going to sit on.
 *
 * Weighting by alpha rather than counting opaque pixels matters for thin letterforms: at the
 * size these render, a wordmark is mostly antialiased edge, and treating a 40%-alpha pixel
 * as fully absent throws away most of the glyph. Composited against the surface first, so a
 * semi-transparent logo is judged as it will actually appear rather than at full strength.
 */
async function inkColour(svgText, bg) {
  const { data, info } = await sharp(Buffer.from(svgText))
    .resize({ width: 400, fit: 'inside', withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let wr = 0;
  let wg = 0;
  let wb = 0;
  let wsum = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const a = data[i + info.channels - 1] / 255;
    if (a <= 0) continue;
    // Composite this pixel over the surface, then weight it by how much of it there is.
    wr += (data[i] * a + bg.r * (1 - a)) * a;
    wg += (data[i + 1] * a + bg.g * (1 - a)) * a;
    wb += (data[i + 2] * a + bg.b * (1 - a)) * a;
    wsum += a;
  }
  if (!wsum) throw new Error('Logo rendered with no visible pixels at all.');

  const mean = { r: wr / wsum, g: wg / wsum, b: wb / wsum };
  return { mean, ratio: contrast(mean, bg) };
}

if (!existsSync(LOBEHUB_DIR)) {
  console.error(
    `Cannot read ${LOBEHUB_DIR}.\nInstall the icon set first: pnpm add -D @lobehub/icons-static-svg`,
  );
  process.exit(1);
}

/** Every brand this script owns, with the file to read it from. */
const sources = [
  ...Object.entries(LOCKUPS).map(([slug, file]) => ({
    slug,
    kind: 'lockup',
    path: resolve(LOBEHUB_DIR, file),
    origin: `lobehub ${file}`,
    outDir: OUT_DIR,
    bg: CREAM_BG,
    surface: 'cream',
  })),
  ...PARTNER_SOURCES.map((slug) => ({
    slug,
    kind: 'lockup',
    path: resolve(PARTNER_DIR, `${slug}.svg`),
    origin: `brand/partners/${slug}.svg`,
    outDir: OUT_DIR,
    bg: CREAM_BG,
    surface: 'cream',
  })),
  ...Object.entries(MARKS).map(([slug, file]) => ({
    slug,
    kind: 'mark',
    path: resolve(LOBEHUB_DIR, file),
    origin: `lobehub ${file}`,
    outDir: MARKS_OUT_DIR,
    bg: DARK_BG,
    surface: 'dark',
  })),
];

for (const { slug, path, origin } of sources) {
  if (!existsSync(path)) {
    throw new Error(`${slug}: expected a source at ${path} (${origin}) and found nothing.`);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(MARKS_OUT_DIR, { recursive: true });

const rows = [];
for (const { slug, kind, path, origin, outDir, bg, surface } of sources) {
  const svg = openSvg(path);

  // Recolour before measuring. Ink bounds come from the alpha channel and so do not move,
  // but the contrast check below reads colour and has to see the artwork as it will ship.
  let recoloured = 0;
  if (RECOLOUR_WHITE_TO_INK.has(slug)) {
    svg.body = svg.body.replace(WHITE_FILL, (_m, prop) => {
      recoloured++;
      return `${prop}="${INK_COLOUR}"`;
    });
    if (!recoloured) {
      throw new Error(
        `${slug} is listed in RECOLOUR_WHITE_TO_INK but has no white fill to rewrite. ` +
          `The source has probably been replaced with a variant that does not need it — ` +
          `drop it from the set rather than leaving a rule that silently does nothing.`,
      );
    }
  }

  const ink = await measureInk(svg, `${slug} logo`);

  let band = null;
  let ratio;
  let pinned = false;
  let boxX;
  let boxY;
  let boxW;
  let boxH;

  if (kind === 'mark') {
    // A mark has no letterforms to measure, so it normalises on its longer side inside a
    // square box: every mark then occupies the same optical square, and one that is wider
    // than it is tall keeps that proportion instead of being forced to a common height.
    const side = Math.max(ink.W, ink.H) / MARK_SCALE;
    boxW = side;
    boxH = side;
    boxX = ink.X0 - (side - ink.W) / 2;
    boxY = ink.Y0 - (side - ink.H) / 2;
    ratio = Math.max(ink.W, ink.H) / side;
  } else {
    // Profile the artwork cropped to its own ink, so the band is measured against the ink and
    // not against whatever padding the source happened to carry.
    const cropped = `<svg ${[...new Set(['xmlns="http://www.w3.org/2000/svg"', ...svg.namespaces])].join(' ')} viewBox="${r(ink.X0)} ${r(ink.Y0)} ${r(ink.W)} ${r(ink.H)}">${svg.body.trim()}</svg>`;
    band = await measureBand(cropped, `${slug} logo`);

    // Pad until the band lands on TARGET_BAND. A logo whose band already sits below the
    // target relative to its ink cannot be padded up to it, so it pins at 1.0 and is
    // reported with a star in the table.
    const wanted = (TARGET_BAND / band) * (NUDGE[slug] ?? 1);
    ratio = Math.min(wanted, MAX_INK_RATIO);
    pinned = wanted > MAX_INK_RATIO;

    // The output box is the ink box, grown vertically so the ink fills `ratio` of it. Width
    // grows by the same absolute amount on each side, which keeps the padding visually even
    // rather than stretching a wide lockup's side margins out of proportion to its top ones.
    boxH = ink.H / ratio;
    const padY = (boxH - ink.H) / 2;
    boxW = ink.W + padY * 2;
    boxX = ink.X0 - padY;
    boxY = ink.Y0 - padY;
  }

  // The artwork keeps its own coordinates and the viewBox moves to frame it, so no path
  // data is rewritten and nothing is rasterised. Width and height attributes are omitted
  // on purpose: with only a viewBox, CSS is the single authority on rendered size. Every
  // namespace the source declared is carried over, because a body that uses a prefix the
  // new root does not declare is an XML parse error rather than a degraded render.
  const ns = new Set(['xmlns="http://www.w3.org/2000/svg"', ...svg.namespaces]);
  const out = `<svg ${[...ns].join(' ')} viewBox="${r(boxX)} ${r(boxY)} ${r(boxW)} ${r(boxH)}" role="img" aria-label="${slug}">${svg.body.trim()}</svg>\n`;

  const { ratio: seen } = await inkColour(out, bg);
  if (seen < MIN_CONTRAST) {
    throw new Error(
      `${slug} (${origin}) measures ${seen.toFixed(2)}:1 against the ${surface} surface it ` +
        `is shown on, below the ${MIN_CONTRAST}:1 floor — it would ship close to invisible.\n` +
        `  If the source is a white-on-dark variant on cream, add "${slug}" to RECOLOUR_WHITE_TO_INK.\n` +
        `  Otherwise source the variant drawn for a ${surface} background.`,
    );
  }

  writeFileSync(resolve(outDir, `${slug}.svg`), out);

  rows.push({
    slug,
    kind,
    origin,
    src: `${r(svg.vb.w)}x${r(svg.vb.h)}`,
    ink: `${r(ink.W)}x${r(ink.H)}`,
    fill: ink.H / svg.vb.h,
    band,
    ratio,
    pinned,
    aspect: boxW / boxH,
    contrast: seen,
    recoloured,
  });
}

// Drop any logo this script no longer owns, so neither directory keeps an orphan that a page
// might still reference and nobody can trace. Only files this script would itself have
// written are considered: public/logos/models/ belongs to sync-model-icons.mjs, and it is a
// subdirectory rather than an .svg so the filter below never sees it.
let removed = 0;
for (const dir of [OUT_DIR, MARKS_OUT_DIR]) {
  const owned = new Set(sources.filter((s) => s.outDir === dir).map((s) => s.slug));
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
    if (!owned.has(file.replace(/\.svg$/, ''))) {
      rmSync(resolve(dir, file));
      console.log(`  removed orphan ${dir.replace(`${ROOT}/`, '')}/${file}`);
      removed++;
    }
  }
}

const lockups = rows.filter((row) => row.kind === 'lockup');
const marks = rows.filter((row) => row.kind === 'mark');
console.log(
  `${lockups.length} lockups written to public/logos/, ${marks.length} marks to public/logos/marks/`,
);
console.log('');
console.log(
  `  ${'brand'.padEnd(12)}${'src box'.padEnd(14)}${'ink'.padEnd(12)}${'ink/box'.padEnd(9)}${'band'.padEnd(7)}${'ratio'.padEnd(8)}${'aspect'.padEnd(9)}contrast`,
);
for (const row of rows) {
  if (row === marks[0]) console.log(`  ${'-'.repeat(28)} marks, normalised on the longer side`);
  console.log(
    `  ${row.slug.padEnd(12)}${row.src.padEnd(14)}${row.ink.padEnd(12)}${row.fill.toFixed(2).padEnd(9)}${(row.band === null ? '-' : row.band.toFixed(3)).padEnd(7)}${(row.ratio.toFixed(2) + (row.pinned ? '*' : '')).padEnd(8)}${`${row.aspect.toFixed(2)}:1`.padEnd(9)}${row.contrast.toFixed(2)}:1${row.recoloured ? `  (${row.recoloured} white fill -> ${INK_COLOUR})` : ''}`,
  );
}
console.log('');
console.log('  ink/box below about 0.9 was dead padding in the source, now cropped away.');
console.log(`  band is the body band as a fraction of the lockup's own ink; ratio pads it to`);
console.log(`  TARGET_BAND (${TARGET_BAND}). A starred ratio pinned at ${MAX_INK_RATIO} and could not reach it.`);
console.log(`  contrast is measured against each group's own surface; the floor is ${MIN_CONTRAST}:1.`);
if (removed) console.log(`  ${removed} orphan(s) removed`);
