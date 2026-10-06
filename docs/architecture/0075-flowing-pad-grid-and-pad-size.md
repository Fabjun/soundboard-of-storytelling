# ADR-0075: The pad grid flows into the window's columns; each deck has a pad size

**Status:** Accepted
**Date:** 2026-10-06
**Slice:** cross-cutting
**Refines:** ADR-0048
**Category:** UI architecture

## Context

Each deck stores a grid (`gridConfig.cols × rows`, ADR-0048) and each placement a cell
(`position.col`, `position.row`). Until 3.0.176 the board showed exactly that grid: always 4 pads
per row, shrunk on a narrow window and capped at 88px on a wide one — a laptop showed four small
pads and empty space beside them. The owner decided on 2026-10-06: the number of pads per row
follows the screen, no horizontal scrolling, vertical scrolling is fine; and, as in V1, a PAD
SIZE slider in the side menu sets how large the pads are (`docs/backlog.md`, "Configurable pad
display at full V1 scope"). The automatic shrinking of the pads to fit the window's height
(3.0.175) goes: the slider sets the size instead.

## Decision

1. **Places in reading order.** A placement's cell is read as its place in reading order —
   `row × cols + col` with the deck's stored `cols` — the meaning the drag-and-drop code already
   used (`posToIndex` in `v3/src/lib/padDnd.ts`). The stored data does not change; empty places
   the user left stay gaps.
2. **Columns from the window.** The grid takes the fewest columns that keep every pad at or
   below the deck's pad size: `cols = ceil((width + gap) / (padSize + gap))`
   (`padColumns` in `v3/src/lib/padSize.ts`); the columns share the width, so a row always fills
   it. `PadGrid` measures its width (ResizeObserver) and sets `--grid-cols`; cells are squares in
   DOM order (reading order), rows are as tall as their pads, the grid scrolls downwards. The All
   pads view follows the same rule with the default size.
3. **Pad size per deck.** `gridConfig.padSize` is a number in px — 44 to 160 in steps of 4,
   88 by default (`PAD_SIZE`). It was a word (`'md'`, `'1fr'`) that nothing used; the word becomes
   the default — in the database (version 9, converted in place, `migrateBoard`) and in a backup
   import (`parseBoard`).
4. **The slider.** PAD SIZE sits at the top of the deck rail, only in SETUP and only with a deck
   open (V1 had it in the side menu). The grid follows it live while it moves; the size is stored
   once, when the move ends (`change` event — no delayed write needed). The slider is the one
   `SliderRow` component the PAD editor uses too.

The column rule is the CSS `auto-fill` idea (as many tracks as fit), computed in JavaScript so
that the tracks can also grow to fill the row and the count is known to the app — MDN,
`repeat()` with `auto-fill` — https://developer.mozilla.org/en-US/docs/Web/CSS/repeat (not
reachable from the cloud container on 2026-10-06; to be read again in the original).

## Consequences

**Positive:**

- A phone shows 4 pads per row (390px window, list folded: about 74px each), a laptop about 13 of
  about 86px — the whole width is used, nothing is cut off.
- The order of the pads is the same on every screen.
- Each deck can have its own size: a deck of a few key pads large, a full deck small.

**Negative / Trade-offs:**

- A pad's place on screen depends on the window: "third column, second row" means something
  else on a phone and on a laptop. Places count in reading order; a future feature that relies on
  a visual position (e.g. a numpad layout that mirrors the grid) must use the reading order.
- The deck's stored `cols` now only defines the reading order and the number of places
  (`cols × rows`), not what is seen.
- With a large pad size on a very narrow window the pads are smaller than the size (the width
  wins); below 44px of window per column they get smaller than a finger.

## Alternatives considered

**Pure CSS `repeat(auto-fill, minmax(size, 1fr))`:** no JavaScript, but pads may grow up to
almost twice the size before another column fits, and the app does not know the column count.
Rejected for the rule "never larger than the pad size".

**Keep the stored grid, only scale the pads (3.0.174–3.0.176):** rejected by the owner — a wide
screen showed four small pads.

**Plus / minus buttons and Ctrl + mouse wheel for zoom** (`docs/design/components/pad.md`,
decided 2026-09-28): replaced by the slider (owner decision 2026-10-06); the buttons and the
mouse wheel are parked.

## Related

- **Files:** `v3/src/lib/padSize.ts`, `v3/src/components/PadGrid.tsx`,
  `v3/src/components/DeckRail.tsx`, `v3/src/components/SliderRow.tsx`,
  `v3/src/screens/BoardScreen.tsx`, `v3/src/lib/boardModel.ts`, `v3/src/lib/padFiles.ts`,
  `v3/src/db/idb.ts`, `v3/tests/e2e/pad-size.spec.ts`, `v3/tests/unit/padSize.test.ts`
- **ADRs:** ADR-0048 (decks, placements, `gridConfig`)
