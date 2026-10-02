# ADR-0060: Commit messages follow Conventional Commits

**Status:** Accepted
**Date:** 2026-10-01
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

Structure stage S6 (BACKLOG "Structure clean-up"): one scheme for commit messages, checked
mechanically like every other scheme. Measured on 2026-10-01: 206 of 213 commits already use the
form `type(scope): description`, all of the last 60; the types in use are those of Conventional
Commits plus two one-offs (`security`, `infra`). Nothing checked the form so far.

_Drafted by Claude while the owner was away (2026-10-01); accepted by the owner on 2026-10-02
(`docs/development/review-log.md`)._

## Decision

1. **Conventional Commits 1.0.0** — `<type>(<optional scope>): <description>`, optional body and
   footers. The de facto standard for commit messages; tools for changelogs and versioning read it.
2. **commitlint** with `@commitlint/config-conventional` (the reference implementation), types
   `build chore ci docs feat fix perf refactor revert style test`; security work is
   `fix(security)` or `chore(security)`.
3. **Checked** by `.husky/commit-msg` on every commit and, for pull requests, in CI
   (`tests.yml`, unit-build-lint) — the latter catches commits made with `--no-verify`.

## Exceptions

| Exception          | Reason                                                                                                                        | Reference                  | Review    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------- |
| `subject-case` off | subjects often start with a proper noun ("Preact 11", "ESLint …"); the rule rejected 13 of the last 60 commits for that alone | `v3/commitlint.config.mjs` | permanent |

## Consequences

**Positive:** one checked form; release notes and versioning can be derived from it later.

**Negative / Trade-offs:** two more dev dependencies; a wrong message aborts the commit (the
message stays in `.git/COMMIT_EDITMSG`).

## Alternatives considered

**No check, convention by habit:** the habit already holds (97 %), but every other scheme in this
project is guarded mechanically — an unchecked one would be the exception.

**commitizen (interactive prompt):** helps writing, enforces nothing; commitlint enforces.

## Related

- **Files:** `v3/commitlint.config.mjs`, `.husky/commit-msg`, `.github/workflows/tests.yml`
- **ADRs:** ADR-0053 (exceptions)
- **Sources:** https://www.conventionalcommits.org/en/v1.0.0/ ·
  https://commitlint.js.org/ · https://github.com/conventional-changelog/commitlint
