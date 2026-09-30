# ADR-0059: Property-based and mutation testing

**Status:** Accepted
**Date:** 2026-09-30
**Slice:** infrastructure
**Refines:** ADR-0033
**Category:** Test infrastructure & workflow

## Context

The unit tests were example-based: chosen inputs, chosen expectations. Coverage showed which lines
ran, not whether the tests would notice a bug there. The owner asked for test quality beyond
counts (T11): a checklist for choosing cases, tests that cover whole input spaces, and a measure of
how many bugs the tests actually catch.

Measured before deciding (2026-09-30, throwaway worktree): a mutation run over the logic modules
detected 59.4 % of 1,813 planted bugs — `padDnd.ts` 30 %, `engine.ts` 53 %, `nanoid.ts` 100 %.
The first attempt with `@stryker-mutator/vitest-runner` reported 5 %: on Vitest 5 that runner
runs no test per mutant (stryker-js#6210); a hand-planted bug that failed 4 tests "survived" there.

## Decision

1. **Edge-case checklist** — test cases are chosen with the ISTQB black-box techniques
   (equivalence partitioning, boundary value analysis) plus a project checklist in
   `docs/development/testing.md`; the slice checklist links it.
2. **Property-based tests** with fast-check (`@fast-check/vitest`), the de facto standard for
   JavaScript/TypeScript: `tests/unit/<module>.property.test.ts` beside the example tests, shared
   generators in `tests/unit/arbitraries.ts`. Generators are biased towards boundaries — uniform
   random input missed a real display bug that the biased generator found at once.
3. **Mutation testing** with StrykerJS, the standard mutation tool for JavaScript/TypeScript:
   weekly in CI (`weekly.yml`, job `mutation`) and `npm run test:mutation`; not in the hooks
   (about 30 minutes). `thresholds.break` = measured score rounded down, only raised — a run
   that tests nothing scores about 0 % and fails (counter-checked).
4. **Timeouts are not trusted** — Stryker counts a timed-out mutant as detected, so a starved
   machine inflates the score (first CI run: 89 of 134 mutants timed out). Each mutant runs
   `vitest --maxWorkers=1`, unit tests run in Node (jsdom only by opt-in), and
   `npm run mutation:report` fails above 5 % timeouts.
5. **Command runner** instead of the Vitest runner until stryker-js#6210 is fixed in a release
   (BACKLOG "T11c"): slower, but it runs the real test command against every mutant.

Every new test, property and threshold is counter-checked (planted bug → red).

## Exceptions

| Exception                                                 | Reason                                                                                    | Reference                       | Review                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------- | --------------------------- |
| `libDnd.ts`, `changelog.ts`, `audio/types.ts` not mutated | no unit tests by design (E2E-only, data, types) — the EXEMPT list of `testGuards.test.ts` | testGuards                      | when a file gets unit tests |
| npm override `typed-rest-client > qs`                     | Stryker 10 pins a `qs` with moderate advisories; 6.16.0 fixes them in the same major      | `v3/package.json` `//overrides` | BACKLOG "T11c"              |

## Consequences

**Positive:**

- Test quality is measured, not assumed; weak spots are visible per module.
- Property tests found a real bug (`formatBytes` showed "1024 KB" below 1 MiB).

**Negative / Trade-offs:**

- A weekly CI job of about 30–60 minutes; mutation results arrive once a week, not per push.
- Three more dev dependencies (fast-check, @fast-check/vitest, @stryker-mutator/core).

## Alternatives considered

**Stryker's Vitest runner now:** measured broken on Vitest 5 (reports everything as survived).

**Mutation testing in the pre-push hook:** about 30 minutes per push; incremental mode can be
reconsidered with the faster runner.

## Related

- **Files:** `v3/stryker.config.mjs`, `v3/tests/unit/*.property.test.ts`,
  `v3/tests/unit/arbitraries.ts`, `.github/workflows/weekly.yml`, `docs/development/testing.md`
- **ADRs:** ADR-0033 (four-layer test strategy), ADR-0053 (exceptions)
- **Sources:** https://stryker-mutator.io/docs/stryker-js/introduction/ · https://fast-check.dev/ ·
  https://github.com/stryker-mutator/stryker-js/issues/6210 · ISTQB CTFL v4.0 syllabus, chapter 4.2
