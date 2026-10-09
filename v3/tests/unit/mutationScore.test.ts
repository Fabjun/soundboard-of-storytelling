/**
 * @fileoverview Unit tests — when a mutation run counts as starved (scripts/lib/mutation-score.ts)
 */

import { looksStarved } from '../../scripts/lib/mutation-score';

describe('looksStarved', () => {
  test('a small module with two genuine infinite loops is not starved (peaks.ts, 2026-10-05)', () => {
    expect(looksStarved(2, 28)).toBe(false);
  });

  test('three timeouts above 5 % are starved', () => {
    expect(looksStarved(3, 28)).toBe(true);
  });

  test('many timeouts in a big run are starved (weekly run 36770237372)', () => {
    expect(looksStarved(89, 134)).toBe(true);
  });

  test('a share at 5 % or below is fine, however many timed out', () => {
    expect(looksStarved(5, 100)).toBe(false);
    expect(looksStarved(4, 2000)).toBe(false);
  });

  test('just above 5 % with enough timeouts is starved', () => {
    expect(looksStarved(6, 100)).toBe(true);
  });

  test('no counted mutants is not starved', () => {
    expect(looksStarved(0, 0)).toBe(false);
  });
});
