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
const BG = '#fafaf7';
const ACCENT = '#FDE047';
const TEXT = '#0f172a';
const MUTED = '#6b7280';

const receiptTargetWidth = 1040;
const receipt = await sharp(IN)
  .resize({ width: receiptTargetWidth, withoutEnlargement: false })
  .toBuffer({ resolveWithObject: true });

const receiptY = 300;

const overlaySvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .brand { font: 700 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${TEXT}; }
    .tag   { font: 500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${MUTED}; }
    .cap   { font: 500 22px ui-monospace, "SF Mono", Menlo, monospace; fill: ${MUTED}; }
  </style>
  <text x="80" y="120" class="brand">canaryone</text>
  <rect x="80" y="130" width="270" height="10" fill="${ACCENT}"/>
  <text x="80" y="200" class="tag">Benchmark your AI agent across every route it could run on.</text>
  <text x="80" y="240" class="tag">Locally. Open source.</text>
  <text x="80" y="600" class="cap">Kimi K3 · 10 routes · 3.9× cost spread</text>
</svg>
`;

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: BG,
  },
})
  .composite([
    { input: receipt.data, top: receiptY, left: Math.round((W - receipt.info.width) / 2) },
    { input: Buffer.from(overlaySvg), top: 0, left: 0 },
  ])
  .png()
  .toFile(OUT);

console.log(`OG image written: ${OUT} (${W}×${H})`);
