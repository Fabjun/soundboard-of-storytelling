# ADR-0067: The browser's own touch gestures are off — the app owns touch

**Status:** Accepted
**Date:** 2026-10-03
**Slice:** cross-cutting
**Refines:** —
**Category:** Interaction

## Context

On the phone, a double tap zoomed the page and a long press selected text (owner report
2026-10-03): browser gestures that disturb a soundboard and would collide with gestures the app
may use itself later (Slice 13: e.g. two fingers to size the pads). The owner asked to switch
them all off and to find further ones. Measured: double-tap zoom was off on one element only,
the search field had 12 px text (iOS zooms into a field with text under 16 px and does not zoom
back), pull-to-refresh and the rubber band were already off (`overscroll-behavior: none`).

## Decision

Owner decisions 2026-10-03, rules in `v3/src/styles/global.css` on every element (touch-action is
not inherited — W3C Pointer Events read it per element up to the nearest scroll container):

1. `touch-action: pan-x pan-y` — the browser may only scroll: no double-tap zoom, no pinch zoom.
   Elements the app drags set `none` (their own class wins).
2. `user-select: none` (and `-webkit-`) — no text selection on long press, in text fields too.
3. `-webkit-touch-callout: none`, `-webkit-user-drag: none`, `-webkit-tap-highlight-color:
transparent` — no iOS long-press menu, no dragging of text or images, no grey tap flash.
4. Every field that takes typing has at least 16 px text (the search field went from 12 to
   16 px) — the standard fix for iOS focus zoom.

Not switchable by a page: the edge swipe back of the browser (none in an app added to the home
screen), shake to undo and three-finger editing gestures (iOS system).

Checked by `v3/tests/e2e/system-gestures.spec.ts` (computed style of every element on five
screens, Chromium and WebKit); the iOS-only parts are on the manual iPhone checklist.

Sources: MDN `touch-action` (pan-x / pan-y, Safari 13+); W3C Pointer Events (touch-action,
pointercancel when the browser takes a gesture); iOS focus zoom under 16 px (WebKit behaviour,
e.g. 456 Berea Street); axe rule `meta-viewport` / WCAG 1.4.4.

## Exceptions

| Exception                                                                | Reason                                                                                                                                 | Reference                                | Review                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------- |
| Pinch zoom is off everywhere, against WCAG 2.2 SC 1.4.4 Resize text (AA) | Owner decision 2026-10-03: the app owns two-finger gestures (pad size, Slice 13); iOS Zoom (accessibility setting) still magnifies     | BACKLOG "App gestures"                   | Slice 14 (text size setting)  |
| Text selection is off in text fields too                                 | Owner decision 2026-10-03: no exceptions; WebKit may then refuse typing in a field (WebKit bugs 82692, 156518) — checked on the iPhone | BACKLOG "Text fields with selection off" | first iPhone check of 3.0.159 |

## Consequences

**Positive:**

- No accidental zoom or selection during a game; the app can use these gestures for itself.
- No focus zoom into the search field on iPhone.

**Negative / Trade-offs:**

- People with low vision cannot pinch to enlarge text in the app; they depend on iOS Zoom until
  the app has its own size settings.
- Text in fields cannot be selected, copied or pasted.

## Alternatives considered

**Keep pinch zoom** (standard-conform, WCAG 1.4.4): recommended, but it blocks a two-finger
gesture of the app's own. Rejected by the owner.

**Pinch zoom off on the pad grid only:** standard-conform elsewhere. Rejected by the owner.

**Allow selection in text fields** (as native apps do; safe for typing): rejected by the owner,
to be checked on the iPhone.

## Related

- **Files:** `v3/src/styles/global.css`, `v3/src/styles/tokens.css`,
  `v3/tests/e2e/system-gestures.spec.ts`, `docs/development/manual-iphone-checklist.md`
- **ADRs:** ADR-0053 (exceptions)
- **Sources:** https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action ·
  https://www.w3.org/TR/pointerevents/ · https://dequeuniversity.com/rules/axe/4.10/meta-viewport ·
  https://456bereastreet.com/archive/201212/ios_webkit_browsers_and_auto-zooming_form_controls
