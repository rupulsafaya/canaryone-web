#!/usr/bin/env node
/**
 * Builds the derived brand assets from the designer's exports in brand/.
 *
 *   brand/c1-logo-source.svg  ->  public/c1-logo.svg                the nav and footer lockup
 *   brand/c1-logo-mark.svg    ->  public/favicon.svg, favicon.png   the browser tab icon
 *                                 public/apple-touch-icon.png      the iOS home screen icon
 *
 * Both exports are all-vector, so nothing here rasterises artwork for its own sake. An
 * earlier export faked transparency with an embedded PNG and a luminance mask and this
 * script used to reconstruct it; that code is gone. What the script does now is correct
 * the things the exports ship with.
 *
 * The lockup export carries a 900x300 artboard viewBox with roughly 90 units of dead
 * padding on every side, so the lockup would sit small and off-centre inside whatever box
 * CSS gives it. The ink is measured and the viewBox cropped to it, which makes the file's
 * aspect ratio the lockup's aspect ratio and makes CSS sizing behave. Some exports also
 * paint opaque white rectangles behind the artwork, which would render the lockup as a
 * white slab on the cream page and on the dark social card; those are removed when present.
 *
 * The lockup's wordmark is filled #000000. That is normalised to the site's near-black,
 * and the normalisation is load-bearing rather than cosmetic: scripts/build-og.mjs
 * recolours the wordmark for the dark card by swapping that exact string. Left at pure
 * black, the OG card would render a black wordmark on a near-black panel and the swap
 * would fail silently, so this script throws if the fill it expects is missing.
 *
 * The favicon is generated from the mark rather than hand-dropped, because a hand-dropped
 * raster goes stale. On 2026-08-03 the mark's yellow moved from #fac41e to #facc15 and the
 * committed favicon.png kept the old colour, which is the drift the MARK COLOUR CHECK below
 * now catches.
 *
 * Ink is measured by rasterising and reading alpha bounds rather than by parsing the bezier
 * paths, because the mark is drawn through a clip path and curve control points lie outside
 * the shape they describe. Rasterising respects both.
 *
 * Run it whenever the designer supplies new exports:
 *   pnpm build:logo && pnpm build:og
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const LOGO_SOURCE = resolve(ROOT, 'brand/c1-logo-source.svg');
const LOGO_OUT = resolve(ROOT, 'public/c1-logo.svg');
/**
 * The same lockup with the wordmark recoloured for a dark surface. The nav sits on --dark
 * on every page, and --dark is #0f0f10 — the exact colour the wordmark is normalised to
 * below — so the light lockup renders as an invisible wordmark beside a yellow mark there.
 * Generated rather than hand-dropped, for the reason recorded in README under the favicon:
 * a hand-made copy silently kept a stale colour once already.
 */
const LOGO_DARK_OUT = resolve(ROOT, 'public/c1-logo-dark.svg');
const MARK_SOURCE = resolve(ROOT, 'brand/c1-logo-mark.svg');
const FAVICON_SVG_OUT = resolve(ROOT, 'public/favicon.svg');
const FAVICON_PNG_OUT = resolve(ROOT, 'public/favicon.png');
const APPLE_ICON_OUT = resolve(ROOT, 'public/apple-touch-icon.png');

/** The export's wordmark fill, and the near-black we replace it with. */
const EXPORT_WORDMARK_FILL = '#000000';
const WORDMARK_FILL = '#0f0f10';
/** Canary 100, which is --text-on-dark. The wordmark colour in the dark-surface lockup. */
const WORDMARK_FILL_ON_DARK = '#fef9c3';
/** Supersampling factor for the ink measurement. 4x gives quarter-unit precision. */
const PROBE_SCALE = 4;
/** Alpha above which a pixel counts as ink, on 0-255. Ignores antialiasing fringe. */
const INK_ALPHA = 8;
/**
 * The favicon sits the mark on a dark rounded square rather than on transparency. The mark
 * is canary yellow line art, which measures 1.53:1 against a white browser tab bar and is
 * close to invisible there at 16px. On the near-black panel it measures 10.51:1, so boxing
 * it makes the tab icon legible in light and dark alike, and matches the site's hero panel.
 */
const FAVICON_BG = '#0f0f10';
/** Fraction of the box the mark's longer side occupies. The rest is margin. */
const FAVICON_MARK_SCALE = 0.72;
/** Corner radius as a fraction of the box. Roughly the iOS/macOS superellipse. */
const FAVICON_RADIUS = 0.22;
/** Raster size of the PNG favicon fallback. */
const FAVICON_PNG_SIZE = 64;
/**
 * iOS applies its own corner mask to apple-touch-icon, so that one ships full-bleed and
 * square. A pre-rounded icon would get rounded twice and show dark corners inside the mask.
 */
const APPLE_ICON_SIZE = 180;

