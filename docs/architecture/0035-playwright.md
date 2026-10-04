# ADR-0035: Playwright for E2E tests

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

E2E tests have to test the app in a real browser (not jsdom): routing, IDB persistence,
Preact signal updates in the DOM, CSS layout. The primary target is iOS/Safari (ADR-0006) —
which makes WebKit test coverage particularly valuable.

> _Playwright was chosen without a detailed evaluation — it is the standard for modern web E2E
> tests with multi-browser support._

## Decision

Playwright with six projects: `smoke` (Chromium), `smoke-webkit` (WebKit), `full` (Chromium), `mobile` (iPhone 13 Pro, WebKit), `mobile-chromium` (iPhone 13 Pro, Chromium), `visual` (Chromium, macOS-only). Configuration in `v3/playwright.config.ts`.

`webServer` configuration: Playwright starts its **own** Vite dev server on test port 5199
(`--strictPort`, `reuseExistingServer: false`, since 2026-09-29). Tests run against
`http://localhost:5199/soundboard-of-storytelling/`. Project assignment of the specs:
`v3/tests/e2e/projects.ts` (guard test `tests/unit/e2eProjects.test.ts`).

**Selector priority** (from docs/development/testing.md):
`getByTestId` > `getByRole` > `.filter({ hasText })` > CSS class

**Base URL:** tests start with `page.goto('/soundboard-of-storytelling/')` and are
self-contained (every test starts with an empty IDB via a fresh browser context).

## Consequences

**Positive:**

- WebKit tests (smoke) give early warning of Safari/iOS incompatibilities.
- The dev server starts automatically: no manual `npm run dev` before tests.
- Browser context isolation: every test has its own IDB.

**Negative / Trade-offs:**

- Pointer events drag in Playwright is hard to stabilize. Tests 9, 14, 20, 21 are marked
  `test.skip` — to be activated in phase 3 (after the drag sequence is stabilized).
- E2E full (~90s) is too slow for the pre-commit hook (runs only in CI).

## Alternatives considered

**Cypress:** proven, good UI. No native WebKit support (Playwright has WebKit via Playwright
WebKit). For this requirement clearly Playwright.

**Testing Library + jsdom:** unit tests with DOM simulation. No real browser, no IDB, no CSS
layout. Not sufficient for integration tests.

## Related

- **Files:** `v3/playwright.config.ts`, `v3/tests/e2e/`, `v3/tests/e2e/helpers.ts`
- **ADRs:** ADR-0033 (test strategy), ADR-0036 (visual regression macOS), ADR-0038 (data-testid convention)
- **Source documents:** `docs/development/testing.md §Tools`, `docs/development/testing.md §Writing E2E tests`
- **Commits:** `4e1152f` — chore: add playwright e2e setup with smoke tests
