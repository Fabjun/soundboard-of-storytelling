// ─────────────────────────────────────────────────────────────────────────────
// Board model — the pad pool, its decks and the quick-access bar (ADR-0048, Slice 9c)
//
// Pure functions: every change returns a new Board, nothing is mutated, nothing is persisted
// here (callers save with boardPut + upsertBoard). A pad lives once in the board's pool; decks
// place it with a position and a key. Editing a pad changes it everywhere it appears.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Board,
  ComboStep,
  Deck,
  Pad,
  PadPosition,
  Placement,
  QuickAccessEntry,
} from '../types';
import { nextFreeSlot } from './padUtils';
import { combosInCycles } from './comboModel';

/** A pad as one deck shows it: the pad from the pool plus its placement in that deck. */
export type PlacedPad = { pad: Pad; placement: Placement };

/** Grid of every new deck; its columns and gap also lay out the All pads view. Copy, never mutate. */
export const DEFAULT_GRID: Readonly<Deck['gridConfig']> = {
  cols: 4,
  rows: 4,
  gap: 8,
  padSize: 'md',
};

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

/**
 * Adds a new pad to the pool and places it in a deck: on `preferred` when that cell is free,
 * otherwise on the next free cell (row-major). Decided on the board passed in — callers pass the
 * latest one (updateBoard), so two quick adds never pick the same cell. Unchanged when the deck
 * is unknown or full.
 */
export function addPadToFreeCell(
  board: Board,
  deckId: string,
  pad: Pad,
  preferred?: PadPosition,
): Board {
  const deck = findDeck(board, deckId);
  if (!deck) return board;
  const { cols, rows } = deck.gridConfig;
  const taken = (pos: PadPosition) =>
    deck.placements.some((p) => p.position.col === pos.col && p.position.row === pos.row);
  const inGrid = (pos: PadPosition) =>
    pos.col >= 0 && pos.col < cols && pos.row >= 0 && pos.row < rows;
  const position =
    preferred && inGrid(preferred) && !taken(preferred)
      ? preferred
      : nextFreeSlot(deck.placements, cols, rows);
  return position ? addPadToDeck(board, deckId, pad, position) : board;
}

