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
| The flywheel's SVG geometry in `index.astro` — two `stroke-width`s, `stroke-dasharray: 22 1075` and `stroke-dashoffset: -1097` | These are measured off the `#fw-circuit` path with `path.getTotalLength()` and mean nothing away from it, so a token holding one of them could never be reused. The dash array and the offset have to move together when the path changes. |
| Transform nudges of 1px and 2px on hover lifts | A one-pixel optical nudge is not layout rhythm, and `global.css` already does this at three sites. If it ever wants a token it should become one `--lift` used by both files, not a spacing token pressed into service. |

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

**Elevation** is three levels plus three special cases. `--shadow-sm` is a card at rest,
`--shadow-md` is a card hovered, `--shadow-lg` is a large frame. `--shadow-cta` is the yellow
CTA glow, `--shadow-dark` carries the inset white hairline that reads as a lit top edge on
near-black panels, and `--shadow-pill-lit` is the lit state of a flywheel pill. Shadow rgba is
always neutral black unless the shadow *is* the yellow — a black shadow given a coloured rgba
comes out tinted, which is README brand rule 3.

**A `drop-shadow()` filter is a shadow and lives in the token layer too.** There are two.
`--glow-accent` trails the flywheel's travelling dot, and it stacks two shadows because a
single wide soft yellow reads as a blur rather than as light. `--glow-icon-on-dark` does the
opposite job: a tight black shadow under a third-party model mark, so a logo whose own artwork
is near-black keeps an edge against the hero panel. Those marks are other companies' assets
and cannot be recoloured, so the separation has to come from underneath them.

**Two component widths sit outside both the spacing scale and the measures**, because they cap
artwork rather than text and a `ch` value is meaningless for artwork. `--figure-max` is the
hero flywheel, whose pills collide with the diagram's edges if it fills its grid column, and
`--panel-max` is a standalone dark diagram, which reads as a schematic at that width and as an
empty band at full width.

**Type has two tracks**, because that is what this site is. Monospace marks anything that is a
fact, a path, a number or a label. Sans marks prose. The 1px gap between `--text-sm` (14px,
mono) and `--text-base` (15px, sans) is the seam between those tracks rather than a scale
step — nothing should ever need both.

Body is `--text-md` at 17px. Ledes are `--text-lg` at 19px. Three fluid display sizes cover
everything larger, and `--display-lg` deliberately serves both the home page's section `h2`
and every subpage `h1`, so an inner page's title carries the same weight as a section heading
instead of its own arbitrary size. There were four until the run reports were removed;
`--display-sm` existed only for the `h2` of their imported markdown.

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

**Low-alpha yellow gets its own tokens, and their names carry the constraint.**
`--accent-line-on-dark` at 25% is a yellow hairline and `--accent-bg-on-dark` at 4% is a yellow
wash; today only the highlighted lane in the home page's deploy diagram uses them. The
`-on-dark` suffix is a rule rather than a description — on cream the hairline fails the
contrast above and the wash is invisible — so a use site that reaches for one of these on cream
is reaching for the wrong token. Alpha belongs in `:root` here for the same reason the
semantic `--good-bg` family keeps its alpha there.

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
class.** `/evals` holds a kicker, a two-line title and a three-line lede; `/prices` holds a
title and a shorter lede and comes out shallower on its own. Nothing sets a depth directly, and
a new page should not start by doing so — give the band its content and let it size itself.

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

Data density is the point of this product, so the two tables — the route scoreboard on
`/evals` and the Time Machine data table on `/prices` — share one contract.

Header rows are tinted, uppercase mono at `--text-2xs`, separated from the body by
`--line-strong` rather than `--line` so a head reads as a head. Body cells are `--text-sm`
mono with horizontal rules only, never vertical grid lines. Numeric columns right-align.

**Every cell carries `font-variant-numeric: tabular-nums`.** Proportional digits make a column
of prices visibly ragged, which is the one thing a cost table must not be.

There were three until the run reports were removed, and the contract survives the drop to two
on purpose: it is the thing a third table should be built against rather than a shared rule
worth inlining back into two places. The one known gap went with the run reports — their
imported-markdown tables wrapped inside numeric columns, and the fix would have meant teaching
a rehype plugin to detect them. That plugin no longer exists; no markdown is rendered on this
site.

## Third-party logos

Other companies' logos appear in four places: two partner rows in the home page's TUNE section,
two deploy-target rows in its DEPLOY section, the eleven provider cards in the `/evals` hub, and
the six open-weight model marks in the hero. They are the one part of the page whose artwork we
do not control, which is why they get a pipeline rather than a rule.

**Two tokens, and they mean ink rather than box.** `--logo-h` at 26px is the bare strips on the
home page, `--logo-h-lg` at 30px is the `/evals` hub where each logo sits inside its own card and
can afford to be larger, and `--logo-icon` at 32px is the square hero marks, which are glyphs
rather than wordmarks and do not belong to the wordmark scale.

Those heights mean ink because [`scripts/build-logos.mjs`](./scripts/build-logos.mjs) crops every
logo's viewBox to its own artwork. Before that, `height: 24px` on a lobehub lockup drew between
20px and 24px of wordmark depending on how much padding the file happened to carry, and
CoreWeave's export carried 45% dead vertical padding, so it drew 11px of wordmark in a 20px row.

