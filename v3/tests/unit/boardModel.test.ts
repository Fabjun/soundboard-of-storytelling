// ─────────────────────────────────────────────────────────────────────────────
// boardModel — pad pool, decks, placements, quick access (ADR-0048, Slice 9c)
// Cases chosen with the edge-case checklist (docs/development/testing.md): nothing / one / many,
// references, duplicates, order. Invariants over random sequences: boardModel.property.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

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
  restoreDeck,
  setPlacementHotkey,
  setPlacements,
  updatePad,
} from '../../src/lib/boardModel';

const grid = { cols: 4, rows: 4, gap: 4, padSize: 'md' };

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
    quickAccess: [],
  };
}

const single = (id: string): SinglePad => ({
  id,
  type: 'single',
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

  it('duplicating places the same pads (no copies) and appends the copy at the end', () => {
    let b = addPadToDeck(emptyBoard(), 'd1', single('a'), { col: 2, row: 3 });
    b = duplicateDeck(b, 'd1', 'd3', 'Deck 1 · 2');
    expect(b.pads).toHaveLength(1);
    expect([...b.decks].sort((x, y) => x.order - y.order).map((d) => d.id)).toEqual([
      'd1',
      'd2',
      'd3',
    ]);
    expect(findDeck(b, 'd3')!.placements).toEqual(findDeck(b, 'd1')!.placements);
    expect(findDeck(b, 'd3')!.placements[0].position).not.toBe(
      findDeck(b, 'd1')!.placements[0].position,
    );
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
    const layout = poolLayout(b, 4);
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
    expect(poolLayout(emptyBoard(), 4)).toEqual([]);
  });

  it('the default grid is 4×4 — the size of every new deck and the width of All pads', () => {
    expect(DEFAULT_GRID).toEqual({ cols: 4, rows: 4, gap: 8, padSize: 'md' });
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
