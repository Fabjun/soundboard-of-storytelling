// ─────────────────────────────────────────────────────────────────────────────
// padDnd — property-based tests (T11b)
//
// Rules that must hold for EVERY pad layout, checked with fast-check on generated inputs. On
// failure fast-check prints the seed and the shrunk counterexample; pass `{ seed, path }` as fc
// options to reproduce it. Example-based tests: padDnd.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import type { Pad, PadPosition } from '../../src/types';
import { applyInsert, applySwap } from '../../src/lib/padDnd';
import { indexToPos } from '../../src/lib/padUtils';
import { layout } from './arbitraries';

const cellKey = (p: PadPosition | null): string => (p ? `${p.col},${p.row}` : 'none');
const positions = (pads: Pad[]): string[] => pads.map((p) => cellKey(p.position)).sort();
const ids = (pads: Pad[]): string[] => pads.map((p) => p.id).sort();
const inGrid = (p: PadPosition | null, cols: number, rows: number): boolean =>
  p !== null && p.col >= 0 && p.col < cols && p.row >= 0 && p.row < rows;

describe('pad drag and drop', () => {
  test.prop([
    layout.chain((l) =>
      fc.tuple(fc.constant(l), fc.nat(l.pads.length - 1), fc.nat(l.cols * l.rows - 1)),
    ),
  ])(
    'swap keeps every pad, keeps cells unique and puts the dragged pad on the target',
    ([{ cols, rows, pads }, src, target]) => {
      const tgt = indexToPos(target, cols);
      const next = applySwap(pads, pads[src].id, tgt);
      expect(ids(next)).toEqual(ids(pads));
      expect(new Set(positions(next)).size).toBe(pads.length);
      expect(next.every((p) => inGrid(p.position, cols, rows))).toBe(true);
      expect(cellKey(next.find((p) => p.id === pads[src].id)!.position)).toBe(cellKey(tgt));
    },
  );

  test.prop([
    layout.chain((l) =>
      fc.tuple(
        fc.constant(l),
        fc.nat(l.pads.length - 1),
        fc.integer({ min: -3, max: l.cols * l.rows + 3 }),
      ),
    ),
  ])(
    'insert keeps every pad, keeps cells unique and stays inside the grid (also for out-of-range targets)',
    ([{ cols, rows, pads }, src, toIndex]) => {
      const next = applyInsert(pads, pads[src].id, toIndex, cols, rows);
      expect(ids(next)).toEqual(ids(pads));
      expect(new Set(positions(next)).size).toBe(pads.length);
      expect(next.every((p) => inGrid(p.position, cols, rows))).toBe(true);
    },
  );

  test.prop([layout])('swapping a pad onto its own cell changes nothing', ({ pads }) => {
    const next = applySwap(pads, pads[0].id, pads[0].position!);
    expect(positions(next)).toEqual(positions(pads));
  });
});
