/**
 * @fileoverview mutation-score — when a mutation run counts as starved (T11c, ADR-0059)
 *
 * Stryker counts a timeout as detected: "the mutant resulted in an infinite loop", and CI would
 * notice that (stryker-mutator.io, mutant states). A starved runner times out on many mutants
 * and so inflates the score (weekly run 36770237372: 89 of 134). Since the weekly run tests one
 * module per job, a share alone is not enough: two timeouts among the 28 mutants of peaks.ts
 * were 7.1 % and failed the run of 2026-10-05.
 */

/** The share of timed-out mutants above which a run may be starved. */
export const MAX_TIMEOUT_SHARE = 0.05;

/** Fewer timeouts than this are mutants that loop forever, not a starved runner. */
export const MIN_STARVED_TIMEOUTS = 3;

/**
 * Tells whether a run with `timeouts` of `total` counted mutants looks starved — its score not
 * trustworthy: more than MAX_TIMEOUT_SHARE timed out, and at least MIN_STARVED_TIMEOUTS did.
 */
export function looksStarved(timeouts: number, total: number): boolean {
  return total > 0 && timeouts >= MIN_STARVED_TIMEOUTS && timeouts / total > MAX_TIMEOUT_SHARE;
}
