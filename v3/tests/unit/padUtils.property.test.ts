/**
 * @fileoverview padUtils — property-based tests (T11b)
 *
 * Rules that must hold for EVERY grid, checked with fast-check on generated inputs. On failure
 * fast-check prints the seed and the shrunk counterexample; pass `{ seed, path }` as fc options
 * to reproduce it. Example-based tests: padUtils.test.ts.
 */

import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { indexToPos, nextFreeSlot, posToIndex } from '../../src/lib/padUtils';
import { layout } from './arbitraries';

describe('grid positions', () => {
  test.prop([fc.integer({ min: 1, max: 16 }), fc.nat({ max: 255 })])(
    'posToIndex(indexToPos(i)) === i, and the column stays inside the grid',
    (cols, index) => {
      const pos = indexToPos(index, cols);
      expect(pos.col).toBeLessThan(cols);
      expect(posToIndex(pos, cols)).toBe(index);
    },
  );

  test.prop([layout])(
    'nextFreeSlot returns the first free cell in row-major order, or null when full',
    ({ cols, rows, placements }) => {
      const taken = new Set(placements.map((p) => posToIndex(p.position, cols)));
      const firstFree = Array.from({ length: cols * rows }, (_, i) => i).find((i) => !taken.has(i));
      const slot = nextFreeSlot(placements, cols, rows);
      if (firstFree === undefined) expect(slot).toBeNull();
      else expect(slot).toEqual(indexToPos(firstFree, cols));
    },
  );
});
