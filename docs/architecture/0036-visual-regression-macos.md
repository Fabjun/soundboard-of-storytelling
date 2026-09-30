# ADR-0036: Visual regression tests local only (macOS baselines)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

Visual regression tests (screenshot comparisons) were introduced in phase 2. The problem:
macOS and Linux (Ubuntu CI) render fonts differently. The same HTML/CSS code → screenshots
that differ pixel by pixel.

If baselines are generated on macOS and CI runs on Ubuntu, visual tests always fail in CI —
even when there is no visual regression.

## Decision

Visual regression tests run **only locally on macOS**. CI (GitHub Actions, Ubuntu) excludes
visual tests.

Baselines are generated on macOS with the file name suffix `-darwin.png`:

```
tests/e2e/visual/__snapshots__/
  visual-startscreen-1-chromium-darwin.png
  visual-boardscreen-setup-1-chromium-darwin.png
  ...
```

These files are committed and belong to the repository.

**Workflow:**
- before UI-relevant commits: run `npm run test:e2e:visual` locally
- for intended UI changes: `npm run test:e2e:update-snapshots` + commit the new baselines

## Consequences

**Positive:**
- Visual regression protection for macOS developers without CI flakiness.
- Baselines are committed — traceable in history.

**Negative / Trade-offs:**
- Visual regression does not work on Linux/Windows. Other developers on other platforms have
  no visual regression protection. No problem for a single-developer project.
- CI gives no visual regression warning. Only manual runs before UI commits protect.

## Alternatives considered

**Separate Ubuntu baselines:** a double set of baselines (darwin + ubuntu). Considerable
maintenance effort.

**Raise the pixelmatch threshold:** accepts more pixel differences. Makes the tests unreliable
— they would miss real regressions.

**Percy / Chromatic:** cloud-based visual regression services. External dependency, costs.
Not justified for a private project.

## Related

- **Files:** `v3/tests/e2e/visual/`, `v3/playwright.config.ts` (visual project config)
- **ADRs:** ADR-0033 (test strategy), ADR-0035 (Playwright)
- **Source documents:** `docs/development/testing.md §Visual regression (local only)`, `CLAUDE.md §Deviations from plan`
- **Commits:** `37bfada` — test: add visual regression tests with screenshot baseline
