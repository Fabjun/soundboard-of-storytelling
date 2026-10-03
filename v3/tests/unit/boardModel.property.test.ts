// ─────────────────────────────────────────────────────────────────────────────
// boardModel — property-based tests (T11b, Slice 9c)
//
// Random sequences of the operations the UI performs keep every board consistent
// (boardProblems is empty after each step), and deleting a pad leaves no reference to it.
// On failure fast-check prints the seed and the shrunk sequence; pass `{ seed, path }` as fc
// options to reproduce it. Example-based tests: boardModel.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import type { Board, ComboPad, Pad } from '../../src/types';
import {
  addDeck,
  addPadToDeck,
  boardProblems,
  deleteDeck,
  deletePad,
  duplicateDeck,
  setPlacementHotkey,
  updatePad,
} from '../../src/lib/boardModel';
import { indexToPos } from '../../src/lib/padUtils';

const grid = { cols: 3, rows: 2, gap: 4, padSize: 'md' }; // small grid: full decks happen often

const start = (): Board => ({
  id: 'b',
  name: 'Board',
  themeId: 'hearth',
  pads: [],
  decks: [{ id: 'd0', name: 'Deck', order: 0, gridConfig: grid, placements: [] }],
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
      const base = { id: `p${n}`, name: `Pad ${n}`, volume: 80, fadeIn: 0, fadeOut: 0 };
      const newPad: Pad = o.combo
        ? ({
            ...base,
            type: 'combo',
            steps: [{ padIds: b.pads.slice(0, 2).map((p) => p.id) }],
          } as ComboPad)
        : { ...base, type: 'single' };
      return addPadToDeck(b, deck.id, newPad, indexToPos(free, grid.cols));
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
