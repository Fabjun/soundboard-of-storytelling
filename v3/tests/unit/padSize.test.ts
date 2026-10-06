/**
 * @fileoverview padSize — unit tests: pad size limits, columns per row, old boards (ADR-0075)
 *
 * Edge-case checklist: inside, below, above the limits, between steps; not a number, NaN,
 * Infinity, a word; columns at the phone width (4), a wide window, exactly fitting, a width
 * smaller than one pad (1 column), unknown width; a board with its size stays the same object, the
 * first deck (lowest order) gives the size, an old word / no size / no deck gives the default, the
 * board's own size wins, a number off the steps is put on them.
 */

import {
  PAD_SIZE,
  clampPadSize,
  migratePadSize,
  padColumns,
  type StoredDeck,
  type StoredSizeBoard,
} from '../../src/lib/padSize';

describe('clampPadSize', () => {
  it('keeps a value inside the limits and on the steps', () => {
    expect(clampPadSize(88)).toBe(88);
    expect(clampPadSize(PAD_SIZE.min)).toBe(PAD_SIZE.min);
    expect(clampPadSize(PAD_SIZE.max)).toBe(PAD_SIZE.max);
  });

  it('pulls values outside the limits to the nearest limit', () => {
    expect(clampPadSize(10)).toBe(PAD_SIZE.min);
    expect(clampPadSize(999)).toBe(PAD_SIZE.max);
  });

  it('puts a value between steps on the nearest step', () => {
    expect(clampPadSize(89)).toBe(88);
    expect(clampPadSize(91)).toBe(92);
  });

  it('gives the default for anything that is not a finite number', () => {
    for (const v of ['md', '1fr', undefined, null, Number.NaN, Number.POSITIVE_INFINITY])
      expect(clampPadSize(v)).toBe(PAD_SIZE.default);
  });
});

describe('padColumns', () => {
  it('fits 4 pads in a row on a phone (390px window, list folded: 322px content)', () => {
    const r = padColumns({ width: 322, gap: 8, padSize: 88 });
    expect(r?.cols).toBe(4);
    expect(r?.side).toBeCloseTo((322 - 24) / 4, 5);
  });

  it('takes as few columns as keep every pad at or below the pad size on a wide window', () => {
    const r = padColumns({ width: 1212, gap: 8, padSize: 88 })!;
    expect(r.side).toBeLessThanOrEqual(88);
    // one column fewer would make the pads larger than the pad size
    expect((1212 - 8 * (r.cols - 2)) / (r.cols - 1)).toBeGreaterThan(88);
  });

  it('gives exactly the pad size when the width fits it exactly', () => {
    expect(padColumns({ width: 4 * 88 + 3 * 8, gap: 8, padSize: 88 })).toEqual({
      cols: 4,
      side: 88,
    });
  });

  it('takes one column when the width is smaller than one pad', () => {
    expect(padColumns({ width: 40, gap: 8, padSize: 88 })).toEqual({ cols: 1, side: 40 });
  });

  it('a larger pad size means fewer columns', () => {
    const small = padColumns({ width: 800, gap: 8, padSize: 44 })!.cols;
    const large = padColumns({ width: 800, gap: 8, padSize: 160 })!.cols;
    expect(large).toBeLessThan(small);
  });

  it('is null while the width is not known', () => {
    expect(padColumns({ width: 0, gap: 8, padSize: 88 })).toBeNull();
    expect(padColumns({ width: Number.NaN, gap: 8, padSize: 88 })).toBeNull();
    expect(padColumns({ width: 300, gap: 8, padSize: 0 })).toBeNull();
  });
});

describe('migratePadSize', () => {
  const deck = (id: string, order: number, padSize?: unknown): StoredDeck => ({
    id,
    name: id,
    order,
    gridConfig:
      padSize === undefined ? { cols: 4, rows: 4, gap: 8 } : { cols: 4, rows: 4, gap: 8, padSize },
    placements: [],
  });
  const board = (decks: StoredDeck[], padSize?: unknown): StoredSizeBoard => ({
    id: 'b',
    name: 'B',
    themeId: 't',
    pads: [],
    decks,
    quickAccess: [],
    ...(padSize === undefined ? {} : { padSize }),
  });

  it('keeps a board that has a size and decks without one — the same object', () => {
    const b = board([deck('a', 0)], 120);
    expect(migratePadSize(b)).toBe(b);
  });

  it("takes the first deck's size — the lowest order, not the first in the array", () => {
    const b = migratePadSize(board([deck('second', 1, 60), deck('first', 0, 120)]));
    expect(b.padSize).toBe(120);
    expect(b.decks.map((d) => d.gridConfig)).toEqual([
      { cols: 4, rows: 4, gap: 8 },
      { cols: 4, rows: 4, gap: 8 },
    ]);
  });

  it("turns an old word ('md', '1fr'), no size and no deck into the default", () => {
    expect(migratePadSize(board([deck('a', 0, 'md')])).padSize).toBe(PAD_SIZE.default);
    expect(migratePadSize(board([deck('a', 0, '1fr')])).padSize).toBe(PAD_SIZE.default);
    expect(migratePadSize(board([deck('a', 0)])).padSize).toBe(PAD_SIZE.default);
    expect(migratePadSize(board([])).padSize).toBe(PAD_SIZE.default);
  });

  it("keeps the board's own size over a deck's, and drops the deck's", () => {
    const b = migratePadSize(board([deck('a', 0, 60)], 120));
    expect(b.padSize).toBe(120);
    expect('padSize' in b.decks[0].gridConfig).toBe(false);
  });

  it('puts a number off the steps or outside the limits on them', () => {
    expect(migratePadSize(board([deck('a', 0, 90)])).padSize).toBe(92);
    expect(migratePadSize(board([deck('a', 0, 2)])).padSize).toBe(PAD_SIZE.min);
    expect(migratePadSize(board([], 999)).padSize).toBe(PAD_SIZE.max);
  });
});