/** Adds a new pad to the pool only — it sits in no deck (All pads view, owner decision 2026-10-02). */
export function addPadToPool(board: Board, pad: Pad): Board {
  return { ...board, pads: [...board.pads, pad] };
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
 * Removes a pad's placement from one deck. The pad stays in the pool (visible in All pads) and
 * in every other deck (docs/architecture/0048-pad-pool-decks.md#2-behavior-final-not-provisional).
 */
export function removeFromDeck(board: Board, deckId: string, padId: string): Board {
  return withDeck(board, deckId, (deck) => ({
    ...deck,
    placements: deck.placements.filter((p) => p.padId !== padId),
  }));
}

/**
 * Places a pool pad in a deck on the next free cell (row-major). Returns the board unchanged when
 * the pad is already in that deck, the deck is unknown or the grid is full — the caller can tell
 * by identity (`result === board`).
 */
export function placeInDeck(board: Board, deckId: string, padId: string): Board {
  const deck = findDeck(board, deckId);
  if (!deck || !findPad(board, padId) || deck.placements.some((p) => p.padId === padId))
    return board;
  const position = nextFreeSlot(deck.placements, deck.gridConfig.cols, deck.gridConfig.rows);
  if (!position) return board;
  return withDeck(board, deckId, (d) => ({
    ...d,
    placements: [...d.placements, { padId, position }],
  }));
}

/** The whole pool for the All pads view: sorted by name (case-insensitive), then by id. */
export function poolByName(board: Board): Pad[] {
  return [...board.pads].sort(
    (a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id),
  );
}

/**
 * The pool laid out for the All pads view: sorted by name, row-major in `cols` columns without
 * gaps. The placements exist only for rendering — no key, never stored.
 */
export function poolLayout(board: Board, cols: number): PlacedPad[] {
  return poolByName(board).map((pad, i) => ({
    pad,
    placement: { padId: pad.id, position: { col: i % cols, row: Math.floor(i / cols) } },
  }));
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

/**
 * Order number for a deck added at the end: highest + 1. Never the deck count — after a delete
 * the count can equal an order number still in use (two decks with the same badge).
 */
export function nextDeckOrder(board: Board): number {
  return board.decks.reduce((max, d) => Math.max(max, d.order), -1) + 1;
}

/**
 * Name for a new deck: "Deck N" with the smallest N no deck is named after (owner decision
 * 2026-10-02: fill the gap — after "Deck 2" is deleted the next new deck is "Deck 2" again).
 */
export function nextDeckName(board: Board): string {
  const names = new Set(board.decks.map((d) => d.name));
  let n = 1;
  while (names.has(`Deck ${n}`)) n++;
  return `Deck ${n}`;
}

/** Adds an empty deck at the end. */
export function addDeck(board: Board, deck: Omit<Deck, 'order' | 'placements'>): Board {
  const order = nextDeckOrder(board);
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
    order: nextDeckOrder(board),
    placements: source.placements.map((p) => ({ ...p, position: { ...p.position } })),
  };
  return { ...board, decks: [...board.decks, copy] };
}

/** Renames a deck. */
export function renameDeck(board: Board, deckId: string, name: string): Board {
  return withDeck(board, deckId, (deck) => ({ ...deck, name }));
}

/**
 * Puts a deleted deck back (undo) into the board as it is NOW — changes made since the delete
 * stay. It keeps its order number unless another deck took it meanwhile (then it goes last) and
 * drops placements of pads deleted meanwhile. Unchanged when a deck with that id exists.
 */
export function restoreDeck(board: Board, deck: Deck): Board {
  if (findDeck(board, deck.id)) return board;
  const pool = new Set(board.pads.map((p) => p.id));
  const orderTaken = board.decks.some((d) => d.order === deck.order);
  const order = orderTaken ? nextDeckOrder(board) : deck.order;
  return {
    ...board,
    decks: [
      ...board.decks,
      { ...deck, order, placements: deck.placements.filter((p) => pool.has(p.padId)) },
    ],
  };
}

/** Removes a deck. Its pads stay in the pool (ADR-0048: pads belong to the board, not a deck). */
export function deleteDeck(board: Board, deckId: string): Board {
  return { ...board, decks: board.decks.filter((d) => d.id !== deckId) };
}

/**
 * A copy of a board with new ids for the board, its decks and its pads; placements, the
 * quick-access bar and combo steps follow. An imported board then never shares an id with one
 * already stored (pads are looked up by id across boards). Unknown references stay as they are —
 * boardProblems() reports them.
 */
export function withNewIds(board: Board, newId: () => string): Board {
  const padIds = new Map(board.pads.map((p) => [p.id, newId()]));
  const pad = (id: string) => padIds.get(id) ?? id;
  return {
    ...board,
    id: newId(),
    pads: board.pads.map((p) =>
      p.type === 'combo'
        ? {
            ...p,
            id: pad(p.id),
            steps: p.steps.map((s) => ({ ...s, padIds: s.padIds.map(pad) })),
          }
        : { ...p, id: pad(p.id) },
    ),
    decks: board.decks.map((d) => ({
      ...d,
      id: newId(),
      placements: d.placements.map((pl) => ({ ...pl, padId: pad(pl.padId) })),
    })),
    quickAccess: board.quickAccess.map((q) => ({ ...q, padId: pad(q.padId) })),
  };
}

// ── Untrusted boards (backup files) ──────────────────────────────────────────

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const optional = (v: unknown, check: (x: unknown) => boolean) => v === undefined || check(v);

function isStep(v: unknown): v is ComboStep {
  return (
    isRec(v) &&
    isStrArray(v.padIds) &&
    optional(v.duration, isNum) &&
    optional(v.stopAll, (x) => typeof x === 'boolean') &&
    optional(v.fadeOutAll, isNum)
  );
}

function isPad(v: unknown): v is Pad {
  if (!isRec(v) || !isStr(v.id) || !isStr(v.name)) return false;
  if (!isNum(v.volume) || !isNum(v.fadeIn) || !isNum(v.fadeOut)) return false;
  if (!optional(v.iconRef, isStr) || !optional(v.color, isStr)) return false;
  if (v.type === 'combo') return Array.isArray(v.steps) && v.steps.every(isStep);
  return (
    (v.type === 'single' || v.type === 'loop') &&
    isStrArray(v.files) &&
    (v.order === 'sequential' || v.order === 'shuffle') &&
    optional(v.trimStart, isNum) &&
    optional(v.trimEnd, isNum)
  );
}

function isPlacement(v: unknown): v is Placement {
  return (
    isRec(v) &&
    isStr(v.padId) &&
    isRec(v.position) &&
    isNum(v.position.col) &&
    isNum(v.position.row) &&
    optional(v.hotkey, isStr)
  );
}

function isDeck(v: unknown): v is Deck {
  if (!isRec(v) || !isStr(v.id) || !isStr(v.name) || !isNum(v.order)) return false;
  const g = v.gridConfig;
  return (
    isRec(g) &&
    isNum(g.cols) &&
    isNum(g.rows) &&
    isNum(g.gap) &&
    isStr(g.padSize) &&
    Array.isArray(v.placements) &&
    v.placements.every(isPlacement)
  );
}

function isQuickAccessEntry(v: unknown): v is QuickAccessEntry {
  return isRec(v) && isStr(v.padId) && optional(v.hotkey, isStr);
}

/**
 * A board read from a file (untrusted JSON), if it has the board's shape AND passes the model's
 * consistency rules — otherwise null. Only the board's own fields are kept.
 */
export function parseBoard(v: unknown): Board | null {
  if (!isRec(v) || !isStr(v.id) || !isStr(v.name) || !isStr(v.themeId)) return null;
  const { pads, decks, quickAccess } = v;
  if (!Array.isArray(pads) || !pads.every(isPad)) return null;
  if (!Array.isArray(decks) || !decks.every(isDeck)) return null;
  if (!Array.isArray(quickAccess) || !quickAccess.every(isQuickAccessEntry)) return null;
  const board: Board = { id: v.id, name: v.name, themeId: v.themeId, pads, decks, quickAccess };
  return boardProblems(board).length === 0 ? board : null;
}

/**
 * Consistency rules of the model — empty when the board is valid. Used by the property tests
 * after every operation; a non-empty result is a bug in the model code.
 */
export function boardProblems(board: Board): string[] {
  const problems: string[] = [];
  const ids = new Set(board.pads.map((p) => p.id));
  if (ids.size !== board.pads.length) problems.push('duplicate pad ids in the pool');
  if (new Set(board.decks.map((d) => d.id)).size !== board.decks.length)
    problems.push('duplicate deck ids');
  // Decks are sorted by order; two decks with one order number have no defined sequence.
  if (new Set(board.decks.map((d) => d.order)).size !== board.decks.length)
    problems.push('two decks share an order number');
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
  // A combo that reaches itself would make the engine start it again and again
  for (const id of combosInCycles(board)) problems.push(`combo ${id}: starts itself (cycle)`);
  return problems;
}
