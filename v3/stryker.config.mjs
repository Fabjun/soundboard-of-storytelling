// ─────────────────────────────────────────────────────────────────────────────
// StrykerJS — mutation testing (T11c, ADR-0059)
//
// Plants small bugs ("mutants") in the logic modules and runs the unit tests against each;
// the mutation score is the share of bugs the tests detect. Slow (~30 min), so it runs weekly
// in CI (weekly.yml) and on demand: npm run test:mutation (from v3/).
//
// Command runner, not @stryker-mutator/vitest-runner: on Vitest 5 that runner runs no test per
// mutant and reports everything as survived (stryker-js#6210; measured here 2026-09-30:
// padUtils 0 % vs 72 %). Review trigger: BACKLOG "T11c".
// ─────────────────────────────────────────────────────────────────────────────

const VITEST = '--maxWorkers=1 --testTimeout=5000';
// One module per CI job (weekly.yml matrix, list from npm run mutation:modules). Its mutants can
// only affect tests that import it, so `vitest related` runs just those: 2–6 test files instead of
// all (measured 2026-10-01: ~3 s instead of ~7 s per mutant).
const MODULE = process.env.MUTATE_MODULE;

/** @type {string[]} */
export const MUTATE = [
  // The coverage modules of vitest.config.ts, without the EXEMPT files of testGuards.test.ts that
  // have no unit tests by design (kept in step by testGuards).
  'src/lib/**/*.ts',
  'src/state/**/*.ts',
  'src/db/**/*.ts',
  'src/audio/**/*.ts',
  '!src/lib/changelog.ts', // data only (release notes), no logic
  '!src/audio/types.ts', // type declarations only
  '!src/lib/libDnd.ts', // pointer/DOM drag — covered by E2E, not by unit tests
];

// Only ever RAISE (like the coverage floor): measured score rounded down. Baseline 2026-09-30:
// 59.40 %. A run that tests nothing scores ~0 and fails. In per-module CI jobs the aggregate job
// enforces it over all modules (npm run mutation:report -- --break).
export const BREAK = 59;

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'command',
  commandRunner: {
    // Guard tests only read files. --maxWorkers=1: Stryker already runs one test process per CPU;
    // vitest workers on top overbooked the CI runner until mutants timed out — and timeouts count
    // as detected, inflating the score (weekly run 36770237372). --testTimeout: the 500 ms local
    // budget would turn slow runs into timeouts as well.
    command: MODULE
      ? `npx vitest related ${MODULE} --run ${VITEST}`
      : `npx vitest run ${VITEST} --exclude 'tests/unit/*Guards.test.ts' --exclude 'tests/unit/e2eProjects.test.ts'`,
  },
  coverageAnalysis: 'off',
  mutate: MODULE ? [MODULE] : MUTATE,
  thresholds: { high: 80, low: 60, break: MODULE ? null : BREAK },
  // Locally half the cores, so the machine stays usable during a run; CI uses Stryker's default.
  concurrency: process.env.CI ? undefined : '50%',
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  timeoutMS: 20000,
};