const r = (n) => Number(n.toFixed(3));

/**
 * Splits an SVG into its root attributes and its body, so the body can be re-wrapped in a
 * root of our own choosing.
 */
function openSvg(path) {
  const text = readFileSync(path, 'utf8');
  const rootTag = text.match(/<svg\b[^>]*>/);
  if (!rootTag) throw new Error(`No root <svg> element in ${path}.`);

  const viewBox = rootTag[0].match(/viewBox="([\d.\s-]+)"/);
  if (!viewBox) throw new Error(`The root <svg> in ${path} has no viewBox to measure against.`);
  const [x, y, w, h] = viewBox[1].trim().split(/\s+/).map(Number);

  const body = text.slice(rootTag.index + rootTag[0].length).replace(/<\/svg>\s*$/, '');
  return { text, body, viewBox: viewBox[1], vb: { x, y, w, h } };
}

/** Rasterises the artwork and returns the bounding box of its ink, in user units. */
async function measureInk(body, viewBox, vb, label) {
  const probeSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="${viewBox}" width="${Math.round(vb.w * PROBE_SCALE)}" height="${Math.round(vb.h * PROBE_SCALE)}">${body}</svg>`;

  const probe = await sharp(Buffer.from(probeSvg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: pw, height: ph, channels } = probe.info;

  let minX = pw;
  let minY = ph;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      if (probe.data[(y * pw + x) * channels + channels - 1] > INK_ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`The ${label} measured as empty. Did a fill get stripped that should not have been?`);

  // Round outward so no antialiased edge is clipped.
  const X0 = vb.x + Math.floor(minX / PROBE_SCALE);
  const Y0 = vb.y + Math.floor(minY / PROBE_SCALE);
  const X1 = vb.x + Math.ceil((maxX + 1) / PROBE_SCALE);
  const Y1 = vb.y + Math.ceil((maxY + 1) / PROBE_SCALE);
  return { X0, Y0, W: X1 - X0, H: Y1 - Y0 };
}

/** The yellow a source file paints its artwork in, used to compare lockup against mark. */
function markColour(text) {
  const fills = [...text.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)]
    .map((m) => m[1].toLowerCase())
    .filter((c) => c !== '#000000' && c !== '#ffffff' && c !== WORDMARK_FILL);
  return fills[0] ?? null;
}

// ---------------------------------------------------------------- the lockup

const logo = openSvg(LOGO_SOURCE);
let logoBody = logo.body;

// White artboard backgrounds. Matched on the fill, so an export that drops them simply
// reports zero removed rather than breaking.
const rects = logoBody.match(/<rect\b[^>]*fill="#ffffff"[^>]*\/>/g) || [];
logoBody = logoBody.replace(/<rect\b[^>]*fill="#ffffff"[^>]*\/>/g, '');

const wordmarkFills = logoBody.match(new RegExp(`fill="${EXPORT_WORDMARK_FILL}"`, 'g')) || [];
if (!wordmarkFills.length) {
  throw new Error(
    `Expected the wordmark to be filled ${EXPORT_WORDMARK_FILL}. Check what the new export uses, ` +
      'because build-og.mjs depends on the normalised fill to recolour for the dark card.'
  );
}
logoBody = logoBody.replace(new RegExp(`fill="${EXPORT_WORDMARK_FILL}"`, 'g'), `fill="${WORDMARK_FILL}"`);

const logoInk = await measureInk(logoBody, logo.viewBox, logo.vb, 'lockup');

// Everything is wrapped in one translate, defs included. A clip path resolves against the
// user space of the element that references it, so wrapping the reference and the clip
// together keeps the mark and its clip in step.
const logoOut = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${r(logoInk.W)} ${r(logoInk.H)}" width="${r(logoInk.W)}" height="${r(logoInk.H)}" role="img" aria-labelledby="c1-logo-title">
  <title id="c1-logo-title">CanaryOne</title>
  <g transform="translate(${r(-logoInk.X0)},${r(-logoInk.Y0)})">${logoBody.trim()}</g>
</svg>
`;
writeFileSync(LOGO_OUT, logoOut);

/**
 * The dark-surface variant. Swapping the normalised fill is exactly what build-og.mjs does
 * in memory for the social card; here the result is written to disk because the nav needs it
 * on every request. Only the wordmark moves — the mark keeps its Canary 400 yellow, which
 * already measures 10.51:1 on the near-black panel.
 */
const darkFills = (logoOut.match(new RegExp(WORDMARK_FILL, 'g')) || []).length;
if (!darkFills) {
  throw new Error(
    `Cannot build the dark lockup: no ${WORDMARK_FILL} fill found in the normalised output.`
  );
}
writeFileSync(
  LOGO_DARK_OUT,
  logoOut
    .replace(new RegExp(WORDMARK_FILL, 'g'), WORDMARK_FILL_ON_DARK)
    .replace('id="c1-logo-title"', 'id="c1-logo-dark-title"')
    .replace('aria-labelledby="c1-logo-title"', 'aria-labelledby="c1-logo-dark-title"')
);

const logoAspect = logoInk.W / logoInk.H;
console.log(`Lockup written: ${LOGO_OUT}`);
console.log(`Dark lockup written: ${LOGO_DARK_OUT} (${darkFills} wordmark fill(s) -> ${WORDMARK_FILL_ON_DARK})`);
console.log(`  artboard ${logo.vb.w}x${logo.vb.h} -> ink ${r(logoInk.W)}x${r(logoInk.H)} at (${r(logoInk.X0)}, ${r(logoInk.Y0)})`);
console.log(`  aspect ${logoAspect.toFixed(4)}:1  ->  nav ${Math.round(logoAspect * 28)}x28, footer ${Math.round(logoAspect * 20)}x20`);
console.log(`  removed ${rects.length} white artboard rect(s)`);
console.log(`  wordmark ${wordmarkFills.length} fills normalised ${EXPORT_WORDMARK_FILL} -> ${WORDMARK_FILL}`);

// ---------------------------------------------------------------- the favicon

const mark = openSvg(MARK_SOURCE);
const markInk = await measureInk(mark.body, mark.viewBox, mark.vb, 'mark');

// A favicon has to be square. Rather than scaling the mark inside a fixed box, the box is
// sized from the mark so that its longer side lands on FAVICON_MARK_SCALE of the whole;
// the mark then keeps its own coordinates and is simply centred. Measuring the longer side
// means a mark wider than it is tall does not end up with tighter margins on one axis.
const side = Math.max(markInk.W, markInk.H) / FAVICON_MARK_SCALE;
const offsetX = (side - markInk.W) / 2 - markInk.X0;
const offsetY = (side - markInk.H) / 2 - markInk.Y0;

/** The icon, with the rounded background optional so apple-touch-icon can go full-bleed. */
const composeIcon = (radius) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${r(side)} ${r(side)}" width="${r(side)}" height="${r(side)}" role="img" aria-labelledby="c1-mark-title">
  <title id="c1-mark-title">CanaryOne</title>
  <rect x="0" y="0" width="${r(side)}" height="${r(side)}"${radius ? ` rx="${r(side * radius)}"` : ''} fill="${FAVICON_BG}"/>
  <g transform="translate(${r(offsetX)},${r(offsetY)})">${mark.body.trim()}</g>
</svg>
`;

const faviconSvg = composeIcon(FAVICON_RADIUS);
writeFileSync(FAVICON_SVG_OUT, faviconSvg);

// Rasterise via explicit pixel width/height on a probe copy rather than via `density`.
// Density is relative to the SVG's own user units, so on a canvas this large (~1900 units)
// even a modest DPI asks for a five-figure-square bitmap and sharp refuses it. Supersample
// 4x and box down, which is both safe and sharper than rendering straight to 64px.
const rasterise = (svg, px) =>
  sharp(Buffer.from(svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${px * 4}" height="${px * 4}"`)))
    .resize({ width: px, height: px, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 });

