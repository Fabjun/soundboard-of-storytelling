/**
 * @fileoverview boardModel — pad pool, decks, placements, quick access (ADR-0048, Slice 9c)
 * Cases chosen with the edge-case checklist (docs/development/testing.md): nothing / one / many,
 * references, duplicates, order. Invariants over random sequences: boardModel.property.test.ts.
 */

import { describe, expect, it } from 'vitest';
import type { Board, ComboPad, Pad, SinglePad } from '../../src/types';
import {
  DEFAULT_GRID,
  addDeck,
  addPadToDeck,
  addPadToFreeCell,
  addPadToPool,
  boardProblems,
  deckCount,
  deckPads,
  deleteDeck,
  deletePad,
  duplicateDeck,
  findDeck,
  nextDeckName,
  nextDeckOrder,
  placeInDeck,
  poolByName,
  poolLayout,
  removeFromDeck,
  renameDeck,
  setBoardPadSize,
  restoreDeck,
  setPlacementHotkey,
  setPlacements,
  updatePad,
  parseBoard,
  withNewIds,
} from '../../src/lib/boardModel';

const grid = { cols: 4, rows: 4, gap: 4 };

function emptyBoard(): Board {
  return {
    id: 'b',
    name: 'Board',
    themeId: 'hearth',
    pads: [],
    decks: [
      { id: 'd1', name: 'Deck 1', order: 0, gridConfig: grid, placements: [] },
      { id: 'd2', name: 'Deck 2', order: 1, gridConfig: grid, placements: [] },
    ],
    padSize: 88,
    quickAccess: [],
  };
}

const single = (id: string): SinglePad => ({
  id,
  type: 'single',
  files: [],
  order: 'sequential',
  name: id,
  volume: 80,
  fadeIn: 0,
  fadeOut: 0,
});

describe('adding and showing pads', () => {
  it('a new pad goes into the pool and is placed in exactly one deck', () => {
    const b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 1, row: 2 });
    expect(b.pads.map((p) => p.id)).toEqual(['a']);
    expect(findDeck(b, 'd1')!.placements).toEqual([{ padId: 'a', position: { col: 1, row: 2 } }]);
    expect(findDeck(b, 'd2')!.placements).toEqual([]);
    expect(boardProblems(b)).toEqual([]);
  });

  it('deckPads pairs placements with pool pads and skips placements of unknown pads', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = setPlacements(b, 'd1', [
      ...findDeck(b, 'd1')!.placements,
      { padId: 'ghost', position: { col: 1, row: 0 } },
    ]);
    expect(deckPads(b, findDeck(b, 'd1')!).map((e) => e.pad.id)).toEqual(['a']);
  });

  it('an empty board has no problems', () => {
    expect(boardProblems(emptyBoard())).toEqual([]);
  });
});

describe('editing', () => {
  it('editing a pad changes it in every deck that places it', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = duplicateDeck(b, 'd1', 'd3', 'Deck 1 (copy)');
    b = updatePad(b, { ...single('a'), name: 'Thunder' });
    for (const deck of b.decks.filter((d) => d.placements.length))
      expect(deckPads(b, deck)[0].pad.name).toBe('Thunder');
  });

  it('a key belongs to the placement: set in one deck, absent in the other', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = duplicateDeck(b, 'd1', 'd3', 'copy');
    b = setPlacementHotkey(b, 'd1', 'a', 'K1');
    expect(findDeck(b, 'd1')!.placements[0].hotkey).toBe('K1');
    expect(findDeck(b, 'd3')!.placements[0].hotkey).toBeUndefined();
    b = setPlacementHotkey(b, 'd1', 'a', undefined);
    expect('hotkey' in findDeck(b, 'd1')!.placements[0]).toBe(false);
  });

  it('a key another pad of the deck holds moves over; other keys and other decks stay', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToDeck(b, 'd1', single('b'), { col: 1, row: 0 });
    b = addPadToDeck(b, 'd1', single('c'), { col: 2, row: 0 });
    b = placeInDeck(b, 'd2', 'a');
    b = setPlacementHotkey(b, 'd1', 'a', 'Numpad1');
    b = setPlacementHotkey(b, 'd1', 'c', 'Numpad3');
    b = setPlacementHotkey(b, 'd2', 'a', 'Numpad1');
    b = setPlacementHotkey(b, 'd1', 'b', 'Numpad1');
    const keys = (deckId: string) =>
      Object.fromEntries(findDeck(b, deckId)!.placements.map((p) => [p.padId, p.hotkey]));
    expect(keys('d1')).toEqual({ a: undefined, b: 'Numpad1', c: 'Numpad3' });
    expect('hotkey' in findDeck(b, 'd1')!.placements[0]).toBe(false);
    expect(keys('d2')).toEqual({ a: 'Numpad1' });
    // clearing one pad's key leaves the others alone
    b = setPlacementHotkey(b, 'd1', 'b', undefined);
    expect(keys('d1')).toEqual({ a: undefined, b: undefined, c: 'Numpad3' });
  });
});

