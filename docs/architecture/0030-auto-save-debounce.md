# ADR-0030: Auto-save with 500 ms debounce — no explicit save button

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Interaction

## Context

PWAs without a backend have no "the server saves on close" path. If the user closes the tab
without saving, changes are lost.

Options: an explicit save button (as in desktop software), auto-save on every change, or
debounced auto-save.

V1 had explicit saving in some areas — that led to data loss when users forgot to save. V3 is
meant to avoid that.

> *This decision was not documented explicitly as a rule; it was derived from the consistent
> code pattern (every mutation calls boardPut with a debounce) and is documented implicitly
> as a deviation in CLAUDE.md ("auto-save with 500 ms debounce, no explicit save button").*

## Decision

Every board/scene/pad mutation triggers a **500 ms debounced write** to IDB via
`boardPut(board)`. There is no explicit "Save" button in SETUP mode.

**Technical pattern:**
1. A user action changes the board state in signals
2. `useEffect`/`useSignalEffect` or an event handler calls `boardPut(board)`
3. Debounce: if further changes arrive within 500 ms, only the last write is executed

## Consequences

**Positive:**
- No data loss from forgotten saving.
- Simpler UX: no "unsaved changes" dialog when closing the tab.
- Compatible with PWA offline-first: the data in IDB is always current.

**Negative / Trade-offs:**
- Write amplification together with ADR-0010 (board as a document): every pad move writes the
  complete ~50 KB document. The debounce limits the frequency (max. 2 writes/s during
  continuous activity).
- No undo for unintended changes — unless the app implements explicit undo. Slice 3 has undo
  for scene delete as a specific case (UndoToast component).

## Alternatives considered

**Explicit save button:** familiar UX for desktop software. Unsuitable for a mobile PWA at a
gaming table: the user is mentally busy and will forget to save.

**No debounce (immediately on every change):** maximum data safety. Fast DnD moves would mean
10+ writes in 500 ms. Measurably worse performance.

## Related

- **Files:** `v3/src/db/idb.ts` (boardPut), `v3/src/screens/BoardScreen.tsx`
- **ADRs:** ADR-0010 (board as JSON document — write amplification), ADR-0014 (IDB persistence)
- **Source documents:** `CLAUDE.md §Deviations from plan`
