#!/usr/bin/env node
// Strip width/height from SVG root so CSS controls sizing.
// Keep viewBox so aspect ratio is preserved.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, '..', 'public', 'logos');

const files = readdirSync(DIR).filter((f) => f.endsWith('.svg'));
let changed = 0;
for (const f of files) {
  const path = resolve(DIR, f);
  const src = readFileSync(path, 'utf8');
  // Only strip width/height on the FIRST <svg ...> tag.
  const out = src.replace(/(<svg\b[^>]*?)(\s+width="[^"]*")([^>]*>)/, '$1$3')
                 .replace(/(<svg\b[^>]*?)(\s+height="[^"]*")([^>]*>)/, '$1$3');
  if (out !== src) {
    writeFileSync(path, out);
    changed++;
    console.log(`normalized: ${f}`);
  }
}
console.log(`${changed}/${files.length} normalized`);