describe('deleting a pad', () => {
  it('removes it from the pool, every deck, the quick-access bar and combo steps', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToDeck(b, 'd1', single('b'), { col: 1, row: 0 });
    b = duplicateDeck(b, 'd1', 'd3', 'copy');
    const combo: ComboPad = {
      ...single('c'),
      type: 'combo',
      steps: [{ padIds: ['a', 'b'] }, { padIds: ['a'], duration: 2 }],
    } as ComboPad;
    b = addPadToDeck(b, 'd2', combo, { col: 0, row: 0 });
    b = { ...b, quickAccess: [{ padId: 'a', hotkey: 'Q1' }, { padId: 'b' }] };
    b = deletePad(b, 'a');
    expect(b.pads.map((p) => p.id)).toEqual(['b', 'c']);
    expect(b.decks.flatMap((d) => d.placements.map((p) => p.padId))).not.toContain('a');
    expect(b.quickAccess).toEqual([{ padId: 'b' }]);
    const steps = (b.pads.find((p) => p.id === 'c') as ComboPad).steps;
    expect(steps).toEqual([{ padIds: ['b'] }, { padIds: [], duration: 2 }]); // timing kept
    expect(boardProblems(b)).toEqual([]);
  });

  it('deleting an unknown pad changes nothing', () => {
    const b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    const after = deletePad(b, 'nope');
    expect(after.pads).toEqual(b.pads);
    expect(after.decks).toEqual(b.decks);
  });
});

describe('decks', () => {
  it('deckCount counts the decks that place a pad (0, 1, many)', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = { ...b, pads: [...b.pads, single('z')] }; // in the pool, in no deck
    expect(deckCount(b, 'z')).toBe(0);
    expect(deckCount(b, 'a')).toBe(1);
    b = duplicateDeck(b, 'd1', 'd3', 'copy');
    expect(deckCount(b, 'a')).toBe(2);
  });

  it('duplicating places the same pads (no copies); the copy comes directly after the original', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 2, row: 3 });
    b = duplicateDeck(b, 'd1', 'd3', 'Deck 1 · 2');
    expect(b.pads).toHaveLength(1);
    expect([...b.decks].sort((x, y) => x.order - y.order).map((d) => [d.id, d.order])).toEqual([
      ['d1', 0],
      ['d3', 1],
      ['d2', 2],
    ]);
    expect(boardProblems(b)).toEqual([]);
    expect(findDeck(b, 'd3')!.placements).toEqual(findDeck(b, 'd1')!.placements);
    expect(findDeck(b, 'd3')!.placements[0].position).not.toBe(
      findDeck(b, 'd1')!.placements[0].position,
    );
  });

  it('duplicating the last deck puts the copy at the end; gaps in the order numbers stay valid', () => {
    let b = duplicateDeck(emptyBoard(), 'd2', 'd3', 'copy');
    expect([...b.decks].sort((x, y) => x.order - y.order).map((d) => d.id)).toEqual([
      'd1',
      'd2',
      'd3',
    ]);
    b = {
      ...emptyBoard(),
      decks: [{ ...emptyBoard().decks[0] }, { ...emptyBoard().decks[1], order: 5 }],
    };
    b = duplicateDeck(b, 'd1', 'd3', 'copy');
    expect(b.decks.map((d) => [d.id, d.order])).toEqual([
      ['d1', 0],
      ['d2', 6],
      ['d3', 1],
    ]);
    expect(boardProblems(b)).toEqual([]);
  });

  it('duplicating an unknown deck changes nothing', () => {
    const b = emptyBoard();
    expect(duplicateDeck(b, 'nope', 'x', 'x')).toBe(b);
  });

  it('a new deck is empty and goes to the end', () => {
    const b = addDeck(emptyBoard(), { id: 'd9', name: 'New', gridConfig: grid });
    expect(findDeck(b, 'd9')).toEqual({
      id: 'd9',
      name: 'New',
      order: 2,
      gridConfig: grid,
      placements: [],
    });
  });

  it('deleting a deck keeps its pads in the pool', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = deleteDeck(b, 'd1');
    expect(b.decks.map((d) => d.id)).toEqual(['d2']);
    expect(b.pads.map((p: Pad) => p.id)).toEqual(['a']);
    expect(deckCount(b, 'a')).toBe(0);
  });
});

