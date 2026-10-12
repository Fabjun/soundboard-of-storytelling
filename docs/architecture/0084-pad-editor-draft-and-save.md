# ADR-0084: PAD editor — a draft until SAVE, the discard question, undo and redo

**Status:** Accepted
**Date:** 2026-10-12
**Slice:** cross-cutting
**Refines:** ADR-0074
**Category:** UI architecture

## Context

The PAD editor saved every change on its own after 500 ms (ADR-0030, which this ADR supersedes;
`v3/src/lib/debouncedSave.ts`), and an unsaved-changes guard was rejected in the V1/V2 inventory
because nothing was ever unsaved. On
2026-10-11 the product owner decided otherwise: changes are saved with an explicit SAVE button;
closing the editor without saving warns that changes are not saved and must be confirmed or
canceled; and the editor gets undo and redo for whatever step came last.

The PAD editor is a full-screen modal dialog (ADR-0074) — the case the platform guidelines cover:
Material's full-screen dialogs carry a confirming action and, when the person made changes, ask
before discarding them ([Material — Dialogs](https://m1.material.io/components/dialogs.html));
Apple's guidance offers the explicit choices "discard" and "keep editing" when an edit is
canceled ([Apple HIG — Action sheets](https://developer.apple.com/design/human-interface-guidelines/action-sheets)).

## Decision

1. **A draft until SAVE.** The pad's own fields — name, icons, type, files with their trims and
   order, repeat, combo steps, volume, fades — change a draft; SAVE writes it through
   `updateBoard`, which applies it to the board as it is then (a deck checkbox set meanwhile is
   kept). SAVE is off while the draft equals the stored pad (`samePadContent`, key order and
   `modifiedAt` aside).
2. **The board relations act at once,** as before: the deck checklist, the deck and quick-access
   keys, ★, REMOVE FROM DECK and DELETE (both with their two taps). They change the board, not the
   pad, and have their own confirmations.
3. **Closing asks when there are unsaved changes.** ✕ and Escape open a modal alert dialog
   (`role="alertdialog"`, W3C APG): "Discard changes?" with KEEP EDITING — focused, the safe answer
   — and DISCARD CHANGES. Escape on the question keeps editing. One Escape closes one dialog
   (`useEscapeKey` leaves a press another dialog handled alone).
4. **Undo and redo** (↶ / ↷ in the header, Cmd / Ctrl + Z and Shift + Cmd / Ctrl + Z outside text
   fields, which keep the browser's own undo) step through the draft (`v3/src/lib/editHistory.ts`:
   past, present, future of whole pad snapshots, at most 100 steps). Changes of one kind within
   500 ms merge into one step — the letters of a typed name, a slider's moves — as ProseMirror's
   history groups changes within its `newGroupDelay`; SAVE ends a group.
5. **The draft is kept on the device.** iOS ends background tabs and asks nothing (no
   `beforeunload`), so an unsaved draft is written to the preferences (`pad-draft:<padId>`,
   ADR-0062) once the edits pause and at once when the page is hidden; opening the pad again brings
   it back ("Unsaved changes restored"). SAVE, DISCARD CHANGES and DELETE forget it. On a desktop,
   leaving the page with unsaved changes also asks the browser's question (`beforeunload`).

## Consequences

**Positive:**

- Nothing changes on the board until the person decides; a slip is undone step by step.
- A draft survives an app switch or a closed tab on the phone.

**Negative / Trade-offs:**

- One tap more (SAVE) for every edit, and a question when closing with changes — the owner's
  choice.
- A pad created with ADD PAD exists on the board before its first SAVE; discarding its first draft
  leaves it empty (named "—").
- Two save models in the app: the PAD editor saves on SAVE, everything else at once.

## Alternatives considered

**Auto-save with undo** (the previous model plus a history): fewer taps, but the owner wants
explicit saving.

**Every board relation in the draft too:** one SAVE for everything, but the relations already
confirm themselves, and undoing them would need a board-wide history (Slice 18).

## Related

- **Files:** `v3/src/components/PadEditorPanel.tsx`, `v3/src/lib/editHistory.ts`,
  `v3/src/lib/padUtils.ts` (`samePadContent`), `v3/src/state/prefs.ts` (the kept draft),
  `v3/src/lib/escapeKey.ts`, `v3/tests/e2e/pad-editor-save.spec.ts`
- **ADRs:** ADR-0074 (full-screen modal dialogs), ADR-0062 (preferences in IndexedDB)
- **Slice 18** (undo / redo for the whole board) stays planned
