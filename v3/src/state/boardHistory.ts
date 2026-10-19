/**
 * @fileoverview boardHistory — the undo history of every board (Slice 18a, ADR-0086)
 *
 * One history per board, of whole boards: the past, the present and the future of
 * src/lib/editHistory.ts, the form the PAD editor's draft uses too. src/state/boardWrites.ts
 * records each change here and writes the board of an undo or redo step, so every writer is
 * covered without code of its own. The store is the truth: when its board is not the history's
 * present any more (a failed save showed the stored board again, a backup import replaced it, a
 * deleted board came back with the same id), the history starts again from the store's board —
 * an undo never leads to a board of another time line. The histories live in memory while the app
 * is open; nothing of them is stored.
 */

import { signal } from '@preact/signals';
import type { Board } from '../types';
import { record, redo, startHistory, undo, type History } from '../lib/editHistory';
import { boards } from './store';

/** A board in the history, with the name of the change that made it ("delete pad 'Rain'"). */
interface Step {
  board: Board;
  label: string;
}

/** The history of each board changed in this session, by board id. */
const histories = signal<ReadonlyMap<string, History<Step>>>(new Map());

/** The history of `latest`'s board, with `latest` as its present (see the file overview). */
function inStep(latest: Board): History<Step> {
  const h = histories.value.get(latest.id);
  return h && h.present.board === latest ? h : startHistory({ board: latest, label: '' });
}

/** Stores the history of a board; histories of boards no longer in the store are dropped. */
function keep(h: History<Step>): void {
  const live = new Set(boards.value.map((b) => b.id));
  const next = new Map([...histories.value].filter(([id]) => live.has(id)));
  next.set(h.present.board.id, h);
  histories.value = next;
}

/** The history of the board as the store shows it now, or null when it has none in step. */
function current(boardId: string): History<Step> | null {
  const h = histories.value.get(boardId);
  const latest = boards.value.find((b) => b.id === boardId);
  return h && latest && h.present.board === latest ? h : null;
}

/**
 * Records a board change: `before` was the board in the store, `after` replaces it; `label`
 * names the change for the undo and redo buttons ("delete pad 'Rain'").
 */
export function recordBoardChange(before: Board, after: Board, label: string): void {
  keep(record(inStep(before), { board: after, label }));
}

/** The name of the change ↶ would take back, or null when there is none. */
export function undoLabel(boardId: string): string | null {
  const h = current(boardId);
  return h && h.past.length > 0 ? h.present.label : null;
}

/** The name of the change ↷ would bring back, or null when there is none. */
export function redoLabel(boardId: string): string | null {
  const h = current(boardId);
  return h && h.future.length > 0 ? h.future[0].label : null;
}

/**
 * The board one step back (`undo`) or forward (`redo`) from `latest`, the board in the store, and
 * `done` to call once that board is shown; null when there is no such step.
 */
export function boardStep(
  latest: Board,
  direction: 'undo' | 'redo',
): { board: Board; done: () => void } | null {
  const h = inStep(latest);
  const moved = direction === 'undo' ? undo(h) : redo(h);
  if (moved === h) return null;
  return { board: moved.present.board, done: () => keep(moved) };
}
