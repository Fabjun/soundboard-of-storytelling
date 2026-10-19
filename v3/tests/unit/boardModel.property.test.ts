/**
 * @fileoverview boardModel — property-based tests (T11b, Slice 9c)
 *
 * Random sequences of the operations the UI performs keep every board consistent
 * (boardProblems is empty after each step), a deck takes every new pad (a full one grows a row),
 * and deleting a pad leaves no reference to it.
 * On failure fast-check prints the seed and the shrunk sequence; pass `{ seed, path }` as fc
 * options to reproduce it. Example-based tests: boardModel.test.ts.
 */

import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import type { Board, Pad } from '../../src/types';
import {
  addDeck,
  addPadToDeck,
  addPadToFreeCell,
  boardProblems,
  deleteDeck,
  deletePad,
  deletedPad,
  duplicateDeck,
  placeInDeck,
  removeFromDeck,
  renameDeck,
  restoreDeck,
  restorePad,
  setPlacementHotkey,
  updatePad,
} from '../../src/lib/boardModel';
import { indexToPos, newPad } from '../../src/lib/padUtils';

const grid = { cols: 3, rows: 2, gap: 4 }; // small grid: full decks happen often

const start = (): Board => ({
  id: 'b',
  name: 'Board',
  themeId: 'hearth',
  pads: [],
  decks: [{ id: 'start', name: 'Deck', order: 0, gridConfig: grid, placements: [] }],
  padSize: 88,
  quickAccess: [],
});

const op = fc.oneof(
  fc.record({ kind: fc.constant('add' as const), deck: fc.nat(5), combo: fc.boolean() }),
  fc.record({ kind: fc.constant('delete' as const), pad: fc.nat(9) }),
  fc.record({ kind: fc.constant('duplicate' as const), deck: fc.nat(5) }),
  fc.record({ kind: fc.constant('deleteDeck' as const), deck: fc.nat(5) }),
  fc.record({ kind: fc.constant('newDeck' as const) }),
  fc.record({ kind: fc.constant('hotkey' as const), deck: fc.nat(5), pad: fc.nat(9) }),
  fc.record({ kind: fc.constant('rename' as const), pad: fc.nat(9) }),
  fc.record({ kind: fc.constant('remove' as const), deck: fc.nat(5), pad: fc.nat(9) }),
  fc.record({ kind: fc.constant('place' as const), deck: fc.nat(5), pad: fc.nat(9) }),
  // preferred cell may lie outside the grid or be taken
  fc.record({
    kind: fc.constant('addFree' as const),
    deck: fc.nat(5),
    col: fc.integer({ min: -1, max: 4 }),
    row: fc.integer({ min: -1, max: 3 }),
  }),
  // delete a deck, delete a pad meanwhile, undo the deck delete
  fc.record({ kind: fc.constant('undoDeck' as const), deck: fc.nat(5), pad: fc.nat(9) }),
  fc.record({ kind: fc.constant('renameDeck' as const), deck: fc.nat(5) }),
  // delete a pad, change something meanwhile (fill a cell, delete a deck or another pad), undo
  fc.record({
    kind: fc.constant('undoPad' as const),
    deck: fc.nat(5),
    pad: fc.nat(9),
    meanwhile: fc.nat(3),
  }),
);

/** Applies one operation the way the UI would (free cell, existing ids) and returns the board. */
type Op = typeof op extends fc.Arbitrary<infer T> ? T : never;

