# ADR-0037: Husky pre-commit hook: build + unit + smoke E2E

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

Running build + tests manually before every commit requires discipline. In practice a step
gets forgotten — especially in quick fix sessions. `CLAUDE.md §Pre-commit checklist` was
originally a manual process.

After phase 2 the pre-commit hook is automated via Husky.

## Decision

The Husky pre-commit hook (`v3/.husky/pre-commit`) runs six gates in sequence:

1. `npm run sync:docs` + `git add` (~1s) — generated docs (ADR index, classes, tokens)
2. `npm run build` (tsc + vite, ~4s)
3. `npx lint-staged` (~1s) — Prettier + ESLint on staged files; auto-fix + re-stage
4. `npm run test` (vitest, ~1s)
5. `npm run test:e2e:smoke` (Chromium + WebKit, ~6s)
6. `npm run link:check` (~1s) — markdown-link-check on all .md files

**Total: ~15s.** If a gate fails → the commit is aborted.

**Activation:** `cd v3 && npm install` activates the hook automatically (via Husky's
`prepare` script in `package.json`).

## Consequences

**Positive:**
- Eliminates an error class: "broke in CI but worked locally" — because it was never tested
  locally.
- Forces short feedback loops: 11s is fast enough never to be skipped.
- Smoke tests cover Chromium + WebKit — early warning of Safari incompatibilities.

**Negative / Trade-offs:**
- 11s overhead per commit. With frequent WIP commits that can be annoying. Workaround:
  `git commit --no-verify` for genuine WIP commits (not recommended).
- Requires Node.js and all dependencies in the `v3/` directory. After `git clone`:
  `cd v3 && npm install` is mandatory.

## Alternatives considered

**Build only in pre-commit:** faster (~4s). But unit test and smoke E2E failures are only found
in CI — feedback too late.

**CI-only gates:** no local hook. Waiting for CI (minutes instead of seconds) slows the
development rhythm.

## Related

- **Files:** `v3/.husky/pre-commit`, `v3/package.json` (prepare script)
- **ADRs:** ADR-0033 (test strategy), ADR-0040 (CI deploy gated on tests)
- **Source documents:** `CLAUDE.md §Pre-commit checklist`, `docs/development/testing.md §Pre-commit hook`
- **Commits:** `4296648` — chore: add husky pre-commit hook; `9839fdb` — chore: extend pre-commit hook with smoke e2e tests
