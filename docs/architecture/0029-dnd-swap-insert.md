# ADR-0029: SWAP + INSERT as dual DnD semantics

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Interaction

## Context

Pad-to-pad drag in the grid (SETUP mode) needs defined semantics: what happens when pad A is
dragged onto slot B?

Options:
1. **SWAP:** A takes B's position, B takes A's position
2. **MOVE:** A takes B's position, B and all other pads stay where they are (but B's slot is
   now empty — unless B is moved)
3. **INSERT:** A takes a position between other pads (as in a list), the other pads move aside

An app with a fixed grid (4×4) needs different semantics than a linear list. SWAP is more
intuitive for a grid; INSERT makes sense for reorder operations (e.g. moving pad #1 between
pad #3 and #4).

## Decision

**Both semantics are supported**, controlled by the drop-zone position:

- **SWAP:** drop directly on an occupied slot → the positions are swapped
- **INSERT:** drop on a drop zone between slots → the pads move aside

Detection runs through a `cellRef` registry in `padDnd.ts`: every grid cell registers itself
with its `{col, row}`. On `pointerup`, `document.elementFromPoint` determines the drop target,
which is checked against the registry.

## Consequences

**Positive:**
- Both common reorder operations are supported naturally.
- Clear visual feedback: SWAP shows a direct position exchange, INSERT shows an "insertion
  gap".

**Negative / Trade-offs:**
- A more complex implementation than SWAP alone. `padDnd.ts` is the most elaborate single
  module in Slice 3.
- Playwright tests for this interaction are marked `test.skip` (tests 20, 21) — pointer
  events drag in Playwright is hard to stabilise.

## Alternatives considered

**SWAP only:** simpler. Drawback: reordering in larger grids needs several consecutive SWAPs.

**INSERT only:** natural for linear lists; less intuitive for 2D grids.

## Related

- **Files:** `v3/src/lib/padDnd.ts` (SWAP + INSERT implementation), `v3/tests/unit/padDnd.test.ts` (applySwap, applyInsert pure function tests)
- **ADRs:** ADR-0007 (pointer events for DnD), ADR-0008 (pad position as {col,row})
- **Source documents:** `docs/design/design-notes.md §Slice 3 / Lessons — DnD pattern`, `docs/development/testing.md §Known pitfalls §5`
- **Commits:** `9eeceeb` — feat(slice-3)
