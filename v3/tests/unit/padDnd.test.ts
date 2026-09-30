// ─────────────────────────────────────────────────────────────────────────────
// padDnd — unit tests for applySwap and applyInsert
//
// Only the pure mutation helpers are tested here. The pointer-event-based
// drag flow (startDrag, _onPointerMove, ghost management) requires a real
// browser and is covered by E2E tests in Phase 2.
// ─────────────────────────────────────────────────────────────────────────────

import type { Pad, PadPosition, SinglePad } from '../../src/types';
import { applySwap, applyInsert } from '../../src/lib/padDnd';

// ── Test factory ──────────────────────────────────────────────────────────────

function makePad(
  id: string,
  pos: PadPosition,
  overrides?: Partial<Omit<SinglePad, 'type'>>,
): SinglePad {
  return {
    id,
    type: 'single',
    name: `Pad ${id}`,
    position: pos,
    volume: 80,
    fadeIn: 0,
    fadeOut: 0,
    ...overrides,
  };
}

/** Build a full 4×4 grid of pads (row-major). */
function makeGrid(): Pad[] {
  const pads: Pad[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const id = `${col}-${row}`;
      pads.push(makePad(id, { col, row }));
    }
  }
  return pads;
}

/** Get the pad at a given position from a pads array. */
function padAt(pads: Pad[], col: number, row: number): Pad | undefined {
  return pads.find((p) => p.position?.col === col && p.position?.row === row);
}

// ── applySwap ────────────────────────────────────────────────────────────────

describe('applySwap', () => {
  test('both slots occupied → swaps positions', () => {
    const pads = [makePad('a', { col: 0, row: 0 }), makePad('b', { col: 1, row: 0 })];
    const result = applySwap(pads, 'a', { col: 1, row: 0 });
    expect(padAt(result, 0, 0)?.id).toBe('b');
    expect(padAt(result, 1, 0)?.id).toBe('a');
  });

  test('target slot empty → source moves, no other pad affected', () => {
    const pads = [makePad('a', { col: 0, row: 0 }), makePad('b', { col: 2, row: 0 })];
    const result = applySwap(pads, 'a', { col: 3, row: 0 });
    // 'a' moved to (3,0)
    expect(padAt(result, 3, 0)?.id).toBe('a');
    // (0,0) is now empty
    expect(padAt(result, 0, 0)).toBeUndefined();
    // 'b' untouched
    expect(padAt(result, 2, 0)?.id).toBe('b');
  });

  test('unknown srcId → returns original array unchanged', () => {
    const pads = [makePad('a', { col: 0, row: 0 })];
    const result = applySwap(pads, 'UNKNOWN', { col: 1, row: 0 });
    expect(result).toBe(pads); // same reference
  });

  test('all other pads are untouched', () => {
    const pads = makeGrid();
    const result = applySwap(pads, '0-0', { col: 3, row: 3 });
    // Only (0,0) and (3,3) are affected
    const unchanged = result.filter(
      (p) =>
        !(p.position?.col === 0 && p.position?.row === 0) &&
        !(p.position?.col === 3 && p.position?.row === 3),
    );
    const originalUnchanged = pads.filter((p) => !(p.id === '0-0') && !(p.id === '3-3'));
    expect(unchanged.map((p) => p.id).sort()).toEqual(originalUnchanged.map((p) => p.id).sort());
  });

  test('immutable: original array is not mutated', () => {
    const pads = [makePad('a', { col: 0, row: 0 }), makePad('b', { col: 1, row: 0 })];
    const originalPositions = pads.map((p) => ({ ...p.position }));
    applySwap(pads, 'a', { col: 1, row: 0 });
    pads.forEach((p, i) => {
      expect(p.position).toEqual(originalPositions[i]);
    });
  });
});

// ── applyInsert ───────────────────────────────────────────────────────────────

describe('applyInsert', () => {
  test('drag forward: source at index 0, insert at index 3 → source ends at 2', () => {
    // 4 pads at (0,0),(1,0),(2,0),(3,0) — row-major indices 0,1,2,3
    const pads = [
      makePad('a', { col: 0, row: 0 }), // index 0
      makePad('b', { col: 1, row: 0 }), // index 1
      makePad('c', { col: 2, row: 0 }), // index 2
      makePad('d', { col: 3, row: 0 }), // index 3
    ];
    // Insert 'a' at gap after index 3 → normalises to insertIdx = 2
    // (fromIndex=0 < clampedTo=3, so insertIdx = 3-1 = 2)
    const result = applyInsert(pads, 'a', 3, 4, 4);

    // 'a' should be at index 2 (col=2, row=0)
    expect(padAt(result, 2, 0)?.id).toBe('a');
    // 'b' shifts from index 1 → index 0 (col=0, row=0)
    expect(padAt(result, 0, 0)?.id).toBe('b');
    // 'c' shifts from index 2 → index 1 (col=1, row=0)
    expect(padAt(result, 1, 0)?.id).toBe('c');
    // 'd' stays at index 3 (col=3, row=0) — not in the shift range
    expect(padAt(result, 3, 0)?.id).toBe('d');
  });

  test('drag backward: source at index 3, insert at index 0 → source ends at 0', () => {
    const pads = [
      makePad('a', { col: 0, row: 0 }), // index 0
      makePad('b', { col: 1, row: 0 }), // index 1
      makePad('c', { col: 2, row: 0 }), // index 2
      makePad('d', { col: 3, row: 0 }), // index 3 — source
    ];
    // Insert 'd' at index 0 (before 'a')
    // fromIndex=3 > clampedTo=0, so insertIdx = 0
    const result = applyInsert(pads, 'd', 0, 4, 4);

    // 'd' moves to index 0 (col=0, row=0)
    expect(padAt(result, 0, 0)?.id).toBe('d');
    // 'a' shifts from 0 → 1
    expect(padAt(result, 1, 0)?.id).toBe('a');
    // 'b' shifts from 1 → 2
    expect(padAt(result, 2, 0)?.id).toBe('b');
    // 'c' shifts from 2 → 3
    expect(padAt(result, 3, 0)?.id).toBe('c');
  });

  test('toIndex clamped to total-1 when out of range', () => {
    const pads = [makePad('a', { col: 0, row: 0 }), makePad('b', { col: 1, row: 0 })];
    // toIndex=99, grid is 4×4=16, clamps to 15, then normalises
    // Should not throw
    expect(() => applyInsert(pads, 'a', 99, 4, 4)).not.toThrow();
  });

  test('from === to after normalise → returns same array reference', () => {
    const pads = [makePad('a', { col: 1, row: 0 })]; // index 1
    // Insert at index 2 — after normalise: fromIndex=1, clampedTo=2, insertIdx=2-1=1 = fromIndex → no-op
    const result = applyInsert(pads, 'a', 2, 4, 4);
    expect(result).toBe(pads);
  });

  test('unknown srcId → returns original array unchanged', () => {
    const pads = [makePad('a', { col: 0, row: 0 })];
    const result = applyInsert(pads, 'UNKNOWN', 3, 4, 4);
    expect(result).toBe(pads);
  });

  test('immutable: original array is not mutated', () => {
    const pads = [
      makePad('a', { col: 0, row: 0 }),
      makePad('b', { col: 1, row: 0 }),
      makePad('c', { col: 2, row: 0 }),
    ];
    const snapshotPositions = pads.map((p) => ({ ...p.position }));
    applyInsert(pads, 'a', 2, 4, 4);
    pads.forEach((p, i) => {
      expect(p.position).toEqual(snapshotPositions[i]);
    });
  });
});