describe('boardProblems finds broken boards', () => {
  it('unknown pad, double placement, shared cell, cell outside the grid', () => {
    const b: Board = {
      ...emptyBoard(),
      pads: [single('a')],
      decks: [
        {
          id: 'd1',
          name: 'x',
          order: 0,
          gridConfig: { ...grid, cols: 2, rows: 1 },
          placements: [
            { padId: 'a', position: { col: 0, row: 0 } },
            { padId: 'a', position: { col: 0, row: 0 } },
            { padId: 'ghost', position: { col: 2, row: 0 } },
          ],
        },
      ],
      quickAccess: [{ padId: 'ghost' }],
    };
    expect(boardProblems(b)).toEqual([
      'deck d1: pad a placed twice',
      'deck d1: two pads in cell 0,0',
      'deck d1: placement of unknown pad ghost',
      'deck d1: cell 2,0 outside the 2×1 grid',
      'quick access: unknown pad ghost',
    ]);
  });
});

describe('remove from deck, place in deck, All pads (Slice 9e)', () => {
  it('removing from one deck keeps the pad in the pool and in other decks', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = duplicateDeck(b, 'd1', 'd3', 'copy');
    b = removeFromDeck(b, 'd1', 'a');
    expect(findDeck(b, 'd1')!.placements).toEqual([]);
    expect(findDeck(b, 'd3')!.placements.map((p) => p.padId)).toEqual(['a']);
    expect(b.pads.map((p) => p.id)).toEqual(['a']);
    expect(boardProblems(b)).toEqual([]);
  });

  it('placing puts the pad on the next free cell (row-major)', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToDeck(b, 'd2', single('x'), { col: 0, row: 0 });
    b = placeInDeck(b, 'd2', 'a');
    expect(findDeck(b, 'd2')!.placements.find((p) => p.padId === 'a')!.position).toEqual({
      col: 1,
      row: 0,
    });
    expect(boardProblems(b)).toEqual([]);
  });

  it('placing changes nothing when the pad is already there, unknown, the deck unknown or full', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    expect(placeInDeck(b, 'd1', 'a')).toBe(b); // already placed
    expect(placeInDeck(b, 'd2', 'ghost')).toBe(b); // unknown pad
    expect(placeInDeck(b, 'nope', 'a')).toBe(b); // unknown deck
    b = {
      ...b,
      decks: b.decks.map((d) => ({ ...d, gridConfig: { ...d.gridConfig, cols: 1, rows: 1 } })),
    };
    b = addPadToDeck(b, 'd2', single('x'), { col: 0, row: 0 });
    expect(placeInDeck(b, 'd2', 'a')).toBe(b); // 1×1 grid already full
  });

  it('All pads lists the whole pool by name, case-insensitive, ties by id', () => {
    let b = addPadToDeck(
      emptyBoard(),
      'd1',
      { ...single('2'), name: 'thunder' },
      { col: 0, row: 0 },
    );
    b = {
      ...b,
      pads: [...b.pads, { ...single('1'), name: 'Thunder' }, { ...single('3'), name: 'Applause' }],
    };
    expect(poolByName(b).map((p) => p.id)).toEqual(['3', '1', '2']);
    expect(poolByName(emptyBoard())).toEqual([]);
  });

  it('the All pads layout fills rows left to right without gaps and has no keys', () => {
    const b = {
      ...emptyBoard(),
      pads: ['e', 'a', 'd', 'b', 'c'].map(single),
    };
    const layout = poolLayout(poolByName(b), 4);
    expect(
      layout.map((e) => [e.pad.id, e.placement.position.col, e.placement.position.row]),
    ).toEqual([
      ['a', 0, 0],
      ['b', 1, 0],
      ['c', 2, 0],
      ['d', 3, 0],
      ['e', 0, 1],
    ]);
    expect(layout.every((e) => e.placement.hotkey === undefined)).toBe(true);
    expect(poolLayout([], 4)).toEqual([]);
  });

  it('the default grid is 4×4 — the size of every new deck and the width of All pads', () => {
    expect(DEFAULT_GRID).toEqual({ cols: 4, rows: 4, gap: 8 });
  });
});

