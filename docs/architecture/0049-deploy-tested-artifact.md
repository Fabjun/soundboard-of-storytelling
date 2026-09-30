# ADR-0049: Deploy the tested build artifact

**Status:** Accepted
**Date:** 2026-09-29
**Slice:** infrastructure
**Refines:** ADR-0040

**Category:** Test infrastructure & workflow

## Context

ADR-0040 gates the GitHub Pages deployment on a green `tests.yml` run via `workflow_run`.
Two gaps remained (found in the test-setup analysis, BACKLOG T8d):

1. **The deployed build was not the tested build.** `deploy-pages.yml` ran its own
   `npm ci` + `npm run build` after the tests. Usually identical, but not guaranteed:
   package downloads, runner image and environment can differ between the two runs.
2. **The gate trusted the branch name only.** The trigger filter `branches: [main]` matches
   the head branch of *any* completed Tests run — including `pull_request` runs, and a fork
   can name its branch `main`. The deploy then checked out
   `github.event.workflow_run.head_sha`, i.e. it could have built and published fork code.
   ADR-0040 stated the opposite ("es triggert nicht auf Pull Requests von Forks"); that
   statement was wrong. No sign that it was ever exploited.

## Decision

- **tests.yml, job `e2e-prod`:** builds `v3/dist`, runs smoke + full + PWA E2E against it
  (`npm run test:e2e:prod`) and, only after success on a push to `main`, uploads exactly
  that folder as artifact `pages-dist` (retention 30 days).
- **deploy-pages.yml never builds.** It downloads `pages-dist` from the triggering Tests run
  (`actions/download-artifact` with `run-id`, permission `actions: read`) and publishes it.
  No Node, no `npm ci`, no dependency cache in the deploy job.
- **Trigger guard:** deploy only if the Tests run succeeded **and** was triggered by `push`
  **and** its head repository is this repository
  (`github.event.workflow_run.head_repository.full_name == github.repository`).
- **Manual re-deploy** (`workflow_dispatch`): uses the artifact of the latest successful
  Tests push run on `main`. If it has expired, the deploy fails visibly; re-run Tests for
  that commit first.
- GitHub Actions are kept on current majors (Node 24 runtime); Dependabot proposes updates
  monthly.

## Consequences

**Positiv:**
- What users get is byte-for-byte what passed the production-build E2E tests.
- Fork or pull-request code can no longer reach the live site through this workflow.
- Smaller attack surface in the job holding `pages: write` / `id-token: write`
  (no package installation there).
- A failed deploy leaves the previous version live — no downtime.

**Negativ / Trade-offs:**
- Deploy depends on an artifact with limited lifetime (30 days) — manual re-deploys of old
  states need a Tests re-run.
- Coupling: the deploy relies on the artifact name `pages-dist` and on `e2e-prod` building
  the same `dist` that is deployed. Renaming one side breaks the deploy visibly (download
  fails), not silently.

## Alternatives Considered

**Deploy job inside `tests.yml` (`needs: e2e-prod`):** shares the artifact trivially and
avoids `workflow_run`. Rejected for now to keep the separation of ADR-0040; also the weekly
check (`weekly.yml`) reuses `tests.yml` and must not deploy.

**Keep rebuilding, but pin everything (lockfile + Node version):** narrows the difference,
but still deploys an untested build. Rejected.

## Related

- **Dateien:** `.github/workflows/tests.yml`, `.github/workflows/deploy-pages.yml`,
  `.github/workflows/weekly.yml`
- **ADRs:** ADR-0040 (CI-gated deployment, refined here)
- **Quelldokumente:** `docs/development/testing.md §CI-Integration`, `docs/backlog.md` T8d
- **Commits:** see git log "…(T8d)"
