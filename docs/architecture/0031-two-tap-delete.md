# ADR-0031: 2-tap delete as the standard confirm pattern

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Interaction

## Context

Delete operations (delete a pad, a library entry, a scene, a board) are destructive and hard
to undo (auto-save writes immediately, ADR-0030). An accidental tap on an iPhone with small
targets leads to data loss without confirmation.

Standard alternatives: a modal/dialog ("Are you sure?"), an undo toast, or a 2-tap confirm
directly on the delete button.

`CLAUDE.md §Permanent coding standards` and `CLAUDE.md §UI rules` state explicitly: "Every
delete button: 2-tap confirmation."

## Decision

Every delete button uses a **2-tap confirm**: the first tap shows the button's confirm state
(visually highlighted, label "CONFIRM" or with the `is-danger` state), the second tap
executes the operation. No modal, no separate dialog.

The confirm state resets automatically after ~3 seconds without a second tap (or on a tap
outside the button).

## Consequences

**Positive:**
- No accidental deletion from a single tap.
- No modal interruption (interrupts the flow less than a dialog).
- Works without a separate overlay component.
- The minimum touch target of 44 px (iOS guideline, CLAUDE.md §UI rules) is kept — also in
  the confirm state.

**Negative / Trade-offs:**
- Two taps instead of one for every delete operation. Slightly more effort for power users.
- Stateful: the confirm state has to be held in the component (`useState` or similar). No
  global state needed.

## Alternatives considered

**Modal/dialog:** standard in desktop apps. On mobile with a small screen a modal is more of a
visual interruption than necessary.

**Undo toast:** delete immediately, then show a 5 s undo option. More elegant UX, but more
technical effort (IDB rollback). Slice 3 uses the undo toast specifically for scene delete
(where data loss can be especially large). Not chosen as the standard pattern.

## Related

- **Files:** `v3/src/components/AudioRow.tsx` (2-tap delete for the library), `v3/src/components/SceneRail.tsx`, `v3/src/screens/BoardListScreen.tsx`
- **ADRs:** ADR-0030 (auto-save makes undo hard without an explicit pattern)
- **Source documents:** `CLAUDE.md §Permanent coding standards`, `CLAUDE.md §UI rules`
