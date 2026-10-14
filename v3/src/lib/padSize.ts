/**
 * @fileoverview padSize — the size of a board's pads and how many fit a row
 *
 * Owner decisions 2026-10-06 (ADR-0075): a board has one pad size (`Board.padSize`, px) for all its
 * decks and the All pads view, set with the PAD SIZE slider in the deck rail (V1 had it there); it
 * is the largest side a pad gets.
 * The grid takes as few columns as keep every pad at or below that size, so a row always fills
 * the width — no horizontal scrolling, and the rows go on downwards. The places stay in reading
 * order, whatever the column count.
 */

import type { Board, Deck } from '../types';

/** Limits of the PAD SIZE slider, in px: the iOS touch target up to a large tile; 88 by default. */
export const PAD_SIZE = { min: 44, max: 160, step: 4, default: 88 } as const;

/** Returns `px` inside the slider's limits, on its steps; anything not a finite number → default. */
export function clampPadSize(px: unknown): number {
  if (typeof px !== 'number' || !Number.isFinite(px)) return PAD_SIZE.default;
  const stepped = Math.round(px / PAD_SIZE.step) * PAD_SIZE.step;
  return Math.min(PAD_SIZE.max, Math.max(PAD_SIZE.min, stepped));
}

/**
 * Where the PAD SIZE slider's value lives (docs/product/features/settings.md S4): with each board
 * (`Board.padSize`, the default — ADR-0075), or one size for every board (a preference).
 */
export const PAD_SIZE_SCOPES = ['board', 'app'] as const;

/** One of PAD_SIZE_SCOPES. */
export type PadSizeScope = (typeof PAD_SIZE_SCOPES)[number];

/** Returns the pad size a board shows: its own, or the app-wide one when the scope is `app`. */
export function padSizeFor(boardPadSize: number, scope: PadSizeScope, appPadSize: number): number {
  return scope === 'app' ? appPadSize : boardPadSize;
}

/**
 * The smallest side a pad gets — the touch target (Apple HIG 44 pt; CLAUDE.md UI rules). At the
 * smallest PAD SIZE the fewest columns would otherwise leave pads of 42 px and less (measured
 * 2026-10-10, docs/design/components/pad.md PQ4).
 */
export const MIN_PAD_SIDE = 44;

/**
 * Below this side a pad is compact: no picture and tighter padding, so its type label, name and
 * key fit — the type is not left to the spine's color alone (WCAG 1.4.1). Measured 2026-10-10:
 * below 80 px the label, picture and name did not fit and the name stood out of the pad by 11 px
 * (BACKLOG "Pad names cut off on narrow screens"; pad.md detail levels).
 */
export const COMPACT_BELOW = 80;

/** True when a pad of this side is shown compact (COMPACT_BELOW); an unknown side is not. */
export function isCompactPad(side: number | null): boolean {
  return side !== null && side < COMPACT_BELOW;
}

/** The width of a grid's content box and the size its pads may take. */
export interface PadColumnsInput {
  /** Width of the grid's content box (padding taken off), in px. */
  width: number;
  /** Gap between cells, in px. */
  gap: number;
  /** The board's pad size — the largest side a pad may get, in px. */
  padSize: number;
}

/**
 * Returns how many columns the grid takes — the fewest that keep every pad at or below the pad
 * size, but never so many that a pad gets smaller than MIN_PAD_SIDE (then a pad may be a little
 * larger than the pad size) — and the side each pad then gets. Null while the width is not known
 * (a hidden panel), so the caller keeps its fallback.
 */
export function padColumns({ width, gap, padSize }: PadColumnsInput): {
  cols: number;
  side: number;
} | null {
  if (![width, gap, padSize].every(Number.isFinite) || width <= 0 || gap < 0 || padSize <= 0)
    return null;
  const fewest = Math.max(1, Math.ceil((width + gap) / (padSize + gap)));
  const most = Math.max(1, Math.floor((width + gap) / (MIN_PAD_SIDE + gap)));
  const cols = Math.min(fewest, most);
  return { cols, side: Math.max(0, (width - gap * (cols - 1)) / cols) };
}

/** A deck as stored before 3.0.178: it may still carry its own pad size (a px number, or a word). */
export type StoredDeck = Deck & { gridConfig: Deck['gridConfig'] & { padSize?: unknown } };

/** A board as stored before 3.0.178: no board pad size yet, decks maybe with their own. */
export type StoredSizeBoard = Omit<Board, 'padSize' | 'decks'> & {
  padSize?: unknown;
  decks: StoredDeck[];
};

/**
 * Returns the board with one pad size in px and its decks without one of their own (owner decision
 * 2026-10-06). A board that has a size keeps it (put on the slider's steps); otherwise the first
 * deck's size is taken (lowest `order` — the deck the rail shows first; owner decision), and a
 * word or no deck gives the default. A board already in this shape comes back as the same object.
 */
export function migratePadSize(board: StoredSizeBoard): Board {
  const sized = board.decks.some((d) => 'padSize' in d.gridConfig);
  if (!sized && typeof board.padSize === 'number' && clampPadSize(board.padSize) === board.padSize)
    return board as Board;
  const first = [...board.decks].sort((a, b) => a.order - b.order)[0];
  const padSize = clampPadSize(board.padSize ?? first?.gridConfig.padSize);
  const decks = board.decks.map((d): Deck => {
    if (!('padSize' in d.gridConfig)) return d;
    const { padSize: _old, ...gridConfig } = d.gridConfig;
    return { ...d, gridConfig };
  });
  return { ...board, padSize, decks };
}
