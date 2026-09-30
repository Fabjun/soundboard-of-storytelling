// @vitest-environment jsdom
// ─────────────────────────────────────────────────────────────────────────────
// padDnd — unit tests: applySwap / applyInsert, and the pointer drag flow
//
// The drag flow runs in jsdom with a stubbed geometry (4×4 cells of 100 px): the E2E tests
// (pad-dnd.spec.ts) prove the real pointer wiring, these tests pin the boundaries the E2E
// tests never hit — drag threshold, edge zones, cell borders (T11c: mutation testing showed
// them unguarded). Cases chosen by boundary value analysis.
// ─────────────────────────────────────────────────────────────────────────────

import type { Pad, PadPosition, SinglePad } from '../../src/types';
import { afterEach, beforeEach, vi } from 'vitest';
import {
  applySwap,
  applyInsert,
  configureDnd,
  registerCellRef,
  setPadsRef,
  startDrag,
  type DndDropResult,
} from '../../src/lib/padDnd';

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

describe('applySwap with unplaced pads', () => {
  it('pads without position are skipped when looking for the target', () => {
    const pads = [
      makePad('a', { col: 0, row: 0 }),
      { ...makePad('u', { col: 0, row: 0 }), position: null },
    ];
    const next = applySwap(pads, 'a', { col: 1, row: 0 });
    expect(next.find((p) => p.id === 'a')!.position).toEqual({ col: 1, row: 0 });
    expect(next.find((p) => p.id === 'u')!.position).toBeNull();
  });
});

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

// ── Pointer drag flow ─────────────────────────────────────────────────────────

const CELL = 100; // px per cell in the stubbed layout
const COLS = 4;

/** A cell element whose layout box is the given grid cell (jsdom computes no layout). */
function cellElement(col: number, row: number, width = CELL): HTMLElement {
  const el = document.createElement('div');
  const left = col * width;
  const top = row * CELL;
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: left + width,
      bottom: top + CELL,
      width,
      height: CELL,
      x: left,
      y: top,
    }) as DOMRect;
  el.setPointerCapture = () => {}; // jsdom has no pointer capture
  return el;
}

