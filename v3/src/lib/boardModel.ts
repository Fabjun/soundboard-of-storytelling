// ─────────────────────────────────────────────────────────────────────────────
// Board model — the pad pool, its decks and the quick-access bar (ADR-0048, Slice 9c)
//
// Pure functions: every change returns a new Board, nothing is mutated, nothing is persisted
// here (callers save with boardPut + upsertBoard). A pad lives once in the board's pool; decks
// place it with a position and a key. Editing a pad changes it everywhere it appears.
// ─────────────────────────────────────────────────────────────────────────────

import type { Board, Deck, Pad, PadPosition, Placement } from '../types';

/** A pad as one deck shows it: the pad from the pool plus its placement in that deck. */
export type PlacedPad = { pad: Pad; placement: Placement };

export function findDeck(board: Board, deckId: string): Deck | undefined {
  return board.decks.find((d) => d.id === deckId);
}

export function findPad(board: Board, padId: string): Pad | undefined {
  return board.pads.find((p) => p.id === padId);
}

/** The pads one deck shows, in the order of its placements. */
export function deckPads(board: Board, deck: Deck): PlacedPad[] {
  const pool = new Map(board.pads.map((p) => [p.id, p]));
  return deck.placements.flatMap((placement) => {
    const pad = pool.get(placement.padId);
    return pad ? [{ pad, placement }] : [];
  });
}

/** In how many decks a pad is placed ("used in N decks"). */
export function deckCount(board: Board, padId: string): number {
  return board.decks.filter((d) => d.placements.some((p) => p.padId === padId)).length;
}

const withDeck = (board: Board, deckId: string, change: (deck: Deck) => Deck): Board => ({
  ...board,
  decks: board.decks.map((d) => (d.id === deckId ? change(d) : d)),
});

/** Adds a new pad to the pool and places it in one deck. */
export function addPadToDeck(board: Board, deckId: string, pad: Pad, position: PadPosition): Board {
  return withDeck({ ...board, pads: [...board.pads, pad] }, deckId, (deck) => ({
    ...deck,
    placements: [...deck.placements, { padId: pad.id, position }],
  }));
}

/** Replaces a pad of the pool — the change shows in every deck that places it. */
export function updatePad(board: Board, pad: Pad): Board {
  return { ...board, pads: board.pads.map((p) => (p.id === pad.id ? pad : p)) };
}

/** Sets or clears a pad's key in one deck (keys belong to the placement). */
export function setPlacementHotkey(
  board: Board,
  deckId: string,
  padId: string,
  hotkey: string | undefined,
): Board {
  return withDeck(board, deckId, (deck) => ({
    ...deck,
    placements: deck.placements.map((p) => {
      if (p.padId !== padId) return p;
      const { hotkey: _old, ...rest } = p;
      return hotkey ? { ...rest, hotkey } : rest;
    }),
  }));
}

/** Replaces a deck's placements, e.g. after a drag and drop. */
export function setPlacements(board: Board, deckId: string, placements: Placement[]): Board {
  return withDeck(board, deckId, (deck) => ({ ...deck, placements }));
}

/**
 * Deletes a pad from the board: from the pool, every deck, the quick-access bar and every
 * combo step. A combo step keeps its other pads and its timing (duration, stop all, fade out
 * all) even when this was its only pad.
 */
export function deletePad(board: Board, padId: string): Board {
  return {
    ...board,
    pads: board.pads
      .filter((p) => p.id !== padId)
      .map((p) =>
        p.type === 'combo'
          ? {
              ...p,
              steps: p.steps.map((s) => ({ ...s, padIds: s.padIds.filter((id) => id !== padId) })),
            }
          : p,
      ),
    decks: board.decks.map((d) => ({
      ...d,
      placements: d.placements.filter((p) => p.padId !== padId),
    })),
    quickAccess: board.quickAccess.filter((q) => q.padId !== padId),
  };
}

/** Adds an empty deck at the end. */
export function addDeck(board: Board, deck: Omit<Deck, 'order' | 'placements'>): Board {
  const order = board.decks.reduce((max, d) => Math.max(max, d.order), -1) + 1;
  return { ...board, decks: [...board.decks, { ...deck, order, placements: [] }] };
}

/**
 * Duplicates a deck and appends the copy at the end (as before Slice 9c). The copy places the
 * SAME pads (same ids, same positions and keys) — no pad copies (docs/architecture/0048-pad-pool-decks.md#2-behavior-final-not-provisional).
 */
export function duplicateDeck(
  board: Board,
  deckId: string,
  copyId: string,
  copyName: string,
): Board {
  const source = findDeck(board, deckId);
  if (!source) return board;
  const copy: Deck = {
    ...source,
    id: copyId,
    name: copyName,
    order: board.decks.reduce((max, d) => Math.max(max, d.order), -1) + 1,
    placements: source.placements.map((p) => ({ ...p, position: { ...p.position } })),
  };
  return { ...board, decks: [...board.decks, copy] };
}

/** Removes a deck. Its pads stay in the pool (ADR-0048: pads belong to the board, not a deck). */
export function deleteDeck(board: Board, deckId: string): Board {
  return { ...board, decks: board.decks.filter((d) => d.id !== deckId) };
}

/**
 * Consistency rules of the model — empty when the board is valid. Used by the property tests
 * after every operation; a non-empty result is a bug in the model code.
 */
export function boardProblems(board: Board): string[] {
  const problems: string[] = [];
  const ids = new Set(board.pads.map((p) => p.id));
  if (ids.size !== board.pads.length) problems.push('duplicate pad ids in the pool');
  for (const deck of board.decks) {
    const { cols, rows } = deck.gridConfig;
    const cells = new Set<string>();
    const placed = new Set<string>();
    for (const p of deck.placements) {
      if (!ids.has(p.padId)) problems.push(`deck ${deck.id}: placement of unknown pad ${p.padId}`);
      if (placed.has(p.padId)) problems.push(`deck ${deck.id}: pad ${p.padId} placed twice`);
      placed.add(p.padId);
      const cell = `${p.position.col},${p.position.row}`;
      if (cells.has(cell)) problems.push(`deck ${deck.id}: two pads in cell ${cell}`);
      cells.add(cell);
      if (
        p.position.col < 0 ||
        p.position.col >= cols ||
        p.position.row < 0 ||
        p.position.row >= rows
      )
        problems.push(`deck ${deck.id}: cell ${cell} outside the ${cols}×${rows} grid`);
    }
  }
  for (const q of board.quickAccess)
    if (!ids.has(q.padId)) problems.push(`quick access: unknown pad ${q.padId}`);
  for (const pad of board.pads)
    if (pad.type === 'combo')
      for (const step of pad.steps)
        for (const id of step.padIds)
          if (!ids.has(id)) problems.push(`combo ${pad.id}: step references unknown pad ${id}`);
  return problems;
}
