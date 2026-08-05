/**
 * Measuring where the ink actually sits inside an SVG's viewBox.
 *
 * Shared by build-logo.mjs, which crops the brand lockup and centres the favicon's mark,
 * and by build-logos.mjs, which normalises the partner logos. It lives here rather than in
 * either of them because the algorithm has two non-obvious properties that are easy to get
 * subtly wrong in a second copy, and a drifting copy would show up as logos that disagree
 * about their own size — the exact bug the normaliser exists to fix.
 *
 * Ink is measured by rasterising and reading alpha bounds rather than by parsing the bezier
 * paths. Two reasons: artwork is often drawn through a clip path, so the paths describe more
 * than what is visible; and curve control points lie outside the shape they describe, so a
 * bounding box over the control points is too large. Rasterising respects both.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

/** Supersampling factor for the measurement. 4x gives quarter-unit precision. */
export const PROBE_SCALE = 4;
/** Alpha above which a pixel counts as ink, on 0-255. Ignores antialiasing fringe. */
export const INK_ALPHA = 8;

/** Rounds to three decimals, which is enough precision for a viewBox and keeps files small. */
export const r = (n) => Number(n.toFixed(3));

/**
 * Editor cruft that carries no artwork. Inkscape and Illustrator exports ship an RDF
 * metadata block, an editor viewport element and often a comment or two. None of it renders,
 * all of it survives into a committed asset, and the RDF block in particular is the reason
 * this stripping exists rather than being tidiness: it references namespace prefixes that
 * only the source file's own root declared, so a body lifted out of one root and dropped
 * into another takes an XML parse error with it. Scaleway's export did exactly that.
 */
const EDITOR_CRUFT = [
  /<metadata\b[\s\S]*?<\/metadata>/gi,
  /<sodipodi:namedview\b[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:namedview>)/gi,
  /<!--[\s\S]*?-->/g,
  /<\?xml[\s\S]*?\?>/gi,
  // Editor bookkeeping attributes such as inkscape:connector-curvature and sodipodi:nodetypes.
  // These affect nothing at render time and are the other half of the same parse problem.
  /\s(?:inkscape|sodipodi):[\w.-]+="[^"]*"/gi,
];

/**
 * Splits an SVG into its root attributes and its body, so the body can be re-wrapped in a
 * root of our own choosing. Throws rather than guessing when there is no viewBox, because
 * every measurement below is expressed in the coordinate system it defines.
 *
 * `namespaces` carries every xmlns declaration the source root held. Re-wrapping with a
 * fixed pair of declarations silently breaks any body that uses a third prefix, so callers
 * should emit these on the root they build instead of assuming svg and xlink are enough.
 */
export function openSvg(path) {
  const text = readFileSync(path, 'utf8');
  const rootTag = text.match(/<svg\b[^>]*>/);
  if (!rootTag) throw new Error(`No root <svg> element in ${path}.`);

  const viewBox = rootTag[0].match(/viewBox="([\d.\s,-]+)"/);
  if (!viewBox) throw new Error(`The root <svg> in ${path} has no viewBox to measure against.`);

  // Validated rather than destructured straight out, because a malformed viewBox otherwise
  // fails a long way from its cause. A Scaleway lockup from vectorlogo.zone shipped
  // viewBox="0 0 0 0 750 0 200" — seven numbers. Taking the first four gave a 0x0 box and
  // the error surfaced from inside the rasteriser as "bad dimensions", which says nothing
  // about which file is wrong or why.
  const nums = viewBox[1].trim().split(/[\s,]+/).map(Number);
  if (nums.length !== 4 || nums.some((n) => !Number.isFinite(n))) {
    throw new Error(
      `The viewBox in ${path} is malformed: "${viewBox[1]}" parses to ${nums.length} number(s), expected 4.`,
    );
  }
  const [x, y, w, h] = nums;
  if (!(w > 0) || !(h > 0)) {
    throw new Error(`The viewBox in ${path} has a zero or negative extent: "${viewBox[1]}".`);
  }

  const namespaces = [...rootTag[0].matchAll(/\sxmlns(?::[\w.-]+)?="[^"]*"/g)].map((m) => m[0].trim());

  let body = text.slice(rootTag.index + rootTag[0].length).replace(/<\/svg>\s*$/, '');
  for (const pattern of EDITOR_CRUFT) body = body.replace(pattern, '');

  return { text, body, viewBox: viewBox[1], vb: { x, y, w, h }, namespaces };
}

/**
 * Rasterises the artwork and returns the bounding box of its ink, in the viewBox's own user
 * units. Bounds are rounded outward so no antialiased edge is clipped.
 *
 * Takes the whole object openSvg returned rather than its pieces, because the probe root has
 * to repeat the source's namespace declarations. A probe that declares only svg and xlink
 * fails outright on an editor export whose body uses a third prefix — not by rendering it
 * wrong, but with an XML parse error from the rasteriser.
 */
export async function measureInk({ body, viewBox, vb, namespaces = [] }, label) {
  const ns = new Set(['xmlns="http://www.w3.org/2000/svg"', 'xmlns:xlink="http://www.w3.org/1999/xlink"', ...namespaces]);
  const probeSvg =
    `<svg ${[...ns].join(' ')} ` +
    `viewBox="${viewBox}" width="${Math.round(vb.w * PROBE_SCALE)}" height="${Math.round(vb.h * PROBE_SCALE)}">${body}</svg>`;

  const probe = await sharp(Buffer.from(probeSvg))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
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
  if (maxX < 0) {
    throw new Error(`The ${label} measured as empty. Did a fill get stripped that should not have been?`);
  }

  const X0 = vb.x + Math.floor(minX / PROBE_SCALE);
  const Y0 = vb.y + Math.floor(minY / PROBE_SCALE);
  const X1 = vb.x + Math.ceil((maxX + 1) / PROBE_SCALE);
  const Y1 = vb.y + Math.ceil((maxY + 1) / PROBE_SCALE);
  return { X0, Y0, W: X1 - X0, H: Y1 - Y0 };
}
