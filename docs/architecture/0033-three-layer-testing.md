# ADR-0033: Four-layer test strategy (unit / E2E smoke / E2E full / visual)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure
**Refines:** —
**Refined by:** ADR-0059 (property-based and mutation testing on top of the unit layer)
**Category:** Test infrastructure & workflow

## Context

The testing infrastructure was introduced in phase 1 (Slice 3.5) after Slice 3 was complete.
At that point 3 feature slices with substantial code existed. The question: which test types,
which tools, which coverage goals?

`docs/architecture/concept-brief.md §6` had originally marked tests as "deferred". After Slice 3
it became clear that further slice development without automated tests would be risky
(regressions not detectable).

## Decision

**Four test layers:**

| Layer             | Tool                       | Purpose                                                            | Runtime | CI             |
| ----------------- | -------------------------- | ------------------------------------------------------------------ | ------- | -------------- |
| Unit              | Vitest                     | Logic correctness (pure functions, signals, IDB)                   | ~1s     | ✓              |
| E2E smoke         | Playwright Chromium+WebKit | Critical paths                                                     | ~6s     | ✓              |
| E2E full          | Playwright Chromium        | Full verification (slices 3–4): board/scene/pad CRUD, audio engine | ~90s    | ✓              |
| Visual regression | Playwright screenshots     | Pixel comparison                                                   | ~30s    | ✗ (local only) |

**Gate order:** unit → E2E smoke → E2E full (CI); pre-commit: sync:docs → build → lint-staged → unit → E2E smoke → link:check (ADR-0037); pre-push: version bump + size → E2E all (ADR-0037).

**Bundle size monitoring:** `@size-limit/file` measures gzip sizes after the build. Limits: JS
200 KB, CSS 50 KB. Integrated in CI. Note: `@size-limit/preset-app` was rejected because it
uses Chrome for timing measurements via `estimo` and crashes on ARM Macs (M chip) due to a
Chromium binary incompatibility. `@size-limit/file` measures gzip size without a Chrome
dependency — sufficient.

## Consequences

**Positive:**

- Unit tests cover logic correctness (pure functions in `src/lib/`, signals in `src/state/`).
- Smoke tests run in ~6s and cover the five most critical paths.
- Visual regression prevents unintended UI changes (locally before UI-relevant commits).

**Negative / Trade-offs:**

- E2E full at ~90s is too long for pre-commit (runs only in CI).
- Visual regression fails on Ubuntu CI (font rendering difference, ADR-0036) — excluded from
  CI.

## Alternatives considered

**Unit tests only:** fast, but covers no browser compatibility, no routing logic, no IDB
round trips. Not enough for an app with complex UI state.

**E2E only:** slow, hard to debug. Unit tests for pure functions are the fastest feedback
loop.

## Related

- **Files:** `v3/vitest.config.ts`, `v3/playwright.config.ts`, `v3/.size-limit.json`, `docs/development/testing.md`
- **ADRs:** ADR-0034 (Vitest), ADR-0035 (Playwright), ADR-0036 (visual regression macOS), ADR-0037 (Husky pre-commit)
- **Source documents:** `docs/development/testing.md §Overview`
- **Commits:** `47ff8b0` — chore: add vitest setup; `4e1152f` — chore: add playwright e2e setup
