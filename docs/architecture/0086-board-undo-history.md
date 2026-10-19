# ADR-0086: Board undo history — every board change can be undone and redone

**Status:** Accepted
**Date:** 2026-10-19
**Slice:** Slice 18
**Refines:** ADR-0084
**Category:** UI architecture

## Context

Slice 18 brings undo and redo for edits and deletions (owner decision 2026-10-02). Until now only
two things could be taken back: a deleted deck (a toast with UNDO for 6 s, `DeckRail.tsx`) and the
steps of the PAD editor's draft (ADR-0084, `v3/src/lib/editHistory.ts`). Every other change —
a new or moved pad, a renamed or duplicated deck, a pad taken out of a deck, PAD SIZE, a saved
pad — was final.

NN/g, heuristic 3 "User control and freedom": "Users often perform actions by mistake. They need
a clearly marked "emergency exit" … Support Undo and Redo." The Redux guide on undo history notes
that undo "usually forces you to rewrite parts of your application to use a specific data mutation
pattern" — unless every change already goes through one place. Here it does: every board change is
a function of the latest board, applied by `applyBoardChange` in `v3/src/state/boardWrites.ts`,
and `codeGuards` keeps components and screens from writing boards any other way.

Owner decisions 2026-10-19 (the plan of Slice 18a): the history lasts while the app is open; the
two-tap delete stays; no undo in GAME.

## Decision

1. **One history per board, of whole boards.** Each board has the three-part history of the
   Redux guide — past, present, future — with the board as the present. It is the `History<T>` of
   `v3/src/lib/editHistory.ts` that the PAD editor's draft already uses (one implementation, its
   limit of 100 steps). A `Board` holds only content (`v3/src/types.ts`: pads, decks, PAD SIZE,
   quick access, name, theme); views, sort orders and the fold of the deck list are preferences
   elsewhere, so an undo never only switches a view. A PAD SIZE set for every board (Settings S4)
   is such a preference too and is not undone.
2. **Recorded at the one write path.** `applyBoardChange` records the new board after every
   change, so every board change — today's and every later one — is a step without code at the
   call site. Each call is one step: the writers already finish a change before they write it
   (PAD SIZE writes once when the slider is let go, a name when the field is left), so no merging
   by time is needed. A new board (`createBoard`) starts with an empty history.
3. **The store is the truth.** When the board in the store is no longer the history's present —
   a failed save showed the stored board again, a backup import replaced it, a deleted board came
   back with the same id — the history starts again from the store's board. An undo never leads
   to a board of another time line; the price is that the steps before such an event are gone
   (a failed save is rare and says NOT SAVED).
4. **Undo and redo are board writes.** They put the board of the step in place through the same
   path and save it at once (a change shows before it is saved, owner decision 2026-10-02); they
   are not recorded as new steps. A new change after an undo drops the redo steps.
5. **Only in SETUP, on the board screen.** ↶ and ↷ sit in the top bar, with the icons of the PAD
   editor's undo and redo; the keys are Cmd / Ctrl + Z to undo and Shift + Cmd / Ctrl + Z or
   Ctrl + Y to redo (Apple: "Shift-Command-Z to Redo"; Microsoft: "Ctrl+Y: Redo an action").
   The keys do nothing in a text field (it keeps its own undo) and while a modal dialog is open —
   the PAD editor's draft has its own history (ADR-0084), and the board behind is inert. GAME has
   no undo: nothing is edited there (P6, safe in live use).
6. **The shown deck stays valid.** An undo can remove the deck that is shown (undoing NEW DECK);
   the board then shows its first deck, as after a delete.
7. **Kept while the app is open.** The history lives in memory, per board, and is gone on a
   reload — as in most web apps; nothing of it is stored. The history of a deleted board is
   dropped.

## Consequences

**Positive:**

- Every board change can be taken back, also those built later, with no code at the call site.
- One history implementation for the board and the PAD editor's draft.
- Undo cannot write a stale board: it starts from the store's board, like every other write.

**Negative / Trade-offs:**

- Memory: up to 100 boards per board touched in a session. Unchanged parts are shared between
  the steps (each change copies only what it changes), so a step costs the changed decks and pads,
  not the whole document; a full copy of a large board is about 50 KB (ADR-0010).
- The undo buttons do not say what they will undo (such as "Undo delete deck"); each writer would
  need a name for its change. Left for later (BACKLOG "Undo names the change it undoes").
- Two ways back after a delete: the toast's UNDO takes back just that deletion, ↶ steps back in
  order (amendment 2026-10-19). After ↶ has put the deck back, the toast's UNDO does nothing
  (`restoreDeck` leaves a deck that is there already).
- Deleting a whole board or a library file is not covered — that needs the audio kept in memory
  or a trash (Slice 18c, its own decision).

## Alternatives considered

**Commands with an inverse each (Command pattern):** less memory per step, but every writer
needs its own undo code, and a forgotten one is a silent gap; snapshots at the one write path
cover every writer at once (Redux guide). Rejected.

**Storing the history in IndexedDB:** undo after a reload, but a second store to keep in step
with the boards and more writes per change; the owner chose the session (2026-10-19). Rejected.

**Undo instead of the two-tap delete** (A List Apart, "Never Use a Warning When you Mean Undo"):
the standard once undo exists; the owner keeps the two taps for now (2026-10-19). Revisited with
the owner now that Slice 18b is built (BACKLOG "Two-tap delete once undo exists").

## Related

- **Files:** `v3/src/state/boardHistory.ts`, `v3/src/state/boardWrites.ts`,
  `v3/src/lib/editHistory.ts`, `v3/src/components/BoardTopBar.tsx`,
  `v3/src/screens/BoardScreen.tsx`, `v3/tests/unit/boardHistory.test.ts`,
  `v3/tests/e2e/board-undo.spec.ts`, `v3/src/state/undoNotice.ts`,
  `v3/src/components/UndoToast.tsx`, `v3/src/lib/boardModel.ts` (`restoreDeck`, `restorePad`)
- **ADRs:** ADR-0084 (the PAD editor's draft history), ADR-0010 (the board as one document),
  ADR-0074 (modal dialogs)
- **Sources:** https://www.nngroup.com/articles/ten-usability-heuristics/ ·
  https://redux.js.org/usage/implementing-undo-history · https://support.apple.com/en-us/102650 ·
  https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec
  · https://alistapart.com/article/neveruseawarning ·
  https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html ·
  https://w3c.github.io/wcag/understanding/timing-adjustable

## Amendments

**2026-10-19 (3.0.252, Slice 18b) — the toast's UNDO takes back one deletion.** The plan was to
make the toast's UNDO a shortcut for ↶. An existing test showed why not: a deck deleted, another
deck renamed meanwhile, UNDO — the deck comes back and the rename stays. ↶ would undo the rename
first. So the toast keeps undoing exactly its deletion on the latest board, as Gmail's undo does
(A List Apart): `restoreDeck` for a deck, and the new `restorePad` for a pad — back in the pool,
its decks (on its cell or the next free one), the quick-access bar and the combo steps that still
exist; a key taken meanwhile stays with the pad that took it, and a step that would now close a
cycle does not take it back. One toast for both (`v3/src/state/undoNotice.ts`), shown by the board
screen: one at a time, gone after 6 s or when the board is left, in a status region that stays in
the page (WCAG 4.1.3). Its 6 s count from when it appears — the timer restarted with each new
render before. When the toast is gone, ↶ still undoes the deletion, so the time limit takes no
ability away (WCAG 2.2.1).
