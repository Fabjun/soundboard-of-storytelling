/**
 * @fileoverview padSize — unit tests: pad size limits, columns per row, old decks (ADR-0075)
 *
 * Edge-case checklist: inside, below, above the limits, between steps; not a number, NaN,
 * Infinity, a word; columns at the phone width (4), a wide window, exactly fitting, a width
 * smaller than one pad (1 column), unknown width; a deck with px stays the same object, an old
 * word becomes the default, a number off the steps is put on them.
 */

import {
  PAD_SIZE,
  clampPadSize,
  migrateDeck,
  padColumns,
  type StoredDeck,
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

describe('migrateDeck', () => {
  const deck = (padSize: unknown): StoredDeck => ({
    id: 'd',
    name: 'Deck',
    order: 0,
    gridConfig: { cols: 4, rows: 4, gap: 8, padSize },
    placements: [],
  });

  it('keeps a deck that has a size in px — the same object', () => {
    const d = deck(120);
    expect(migrateDeck(d)).toBe(d);
  });

  it("turns an old word ('md', '1fr') into the default", () => {
    expect(migrateDeck(deck('md')).gridConfig.padSize).toBe(PAD_SIZE.default);
    expect(migrateDeck(deck('1fr')).gridConfig.padSize).toBe(PAD_SIZE.default);
  });

  it('puts a number off the steps or outside the limits on them', () => {
    expect(migrateDeck(deck(90)).gridConfig.padSize).toBe(92);
    expect(migrateDeck(deck(2)).gridConfig.padSize).toBe(PAD_SIZE.min);
  });
});
