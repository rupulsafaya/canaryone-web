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
 * Ink is measured by scripts/lib/svg-ink.mjs, which rasterises rather than parsing the
 * bezier paths; the reasoning is recorded there. build-logos.mjs shares that module, so the
 * two scripts cannot drift apart on what counts as the edge of a logo.
 *
 * Run it whenever the designer supplies new exports:
 *   pnpm build:logo && pnpm build:og
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { openSvg, measureInk, r } from './lib/svg-ink.mjs';

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
/**
 * The legacy container, and not optional. A `<link rel="icon">` covers the tab strip, but
 * several surfaces ignore the markup and request /favicon.ico from the site root directly:
 * Safari's bookmarks and Favorites, a browser's own bookmark and history lists, and most
 * link-unfurlers. Until 2026-08-05 this file did not exist and that request 404'd, which is
 * why the icon was missing outside the tab.
 */
const FAVICON_ICO_OUT = resolve(ROOT, 'public/favicon.ico');
const APPLE_ICON_OUT = resolve(ROOT, 'public/apple-touch-icon.png');

/** The export's wordmark fill, and the near-black we replace it with. */
const EXPORT_WORDMARK_FILL = '#000000';
const WORDMARK_FILL = '#0f0f10';
/** Canary 100, which is --text-on-dark. The wordmark colour in the dark-surface lockup. */
const WORDMARK_FILL_ON_DARK = '#fef9c3';
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
 * Sizes packed into favicon.ico. A browser picks the entry nearest the size it needs, so
 * 16 covers the tab strip at 1x, 32 covers it at 2x and the bookmarks bar, and 48 covers
 * the history and new-tab surfaces. Rendering each size from the vector beats letting the
 * browser downscale one large bitmap, because the mark is thin line art.
 */
const FAVICON_ICO_SIZES = [16, 32, 48];
/**
 * iOS applies its own corner mask to apple-touch-icon, so that one ships full-bleed and
 * square. A pre-rounded icon would get rounded twice and show dark corners inside the mask.
 */
const APPLE_ICON_SIZE = 180;

/**
 * Packs PNGs into an ICO container. Every browser in support since IE11 reads PNG-compressed
 * ICO entries, so there is no need to emit the old uncompressed DIB format, and sharp has no
 * ICO encoder of its own. The layout is a 6-byte ICONDIR, one 16-byte ICONDIRENTRY per image,
 * then the image payloads.
 */
function packIco(images) {
  const HEADER = 6;
  const ENTRY = 16;
  const dir = Buffer.alloc(HEADER + ENTRY * images.length);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // 1 = icon, as opposed to 2 = cursor
  dir.writeUInt16LE(images.length, 4);

  let offset = dir.length;
  images.forEach(({ size, data }, i) => {
    const at = HEADER + ENTRY * i;
    // A zero byte means 256. Nothing here is that large, but the encoding is the spec's.
    dir.writeUInt8(size >= 256 ? 0 : size, at);
    dir.writeUInt8(size >= 256 ? 0 : size, at + 1);
    dir.writeUInt8(0, at + 2); // palette size, 0 for truecolour
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });

  return Buffer.concat([dir, ...images.map((i) => i.data)]);
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

const logoInk = await measureInk({ ...logo, body: logoBody }, 'lockup');

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
const markInk = await measureInk(mark, 'mark');

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

// Each ICO entry is rendered from the vector at its own size rather than downscaled from one
// bitmap, because at 16px the mark is a few pixels of line weight and a resample of a 48px
// render loses it. The rounded corner is kept: these surfaces sit on white as often as dark.
const icoEntries = [];
for (const size of FAVICON_ICO_SIZES) {
  icoEntries.push({ size, data: await rasterise(faviconSvg, size).toBuffer() });
}
writeFileSync(FAVICON_ICO_OUT, packIco(icoEntries));

console.log(`Favicon written: ${FAVICON_SVG_OUT} + ${FAVICON_PNG_OUT}`);
console.log(`  ICO fallback ${FAVICON_ICO_OUT} carrying ${FAVICON_ICO_SIZES.join(', ')}px`);
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
