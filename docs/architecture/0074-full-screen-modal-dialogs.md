# ADR-0074: Full-screen modal dialogs — one pattern, the PAD editor first

**Status:** Accepted
**Date:** 2026-10-05
**Slice:** cross-cutting
**Refines:** —
**Refined by:** ADR-0084 (the PAD editor's draft, SAVE, the discard question, undo and redo)
**Category:** UI architecture

## Context

The PAD editor was a 280px column to the right of the pad grid. On a phone it squeezed the grid to
nothing ([design-notes.md §Known limitation](../design/design-notes.md#known-limitation-setup-layout-on-narrow-viewports)).
The owner decided on 2026-10-05: tapping a pad in SETUP opens the PAD editor full screen, on
every screen size, the board's top bar included.

The app already had two full-screen overlays on the `sb-overlay` class — the icon list
(`v3/src/components/IconPicker.tsx`, `role="dialog"`, Escape closes) and What's new
(`v3/src/screens/StartScreen.tsx`) — but no written rule for how such a dialog behaves.

## Decision

A full-screen dialog of the app is built one way:

1. **Shell:** the `sb-overlay` class (fixed, the whole window, above the screen), a header with
   `sb-overlay-header` / `sb-overlay-title` and a close button with an accessible name; the body
   scrolls on its own.
2. **Modal dialog (WAI-ARIA APG, Dialog (Modal) pattern):** `role="dialog"`, `aria-modal="true"`,
   an accessible name; on open, focus moves into the dialog (to the dialog itself when the first
   field would open the phone keyboard); the page around it is inert — `inert` on every sibling up
   to the screen (`v3/src/lib/inertOutside.ts`, the same walk as react-aria's `ariaHideOutside`);
   Escape closes it; on close, focus returns to the element that opened it.
3. **Nested dialogs:** a dialog opened on top (the icon list, the type confirmation) closes first
   on Escape; the dialog below ignores Escape while one is open.
4. **Escape through one hook:** every dialog closes on Escape through `useEscapeKey(onClose,
active)` (`v3/src/lib/escapeKey.ts`). It adds its document listener in a layout effect —
   before the dialog is painted — and reads the handler and `active` at the moment the key is
   pressed. Two races were found in CI on 2026-10-05 with listeners added or removed in passive
   effects, which run only after the paint: Escape right after the icon list opened closed the
   PAD editor too, and after the first fix the icon list sometimes heard no Escape at all
   (reproduced locally in 1 of 15 runs; 0 of 40 with the hook). All four dialogs use the hook;
   `codeGuards` ("dialogs close on Escape through useEscapeKey") allows no other keydown
   listener.
5. **Closing:** only by the close button and Escape — no swipe-away, no tap outside (there is no
   outside; BACKLOG "B7 — Closing the PadEditor").

The PAD editor (`v3/src/components/PadEditorPanel.tsx`) is the first dialog built this way: the
fields in one column, centered and at most 40rem wide on a wide window (`sb-pad-editor`).

Sources: W3C WAI-ARIA Authoring Practices, Dialog (Modal) pattern —
https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ ("Windows under a modal dialog are
inert", focus returns to the element that opened the dialog, Escape closes it, Tab stays inside);
HTML `inert` attribute — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert;
Material Design 3, full-screen dialogs for mobile — https://m3.material.io/components/dialogs/guidelines.
The W3C and MDN pages could not be opened from the cloud container on 2026-10-05 (network
policy); their content was taken from search results quoting them — to be read again in the
original.

## Consequences

**Positive:**

- The PAD editor has the whole window on a phone; the grid is no longer squeezed.
- Keyboard and screen-reader users stay in the dialog; focus is not lost on close.
- One pattern for every full-screen dialog — the next one copies it.

**Negative / Trade-offs:**

- While the editor is open the grid behind is out of reach: another pad, ADD PAD or a deck is
  reached by closing the editor first (was possible beside the old column). Specs close the
  editor through `closePadEditor` (`v3/tests/e2e/helpers.ts`).
- On a wide window the grid is no longer visible next to the editor.
- `inert` needs iOS 15.5 or newer; on iOS 15.0–15.4 the attribute is ignored — the overlay still
  takes every tap, only Tab can reach the page behind.

## Alternatives considered

**Native `<dialog>` with `showModal()`:** inert page, Escape and the top layer for free (MDN
recommends it), but iOS 15.0–15.3 have no `<dialog>` (Safari 15.4 added it — release notes, not
re-checked here) and the app supports iOS 15+ (CLAUDE.md §Supported platforms). Rejected for
now; worth reconsidering when the minimum moves to iOS 15.4.

**Full screen on phones only, the column on wide windows:** keeps the grid in view on a laptop;
rejected by the owner (2026-10-05: full screen on every screen size).

**Browser Fullscreen API (`requestFullscreen`):** not available for page elements on iPhone
Safari; and the editor only needs the app window. Rejected.

## Related

- **Files:** `v3/src/components/PadEditorPanel.tsx`, `v3/src/lib/inertOutside.ts`,
  `v3/src/lib/escapeKey.ts`, `v3/src/components/IconPicker.tsx`,
  `v3/src/components/PadTypeConfirmDialog.tsx`, `v3/src/components/PadCreationPopover.tsx`,
  `v3/src/styles/tokens.css` (`sb-pad-editor`, `sb-overlay-header`),
  `v3/tests/e2e/pad-editor-fullscreen.spec.ts`, `v3/tests/unit/inertOutside.test.ts`,
  `v3/src/lib/modalDialog.ts`, `v3/tests/unit/modalDialog.test.ts`
- **ADRs:** ADR-0054 (test locators — the new spec finds the editor by role and name)

## Amendments

**2026-10-15 (3.0.248) — one hook for rule 2; every dialog aligned.** The exception review found
the open / close effect of rule 2 copied into three dialogs (PAD editor, its "Discard changes?"
question, the developer view) and missing in three more: the icon list and What's new (the
registered exception) and the pad type confirmation, which had no dialog role at all (not
registered). `useModalDialog(ref, options)` (`v3/src/lib/modalDialog.ts`) is the effect once, in a
layout effect like `useEscapeKey`: the page outside inert up to a root, the focus on the
`data-autofocus` element or the dialog itself, and on close the inert marks lifted before the
focus goes back to the opener while that is still on the page. All six use it; the type
confirmation is an alert dialog with the focus on CANCEL. `codeGuards` ("every dialog is modal
through useModalDialog") requires both hooks in every file with `role="dialog"` or
`"alertdialog"` and allows `inertOutside` only in the hook. The W3C APG page was read in the
original on 2026-10-15 and confirms rule 2 as written ("Windows under a modal dialog are inert",
"focus returns to the element that invoked the dialog", "Escape: Closes the dialog").

**2026-10-19 (3.0.249) — the icon list follows rule 2 on a touch screen; its exception is
resolved.** The icon list put the first focus in its search field (as V1), which opens the
on-screen keyboard over half the icons. Now the list itself takes the focus where a finger is the
main pointer (`pointer: coarse`, MDN `@media/pointer`), and the search field keeps it everywhere
else, where no on-screen keyboard opens. W3C APG Dialog (Modal), note 1 on initial focus: where
"focusing the first interactive element could cause the beginning of content to scroll out of
view", focus a static element at the start instead. iOS opens the keyboard on a programmatic
focus only after a user gesture (WebKit bug 195884), Android Chrome always — so the change counts
most on Android. Tested in `v3/tests/e2e/pad-icons.spec.ts` with touch on and off.
