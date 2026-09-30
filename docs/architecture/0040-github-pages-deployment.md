# ADR-0040: GitHub Pages deployment gated on CI (`workflow_run`)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure
**Refines:** —
**Refined by:** ADR-0049 (deploy the tested artifact, push-only guard)
**Category:** Test infrastructure & workflow

## Context

V3 is deployed to GitHub Pages. The deployment should only happen when all tests are green —
otherwise a broken build is deployed to the live URL.

The technical problem: GitHub Actions has `needs` for intra-workflow sequencing and
`workflow_run` for cross-workflow sequencing. `needs` only works if both jobs are in the same
workflow file.

`deploy-pages.yml` and `tests.yml` are separate workflow files (clean separation of
concerns). That requires `workflow_run`.

## Decision

`deploy-pages.yml` triggers via `workflow_run`:

```yaml
on:
  workflow_run:
    workflows: ["Tests"]
    types: [completed]
    branches: [main]
  workflow_dispatch:  # manual trigger allowed
```

An additional guard in the job: `if: github.event.workflow_run.conclusion == 'success'`.

Only when `tests.yml` succeeds on `main` is there a deploy.

`workflow_dispatch` allows a manual re-deploy (e.g. after a branch push without code change).

## Consequences

**Positive:**

- Deploying a broken build is excluded structurally (not only by convention).
- A clear separation: `tests.yml` for CI quality gates, `deploy-pages.yml` for deployment.

**Negative / Trade-offs:**

- ~~`workflow_run` has a special property: it does not trigger for pull requests from forks
  (a GitHub security restriction). No problem for a single-developer project.~~
  **Correction 2026-09-29: wrong.** `workflow_run` also fires after `pull_request` runs, and a
  fork can name its branch `main`. Since ADR-0049 the deploy checks the event (`push`) and the
  source repository.
- Deployment latency: `workflow_run` starts after `tests.yml` has finished (not in parallel).
  Total latency: tests (~3 min) + deploy (~1 min).

## Alternatives considered

**Both workflows in one file:** would allow `needs`. Drawback: less clear separation of
concerns (test definition and deploy definition mixed).

**A direct push trigger for the deploy without a test gate:** simpler, but risks deploying
broken builds.

## Related

- **Files:** `.github/workflows/tests.yml`, `.github/workflows/deploy-pages.yml`
- **ADRs:** ADR-0033 (test strategy), ADR-0037 (Husky pre-commit)
- **Source documents:** `docs/development/testing.md §CI integration`, `CLAUDE.md §Deviations from plan`
- **Commits:** `0fcb4e9` — ci: add github actions test workflow; `9de5c19` — chore: add github pages deployment workflow
