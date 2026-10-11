/**
 * @fileoverview deckDnd — where a dragged deck lands in the deck list (Slice 13g)
 *
 * docs/product/features/adaptive-layout.md#decided L6 (owner decision 2026-10-11): decks are
 * reordered by drag & drop and by ▲ / ▼. The drag runs on Pointer Events from the deck's drag
 * handle (never HTML5 drag & drop — CLAUDE.md "Supported Platforms"); this module only decides the
 * place, so it can be tested without a browser. The component (DeckRail) feeds it the vertical
 * centers of the deck rows and the pointer's height.
 */

/** Minimum pointer movement (px) before a press on the handle becomes a drag — as for pads. */
export const DECK_DRAG_THRESHOLD = 8;

/**
 * Returns the index the dragged deck takes when it is dropped at height `y`, given the vertical
 * centers of every deck row in rail order (`centers`, the dragged one included at `from`). The
 * deck goes before the first other row whose center lies below `y`; the result is the index for
 * `moveDeck` (src/lib/boardModel.ts) — `from` itself when it would stay where it is.
 */
export function deckDropIndex(y: number, centers: readonly number[], from: number): number {
  let index = 0;
  centers.forEach((center, i) => {
    if (i !== from && center < y) index++;
  });
  return index;
}
