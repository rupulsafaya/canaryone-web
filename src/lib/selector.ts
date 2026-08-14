/**
 * The pairing rules for the site's no-JavaScript selector.
 *
 * WHAT IT IS. A group of hidden radios, a rail of labels styled as chips, and one card per
 * option with all but one hidden. The radios are the state, CSS does the switching, and no
 * script is involved: every variant is rendered at build time and one is displayed. `/market`
 * chooses a model with it and `/evals` chooses a report view.
 *
 * WHY IT IS GENERATED. The rules have to name each option by index — radio N shows card N and
 * lights chip N — so there is one rule set per option and the count is data. Astro's scoped
 * styles cannot carry a generated block, which is why the caller injects the result through
 * `<style is:global set:html={...}>`; every selector here sits under `.sel`, which exists only
 * on pages using the component.
 *
 * WHY IT IS HERE. Both pages had their own copy of this, with the same two traps recorded in
 * both sets of comments. Consolidated 2026-08-13.
 *
 * TWO THINGS THAT LOOK LIKE STYLE AND ARE NOT:
 *
 *   The pairing wins on SPECIFICITY, never on source order. `.sel-cards > *` hides every card
 *   from the page's own scoped block, and Astro emits scoped and global styles in an order that
 *   differed between dev and build. A rule that was correct in one and wrong in the other cost
 *   real time on /market once already.
 *
 *   `inner` exists because the cards are not always a sibling of the radios. On /evals they sit
 *   inside the panel that carries the run's identity bar, so the chain is sibling-to-panel and
 *   then down into it. Passing the descendant step keeps one generator for both shapes.
 */

export interface SelectorCssOptions {
  /**
   * A descendant step between the radio's sibling and the cards, with a leading space — for
   * example `' .panel'` when the cards are nested inside the section's object. Empty when the
   * cards are a direct sibling of the radios.
   */
  inner?: string;
  /** The radio group's `name`, only used to scope nothing — kept for callers that want to log it. */
  name?: string;
}

/**
 * @param count how many options are rendered
 * @returns a CSS string to inject globally
 */
export const selectorCss = (count: number, opts: SelectorCssOptions = {}): string => {
  const inner = opts.inner ?? '';
  return Array.from({ length: count }, (_v, i) => {
    const n = i + 1;
    return `
.sel > input:nth-of-type(${n}):checked ~${inner} .sel-cards > :nth-child(${n}) {
  display: block;
}
.sel > input:nth-of-type(${n}):checked ~ .sel-rail > label:nth-child(${n}) {
  display: inline-block;
  background: var(--accent);
  border-color: var(--accent-deep);
  color: var(--dark);
  font-weight: var(--weight-semibold);
}
.sel > input:nth-of-type(${n}):focus-visible ~ .sel-rail > label:nth-child(${n}) {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: var(--focus-offset);
}`;
  }).join('');
};