function apply(b: Board, o: Op, n: number): Board {
  const deck = b.decks.length ? b.decks[('deck' in o ? o.deck : 0) % b.decks.length] : undefined;
  const pad = b.pads.length ? b.pads[('pad' in o ? o.pad : 0) % b.pads.length] : undefined;
  switch (o.kind) {
    case 'add': {
      if (!deck) return b;
      const taken = new Set(
        deck.placements.map((p) => p.position.row * grid.cols + p.position.col),
      );
      const free = Array.from({ length: grid.cols * grid.rows }, (_, i) => i).find(
        (i) => !taken.has(i),
      );
      if (free === undefined) return b;
      const created = newPad(`p${n}`, o.combo ? 'combo' : 'single', `Pad ${n}`);
      const pad: Pad =
        created.type === 'combo'
          ? { ...created, steps: [{ padIds: b.pads.slice(0, 2).map((p) => p.id) }] }
          : created;
      return addPadToDeck(b, deck.id, pad, indexToPos(free, grid.cols));
    }
    case 'delete':
      return pad ? deletePad(b, pad.id) : b;
    case 'duplicate':
      return deck ? duplicateDeck(b, deck.id, `d${n}`, `${deck.name} (copy)`) : b;
    case 'deleteDeck':
      return deck ? deleteDeck(b, deck.id) : b;
    case 'newDeck':
      return addDeck(b, { id: `d${n}`, name: `Deck ${n}`, gridConfig: grid });
    case 'hotkey':
      return deck && pad ? setPlacementHotkey(b, deck.id, pad.id, `K${n % 14}`) : b;
    case 'rename':
      return pad ? updatePad(b, { ...pad, name: `${pad.name}!` }) : b;
    case 'remove':
      return deck && pad ? removeFromDeck(b, deck.id, pad.id) : b;
    case 'place':
      return deck && pad ? placeInDeck(b, deck.id, pad.id) : b;
    case 'addFree': {
      if (!deck) return b;
      const created = newPad(`p${n}`, 'single', `Pad ${n}`);
      return addPadToFreeCell(b, deck.id, created, { col: o.col, row: o.row });
    }
    case 'undoDeck': {
      if (!deck) return b;
      let next = deleteDeck(b, deck.id);
      if (pad) next = deletePad(next, pad.id);
      return restoreDeck(next, deck);
    }
    case 'undoPad': {
      if (!pad) return b;
      const gone = deletedPad(b, pad.id)!;
      let next = deletePad(b, pad.id);
      const other = next.pads[0];
      if (o.meanwhile === 0 && deck)
        next = addPadToFreeCell(next, deck.id, newPad(`m${n}`, 'single', `Pad ${n}`));
      if (o.meanwhile === 1 && deck) next = deleteDeck(next, deck.id);
      if (o.meanwhile === 2 && other) next = deletePad(next, other.id);
      return restorePad(next, gone);
    }
    case 'renameDeck':
      return deck ? renameDeck(b, deck.id, `${deck.name}!`) : b;
    default:
      return b;
  }
}

describe('board model', () => {
  test.prop([fc.array(op, { maxLength: 40 })])(
    'every sequence of UI operations keeps the board consistent',
    (ops) => {
      let b = start();
      ops.forEach((o, n) => {
        b = apply(b, o, n);
        expect(boardProblems(b), `after step ${n}: ${o.kind}`).toEqual([]);
      });
    },
  );

  // A deck has no fixed capacity (owner decision 2026-10-19): ADD PAD never does nothing
  // The random sequences seldom fill a deck, so the deck is filled here: up to, onto and past full
  test.prop([fc.array(op, { maxLength: 30 }), fc.nat(5), fc.nat(20)])(
    'a deck takes every new pad; only a full deck grows, by one row',
    (ops, which, fill) => {
      let b = start();
      ops.forEach((o, n) => (b = apply(b, o, n)));
      if (b.decks.length === 0) return;
      const deck = b.decks[which % b.decks.length];
      const { cols, rows } = deck.gridConfig;
      const free = cols * rows - deck.placements.length; // cells are unique and in the grid
      const count = fill % (free + 2);
      for (let i = 0; i < count; i++)
        b = addPadToFreeCell(b, deck.id, newPad(`f${i}`, 'single', `Fill ${i}`));
      const after = b.decks.find((d) => d.id === deck.id)!;
      expect(after.placements).toHaveLength(deck.placements.length + count);
      expect(after.gridConfig.rows).toBe(count > free ? rows + 1 : rows);
      expect(boardProblems(b)).toEqual([]);
    },
  );

  test.prop([fc.array(op, { maxLength: 30 }), fc.nat(9)])(
    'after deleting a pad nothing refers to it any more',
    (ops, which) => {
      let b = start();
      ops.forEach((o, n) => (b = apply(b, o, n)));
      if (b.pads.length === 0) return;
      const id = b.pads[which % b.pads.length].id;
      b = deletePad(b, id);
      expect(JSON.stringify(b)).not.toContain(`"${id}"`);
    },
  );
});
