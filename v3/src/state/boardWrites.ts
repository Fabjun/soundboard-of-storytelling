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

import type { Board } from '../types';
import { boardGet, boardPut } from '../db/idb';
import { boards, pendingSaves, removeBoardFromStore, upsertBoard } from './store';

/**
 * Applies `change` to the latest version of a board, shows the result and saves it.
 * Returns the new board, or null when the board is unknown, `change` returned it unchanged
 * (same object) or the save failed.
 */
export async function updateBoard(
  boardId: string,
  change: (board: Board) => Board,
): Promise<Board | null> {
  return applyBoardChange(boardId, change).saved;
}

/**
 * Like updateBoard, but tells AT ONCE whether the change applied: `board` is the new board now
 * shown (null when the board is unknown or nothing changed), `saved` settles when it is stored.
 * Use it when the screen reacts to the change (select the new pad, close the editor …) — a change
 * shows before it is saved (owner decision 2026-10-02), so the reaction must not wait for the save
 * either: something typed in between would land in the wrong place.
 */
export function applyBoardChange(
  boardId: string,
  change: (board: Board) => Board,
): { board: Board | null; saved: Promise<Board | null> } {
  const latest = boards.value.find((b) => b.id === boardId);
  if (!latest) return { board: null, saved: Promise.resolve(null) };
  const next = change(latest);
  if (next === latest) return { board: null, saved: Promise.resolve(null) };
  upsertBoard(next);
  return { board: next, saved: save(next) };
}

/** Adds a new board to the store and saves it. Returns null when the save failed. */
export async function createBoard(board: Board): Promise<Board | null> {
  upsertBoard(board);
  return save(board);
}

async function save(board: Board): Promise<Board | null> {
  pendingSaves.value++; // synchronously, before the first await — callers see it at once
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
    pendingSaves.value--;
  }
}
