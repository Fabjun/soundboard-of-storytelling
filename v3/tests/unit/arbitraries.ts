// ─────────────────────────────────────────────────────────────────────────────
// Shared fast-check generators ("arbitraries") for the property-based tests (T11b)
// ─────────────────────────────────────────────────────────────────────────────

import { fc } from '@fast-check/vitest';
import type { Pad } from '../../src/types';
import { indexToPos } from '../../src/lib/padUtils';

/** A grid (cols × rows) with pads on a random subset of its cells, each cell used once. */
export const layout = fc
  .record({ cols: fc.integer({ min: 1, max: 8 }), rows: fc.integer({ min: 1, max: 8 }) })
  .chain(({ cols, rows }) =>
    fc
      .subarray(
        Array.from({ length: cols * rows }, (_, i) => i),
        { minLength: 1 },
      )
      .map((cells) => ({
        cols,
        rows,
        pads: cells.map((cell, n): Pad => ({
          id: `p${n}`,
          type: 'single',
          name: `Pad ${n}`,
          position: indexToPos(cell, cols),
          volume: 80,
          fadeIn: 0,
          fadeOut: 0,
        })),
      })),
  );
