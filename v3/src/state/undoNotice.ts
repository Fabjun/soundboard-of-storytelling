/**
 * @fileoverview undoNotice — the one toast that offers to undo a deletion (Slice 18b, ADR-0086)
 *
 * A deleted deck or pad shows a toast with UNDO for a few seconds. Its UNDO takes back exactly
 * that deletion and keeps every change made since (Gmail's undo of an action, A List Apart "Never
 * use a warning when you mean undo") — unlike ↶, which steps back through the board's history in
 * order. One toast at a time: a new deletion replaces the toast of the one before. The board
 * screen shows it and clears it when the board is left, so an UNDO never acts on a board that is
 * not shown.
 */

import { signal } from '@preact/signals';

/** The toast shown now: its text and what its UNDO does. */
export interface UndoNotice {
  /** Tells one toast from the next, so a new one starts its own time. */
  id: number;
  message: string;
  undo: () => void;
}

/** The toast to show, or null. */
export const undoNotice = signal<UndoNotice | null>(null);

let lastId = 0;

/** Shows a toast with `message` whose UNDO calls `undo`; it replaces a toast shown before. */
export function announceUndo(message: string, undo: () => void): void {
  undoNotice.value = { id: ++lastId, message, undo };
}

/** Hides the toast — only the one with `id` when given, so a newer toast stays. */
export function clearUndoNotice(id?: number): void {
  if (id === undefined || undoNotice.value?.id === id) undoNotice.value = null;
}
