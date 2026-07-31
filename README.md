# canaryone-web

Marketing site for [canaryone](https://github.com/rupulsafaya/canaryone) — served at
[canaryone.ai](https://canaryone.ai). Also the **canonical source for the
CanaryOne brand palette** — other repos (canaryone, canaryone-cloud, canaryone-demo)
should inherit their colors from here rather than reinvent them.

Astro, no Tailwind, no analytics, no web fonts, one page. See
[`SPEC.md`](./SPEC.md) for the decision record.

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
- `#FACC15` Canary 400 — alternate; not currently used
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

The OG image (`public/og.png`) is generated from `public/receipt-kimi-k3.png`
via `scripts/build-og.mjs`. Re-run if you change the receipt.

## Deploy

Vercel, static. Committed to `main` deploys to production. See
[`SPEC.md`](./SPEC.md) for domain + DNS notes.

## License

MIT.
