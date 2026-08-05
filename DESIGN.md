# CanaryOne design system

How this site is built, and the rules that keep it coherent. The colour palette itself is in
[`README.md` § Brand palette](./README.md#brand-palette-source-of-truth), which is canonical
for every CanaryOne repo — this document covers everything else, which is local to the web
site, plus the rules governing how the palette gets used.

Everything lives in one file, [`src/styles/global.css`](./src/styles/global.css). Hand-written
CSS with custom properties, no Tailwind, no CSS-in-JS, no component library.

## The one rule

**Nothing outside the `:root` token block should contain a literal length, radius, shadow,
duration, font size or colour.** If a use site needs a value the scale does not have, the
scale is wrong — widen it in `:root` rather than writing a one-off.

This exists because the file previously carried 15 distinct border radii, 9 bespoke
box-shadows, 24 font sizes, 30 spacing values and 9 content measures, none of them named.
The result looked fine at a glance and visibly noisy under inspection.

The documented exceptions, all deliberate:

| Exception | Why |
|---|---|
| `border-radius: 50%` on the traffic-light dots | On a square element it equals `--radius-full`, but 50% says "circle" where 9999px says "pill that happens to be square". |
| Six `clamp()` values carrying fluid section rhythm | These are intentional viewport-responsive values, not stray literals. |
| `margin: -1px` in `.sr-only` | Part of the visually-hidden clip idiom. |
| `0.01ms` in the reduced-motion block | A conventional near-zero, not a duration. |
| `font-size: 0.88em` on inline code | Relative to its parent on purpose, so a code chip scales with whatever text surrounds it. |
| `INK` in `prices.astro` | Chart.js takes colour strings and cannot read CSS variables. Each value carries a comment naming the token it mirrors, and they must be kept in step by hand. |

## Scales

Both the spacing and type scales were **derived from what the file already used**, not
imposed. That matters: an imposed type scale omitted `14px`, which was the second most common
size in the file, and would have silently absorbed nine use sites into `13px`.

**Spacing** is a 4px grid from `--space-0-5` (2px) to `--space-24` (96px). The old values sat
on a 2px rhythm, so snapping to 4px moved about half the use sites by 2px — imperceptible per
site, and it is what makes the values nameable. `--space-0-5` exists because inline elements
like code chips and badge padding need an optical adjustment that is not layout rhythm.

**Radii** collapse to five: `sm` 4px for inline code and badges, `md` 8px for buttons and
controls and chips, `lg` 12px for cards and panels and tables, `xl` 16px for framed
screenshots and terminal windows, `full` for stadium shapes.

**Elevation** is three levels plus two special cases. `--shadow-sm` is a card at rest,
`--shadow-md` is a card hovered, `--shadow-lg` is a large frame. `--shadow-cta` is the yellow
CTA glow and `--shadow-dark` carries the inset white hairline that reads as a lit top edge on
near-black panels. Shadow rgba is always neutral black; a coloured rgba tints the shadow,
which is README brand rule 3.

**Type has two tracks**, because that is what this site is. Monospace marks anything that is a
fact, a path, a number or a label. Sans marks prose. The 1px gap between `--text-sm` (14px,
mono) and `--text-base` (15px, sans) is the seam between those tracks rather than a scale
step — nothing should ever need both.

Body is `--text-md` at 17px. Ledes are `--text-lg` at 19px. Four fluid display sizes cover
everything larger, and `--display-lg` deliberately serves both the home page's section `h2`
and every subpage `h1`, so an inner page's title carries the same weight as a section heading
instead of its own arbitrary size.

**Never fight a clamp with a fixed override in a media query.** The display sizes are fluid
and their minimums *are* the mobile sizes. Overriding them at a breakpoint is how the file
ended up with six display sizes.

**Weights**: display and page headings are `--weight-medium`, UI and card titles and table
heads are `--weight-semibold`, and `--weight-bold` is reserved for the hub-and-spoke centre,
which reads as a mark rather than as text.

## Where yellow is allowed

Canary yellow only works on dark. `--accent-deep` on `--bg` measures **1.87:1**, which is the
same number that disqualifies it as a focus ring.

**On a dark surface** yellow may be a foreground: the kicker, the terminal prompt, a
breadcrumb hover, the focus ring, the fading band hairlines.

**On cream** yellow may only be a fill sitting behind dark text — the primary button, a
pressed toggle segment, the highlight band behind a headline, the winner row tint, the report
frame's open chip — or a 3px decorative callout rule, where the label beside it carries the
meaning and the rule is only drawing the eye.

**On cream yellow may not be text, a link underline, or a card's hover border.** Those read as
a wash that never resolves into emphasis, which is how a colour meant to be decisive ends up
looking incidental. Six hovered links were yellow before this rule existed, and they were
illegible.

`.kicker` defaults to muted and opts into yellow inside `.hero` and `.page-band`. That
direction is deliberate: a kicker added to a new cream section should not be able to come out
illegible.

## Icon-only links

GitHub and X carry no text label in either the nav or the footer, and both use the same
`.icon-only` component: square padding, `gap: 0`, a 32x32 target. The accessible name lives on
`aria-label` and `title` repeats it for a sighted reader on hover.

Do not compensate the padding with a negative margin between an adjacent pair. The padded box
is the hit target, and hit targets set the rhythm of a link row — pulling them together
collapsed the gap to 4px in the nav against 20px everywhere else.

## The header band

Every page opens on the same `--dark` surface. The nav is dark on every page and merges into
whatever sits beneath it — the full hero on the home page, a compact `.page-band` everywhere
else. Below the band each page is cream.

**Depth is the only thing that varies, and it varies by content rather than by a modifier
class.** A run report's band holds a breadcrumb, a title and a one-line summary, so it is
naturally shallower than `/prices`, which holds a title and a three-line lede.

Giving subpages their own non-dark header colour was considered and rejected: two header
surfaces is the inconsistency the band removes, not a fix for it.

The band's bottom edge is a fading yellow hairline, not a solid rule. A solid full-width
yellow line under every page header would be far too much yellow for a treatment that appears
site-wide.

## Focus

One treatment, using `outline` rather than `box-shadow`. An outline follows the element's own
border-radius and composites with whatever shadow the element already carries; a box-shadow
ring erases the primary button's glow and every card's elevation on focus.

The ring is `--text` on light surfaces and `--accent` on dark ones. This is a contrast
constraint: WCAG 2.2 § 1.4.11 wants 3:1 for a focus indicator, `--accent-deep` on `--bg` is
1.87:1, `--text` on `--bg` is roughly 16:1 and `--accent` on `--dark` roughly 14:1. **Do not
"fix" the light ring back to yellow.**

Nothing in the stylesheet should set `outline: none` without putting an equivalent indicator
back.

## Tables

Data density is the point of this product, so the three tables — the home page scoreboard, the
imported-markdown results tables, and the Time Machine data table — share one contract.

Header rows are tinted, uppercase mono at `--text-2xs`, separated from the body by
`--line-strong` rather than `--line` so a head reads as a head. Body cells are `--text-sm`
mono with horizontal rules only, never vertical grid lines. Numeric columns right-align.

**Every cell carries `font-variant-numeric: tabular-nums`.** Proportional digits make a column
of prices visibly ragged, which is the one thing a cost table must not be.

Known gap: cells in the imported markdown tables still wrap where a numeric column would
rather not, so `12 of 12` can break across lines. The fix is a class on numeric columns, which
means teaching the rehype plugin in `astro.config.mjs` to detect them. Forcing `nowrap` on
every prose cell instead would blow those tables out to thousands of pixels wide, because the
same tables carry paragraph-length cells.

## Motion

Three durations: `--dur-fast` for a button press, `--dur-base` for hover and colour and
border, `--dur-slow` for lifts and frames.

**There are no looping animations.** Every transition is interaction-triggered.
`prefers-reduced-motion` unwinds the global `scroll-behavior: smooth` along with all
transitions and animations.

## Breakpoints

Four, and there should not be a fifth. Custom properties cannot be used inside a media query
condition, so these are documentation rather than something the queries reference.

| Width | What changes |
|---|---|
| 380px | The nav stacks: lockup on its own row, links beneath. |
| 640px | Type and hub sizing step down; the band gives back a third of its depth. |
| 900px | The hub and the boundary diagram go vertical. |
| 1024px | Reserved. |

## Generated assets

The lockup, both variants, the favicon and the OG card are all generated and committed. Run
`pnpm build:logo` then `pnpm build:og` when a new export lands. See README § Generated assets.

**`public/c1-logo-dark.svg` is not optional.** The light lockup normalises its wordmark to
`#0f0f10`, which is exactly `--dark`, so on the nav it would render as a yellow mark beside
nothing at all. `build-logo.mjs` emits the dark variant by swapping that fill for Canary 100
and throws if the fill it expects is missing.

Generate these, never hand-drop them. On 2026-08-03 a hand-dropped `favicon.png` silently kept
a stale yellow after the mark's colour changed.