await rasterise(faviconSvg, FAVICON_PNG_SIZE).toFile(FAVICON_PNG_OUT);
await rasterise(composeIcon(0), APPLE_ICON_SIZE).toFile(APPLE_ICON_OUT);

console.log(`Favicon written: ${FAVICON_SVG_OUT} + ${FAVICON_PNG_OUT}`);
console.log(`  mark ink ${r(markInk.W)}x${r(markInk.H)} -> ${r(side)} box, mark at ${(FAVICON_MARK_SCALE * 100).toFixed(0)}% of it`);
console.log(`  background ${FAVICON_BG}, corner radius ${(FAVICON_RADIUS * 100).toFixed(0)}%`);
console.log(`  PNG fallback ${FAVICON_PNG_SIZE}x${FAVICON_PNG_SIZE}`);
console.log(`  Apple touch icon: ${APPLE_ICON_OUT} at ${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE}, square for iOS to mask`);

// ---------------------------------------------------------------- MARK COLOUR CHECK

// The lockup and the mark are exported separately, so their yellows can drift apart. They
// did once already. Warn loudly rather than shipping a tab icon in last month's colour.
const logoYellow = markColour(logo.text);
const markYellow = markColour(mark.text);
if (logoYellow && markYellow && logoYellow !== markYellow) {
  console.warn(
    `\n  WARNING: the lockup's mark is ${logoYellow} but brand/c1-logo-mark.svg is ${markYellow}.\n` +
      `  These should match. Re-export whichever one is stale before shipping.`
  );
} else if (logoYellow) {
  console.log(`  mark colour ${logoYellow}, matching in both exports`);
}