describe('drag flow (startDrag)', () => {
  let cells: Map<string, HTMLElement>;
  let pads: Pad[];
  let onDrop: ReturnType<typeof vi.fn<(r: DndDropResult) => void>>;

  /** Grid of COLS × 4 cells; every cell holds pad "p<col>,<row>". */
  function setup(width = CELL): void {
    cells = new Map();
    pads = [];
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < COLS; col++) {
        const key = `${col},${row}`;
        const el = cellElement(col, row, width);
        cells.set(key, el);
        registerCellRef(key, el);
        pads.push(makePad(`p${key}`, { col, row }));
      }
    configureDnd(COLS, 4);
    setPadsRef(pads);
  }

  const move = (x: number, y: number): void => {
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y }));
  };
  const up = (): void => {
    document.dispatchEvent(new PointerEvent('pointerup'));
  };
  /** Press on cell (col,row) at its centre (or the given point). */
  const press = (col: number, row: number, x = col * CELL + 50, y = row * CELL + 50): void => {
    const el = cells.get(`${col},${row}`)!;
    startDrag(
      {
        preventDefault: () => {},
        currentTarget: el,
        pointerId: 1,
        clientX: x,
        clientY: y,
      } as unknown as PointerEvent,
      `p${col},${row}`,
      el,
      onDrop,
    );
  };
  const ghost = (): HTMLElement | null => document.body.querySelector(':scope > div');

  beforeEach(() => {
    onDrop = vi.fn<(r: DndDropResult) => void>();
    setup();
  });

  afterEach(() => {
    up(); // ends a drag a test left open
    for (const key of cells.keys()) registerCellRef(key, null);
    document.body.innerHTML = '';
  });

  it('a move below the 8 px threshold is not a drag: cancel, no ghost', () => {
    press(0, 0);
    move(50 + 7, 50 + 7);
    expect(ghost()).toBeNull();
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'cancel' });
  });

  it('8 px in either direction starts the drag: ghost and source marker appear', () => {
    press(0, 0);
    move(50, 50 + 8);
    expect(ghost()).not.toBeNull();
    expect(cells.get('0,0')!.classList.contains('is-drag-source')).toBe(true);
  });

  it('the ghost has the source size and follows the pointer centred', () => {
    press(0, 0);
    move(58, 50);
    move(250, 170);
    const g = ghost()!;
    expect(g.style.width).toBe(`${CELL}px`);
    expect(g.style.left).toBe(`${250 - CELL / 2}px`);
    expect(g.style.top).toBe(`${170 - CELL / 2}px`);
  });

  it('pointer up removes ghost, source marker and drop indicators', () => {
    press(0, 0);
    move(58, 50);
    move(250, 150); // centre of cell (2,1) → swap indicator
    expect(cells.get('2,1')!.classList.contains('is-drag-swap')).toBe(true);
    up();
    expect(ghost()).toBeNull();
    expect(cells.get('0,0')!.classList.contains('is-drag-source')).toBe(false);
    expect(cells.get('2,1')!.classList.contains('is-drag-swap')).toBe(false);
  });

  it('centre of another cell → swap with that cell', () => {
    press(0, 0);
    move(58, 50);
    move(250, 150);
    up();
    expect(onDrop).toHaveBeenCalledWith({
      kind: 'swap',
      srcId: 'p0,0',
      tgtPos: { col: 2, row: 1 },
    });
  });

  it('left edge zone: one pixel inside inserts before, the zone border itself swaps', () => {
    const left = 2 * CELL; // cell (2,1); edge zone = min(25 px, 22 px) = 22 px
    press(0, 0);
    move(58, 50);
    move(left + 21, 150);
    expect(cells.get('2,1')!.classList.contains('is-insert-before')).toBe(true);
    move(left + 22, 150);
    expect(cells.get('2,1')!.classList.contains('is-insert-before')).toBe(false);
    expect(cells.get('2,1')!.classList.contains('is-drag-swap')).toBe(true);
    move(left + 21, 150);
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'insert', srcId: 'p0,0', toIndex: 1 * COLS + 2 });
  });

  it('right edge zone: one pixel inside inserts after, the zone border itself swaps', () => {
    const right = 3 * CELL; // cell (2,1)
    press(0, 0);
    move(58, 50);
    move(right - 22, 150);
    expect(cells.get('2,1')!.classList.contains('is-drag-swap')).toBe(true);
    move(right - 21, 150);
    expect(cells.get('2,1')!.classList.contains('is-insert-after')).toBe(true);
    up();
    expect(onDrop).toHaveBeenCalledWith({
      kind: 'insert',
      srcId: 'p0,0',
      toIndex: 1 * COLS + 2 + 1,
    });
  });

  it('narrow cells: the edge zone is 25 % of the width when that is below 22 px', () => {
    for (const key of cells.keys()) registerCellRef(key, null);
    setup(40); // edge zone = min(10 px, 22 px) = 10 px
    press(0, 0, 20, 50);
    move(20, 58);
    move(2 * 40 + 9, 150);
    expect(cells.get('2,1')!.classList.contains('is-insert-before')).toBe(true);
    move(2 * 40 + 10, 150);
    expect(cells.get('2,1')!.classList.contains('is-drag-swap')).toBe(true);
  });

  it('cell borders belong to the cell (inclusive), outside every cell is no target', () => {
    press(0, 0);
    move(58, 50);
    move(3 * CELL + 50, 3 * CELL); // top border of the last row
    expect(
      cells.get('3,3')!.classList.contains('is-drag-swap') ||
        cells.get('3,2')!.classList.contains('is-drag-swap'),
    ).toBe(true);
    move(4 * CELL, 4 * CELL); // bottom-right corner of the grid
    expect(cells.get('3,3')!.classList.contains('is-insert-after')).toBe(true);
    move(4 * CELL + 1, 150); // one pixel right of the grid
    expect(
      [...cells.values()].some(
        (el) => el.className !== '' && !el.classList.contains('is-drag-source'),
      ),
    ).toBe(false);
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'cancel' });
  });

  it('over its own cell nothing is marked and the drop cancels', () => {
    press(1, 1);
    move(150, 158);
    expect(cells.get('1,1')!.classList.contains('is-drag-swap')).toBe(false);
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'cancel' });
  });

  it('moving to another cell clears the previous indicator', () => {
    press(0, 0);
    move(58, 50);
    move(250, 150);
    move(350, 250);
    expect(cells.get('2,1')!.classList.contains('is-drag-swap')).toBe(false);
    expect(cells.get('3,2')!.classList.contains('is-drag-swap')).toBe(true);
  });

  it('after pointer up the listeners are gone: a later move starts nothing', () => {
    press(0, 0);
    up();
    move(250, 150);
    expect(ghost()).toBeNull();
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('8 px sideways also starts the drag (threshold applies to both axes)', () => {
    press(0, 0);
    move(50 + 7, 50);
    expect(ghost()).toBeNull();
    move(50 + 8, 50);
    expect(ghost()).not.toBeNull();
  });

  it('the left and top border of the grid belong to the first cells', () => {
    press(3, 3);
    move(350, 358);
    move(0, 50); // left border of cell (0,0) → its left edge zone
    expect(cells.get('0,0')!.classList.contains('is-insert-before')).toBe(true);
    move(150, 0); // top border of cell (1,0), centre column → swap
    expect(cells.get('1,0')!.classList.contains('is-drag-swap')).toBe(true);
  });

  it('an unregistered cell is no drop target any more', () => {
    registerCellRef('2,1', null);
    press(0, 0);
    move(58, 50);
    move(250, 150);
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'cancel' });
  });

  it('the insert index follows the configured column count', () => {
    configureDnd(5, 4);
    press(0, 0);
    move(58, 50);
    move(2 * CELL + 5, 150); // left edge of the cell registered as (2,1)
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'insert', srcId: 'p0,0', toIndex: 1 * 5 + 2 });
  });

  it('pressing prevents the default action and captures the pointer', () => {
    const el = cells.get('0,0')!;
    const capture = vi.spyOn(el, 'setPointerCapture');
    const preventDefault = vi.fn();
    startDrag(
      {
        preventDefault,
        currentTarget: el,
        pointerId: 7,
        clientX: 50,
        clientY: 50,
      } as unknown as PointerEvent,
      'p0,0',
      el,
      onDrop,
    );
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(capture).toHaveBeenCalledWith(7);
  });

  it('a pad id that is not in the pad list drags without errors (no source marker)', () => {
    const el = cells.get('0,0')!;
    startDrag(
      {
        preventDefault: () => {},
        currentTarget: el,
        pointerId: 1,
        clientX: 50,
        clientY: 50,
      } as unknown as PointerEvent,
      'unknown',
      el,
      onDrop,
    );
    expect(() => move(58, 50)).not.toThrow();
    expect(el.classList.contains('is-drag-source')).toBe(false);
  });

  it('the source cell not being registered is harmless', () => {
    registerCellRef('0,0', null);
    press(0, 0);
    expect(() => move(58, 50)).not.toThrow();
    expect(() => up()).not.toThrow();
  });

  it('a dragged pad without position gets no source marker', () => {
    pads[0] = { ...pads[0], position: null };
    setPadsRef(pads);
    press(0, 0);
    move(58, 50);
    expect(cells.get('0,0')!.classList.contains('is-drag-source')).toBe(false);
  });
});
