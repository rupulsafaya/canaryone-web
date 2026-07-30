#!/usr/bin/env node
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IN = resolve(ROOT, 'public/receipt-kimi-k3.png');
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

const overlaySvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="100%" r="70%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.22"/>
      <stop offset="60%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .brand { font: 700 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${TEXT_ON_DARK}; }
    .h1    { font: 500 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${TEXT_ON_DARK}; letter-spacing: -1.5px; }
    .tag   { font: 500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${MUTED_ON_DARK}; }
  </style>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="80" y="100" class="brand">CanaryOne</text>
  <rect x="80" y="112" width="176" height="4" fill="${ACCENT}"/>
  <text x="80" y="200" class="h1">Test AI providers on</text>
  <text x="80" y="264" class="h1">your own test workloads.</text>
  <text x="80" y="304" class="tag">Local. Open source.</text>
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
  ])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`OG image written: ${OUT} (${W}×${H})`);
