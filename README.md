# canaryone-web

Marketing site for [canaryone](https://github.com/rupulsafaya/canaryone) — served at
[canaryone.ai](https://canaryone.ai). Also the **canonical source for the
CanaryOne brand palette** — other repos (canaryone, canaryone-cloud, canaryone-demo)
should inherit their colors from here rather than reinvent them.

Astro, no Tailwind, no analytics, no web fonts. A home page plus the run reports at
`/runs`. See [`SPEC.md`](./SPEC.md) for the decision record, and note that SPEC.md's
"single page, scroll only" and "≤3 viewport heights" rules were lifted when the reports
section was added — everything else in its non-goals list still stands.

## Run reports


The reports at [`/runs`](https://canaryone.ai/runs) are written in the **fantastic-dollop**
repository, under `outreach/results/`. That directory is the source of truth. This
repository holds a published copy under [`src/content/runs/`](./src/content/runs/).

**Why a copy and not a reference, so nobody re-litigates it.** Vercel builds only from
`canaryone-web` and has no access to a sibling checkout. A relative path in
`astro.config.mjs`, a symlink, or a git submodule all work locally and all fail the
moment Vercel runs the build. So the content is committed here, and a script copies it
across when you ask it to:

```bash
pnpm import:runs                 # copy, and report what changed
pnpm import:runs -- --dry-run    # report only, write nothing
pnpm import:runs -- --prune      # also delete copies whose source file is gone
```

The script is idempotent: re-running it with no upstream change writes nothing and
reports every file unchanged. It picks up any `outreach/results/YYYY-MM-DD-*.md`, and
excludes `README.md` and `TEMPLATE.md`, which are the index and the blank template rather
than runs. Point it somewhere else with `RESULTS_DIR=/path/to/results pnpm import:runs`.

**Never edit `src/content/runs/` by hand.** The next import overwrites it. Fix the source
file in fantastic-dollop and re-import.

What the import changes, and nothing else:

| Change | Why |
|---|---|
| Prepends frontmatter | Derived from the file's own H1 and Identity table, plus the "What it is" and "Status" cells of the results index. The schema is in [`src/content.config.ts`](./src/content.config.ts). |
| Rewrites links between run files to `/runs/<slug>` | A relative `.md` link is a dead link on the web. |
| Turns links pointing outside `results/` into plain text | Those targets are working documents in fantastic-dollop that a reader cannot open. |
| Replaces absolute home paths with `<repo>` | The same redaction `results/README.md` asks for on screenshots. |

Everything else is copied verbatim, including every "what this run does not support"
caveat. Those caveats are the reason a run page is citable rather than marketing, so the
build prints a warning if a run arrives without one.

**Every number on this site has to trace to `outreach/numbers.md` in fantastic-dollop, or
to an artefact published here.** The scoreboard on the home page is run `e860167a`, whose
full report ships at [`public/demo-report/`](./public/demo-report/) so a reader can check
it.

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
--muted:         #6b7280;   /* secondary text */
--line:          #e5e7eb;   /* hairline borders */
--line-strong:   #d1d5db;   /* stronger separators */

/* Semantic */
--good:          #16a34a;   /* pass green */
--warn:          #ca8a04;   /* narrated / warning */
```

**Rules for downstream repos:**

1. **`#FDE047` is the identity.** Use it decisively — wordmark accents, primary CTAs,
   winner rows, hub-and-spoke centers — not sprinkled as tiny underlines. If you find
   yourself thinking "the yellow is too much," it isn't.
2. **No blue-slate on dark surfaces.** Body text at `#0f172a` is fine because it's
   small type. Large dark panels/cards/backgrounds must use `#0f0f10` (neutral
   near-black), NOT `slate-900`. See [`SPEC.md`](./SPEC.md) for the history —
   Tailwind's `slate-900` reads blue under a yellow radial gradient.
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

Both scripts are run by hand and their output is committed. Neither runs during
`pnpm build`, so a Vercel deploy never depends on them.

```bash
pnpm build:logo       # brand/*.svg -> public/c1-logo.svg, favicon.svg, favicon.png
pnpm build:og         # public/c1-logo.svg + receipt -> public/og.png
pnpm redact:report    # prepare public/demo-report/ for publication
```

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

**The favicon.** `public/favicon.svg`, `public/favicon.png` and
`public/apple-touch-icon.png` are all generated by `build-logo.mjs` from the mark-only
export at [`brand/c1-logo-mark.svg`](./brand/c1-logo-mark.svg). The layout links the SVG
first, the 64×64 PNG as a fallback, and the 180×180 icon for iOS.

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

## Deploy

Vercel, static. Committed to `main` deploys to production. See
[`SPEC.md`](./SPEC.md) for domain + DNS notes.

## License

MIT.
