# ADR-0080: Accessibility checks

**Status:** Accepted
**Date:** 2026-10-09
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

Owner rule 2026-10-02 (CLAUDE.md UI rules): every control works with the Tab key and has an
accessible name (icon buttons: `aria-label`); error messages say in plain words what happened and
what to do (Nielsen heuristic 9). The existing screens had never been checked. The audit of
2026-10-09 found core flows that needed a mouse — opening a board, choosing a deck, choosing the
file of a new pad — because clickable `div`s held them, plus icon buttons named only by `title`,
icons announced by their file names and raw technical error messages. Built while the owner was
away; accepted by the owner 2026-10-09 (checks, decorative icons, row buttons and error texts as
built).

## Decision

1. **Runtime: axe-core** through `@axe-core/playwright` (MPL-2.0, a dev dependency only — not in
   the app) — Playwright's documented way to test accessibility. `v3/tests/e2e/a11y.spec.ts` scans
   every main screen in its real state for WCAG 2.2 A / AA, in Chromium and WebKit; one test walks
   board → deck → new pad with the keyboard alone; one opens an import error with the keyboard.
   Color contrast (WCAG 2.2 SC 1.4.3) is checked too since 3.0.193, in the default theme with
   every rule and in each `.sb-theme-*` of `v3/src/styles/tokens.css` (read from the file) on its
   own, before any screen offers themes (BACKLOG "Text contrast below WCAG AA").
2. **Source: a guard** in `codeGuards` — axe cannot see a click handler on a plain element: a
   click handler sits on a control Tab reaches (a native control, or role + tabIndex + keys;
   dialog backdrops and click stoppers excepted; other exceptions named with their reason); a
   button that shows only an icon has an `aria-label`.
3. **Patterns:** the main action of a list row is a real `<button>` (`sb-row-button`, no look of
   its own), the row's other buttons its siblings — never a clickable row `div` with buttons
   inside (a button may not hold buttons, axe `nested-interactive`). `PixelIcon` is decorative
   (`aria-hidden`); the control carries the name. Error texts: plain sentence + next step; the
   technical cause goes to the console.

Industry standard: Playwright, "Accessibility testing" (axe-core); WAI-ARIA Authoring Practices,
button pattern; W3C WAI tutorial "Decorative Images"; first rule of ARIA use (native elements
first).

## Consequences

**Positive:**

- Every main flow works without a mouse, checked in two browsers; a new clickable `div` or an
  unnamed icon button fails on the next commit.
- Screen readers hear the control's purpose, not "book" or "flame".

**Negative / Trade-offs:**

- axe sees only the screens the spec opens; new screens need a scan in the spec.
- WebKit on macOS reaches buttons with Option+Tab only (system setting); the spec uses it there.

## Alternatives considered

**`eslint-plugin-jsx-a11y`:** the common lint rules (`interactive-supports-focus`,
`click-events-have-key-events`), but its peer range ends at ESLint 9 — the project uses ESLint 10;
installing it would bypass the peer check. Rejected for now; the guard covers the two rules that
matter here. Review when the plugin supports ESLint 10.

**`role="button"` on the clickable row:** fewer changes, but the row holds buttons — invalid
(nested interactive). Rejected.

## Related

- **Files:** `v3/tests/e2e/a11y.spec.ts`, `v3/tests/unit/codeGuards.test.ts`,
  `v3/src/components/PixelIcon.tsx`, `v3/src/styles/components.css` (`sb-row-button`)
- **ADRs:** ADR-0054 (test IDs and locators), ADR-0074 (dialogs close on Escape)
- **Sources:** https://playwright.dev/docs/accessibility-testing,
  https://www.w3.org/WAI/ARIA/apg/patterns/button/,
  https://www.w3.org/WAI/tutorials/images/decorative/,
  https://www.w3.org/TR/using-aria/#rule1
