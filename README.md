# canaryone-web

Marketing site for [canaryone](https://github.com/rupulsafaya/canaryone) — served at
[canaryone.ai](https://canaryone.ai). Also the **canonical source for the
CanaryOne brand palette** — other repos (canaryone, canaryone-cloud, canaryone-demo)
should inherit their colors from here rather than reinvent them.

Astro, no Tailwind, no analytics, no web fonts. Three pages:

| Path | What it is |
|---|---|
| `/` | Platform landing page — hero with animated flywheel, four pillar cards (Test / Tune / Deploy / Improve), detail sections for Tune / Deploy / Improve, early-access waitlist popup |
| `/evals` | Your Evals — full benchmark detail: provider hub, route scoreboard, local-proxy diagram, report screenshots, install command |
| `/prices` | Model Market — listed token prices for every tracked model, snapshotted nightly and plotted over time |

The homepage no longer carries the scoreboard or install terminal directly; those live at `/evals`. The early-access waitlist submits to a Supabase `waitlist` table (`ghkebzdbexoqxuzneayk`, us-east-1) using the anon key with INSERT-only RLS — no credentials are exposed to the browser.

Every page has to be listed by hand in
[`src/pages/sitemap.txt.ts`](./src/pages/sitemap.txt.ts). That file used to enumerate the run
reports from a content collection and, because nobody revisited it when the site was
repositioned, it never listed `/evals` at all — the page carrying all of the benchmark detail
went unindexed from the day it landed. Three URLs are few enough to keep by hand; add the line
when a page lands.

See [`DESIGN.md`](./DESIGN.md) for the design system: the token scales, where canary yellow
is and is not allowed, the header band, the table contract, the third-party logo pipeline and
the focus rules. Read it before changing anything visual.

## Run reports, and why they are gone

`/runs` published six benchmark reports imported from **fantastic-dollop**, under
`outreach/results/`. On 2026-08-05 the whole thing was removed: the index and detail pages, the
`runs` content collection and its six markdown files, the `RunCard` component, `src/lib/runs.ts`,
`scripts/import-runs.mjs`, and the "THE RUNS" section on `/evals` that listed the three most
recent. The markdown table plugin in `astro.config.mjs` went with them, since no markdown is
rendered on this site any more.

The reasoning is recorded here because it is a deletion rather than a refactor and the reports
were the site's evidence base. `/runs` was already dropped from the nav when the site was
repositioned onto the four pillars, leaving it reachable only from a footer link and one link at
the bottom of `/evals`. Rather than keep a section of the site that nothing pointed at, it went.
Everything is in git history, and `outreach/results/` in fantastic-dollop remains the source of
truth, so restoring it is a revert rather than a rewrite.

**What the deletion does not change: every number on this site still has to trace to
`outreach/numbers.md` in fantastic-dollop, or to an artefact published here.** The scoreboard on
`/evals` is run `e860167a`, whose full report ships at
[`public/demo-report/`](./public/demo-report/) so a reader can check it. That report is now the
only published evidence on the site, which makes it more load-bearing than it was, not less.

## Brand palette (source of truth)

Family reference: [figma.com/colors/canary](https://www.figma.com/colors/canary/) —
this is the color family CanaryOne lives in. The specific shades locked in
production are the CSS variables in [`src/styles/global.css`](./src/styles/global.css) `:root`:

```css
/* Identity — canary yellow, generously */
--accent:        #FDE047;   /* Canary 300 · primary CTA, wordmark underline, hub-center, highlight */
--accent-soft:   #fef08a;   /* Canary 200 · unused-but-reserved */
--accent-deep:   #EAB308;   /* Canary 500 · hover / interactive-active */

/* Cream body */
--bg:            #fafaf7;   /* warm off-white page bg */
--bg-tint:       #f5f2e8;   /* warm cream tint · card headers, boundary panel */
--panel:         #ffffff;   /* white card bg */

/* Neutral dark — NEVER slate/navy. See "No blue" below. */
--dark:          #0f0f10;   /* hero panel bg, install terminal bg, hub-center glyph fill */
--line-dark:     #262626;   /* borders on dark surfaces */
--text-on-dark:  #fef9c3;   /* Canary 100 · headlines/body on dark */
--muted-on-dark: #a8a29e;   /* stone-400 warm gray · secondary text on dark */

/* Text on cream */
--text:          #0f172a;   /* primary text (small type — the blue tint is imperceptible here) */
--muted:         #57534e;   /* secondary text · stone-600, warm */
--line:          #e5e7eb;   /* hairline borders */
--line-strong:   #d1d5db;   /* stronger separators */

/* Semantic — each state is a foreground plus a matching 10%-alpha fill */
--good:          #16a34a;   --good-bg:   rgba(22, 163, 74, 0.1);    /* pass */
--warn:          #ca8a04;   --warn-bg:   rgba(202, 138, 4, 0.1);    /* narrated / warning */
--danger:        #b42318;   --danger-bg: rgba(180, 35, 24, 0.1);    /* error */
--info:          #78716c;   --info-bg:   rgba(120, 113, 108, 0.1);  /* neutral · stone-500, warm */

/* Surfaces and chrome */
--dark-deep:     #0a0a0b;   /* one step below --dark, for a panel on a dark panel */
--traffic-red:   #ff5f57;   /* macOS window dots — quoting an interface, not brand colour */
--traffic-amber: #febc2e;
--traffic-green: #28c840;
```

**`--muted` changed from `#6b7280` to `#57534e` on 2026-08-05, and there is no longer a
`--muted-strong`.** The old cool grey only reached 4.32:1 on `--bg-tint`, which fails WCAG AA
for small text, so the file carried a second warm token just for tinted surfaces. The single
warm stone-600 measures 7.4:1 on `--bg` and 6.9:1 on `--bg-tint`, passes AA on both, drops a
token, and stops a cool grey sitting inside an otherwise warm palette. Downstream repos
should take the new value and delete any `--muted-strong` of their own.

**Rules for downstream repos:**

1. **`#FDE047` is the identity.** Use it decisively — wordmark accents, primary CTAs,
   winner rows, hub-and-spoke centers — not sprinkled as tiny underlines. If you find
   yourself thinking "the yellow is too much," it isn't.
2. **No blue-slate on dark surfaces.** Body text at `#0f172a` is fine because it's
   small type. Large dark panels/cards/backgrounds must use `#0f0f10` (neutral
   near-black), NOT `slate-900`. The reason, which used to live in the deleted `SPEC.md`:
   Tailwind's `slate-900` reads visibly blue under a yellow radial gradient.
3. **Shadow drops:** `rgba(0, 0, 0, X)`. Never `rgba(15, 23, 42, X)` — that slate
   rgba tints the shadow cool.
4. **Muted-on-dark:** `#a8a29e` (stone-400). Never `#94a3b8` (slate-400).
5. **Typography:** system stack only. No web fonts anywhere in the brand system.

Family navigation:
- `#FEF9C3` Canary 100 — text on dark
- `#FEF08A` Canary 200 — soft accents (currently unused)
- `#FDE047` Canary 300 — **identity**
- `#FACC15` Canary 400 — **the logo mark**, in both the lockup and the favicon
- `#EAB308` Canary 500 — hover / active

## Develop

```bash
pnpm install
pnpm dev              # http://localhost:4321
```

## Build

```bash
pnpm build            # static site to ./dist
pnpm preview          # preview the built site
```

## Generated assets

Every script here is run by hand and its output is committed. None of them run during
`pnpm build`, so a Vercel deploy never depends on them, and `sharp` and the icon library stay
devDependencies.

```bash
pnpm build:logo       # brand/*.svg -> public/c1-logo.svg, favicon.svg/.png/.ico
pnpm build:logos      # lobehub + brand/partners/ -> public/logos/ and public/logos/marks/
pnpm build:og         # public/c1-logo.svg + receipt -> public/og.png
pnpm sync:model-icons # lobehub -> public/logos/models/ (the 16px icons on /prices)
pnpm redact:report    # prepare public/demo-report/ for publication
```

`build:logo` is the CanaryOne brand mark and `build:logos` is everyone else's. The singular
name predates the plural one and the two are easy to confuse; they share the ink measurement in
[`scripts/lib/svg-ink.mjs`](./scripts/lib/svg-ink.mjs) and nothing else.

**The demo report.** `public/demo-report/index.html` is a real generated report for run
`e860167a`, and the home page cites it, so it is served as the artefact rather than
rewritten. [`scripts/redact-report.mjs`](./scripts/redact-report.mjs) makes exactly two
changes to it and discloses both in a "Published copy" row inside the report itself:

1. **Absolute home paths become `<repo>`.** The generated header prints the target
   repository's full path, including the home directory of whoever ran it, in 23 places
   including stack traces. `outreach/results/README.md` asks for this redaction on
   screenshots; a published HTML report is the same exposure with a permanent URL.
2. **"Nothing leaves your machine." is replaced** with the outbound truth: the judge
   sends each session transcript to a gateway, and `--disable-judge` turns it off.
   `outreach/numbers.md` blocks that claim family outright.

No measured value is touched, and the script fails rather than publishing if a path shape
slips past its pattern. Run it on any report freshly copied into `public/demo-report/`;
it is idempotent. **Rule 2 is a stopgap** — the real fix is in the canaryone report
template, and the rule should be deleted once the generator stops emitting the claim.

**The logo.** `public/c1-logo.svg` is the lockup used in the nav and the footer: the canary
mark plus the `CanaryOne` wordmark. It is built from the designer's export at
[`brand/c1-logo-source.svg`](./brand/c1-logo-source.svg) by
[`scripts/build-logo.mjs`](./scripts/build-logo.mjs).

The export is all-vector, so the mark and the nine wordmark glyphs are real paths and
nothing is rasterised. An earlier export faked transparency with an embedded PNG and a
luminance mask, and the build script used to reconstruct that raster; that code is gone.
What the script still does is correct what the export ships with. It crops the viewBox from
the 900×300 artboard down to the ink, which removes roughly 90 units of dead padding on
every side and makes the file's aspect ratio the lockup's aspect ratio, so CSS sizing
behaves. It normalises the wordmark fill from `#000000` to `#0f0f10`. And it deletes any
opaque white rectangles painted behind the artwork, which would render the lockup as a
white slab on the cream page and on the dark social card. The current export has none; a
previous one had two, so the removal stays in.

The current output is a 714×131 viewBox, an aspect ratio of 5.4504:1. That is where the
nav's `153×28` and the footer's `109×20` come from; the script prints both, so recompute
them if a new export changes the ratio. Run `pnpm build:logo` when an export lands, then
`pnpm build:og`.

That normalised `#0f0f10` fill is load-bearing. `build-og.mjs` recolours the wordmark for
the dark card by swapping exactly that string, in memory, without touching the file. Left
at the export's pure black, the OG card would render a black wordmark on a near-black panel
and the swap would fail silently, so `build-logo.mjs` throws if it cannot find the fill it
expects.

**The favicon.** `public/favicon.svg`, `public/favicon.png`, `public/favicon.ico` and
`public/apple-touch-icon.png` are all generated by `build-logo.mjs` from the mark-only
export at [`brand/c1-logo-mark.svg`](./brand/c1-logo-mark.svg).

**`favicon.ico` is not optional, and its `sizes` hint is load-bearing.** A
`<link rel="icon">` covers the browser tab, but several surfaces ignore the markup and
request `/favicon.ico` from the site root by path: Safari's Favorites and bookmarks,
browser history lists, and most link unfurlers. Until 2026-08-05 the file did not exist and
every one of those requests 404'd, which is why the icon showed in the tab and nowhere else.
The layout declares the `.ico` first carrying an explicit `sizes="32x32"`, and that hint is
what keeps a browser from preferring the raster over the vector for the tab itself — given a
size it can satisfy from the SVG, it takes the SVG. The 64×64 PNG stays after both as a last
resort, and the 180×180 icon serves iOS.

The `.ico` packs 16, 32 and 48px entries, each rendered from the vector at its own size
rather than resampled down from one larger bitmap. At 16px the mark is a few pixels of line
weight and a downscale of a 48px render loses it. The container is written by hand in
`packIco()` because sharp has no ICO encoder; the entries are PNG-compressed, which every
browser still in support reads.

**The mark sits on a dark rounded square, and that is deliberate.** On transparency the
canary yellow measures 1.53:1 against a white browser tab bar and is close to invisible at
the 16px browsers actually draw. On the near-black panel it measures 10.51:1. Boxing it
makes the tab icon legible in light and dark alike and echoes the hero panel. The mark
occupies 72% of the box, and the corner radius is 22%.

The `apple-touch-icon` is the same artwork but full-bleed and square, with no corner radius,
because iOS applies its own mask. A pre-rounded icon gets rounded twice and shows dark
corners inside the mask.

**Generate the favicon, never hand-drop it.** On 2026-08-03 the mark's yellow moved from
`#fac41e` to `#facc15` and the committed `favicon.png` silently kept the old colour, because
it had been dropped in by hand rather than derived. The script now compares the yellow in
the lockup export against the yellow in the mark export and warns when they disagree.

**The OG image.** `public/og.png` is 1200×630, composed from the logo, the headline, and
`src/assets/receipt-kimi-k3.png`. Re-run `pnpm build:og` if you change either input.

## Third-party logos

`public/logos/` holds a horizontal lockup for each partner, `public/logos/marks/` holds the six
open-weight model marks in the hero, and both are generated by
[`scripts/build-logos.mjs`](./scripts/build-logos.mjs) from two sources:

| Source | Covers | Notes |
|---|---|---|
| `@lobehub/icons-static-svg`, the `-text` variants | 14 partner lockups plus the 6 hero marks | A devDependency. Bump it, re-run `pnpm build:logos`, commit the output. |
| [`brand/partners/`](./brand/partners/) | CoreWeave, nscale, Scaleway, Vultr | The four brands lobehub does not ship. Hand-sourced, and **not** to be edited in place — the script rewrites `public/logos/`, so `brand/partners/` is the copy that survives. |

**Take a hand-sourced logo from the company, not from a logo aggregator.** The first Scaleway
candidate came from vectorlogo.zone carrying `viewBox="0 0 0 0 750 0 200"` — seven numbers, which
is not a viewBox. `openSvg` now validates the attribute and names the file, because taking the
first four numbers gave a 0×0 box and the failure surfaced from inside the rasteriser as "bad
dimensions", which says nothing about which file is wrong.

**Why a script rather than 18 committed files.** Every logo arrived with its own idea of how much
padding belongs inside its viewBox, and the pages set a CSS height and trusted it. The result was
a row where `height: 20px` produced anywhere from 11px to 20px of actual wordmark. See DESIGN.md
§ Third-party logos for the normalisation and the two rules it makes unnecessary.

Two build-time guards, both of which exist because the bug they catch already shipped:

1. **A contrast floor of 1.6:1**, measured per group against the surface that group sits on —
   cream for the lockups, near-black for the hero marks. Scaleway serves only a white-on-dark
   lockup from its own header, which measured 1.04:1 on cream and was invisible; it is now
   recoloured to `--text`, and the recolour is only ever applied to artwork that is entirely
   white. Vultr's blue mark and CoreWeave's are left exactly as drawn.
2. **A stale-recolour check.** A brand listed in `RECOLOUR_WHITE_TO_INK` that no longer has a
   white fill fails the build rather than leaving a rule that silently does nothing.

Adding a brand: put the lockup in `brand/partners/` or add its lobehub filename to `LOCKUPS`,
run `pnpm build:logos`, and commit `public/logos/`. The script deletes any file in the two output
directories it does not own, so a removed brand cannot leave an orphan behind.
`public/logos/models/` is left alone — that belongs to `sync:model-icons`.

## Deploy

Vercel, static. Committed to `main` deploys to production.

## License

MIT.
