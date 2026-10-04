# ADR-0071: Virtualized icon grids with `@tanstack/virtual-core`

**Status:** Proposed
**Date:** 2026-10-04
**Slice:** Slice 15
**Refines:** ADR-0070
**Category:** UI architecture

## Context

The icon picker (ADR-0070) drew every icon of a search result or an open category as a button. A
one-letter search matches about 2,000 of the 2,151 icons; to spare the iPhone's memory, the first
version drew only the first 240 results and asked for a narrower search. In the review of the
Slice 15d pull request (2026-10-04) the owner decided to replace that limit with a virtualized
list that draws only the visible rows, using `@tanstack/virtual-core`.

## Decision

1. **Library:** `@tanstack/virtual-core` (MIT), the framework-agnostic core of TanStack Virtual —
   headless, so the markup and the `sb-*` classes stay the project's own
   ([TanStack Virtual](https://tanstack.com/virtual/latest),
   [Virtualizer API](https://tanstack.com/virtual/latest/docs/api/virtualizer)). There is no
   Preact adapter; `useVirtualRows` in `v3/src/components/IconPicker.tsx` follows the lifecycle of
   TanStack's own React adapter (new options on every render, mounted once, updated after every
   render, drawn again when the visible range changes).
2. **One virtualizer per grid** (the search results, or each open category), all on the overlay's
   scroll area; each is offset by where its grid starts (`scrollMargin`), as the Virtualizer API
   provides for lists inside a larger scroll area. Rows are measured once drawn (names under the
   icons can wrap).
3. **The CSS stays the source of the layout:** the column count is read from the grid's computed
   `grid-template-columns` (an auto-fill grid lists one size per column), the row gap from its
   computed `row-gap`; each drawn row inherits the grid's columns. `v3/src/lib/iconGrid.ts` holds
   the pure parts (rows, columns, keys) with unit tests.
4. **Accessibility:** each grid is `role="grid"` with `aria-rowcount` and `aria-colcount`, each
   drawn row `role="row"` with `aria-rowindex` — WAI-ARIA's way to describe rows that are not in
   the DOM ([MDN aria-rowcount](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowcount)).
   The keys follow the APG layout grid (arrows, Home, End —
   [APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)); a key that moves to a row not
   drawn yet scrolls it into view and focuses it once drawn, and keys typed before that move on
   from it. One Tab stop per grid: the focused icon, or the first drawn one while the focused row
   is scrolled away.

## Consequences

**Positive:**

- Every match is reachable; the picker draws a few hundred buttons at most, whatever the search.
- The pattern can serve other long lists (e.g. the library in Slice 16).

**Negative / Trade-offs:**

- One more production dependency (listed in `third-party-licenses.txt` like every other).
- No official Preact adapter: the small adapter is the project's own code and follows the React
  adapter by hand when TanStack changes its lifecycle.
- The grid's height is set from the virtualizer, so its rows are out of flow: a parent that is a
  flex column must not shrink it (`.sb-overlay-body > *`, checked by `layout-reach.spec.ts`).

## Alternatives considered

**Keep the limit of 240 results** — rejected by the owner (matches beyond the limit could not be
reached without a narrower search).

**Own windowing code** (fixed row height, about 100 lines) — no dependency, but the scroll and
measuring edge cases (iOS scrolling, rows that change height, scrolling to an index) would be the
project's to maintain; the owner chose the maintained library.

**`react-window` / `react-virtuoso`** through `preact/compat` — ready-made React components with
their own markup; the headless core leaves the markup, the `sb-*` classes and the grid semantics
to the project and needs no React API.

## Related

- **Files:** `v3/src/components/IconPicker.tsx`, `v3/src/lib/iconGrid.ts`,
  `v3/tests/unit/iconGrid.test.ts`, `v3/tests/e2e/pad-icons.spec.ts`,
  `v3/tests/e2e/layout-reach.spec.ts`
- **ADRs:** ADR-0070 (pad icons and the picker)
- **Source documents:** [docs/backlog.md](../backlog.md) "Icon picker: virtualized result grid"
- **Sources:** https://tanstack.com/virtual/latest ·
  https://tanstack.com/virtual/latest/docs/api/virtualizer ·
  https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowcount ·
  https://www.w3.org/WAI/ARIA/apg/patterns/grid/
