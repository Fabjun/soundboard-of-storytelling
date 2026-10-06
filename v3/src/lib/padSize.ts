/**
 * @fileoverview padSize — the size of the pads on a deck's grid and how many fit a row
 *
 * Owner decisions 2026-10-06 (ADR-0075): each deck has a pad size (`gridConfig.padSize`, px), set
 * with the PAD SIZE slider in the deck rail (V1 had it there); it is the largest side a pad gets.
 * The grid takes as few columns as keep every pad at or below that size, so a row always fills
 * the width — no horizontal scrolling, and the rows go on downwards. The places stay in reading
 * order, whatever the column count.
 */

import type { Deck } from '../types';

/** Limits of the PAD SIZE slider, in px: the iOS touch target up to a large tile; 88 by default. */
export const PAD_SIZE = { min: 44, max: 160, step: 4, default: 88 } as const;

/** Returns `px` inside the slider's limits, on its steps; anything not a finite number → default. */
export function clampPadSize(px: unknown): number {
  if (typeof px !== 'number' || !Number.isFinite(px)) return PAD_SIZE.default;
  const stepped = Math.round(px / PAD_SIZE.step) * PAD_SIZE.step;
  return Math.min(PAD_SIZE.max, Math.max(PAD_SIZE.min, stepped));
}

/** The width of a grid's content box and the size its pads may take. */
export interface PadColumnsInput {
  /** Width of the grid's content box (padding taken off), in px. */
  width: number;
  /** Gap between cells, in px. */
  gap: number;
  /** The deck's pad size — the largest side a pad may get, in px. */
  padSize: number;
}

/**
 * Returns how many columns the grid takes — the fewest that keep every pad at or below the pad
 * size — and the side each pad then gets. Null while the width is not known (a hidden panel), so
 * the caller keeps its fallback.
 */
export function padColumns({ width, gap, padSize }: PadColumnsInput): {
  cols: number;
  side: number;
} | null {
  if (![width, gap, padSize].every(Number.isFinite) || width <= 0 || gap < 0 || padSize <= 0)
    return null;
  const cols = Math.max(1, Math.ceil((width + gap) / (padSize + gap)));
  return { cols, side: Math.max(0, (width - gap * (cols - 1)) / cols) };
}

/** A deck as stored before ADR-0075: its `padSize` was a word ('md', '1fr') nothing used. */
export type StoredDeck = Omit<Deck, 'gridConfig'> & {
  gridConfig: Omit<Deck['gridConfig'], 'padSize'> & { padSize: unknown };
};

/**
 * Returns the deck with a pad size in px; a deck that has one already comes back unchanged (the
 * same object). An old word becomes the default — it never had an effect.
 */
export function migrateDeck(deck: StoredDeck): Deck {
  const { padSize } = deck.gridConfig;
  if (typeof padSize === 'number' && clampPadSize(padSize) === padSize) return deck as Deck;
  return { ...deck, gridConfig: { ...deck.gridConfig, padSize: clampPadSize(padSize) } };
}
