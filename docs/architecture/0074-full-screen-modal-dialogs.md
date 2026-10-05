# ADR-0074: Full-screen modal dialogs — one pattern, the PAD editor first

**Status:** Accepted
**Date:** 2026-10-05
**Slice:** cross-cutting
**Refines:** —
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
   on Escape; the dialog below ignores Escape while one is open. It decides when the key is
   pressed, from the current state (a ref set on every render) — not by removing its listener in
   an effect, which runs only after the next paint and so missed a key pressed right after the
   dialog on top opened (found in CI 2026-10-05, reproduced locally in 1 of 15 runs).
4. **Closing:** only by the close button and Escape — no swipe-away, no tap outside (there is no
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

## Exceptions

| Exception                                                                          | Reason                                                | Reference                                  | Review     |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------ | ---------- |
| Icon list and What's new: no inert page, no focus return; What's new has no Escape | built before this ADR; aligned in a step of their own | BACKLOG "Full-screen dialogs per ADR-0074" | 2026-10-31 |

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
  `v3/src/styles/tokens.css` (`sb-pad-editor`, `sb-overlay-header`),
  `v3/tests/e2e/pad-editor-fullscreen.spec.ts`, `v3/tests/unit/inertOutside.test.ts`
- **ADRs:** ADR-0054 (test locators — the new spec finds the editor by role and name)
