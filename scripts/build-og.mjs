#!/usr/bin/env node
/**
 * Renders public/og.png, the 1200x630 social card.
 *
 * The wordmark comes from public/c1-logo.svg rather than being set as text, so the card
 * and the site's nav carry the same lockup. The logo ships with a near-black wordmark for
 * use on cream, and this card is on the dark panel, so the fill is swapped in memory —
 * the file on disk is not touched.
 *
 *   pnpm build:og        # after changing the logo or the receipt
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IN = resolve(ROOT, 'src/assets/receipt-kimi-k3.png');
const LOGO = resolve(ROOT, 'public/c1-logo.svg');
const OUT = resolve(ROOT, 'public/og.png');

const W = 1200;
const H = 630;

// Match the site's own dark hero panel — neutral near-black + canary yellow.
const BG_DARK = '#0f0f10';
const ACCENT = '#FDE047';
const TEXT_ON_DARK = '#fef9c3';
const MUTED_ON_DARK = '#a8a29e';

// Scale the receipt PNG down for the bottom half of the card.
const receiptTargetWidth = 1040;
const receipt = await sharp(IN)
  .resize({ width: receiptTargetWidth, withoutEnlargement: false })
  .toBuffer({ resolveWithObject: true });

const receiptY = 340;

// The lockup, recoloured for a dark surface. Only the wordmark's fill changes; the mark
// is a yellow raster inside the SVG and is left alone.
const LOGO_HEIGHT = 58;
const logoSvg = readFileSync(LOGO, 'utf8').replace(/fill="#0f0f10"/g, `fill="${TEXT_ON_DARK}"`);
const logo = await sharp(Buffer.from(logoSvg), { density: 600 })
  .resize({ height: LOGO_HEIGHT })
  .png()
  .toBuffer({ resolveWithObject: true });

const overlaySvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="100%" r="70%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .h1  { font: 500 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${TEXT_ON_DARK}; letter-spacing: -1.5px; }
    .tag { font: 500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${MUTED_ON_DARK}; }
  </style>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="80" y="204" class="h1">Test AI providers on</text>
  <text x="80" y="268" class="h1">your own test workloads.</text>
  <text x="80" y="308" class="tag">Runs on your machine, against your own tests. Open source.</text>
</svg>
`;

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: BG_DARK,
  },
})
  .composite([
    { input: receipt.data, top: receiptY, left: Math.round((W - receipt.info.width) / 2), blend: 'over' },
    { input: Buffer.from(overlaySvg), top: 0, left: 0 },
    { input: logo.data, top: 64, left: 80 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`OG image written: ${OUT} (${W}×${H})`);
console.log(`  lockup from ${LOGO} at ${logo.info.width}×${logo.info.height}, wordmark recoloured to ${TEXT_ON_DARK}`);
