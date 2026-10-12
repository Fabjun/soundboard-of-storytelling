/**
 * @fileoverview editHistory — undo and redo for an editor's draft (owner decision 2026-10-11)
 *
 * The PAD editor keeps its changes as a draft until SAVE and lets every step be undone and redone
 * (ADR-0084). The history holds whole snapshots of the draft — small, a pad without its audio — in
 * three parts: the past, the present and the future (the "undo stack" form of Redux's undo guide).
 * Changes of the same kind in quick succession — the letters of a typed name, the steps of a
 * slider — merge into one step when they follow each other within `MERGE_MS`, as ProseMirror's
 * history groups changes within its `newGroupDelay` (500 ms). A new change after an undo drops
 * the redo steps. The past keeps at most `LIMIT` steps.
 */

/** Changes of the same kind closer together than this (ms) are one step. */
export const MERGE_MS = 500;

/** The most steps the past keeps; older ones are forgotten. */
export const LIMIT = 100;

/** The history of a draft: what came before, the draft now, and what an undo left behind. */
export interface History<T> {
  readonly past: readonly T[];
  readonly present: T;
  readonly future: readonly T[];
  /** The kind and the time of the last change, for merging (undefined after an undo / redo). */
  readonly last?: { kind: string; at: number };
}

/** Returns a history that starts at `present`, with nothing to undo or redo. */
export function startHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/**
 * Returns the history with `next` as the present. A change of `kind` within `MERGE_MS` of the
 * last change of the same kind replaces the present instead of adding a step; a change without a
 * kind never merges. The future is dropped.
 */
export function record<T>(h: History<T>, next: T, kind?: string, now = Date.now()): History<T> {
  const merge = kind !== undefined && h.last?.kind === kind && now - h.last.at < MERGE_MS;
  const last = kind === undefined ? undefined : { kind, at: now };
  if (merge) return { past: h.past, present: next, future: [], last };
  return { past: [...h.past, h.present].slice(-LIMIT), present: next, future: [], last };
}

/** Returns the history one step back; unchanged when there is nothing to undo. */
export function undo<T>(h: History<T>): History<T> {
  if (h.past.length === 0) return h;
  return {
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future],
  };
}

/** Returns the history one step forward again; unchanged when there is nothing to redo. */
export function redo<T>(h: History<T>): History<T> {
  if (h.future.length === 0) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
}

/** Returns the history with its merging ended: the next change is a step of its own (after SAVE). */
export function seal<T>(h: History<T>): History<T> {
  return h.last ? { past: h.past, present: h.present, future: h.future } : h;
}
