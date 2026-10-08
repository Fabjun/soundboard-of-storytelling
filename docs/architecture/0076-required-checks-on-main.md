# ADR-0076: Required checks on main

**Status:** Accepted
**Date:** 2026-10-08
**Slice:** infrastructure
**Refines:** ADR-0051
**Category:** Test infrastructure & workflow

## Context

ADR-0051 protected `main` against force-push and deletion only and deferred "require pull
requests with status checks": it would end direct pushes, which were the solo workflow then.
Since 2026-10-04 every change has reached `main` through a pull request (#43 to #58). On
2026-10-08 the owner allowed Claude to merge its own pull requests without asking, on the
condition that every check is green; nothing on GitHub enforced that condition, so it rested on
a working rule alone. A merge of a red pull request would deploy (ADR-0049 deploys what passed
`tests.yml` on `main`, but a red `main` still breaks the next push and the weekly check).

## Decision

The ruleset `protect-main` (owner decision 2026-10-08, set via `gh api`, read back) keeps its two
rules and gains two:

| Rule                     | Value                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `non_fast_forward`       | unchanged — no force-push                                                                                                                                               |
| `deletion`               | unchanged — `main` cannot be deleted                                                                                                                                    |
| `pull_request`           | changes reach `main` only through a pull request; 0 approvals required (GitHub does not let an author approve their own pull request — one person owns this repository) |
| `required_status_checks` | the five jobs of `tests.yml` — `unit-build-lint`, `e2e-smoke`, `e2e-mobile`, `e2e-full`, `e2e-prod` (GitHub Actions) — must pass; the branch must be up to date first   |

No bypass, also not for admins: Claude works with the owner's token, so an admin bypass would
let it pass the rule too. "Up to date" means the checks ran on the state that lands on `main`.

Industry standard: GitHub's protected branches and rulesets with required status checks
("Require status checks to pass before merging", "Require branches to be up to date").

**Verify:** `gh api repos/Fabjun/soundboard-of-storytelling/rules/branches/main`

## Consequences

**Positive:**

- A pull request with a red, pending or missing check cannot be merged — by the owner, by Claude
  or by Dependabot; the condition no longer depends on memory.
- The tests that gate the deploy (ADR-0049) ran on exactly the state that is merged.

**Negative / Trade-offs:**

- No direct pushes to `main`, also not for a one-line doc fix: every change needs a branch, a
  pull request and a full CI run (about 8 to 18 minutes).
- A pull request behind `main` must be updated before it can be merged, which starts the checks
  again.
- Renaming a job in `tests.yml` blocks every merge until the ruleset names the new job — the
  ruleset and the workflow change together.
- An urgent fix while CI is broken requires disabling the ruleset first (owner, GitHub settings).

## Alternatives considered

**Keep ADR-0051 as it was:** green-only merging guarded by a working rule and the local pre-push
hook. Rejected — nothing stops a merge while a check is red or still running.

**Required checks with an admin bypass:** keeps an emergency path, but Claude acts with the
owner's admin token, so the bypass would cover it as well. Rejected.

## Related

- **Files:** `.github/workflows/tests.yml`
- **ADRs:** ADR-0051 (repository security settings), ADR-0049 (deploy the tested artifact)
- **Sources:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets,
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
