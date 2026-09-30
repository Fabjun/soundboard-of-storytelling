# ADR-0007: Pointer events for DnD — HTML5 drag and drop forbidden

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Platform constraints

## Context

Slice 3 (board + scene + pad CRUD) required two DnD interactions:

- pad-to-pad drag: SWAP / INSERT within the grid
- library-to-grid drag: drag an audio file from the library onto a pad slot

Path B (library → grid, "drag from library") was first implemented with HTML5 DnD
(`draggable`, `ondragstart`, `ondragover`, `ondrop`). That worked without problems in desktop
Brave.

**On the iPhone (Brave, iOS) it was silently broken:** iOS WebKit does not support HTML5 DnD
events on touch devices. No error, no event — the drag simply never started. The bug was only
found during manual testing on the primary target (after the desktop test).

After the fix (porting to pointer events), the platform constraint decision (ADR-0006) was
written down as a formal rule: HTML5 DnD is forbidden.

## Decision

**Every DnD interaction in V3 uses pointer events exclusively.**

`draggable`, `ondragstart`, `ondragover`, `ondragenter`, `ondragleave`, `ondrop` are forbidden
in new V3 code.

**Canonical reference implementations:**

- `v3/src/lib/padDnd.ts` — pad to pad (SWAP + INSERT, ghost, cellRef registry)
- `v3/src/lib/libDnd.ts` — library to grid (drop only, ghost, elementFromPoint)

**Pattern (from both implementations):**

1. `element.setPointerCapture(e.pointerId)` on `pointerdown`
2. `pointermove` on `document` for tracking
3. `pointerup` on `document` for drop detection
4. Ghost: `position: fixed; pointer-events: none` — pointer events pass through the ghost (prerequisite for `elementFromPoint` in libDnd.ts; padDnd.ts relies on the same property but uses the cellRef registry instead of `elementFromPoint` for drop-zone detection)
5. `touch-action: none` on draggable elements — prevents scroll capture
6. 8 px threshold before the drag starts (prevents accidental drags)
7. Isolated module state per DnD type — no shared state between modules

## Consequences

**Positive:**

- One DnD implementation works on iOS, Android and desktop.
- Pointer events are guaranteed on all supported platforms (ADR-0006).

**Negative / Trade-offs:**

- More code than HTML5 DnD: pointer events require manual ghost element handling, manual
  drop-zone detection via `elementFromPoint`, manual capture release. HTML5 DnD does this
  implicitly (but only on desktop).
- Playwright tests for pointer-events drag are more effort (tests 9, 14, 20, 21 are currently
  marked `test.skip` until the drag sequence is stable in Playwright).

## Alternatives considered

**HTML5 DnD with a pointer events fallback:** would be double implementation effort. No
advantage over pure pointer events, which run on all platforms.

**react-dnd / dnd-kit:** libraries with pointer events support. Not used because V3 needs no
external DnD library — the two isolated modules are lean enough and fully controllable.

## Related

- **Files:** `v3/src/lib/padDnd.ts`, `v3/src/lib/libDnd.ts`
- **ADRs:** ADR-0006 (platform targets), ADR-0029 (SWAP + INSERT semantics)
- **Source documents:** `CLAUDE.md §Supported Platforms`, `docs/design/design-notes.md §Slice 3 / Lessons — DnD pattern`
- **Commits:** `86502b2` — fix(slice-3): replace HTML5 DnD with pointer events in path B
