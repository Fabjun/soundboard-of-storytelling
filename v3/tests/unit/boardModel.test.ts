// ─────────────────────────────────────────────────────────────────────────────
// boardModel — pad pool, decks, placements, quick access (ADR-0048, Slice 9c)
// Cases chosen with the edge-case checklist (docs/development/testing.md): nothing / one / many,
// references, duplicates, order. Invariants over random sequences: boardModel.property.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, it } from 'vitest';
import type { Board, ComboPad, Pad, SinglePad } from '../../src/types';
import {
  addDeck,
  addPadToDeck,
  boardProblems,
  deckCount,
  deckPads,
  deleteDeck,
  deletePad,
  duplicateDeck,
  findDeck,
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