describe('changes applied to the latest board (board writes)', () => {
  it('adds a pad on the preferred cell when free, else on the next free cell', () => {
    let b = addPadToFreeCell(emptyBoard(), 'd1', single('a'), { col: 2, row: 1 });
    expect(findDeck(b, 'd1')!.placements[0].position).toEqual({ col: 2, row: 1 });
    b = addPadToFreeCell(b, 'd1', single('b'), { col: 2, row: 1 }); // taken
    expect(findDeck(b, 'd1')!.placements[1].position).toEqual({ col: 0, row: 0 });
    b = addPadToFreeCell(b, 'd1', single('c'), { col: 9, row: 0 }); // outside the grid
    expect(findDeck(b, 'd1')!.placements[2].position).toEqual({ col: 1, row: 0 });
    expect(boardProblems(b)).toEqual([]);
  });

  it('a pad added to the pool only sits in no deck', () => {
    const b = addPadToPool(emptyBoard(), single('a'));
    expect(b.pads.map((p) => p.id)).toEqual(['a']);
    expect(b.decks.every((d) => d.placements.length === 0)).toBe(true);
    expect(deckCount(b, 'a')).toBe(0);
  });

  it('two adds in a row on the same board never share a cell', () => {
    let b = addPadToFreeCell(emptyBoard(), 'd1', single('a'));
    b = addPadToFreeCell(b, 'd1', single('b'));
    expect(findDeck(b, 'd1')!.placements.map((p) => p.position)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
  });

  it('adding changes nothing when the deck is full or unknown', () => {
    const tiny = {
      ...emptyBoard(),
      decks: emptyBoard().decks.map((d) => ({ ...d, gridConfig: { ...grid, cols: 1, rows: 1 } })),
    };
    const one = addPadToFreeCell(tiny, 'd1', single('a'));
    expect(addPadToFreeCell(one, 'd1', single('b'))).toBe(one);
    expect(addPadToFreeCell(one, 'nope', single('b'))).toBe(one);
  });

  it('the next deck order is highest + 1, not the deck count', () => {
    expect(nextDeckOrder({ ...emptyBoard(), decks: [] })).toBe(0);
    const b = deleteDeck(
      addDeck(emptyBoard(), { id: 'd3', name: 'Deck 3', gridConfig: grid }),
      'd2',
    );
    expect(b.decks.map((d) => d.order)).toEqual([0, 2]);
    expect(nextDeckOrder(b)).toBe(3); // the count (2) is taken by d3
  });

  it('a new deck name takes the smallest unused "Deck N"', () => {
    expect(nextDeckName({ ...emptyBoard(), decks: [] })).toBe('Deck 1');
    expect(nextDeckName(emptyBoard())).toBe('Deck 3'); // Deck 1, Deck 2
    expect(nextDeckName(deleteDeck(emptyBoard(), 'd1'))).toBe('Deck 1'); // gap filled
    expect(nextDeckName(renameDeck(emptyBoard(), 'd1', 'Night'))).toBe('Deck 1');
  });

  it("sets the board's pad size, inside the slider limits; unchanged → the same board", () => {
    const before = emptyBoard();
    const b = setBoardPadSize(before, 120);
    expect(b.padSize).toBe(120);
    expect(b.decks).toBe(before.decks); // one size for the board; the decks are not touched
    expect(setBoardPadSize(b, 999).padSize).toBe(160);
    expect(setBoardPadSize(b, 90).padSize).toBe(92);
    expect(setBoardPadSize(b, 120)).toBe(b);
  });

  it('renames one deck only', () => {
    const b = renameDeck(emptyBoard(), 'd2', 'Night');
    expect(b.decks.map((d) => d.name)).toEqual(['Deck 1', 'Night']);
  });

  it('undo of a deck delete keeps changes made in between and drops pads deleted meanwhile', () => {
    let b = addPadToDeck(emptyBoard(), 'd2', single('a'), { col: 0, row: 0 });
    b = addPadToDeck(b, 'd2', single('x'), { col: 1, row: 0 });
    const deleted = findDeck(b, 'd2')!;
    b = deleteDeck(b, 'd2');
    b = renameDeck(b, 'd1', 'Renamed meanwhile');
    b = deletePad(b, 'x');
    b = restoreDeck(b, deleted);
    expect(findDeck(b, 'd1')!.name).toBe('Renamed meanwhile');
    expect(findDeck(b, 'd2')!.placements.map((p) => p.padId)).toEqual(['a']);
    expect(findDeck(b, 'd2')!.order).toBe(1);
    expect(boardProblems(b)).toEqual([]);
  });

  it('undo puts the deck last when its order number was taken meanwhile; no-op when it exists', () => {
    const deleted = findDeck(emptyBoard(), 'd2')!;
    let b = deleteDeck(emptyBoard(), 'd2');
    b = { ...b, decks: [...b.decks, { ...deleted, id: 'd3', name: 'New' }] }; // takes order 1
    b = restoreDeck(b, deleted);
    expect(findDeck(b, 'd2')!.order).toBe(2);
    expect(boardProblems(b)).toEqual([]);
    expect(restoreDeck(b, deleted)).toBe(b);
  });

  it('boardProblems finds duplicate deck ids and shared order numbers', () => {
    const b = emptyBoard();
    expect(
      boardProblems({ ...b, decks: [b.decks[0], { ...b.decks[1], id: 'd1', order: 0 }] }),
    ).toEqual(['duplicate deck ids', 'two decks share an order number']);
  });
});

// Cases added for surviving mutants (local mutation run 2026-10-02, boardModel 92.76 %).
describe('edges found by mutation testing', () => {
  it('a free preferred cell is used even when other cells are taken; cells on row/col 0 count', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToFreeCell(b, 'd1', single('b'), { col: 0, row: 1 }); // same column, other row
    b = addPadToFreeCell(b, 'd1', single('c'), { col: 1, row: 0 }); // same row, other column
    expect(findDeck(b, 'd1')!.placements.map((p) => [p.padId, p.position])).toEqual([
      ['a', { col: 0, row: 0 }],
      ['b', { col: 0, row: 1 }],
      ['c', { col: 1, row: 0 }],
    ]);
    b = addPadToFreeCell(b, 'd1', single('d'), { col: 0, row: 4 }); // below the grid → next free
    expect(findDeck(b, 'd1')!.placements[3].position).toEqual({ col: 2, row: 0 });
  });

  it('a free preferred cell on row 0 that is not the next free cell is used', () => {
    // (0,0) taken: the next free cell would be (1,0) — so (3,0) proves the preference counts
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToFreeCell(b, 'd1', single('b'), { col: 3, row: 0 });
    expect(findDeck(b, 'd1')!.placements[1].position).toEqual({ col: 3, row: 0 });
  });

  it('a preferred cell left of or above the grid falls back to the next free cell', () => {
    let b = addPadToFreeCell(emptyBoard(), 'd1', single('a'), { col: -1, row: 0 });
    b = addPadToFreeCell(b, 'd1', single('b'), { col: 0, row: -1 });
    expect(findDeck(b, 'd1')!.placements.map((p) => p.position)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
    expect(boardProblems(b)).toEqual([]);
  });

  it('placing a pad that is already in a deck with other pads changes nothing', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToDeck(b, 'd1', single('b'), { col: 1, row: 0 });
    expect(placeInDeck(b, 'd1', 'a')).toBe(b);
  });

  it('a key and a removal touch only their own placement', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToDeck(b, 'd1', single('b'), { col: 1, row: 0 });
    b = setPlacementHotkey(b, 'd1', 'a', 'K1');
    expect(findDeck(b, 'd1')!.placements.map((p) => p.hotkey)).toEqual(['K1', undefined]);
    b = removeFromDeck(b, 'd1', 'a');
    expect(findDeck(b, 'd1')!.placements.map((p) => p.padId)).toEqual(['b']);
  });

  it('undo keeps the old order number when no other deck has it', () => {
    const b = { ...emptyBoard(), decks: [{ ...emptyBoard().decks[0], order: 5 }] };
    const deleted = { ...emptyBoard().decks[1], order: 2 };
    expect(findDeck(restoreDeck(b, deleted), 'd2')!.order).toBe(2);
  });

  it('boardProblems finds duplicate pad ids, cells left of / above / below the grid and combo references', () => {
    const combo: ComboPad = {
      ...single('c'),
      type: 'combo',
      steps: [{ padIds: ['ghost'] }],
    };
    const b: Board = {
      ...emptyBoard(),
      pads: [single('a'), single('a'), combo],
      decks: [
        {
          id: 'd1',
          name: 'x',
          order: 0,
          gridConfig: { ...grid, cols: 2, rows: 2 },
          placements: [
            { padId: 'a', position: { col: -1, row: 0 } },
            { padId: 'c', position: { col: 0, row: -1 } },
          ],
        },
        {
          id: 'd2',
          name: 'y',
          order: 1,
          gridConfig: { ...grid, cols: 2, rows: 2 },
          placements: [{ padId: 'a', position: { col: 0, row: 2 } }],
        },
      ],
    };
    expect(boardProblems(b)).toEqual([
      'duplicate pad ids in the pool',
      'deck d1: cell -1,0 outside the 2×2 grid',
      'deck d1: cell 0,-1 outside the 2×2 grid',
      'deck d2: cell 0,2 outside the 2×2 grid',
      'combo c: step references unknown pad ghost',
    ]);
  });
});

