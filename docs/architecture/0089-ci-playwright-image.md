# ADR-0089: CI runs the browser tests in Playwright's own image

**Status:** Accepted
**Date:** 2026-10-22
**Slice:** infrastructure
**Refines:** ADR-0049
**Category:** Test infrastructure & workflow

## Context

Every E2E job of `.github/workflows/tests.yml` installed its browsers with `npx playwright install
--with-deps`. The browsers come from Playwright's CDN; their system packages (fonts, codecs) come
from the runner's Ubuntu mirror through apt. That apt step hung three times:

- 2026-10-09: a job waited over 13 minutes (testGuards rule 11, the time limits);
- 2026-10-22, PR #163: e2e-full was canceled after 25 minutes in the install step, no test ran;
- 2026-10-22, PR #164: e2e-prod fetched 16.7 MB "in 13min 7s (21.2 kB/s)" from
  `azure.archive.ubuntu.com`, and the job hit its 15-minute limit at test 88 of 218.

The browsers themselves downloaded in seconds each time. A required check that fails on a mirror
blocks every merge and the deploy (ADR-0049), although nothing in the app changed.

## Decision

1. **The four E2E jobs run in the container `mcr.microsoft.com/playwright:v<version>-noble`**
   with `options: --user 1001`, as Playwright's CI guide shows ("Via Containers"): browsers and
   their system packages are in the image, so no job installs anything with apt. The tag is the
   version of `@playwright/test` installed in `v3/` (1.64.1 today).
2. **No workflow installs browsers itself** — and the tag follows the npm version: testGuards rule
   15 fails when an image tag differs from the installed `@playwright/test` or a workflow runs
   `playwright install`. Dependabot raises the npm version but not an image tag in a workflow, so
   its pull request fails that guard until the tag is raised in the same change.
3. **Everything else stays:** the steps `npm ci` and `setup-node` (the `.nvmrc` Node version), the
   time limits, the artifacts; the local gate keeps its own browsers.

## Consequences

**Positive:**

- The jobs no longer depend on the Ubuntu mirror; the environment is the same in every run, with
  the browser versions Playwright tested together.

**Negative / Trade-offs:**

- Each job pulls the image (about 2 GB) from Microsoft's registry; the pull time is measured on
  this change's first run and goes into the time limits if it matters.
- A Playwright update needs the tag raised with it (the guard says so).

## Alternatives considered

- **Restart failed jobs:** costs 15–25 minutes each time and someone who notices. Rejected as the
  fix; it stays the first aid.
- **Cache the browsers (`~/.cache/ms-playwright`):** the browsers were never the slow part — the
  apt packages were. Rejected.
- **apt with retries or another mirror:** treats the symptom on a mirror we do not control.
  Rejected.

## Related

- **Files:** `.github/workflows/tests.yml`, `v3/tests/unit/testGuards.test.ts` (rule 15)
- **ADRs:** ADR-0049 (deploy gated on the tested build)
- **Sources:** https://playwright.dev/docs/ci (GitHub Actions, "Via Containers")
