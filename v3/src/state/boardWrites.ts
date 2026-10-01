// ─────────────────────────────────────────────────────────────────────────────
// Board writes — the one way to change and save a board
//
// A change is a function of the LATEST board in the store, never of a board copy a component
// rendered with — the "updater function" pattern (react.dev/learn/queueing-a-series-of-state-updates).
// Saving a finished board computed earlier lost every change made in between (deck undo, PAD editor
// auto-save; BACKLOG "Bug: board writes from an outdated board copy lose changes").
//
// Order: the store updates at once, so the next change already builds on this one; then the board
// is saved. IndexedDB starts read/write transactions on the same store in the order they were
// created (W3C IndexedDB, transaction scheduling), so saves land in call order.
// A failed save reloads the stored board, so the screen never shows unsaved data as saved.
//
// Guarded: components and screens never call boardPut / upsertBoard (codeGuards).
// ─────────────────────────────────────────────────────────────────────────────

import { signal } from '@preact/signals';
import type { Board } from '../types';
import { boardGet, boardPut } from '../db/idb';
import { boards, removeBoardFromStore, upsertBoard } from './store';

/**
 * Board saves still running. A change shows before it is stored, so "visible" no longer means
 * "saved": whatever must not lose a change (a future "Saving…" hint, E2E tests before a reload)
 * waits for 0. main.tsx mirrors it as the `data-saving` attribute on <html>.
 */
export const pendingBoardSaves = signal(0);

/**
 * Applies `change` to the latest version of a board, shows the result and saves it.
 * Returns the new board, or null when the board is unknown, `change` returned it unchanged
 * (same object) or the save failed.
 */
export async function updateBoard(
  boardId: string,
  change: (board: Board) => Board,
): Promise<Board | null> {
  const latest = boards.value.find((b) => b.id === boardId);
  if (!latest) return null;
  const next = change(latest);
  if (next === latest) return null;
  upsertBoard(next);
  return save(next);
}

/** Adds a new board to the store and saves it. Returns null when the save failed. */
export async function createBoard(board: Board): Promise<Board | null> {
  upsertBoard(board);
  return save(board);
}

async function save(board: Board): Promise<Board | null> {
  pendingBoardSaves.value++; // synchronously, before the first await — callers see it at once
  try {
    await boardPut(board);
    return board;
  } catch (e) {
    console.error('Board save failed:', e);
    try {
      const stored = await boardGet(board.id);
      if (stored) upsertBoard(stored);
      else removeBoardFromStore(board.id);
    } catch (reloadError) {
      console.error('Board reload after a failed save failed:', reloadError);
    }
    return null;
  } finally {
    pendingBoardSaves.value--;
  }
}