describe('withNewIds (import)', () => {
  it('renews every id; placements, quick access and combo steps follow; content stays', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    const combo: ComboPad = {
      id: 'c',
      type: 'combo',
      name: 'c',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      steps: [{ padIds: ['a', 'ghost'] }],
    };
    b = addPadToDeck(b, 'd2', combo, { col: 1, row: 0 });
    b = { ...b, quickAccess: [{ padId: 'a', hotkey: 'K1' }] };
    let n = 0;
    const c = withNewIds(b, () => `x${n++}`);
    const [a, copied] = c.pads;
    expect(
      [c.id, ...c.decks.map((d) => d.id), a.id, copied.id].every((id) => id.startsWith('x')),
    ).toBe(true);
    expect(new Set([c.id, ...c.decks.map((d) => d.id), a.id, copied.id]).size).toBe(5);
    expect(c.decks[0].placements[0]).toEqual({ padId: a.id, position: { col: 0, row: 0 } });
    expect(c.decks[1].placements[0].padId).toBe(copied.id);
    expect(c.quickAccess).toEqual([{ padId: a.id, hotkey: 'K1' }]);
    expect(copied).toMatchObject({ type: 'combo', steps: [{ padIds: [a.id, 'ghost'] }] }); // unknown stays
    expect(c.name).toBe(b.name);
    expect(a.name).toBe('a');
  });
});