**Equal ink height is still not equal optical size, so the normalisation is on the body band.**
The script measures the shortest run of pixel rows holding 80% of a logo's ink — which lands on
the capitals and the x-height and ignores a lone descender — and pads each file until every band
is the same fraction of its box. Normalising total ink instead leaves a wordmark with a descender
rendering its capitals visibly smaller than one set in capitals; LangChain beside LlamaIndex was
exactly that, and it survived the cropping. All eighteen lockups now converge on a band of 0.460.

The band is a property of the artwork rather than of any render size, so **there is no table of
hand-tuned sizes to maintain.** Replace a logo file, re-run `pnpm build:logos`, and the new one is
normalised with the rest. `NUDGE` exists for artwork the measurement reads wrong and is currently
empty; an entry there should carry the reason, and a row that merely looks too big or too small is
a `--logo-h` question instead.

Marks normalise differently, on their longer side inside a square box, because there are no
letterforms to measure and a mark that is wider than it is tall should keep that proportion. This
is the same rule `build-logo.mjs` applies to the favicon.

Two rules follow from all this:

**Never put a `max-width` on a logo that has a height.** When a width clamp binds, the CSS
constraint table recomputes the height, so the clamp silently overrides it. `.dt-logo` carried
`height: 20px; max-width: 110px`, and nscale — 8.88:1 — wanted 178px of width, got clamped to
110px, and collapsed to 12.4px tall in a row of 20px logos. The row looked like a logo-sizing
problem and was a CSS specificity problem. Cropping to ink is what makes the clamp unnecessary;
do not reintroduce it to stop a wide lockup running off a row. Let the row wrap.

**Do not fade a logo to make it recede.** The partner rows sat at `opacity: 0.75`, which reads as
deliberate restraint on a solid black wordmark and as a printing fault on a two-colour mark —
LangChain and LlamaIndex looked broken rather than understated. Every logo now renders at full
opacity. If a row needs to sit back, that is a size or a spacing decision.

**Prefer a horizontal lockup to a bare mark in any row that names companies.** A row saying "we
deploy to these people" has to be readable as names, and half a row of unlabelled icons beside
half a row of wordmarks cannot be made to look like one system at any size. Scaleway, Vultr and
Lambda were bare marks and are now lockups. The hero strip is the deliberate exception: it is
decoration under a headline rather than a list, and six wordmarks there would compete with the
`h1`.

**A logo has to be legible on the surface it sits on, and the build checks it.** The script
measures each logo's alpha-weighted mean colour against its own group's background — cream for the
lockups, `--dark` for the hero marks — and fails below 1.6:1. Scaleway publishes only a
white-on-dark lockup, which measured 1.04:1 on cream; it is recoloured to `--text`, and that
recolour is only ever applied to artwork that is entirely one white, never to a logo carrying real
brand colour. Baseten's old file failed the same way from the other direction, shipping its own
green background plate so it read as a green pill among black wordmarks.

## Motion

Four durations. `--dur-fast` is a button press, `--dur-base` is hover and colour and border,
`--dur-slow` is lifts and frames, and `--dur-cycle` at 4s is one turn of the hero flywheel.

**There is exactly one looping animation on the site: the hero flywheel.** Everything else is
interaction-triggered, and that is the rule — a second loop is a design change to argue for,
not a detail to add. The site is a dense technical page and a page that moves in several places
at once reads as a template rather than as a tool. One deliberate loop in the hero, above the
fold, is the whole motion budget, and it spends it on the thing the four pillars are trying to
explain: that this is a cycle rather than a checklist.

The loop is three animations sharing one duration — the travelling dot plus four pill glows
offset by a quarter cycle each. Those offsets are `calc()` expressions off `--dur-cycle` rather
than four literal delays, so retiming the cycle cannot leave the pills lighting up out of step
with the dot.

`prefers-reduced-motion` unwinds the global `scroll-behavior: smooth` along with all transitions
and animations, and that global block is what stops the flywheel — it caps every animation on
the page at one iteration of `0.01ms`, which lands the dot at `stroke-dashoffset: 0` and every
pill unlit, exactly the frame a local `animation: none` would show. **Do not add a local
reduced-motion block for a new animation.** Two of them existed in `index.astro` and neither
did anything the global block was not already doing.

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
`pnpm build:logo` then `pnpm build:og` when a new export lands. Third-party logos are generated
too, by a separate script — see § Third-party logos below, and README § Generated assets for
every command.

**`public/favicon.ico` is not optional either.** The `<link rel="icon">` tags cover the tab,
but Safari's Favorites, browser bookmark and history lists and most link unfurlers request
`/favicon.ico` by path and ignore the markup. It 404'd until 2026-08-05, which is exactly why
the icon rendered in the tab and nowhere else. See README § Generated assets for why the
`sizes="32x32"` hint on that link has to stay.

**`public/c1-logo-dark.svg` is not optional.** The light lockup normalises its wordmark to
`#0f0f10`, which is exactly `--dark`, so on the nav it would render as a yellow mark beside
nothing at all. `build-logo.mjs` emits the dark variant by swapping that fill for Canary 100
and throws if the fill it expects is missing.

Generate these, never hand-drop them. On 2026-08-03 a hand-dropped `favicon.png` silently kept
a stale yellow after the mark's colour changed.
