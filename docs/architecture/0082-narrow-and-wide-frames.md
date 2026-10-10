# ADR-0082: Narrow and wide frames — one window class, asked in one place

**Status:** Proposed
**Date:** 2026-10-10
**Slice:** Slice 13
**Refines:** ADR-0045
**Category:** UI architecture

## Context

ADR-0045 made the app one adaptive application whose frame follows the screen format (axis 1),
with the thresholds "determined empirically on real devices — not fixed yet". On 2026-10-10 the
product owner set the start value and the narrow frame (`docs/product/features/adaptive-layout.md`
L1, L2): below 600 px a dock at the bottom holds PAUSED, STOP ALL and the save status; from 600 px
the wide frame stays as it was.

Measured the same day: the stylesheets had no breakpoint at all, and three components each read
`window.innerWidth` once while rendering — `BoardTopBar` at 480 px, `PadCreationPopover` and
`PadTypeConfirmDialog` at 600 px. They disagreed, and none followed a resize or a rotation.

## Decision

1. **One boundary, 600 CSS px** (`WIDE_MIN_WIDTH` in `v3/src/state/windowClass.ts`): narrow below,
   wide from it. It is the boundary of Material 3's _compact_ and _medium_ window size classes —
   99.96 % of phones in portrait are compact
   ([Android Developers — Window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes)).
   A start value: the owner calibrates it on the phone and the tablet (ADR-0045).
2. **One place asks:** the signal `narrowWindow` follows the media query `(max-width: 599.98px)`
   through the MediaQueryList `change` event
   ([MDN — Testing media queries programmatically](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Testing_media_queries)),
   started in `v3/src/main.tsx` before the first render. The .02 px below the boundary follows
   Bootstrap, which uses it so a fractional viewport width on high-dpi devices falls on neither
   side twice ([Bootstrap — Breakpoints](https://getbootstrap.com/docs/5.3/layout/breakpoints/));
   the range syntax `(width < 600px)` needs iOS 16.4, the app supports iOS 15. Components read the signal; none compares the window size or writes a width query of
   its own — guarded by `codeGuards` ("narrow or wide is asked in one place").
3. **The frame decides where a control is rendered, not CSS hiding:** a control exists once in
   the page — `LiveControls` sits in the top bar (wide) or in the dock (narrow) — so the reading
   order, the focus order and the test locators find exactly one STOP ALL. The dock is the
   status bar's dock variant (`sb-status-bar-dock`), one bar at the bottom instead of two; it
   keeps clear of the iPhone's home indicator (`env(safe-area-inset-bottom)`, the page uses
   `viewport-fit=cover`).
4. Breakpoints are px (ADR-0081, Decision 2).

## Consequences

**Positive:**

- One value for the whole app; changing it after the device calibration is one edit.
- A rotation or a resized window switches the frame at once; the first render already has the
  right one.
- No duplicated controls: assistive technology and tests see one STOP ALL.

**Negative / Trade-offs:**

- The frame needs JavaScript to switch — acceptable, the app does not run without it.
- Styles that differ by frame are written for the rendered markup (a modifier class), not as a
  CSS media query; a stylesheet-only breakpoint would need the same value a second time.
- `BoardTopBar` and the pad creation dialogs now switch at 600 px instead of 480 px — between
  480 and 600 px they show their compact form.

## Alternatives considered

**CSS media queries only:** the standard for pure styling, but moving a control between two
places would mean rendering it twice and hiding one — two STOP ALL buttons in the page, one
invisible. Rejected for the controls; the class is read in TypeScript.

**By orientation** (`orientation: portrait`): a tablet in portrait would get the phone frame.
Rejected by the owner on 2026-10-10 in favor of the size classes.

**Container queries:** sized by the element, not the window; supported from iOS 16 only (CLAUDE.md
"Supported Platforms"). Not needed for the frame, which follows the window.

## Related

- **Files:** `v3/src/state/windowClass.ts`, `v3/src/components/LiveControls.tsx`,
  `v3/src/components/StatusBar.tsx`, `v3/src/components/BoardTopBar.tsx`,
  `v3/src/screens/BoardScreen.tsx`, `v3/tests/e2e/board-frames.spec.ts`
- **ADRs:** ADR-0045 (two-axis adaptive model), ADR-0081 (px for breakpoints)
- **Product:** `docs/product/features/adaptive-layout.md` (L1, L2)