describe('updatePad', () => {
  it('replaces only the pad with that id', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 0, row: 0 });
    b = addPadToDeck(b, 'd1', single('b'), { col: 1, row: 0 });
    b = updatePad(b, { ...single('a'), name: 'changed' });
    expect(b.pads.map((p) => p.name)).toEqual(['changed', 'b']);
  });
});

describe('parseBoard (untrusted boards from a backup file)', () => {
  /** A valid board using every optional field once. */
  const valid = () => ({
    id: 'b',
    name: 'Night',
    themeId: 'hearth',
    pads: [
      {
        id: 'p',
        type: 'single',
        name: 'Owl',
        volume: 80,
        fadeIn: 0,
        fadeOut: 1,
        icons: ['nikoichu:dragon', 'kenney-1bit:bat'],
        color: 'red',
        files: [{ hash: 'h1', trimStart: 1, trimEnd: 2 }],
        order: 'sequential',
      },
      {
        id: 'l',
        type: 'loop',
        name: 'Rain',
        volume: 80,
        fadeIn: 0,
        fadeOut: 0,
        files: [],
        order: 'shuffle',
        repeat: 3,
      },
      {
        id: 'c',
        type: 'combo',
        name: 'Day',
        volume: 80,
        fadeIn: 0,
        fadeOut: 0,
        steps: [{ padIds: ['p'], duration: 2, stopAll: true, fadeOutAll: 1.5 }, { padIds: [] }],
      },
    ],
    decks: [
      {
        id: 'd',
        name: 'Deck 1',
        order: 0,
        gridConfig: { cols: 4, rows: 4, gap: 8 },
        placements: [
          { padId: 'p', position: { col: 0, row: 0 }, hotkey: 'K1' },
          { padId: 'c', position: { col: 1, row: 0 } },
        ],
      },
    ],
    padSize: 88,
    quickAccess: [{ padId: 'l', hotkey: 'K2' }, { padId: 'c' }],
  });

  it('accepts a valid board with every optional field, and keeps only the board fields', () => {
    expect(parseBoard({ ...valid(), extra: 1 })).toEqual(valid());
  });

  it("a board before 3.0.178 takes its first deck's pad size; an old word gives the default", () => {
    const { padSize: _, ...old } = valid();
    const sized = (deckSize: unknown) => ({
      ...old,
      decks: old.decks.map((d) => ({ ...d, gridConfig: { ...d.gridConfig, padSize: deckSize } })),
    });
    expect(parseBoard(sized(120))).toEqual({ ...valid(), padSize: 120 });
    expect(parseBoard(sized('md'))).toEqual(valid());
    expect(parseBoard(old)).toEqual(valid());
  });

  it('accepts a pad stored before ADR-0068 and returns it converted', () => {
    const legacy = withPad(valid(), 0, { files: ['h1'], trimStart: 1, trimEnd: 2 });
    expect(parseBoard(legacy)).toEqual(valid());
  });

  it("turns V1's icon id kept in iconRef into an icon key; drops an id the collection lacks (ADR-0070)", () => {
    const { icons: _, ...noIcons } = valid().pads[0];
    const board = (iconRef: string) => ({
      ...valid(),
      pads: [{ ...noIcons, iconRef }, ...valid().pads.slice(1)],
    });
    expect(parseBoard(board('px-rpg-creature-archetypes-dragon'))?.pads[0]).toEqual({
      ...noIcons,
      icons: ['nikoichu:dragon'],
    });
    expect(parseBoard(board('owl'))?.pads[0]).toEqual(noIcons);
  });

  /** The board with one pad changed — the others stay, so only that pad's field is wrong. */
  const withPad = (b: ReturnType<typeof valid>, i: number, patch: Record<string, unknown>) => ({
    ...b,
    pads: b.pads.map((p, k) => (k === i ? { ...p, ...patch } : p)),
  });

  /** [description, change] — each one makes the board invalid. */
  const broken: [string, (b: ReturnType<typeof valid>) => unknown][] = [
    ['not an object', () => 'board'],
    ['an array', () => []],
    ['id missing', (b) => ({ ...b, id: 1 })],
    ['name missing', (b) => ({ ...b, name: undefined })],
    ['themeId missing', (b) => ({ ...b, themeId: null })],
    ['pads not an array', (b) => ({ ...b, pads: {} })],
    ['decks not an array', (b) => ({ ...b, decks: 'd' })],
    ['quickAccess not an array', (b) => ({ ...b, quickAccess: undefined })],
    ['pad not an object', (b) => ({ ...b, pads: [...b.pads, null] })],
    ['pad id', (b) => withPad(b, 0, { id: 5 })],
    ['pad name', (b) => withPad(b, 0, { name: null })],
    ['pad volume', (b) => withPad(b, 0, { volume: '80' })],
    ['pad fadeIn', (b) => withPad(b, 0, { fadeIn: null })],
    ['pad fadeOut', (b) => withPad(b, 0, { fadeOut: undefined })],
    ['pad iconRef', (b) => withPad(b, 0, { iconRef: 1 })],
    ['pad icons not an array', (b) => withPad(b, 0, { icons: 'nikoichu:dragon' })],
    ['pad icon key malformed', (b) => withPad(b, 0, { icons: ['Dragon'] })],
    ['pad more than 4 icons', (b) => withPad(b, 0, { icons: Array(5).fill('nikoichu:dragon') })],
    ['pad color', (b) => withPad(b, 0, { color: false })],
    ['pad addedAt', (b) => withPad(b, 0, { addedAt: 'yesterday' })],
    ['pad modifiedAt', (b) => withPad(b, 0, { modifiedAt: null })],
    ['pad type', (b) => withPad(b, 0, { type: 'playlist' })],
    ['pad files', (b) => withPad(b, 0, { files: ['h1', 2] })],
    ['pad files mixed shapes', (b) => withPad(b, 0, { files: ['h1', { hash: 'h2' }] })],
    ['pad files missing', (b) => withPad(b, 0, { files: undefined })],
    ['pad order', (b) => withPad(b, 0, { order: 'random' })],
    ['file hash', (b) => withPad(b, 0, { files: [{ trimStart: 1 }] })],
    ['file trimStart', (b) => withPad(b, 0, { files: [{ hash: 'h1', trimStart: '1' }] })],
    ['file trimEnd', (b) => withPad(b, 0, { files: [{ hash: 'h1', trimEnd: null }] })],
    ['old pad trimStart', (b) => withPad(b, 0, { files: ['h1'], trimStart: '1' })],
    ['old pad trimEnd', (b) => withPad(b, 0, { files: ['h1'], trimEnd: null })],
    ['loop files', (b) => withPad(b, 1, { files: 'h' })],
    ['loop repeat 0', (b) => withPad(b, 1, { repeat: 0 })],
    ['loop repeat not whole', (b) => withPad(b, 1, { repeat: 1.5 })],
    ['loop repeat above 999', (b) => withPad(b, 1, { repeat: 1000 })],
    ['loop repeat not a number', (b) => withPad(b, 1, { repeat: '3' })],
    ['single with a repeat', (b) => withPad(b, 0, { repeat: 2 })],
    ['combo steps', (b) => withPad(b, 2, { steps: undefined })],
    ['combo step', (b) => withPad(b, 2, { steps: [5] })],
    ['step padIds', (b) => withPad(b, 2, { steps: [{ padIds: 'p' }] })],
    ['step duration', (b) => withPad(b, 2, { steps: [{ padIds: [], duration: '2' }] })],
    ['step stopAll', (b) => withPad(b, 2, { steps: [{ padIds: [], stopAll: 1 }] })],
    ['step fadeOutAll', (b) => withPad(b, 2, { steps: [{ padIds: [], fadeOutAll: true }] })],
    ['deck not an object', (b) => ({ ...b, decks: [7] })],
    ['deck id', (b) => ({ ...b, decks: [{ ...b.decks[0], id: null }] })],
    ['deck name', (b) => ({ ...b, decks: [{ ...b.decks[0], name: 3 }] })],
    ['deck order', (b) => ({ ...b, decks: [{ ...b.decks[0], order: '0' }] })],
    ['grid missing', (b) => ({ ...b, decks: [{ ...b.decks[0], gridConfig: null }] })],
    [
      'grid cols',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], gridConfig: { ...b.decks[0].gridConfig, cols: '4' } }],
      }),
    ],
    [
      'grid rows',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], gridConfig: { ...b.decks[0].gridConfig, rows: null } }],
      }),
    ],
    [
      'grid gap',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], gridConfig: { ...b.decks[0].gridConfig, gap: undefined } }],
      }),
    ],
    [
      'grid padSize',
      (b) => ({
        ...b,
        // A deck's own size before 3.0.178: a number (px) or an old word is fine, nothing else
        decks: [{ ...b.decks[0], gridConfig: { ...b.decks[0].gridConfig, padSize: true } }],
      }),
    ],
    ['board padSize', (b) => ({ ...b, padSize: '88' })],
    ['placements', (b) => ({ ...b, decks: [{ ...b.decks[0], placements: {} }] })],
    ['placement', (b) => ({ ...b, decks: [{ ...b.decks[0], placements: ['p'] }] })],
    [
      'placement padId',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], placements: [{ padId: 1, position: { col: 0, row: 0 } }] }],
      }),
    ],
    [
      'placement position',
      (b) => ({ ...b, decks: [{ ...b.decks[0], placements: [{ padId: 'p', position: [0, 0] }] }] }),
    ],
    [
      'placement col',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], placements: [{ padId: 'p', position: { col: '0', row: 0 } }] }],
      }),
    ],
    [
      'placement row',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], placements: [{ padId: 'p', position: { col: 0 } }] }],
      }),
    ],
    [
      'placement hotkey',
      (b) => ({
        ...b,
        decks: [
          { ...b.decks[0], placements: [{ padId: 'p', position: { col: 0, row: 0 }, hotkey: 1 }] },
        ],
      }),
    ],
    ['placement null', (b) => ({ ...b, decks: [{ ...b.decks[0], placements: [null] }] })],
    [
      'one valid and one broken placement',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], placements: [...b.decks[0].placements, { padId: 'l' }] }],
      }),
    ],
    ['quick access entry', (b) => ({ ...b, quickAccess: [null] })],
    ['quick access padId', (b) => ({ ...b, quickAccess: [{ padId: 2 }] })],
    ['quick access hotkey', (b) => ({ ...b, quickAccess: [{ padId: 'l', hotkey: false }] })],
    [
      'inconsistent (unknown pad placed)',
      (b) => ({
        ...b,
        decks: [{ ...b.decks[0], placements: [{ padId: 'ghost', position: { col: 0, row: 0 } }] }],
      }),
    ],
  ];

  it.each(broken)('rejects: %s', (_, change) => {
    expect(parseBoard(change(valid()))).toBeNull();
  });
});
