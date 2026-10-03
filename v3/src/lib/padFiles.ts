/**
 * @fileoverview padFiles — the files of a Single / Loop pad, each with its own trim (ADR-0068)
 *
 * Two parts:
 *   - The list operations of the PAD editor's file list: add (no file twice), remove, move one
 *     place up or down (WCAG 2.2 SC 2.5.7: buttons instead of dragging), set one file's trim.
 *   - `migratePad`: the one conversion of a pad stored before ADR-0068 (`files: string[]` plus one
 *     trim for the whole pad) — used by the database upgrade to version 7 and by the backup import,
 *     so both convert alike. It keeps how the pad sounded: a Single applied its trim to whichever
 *     file it played, so every file gets it; a Loop with one file gets it on that file; a Loop with
 *     several files ignored it (the engine played each file whole), so no file gets it.
 */

import type { Board, Pad, PadFile } from '../types';

/** A file of the pad, untrimmed. */
export const padFile = (hash: string): PadFile => ({ hash });

/** The library item ids of a pad's files, in order. */
export const hashesOf = (files: readonly PadFile[]): string[] => files.map((f) => f.hash);

/** Returns `files` with `hashes` added at the end — a file the pad has already is not added. */
export function addFiles(files: readonly PadFile[], hashes: readonly string[]): PadFile[] {
  const present = new Set(hashesOf(files));
  const added = [...new Set(hashes)].filter((h) => !present.has(h)).map(padFile);
  return [...files, ...added];
}

/** Returns `files` without the one at `index`; an index outside the list changes nothing. */
export function removeFile(files: readonly PadFile[], index: number): PadFile[] {
  return files.filter((_, i) => i !== index);
}

/**
 * Returns `files` with the one at `index` moved one place up (`-1`) or down (`+1`); at either end
 * of the list nothing changes.
 */
export function moveFile(files: readonly PadFile[], index: number, step: -1 | 1): PadFile[] {
  const to = index + step;
  if (index < 0 || index >= files.length || to < 0 || to >= files.length) return [...files];
  const next = [...files];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/** Returns `files` with the trim of the one at `index` replaced; `undefined` clears an end. */
export function setFileTrim(
  files: readonly PadFile[],
  index: number,
  trim: { trimStart?: number; trimEnd?: number },
): PadFile[] {
  return files.map((f, i) => {
    if (i !== index) return f;
    const next: PadFile = { hash: f.hash };
    if (trim.trimStart !== undefined) next.trimStart = trim.trimStart;
    if (trim.trimEnd !== undefined) next.trimEnd = trim.trimEnd;
    return next;
  });
}

// ── Pads stored before ADR-0068 ───────────────────────────────────────────────

/** A Single / Loop pad as stored before ADR-0068: hashes only, one trim for the whole pad. */
type LegacyFilePad = Omit<Extract<Pad, { files: PadFile[] }>, 'files'> & {
  files: string[];
  trimStart?: number;
  trimEnd?: number;
};

/** A pad as it may come out of storage or a backup: current or from before ADR-0068. */
export type StoredPad = Pad | LegacyFilePad;

/** True for a pad that still has the shape from before ADR-0068. */
function isLegacy(pad: StoredPad): pad is LegacyFilePad {
  if (pad.type === 'combo') return false;
  // An old pad without files is recognised by its pad-wide trim
  return 'trimStart' in pad || 'trimEnd' in pad || pad.files.some((f) => typeof f === 'string');
}

/**
 * Returns the pad in the shape of ADR-0068; a pad that has it already comes back unchanged (the
 * same object). How it sounded is kept — see the file overview.
 */
export function migratePad(pad: StoredPad): Pad {
  if (!isLegacy(pad)) return pad;
  const { files, trimStart, trimEnd, ...rest } = pad;
  const keepTrim = pad.type === 'single' || files.length <= 1;
  const trim = {
    ...(keepTrim && trimStart !== undefined ? { trimStart } : {}),
    ...(keepTrim && trimEnd !== undefined ? { trimEnd } : {}),
  };
  return { ...rest, files: files.map((hash) => ({ hash, ...trim })) };
}

/** Returns the board with every pad in the shape of ADR-0068 (`migratePad`). */
export function migrateBoard(board: Omit<Board, 'pads'> & { pads: StoredPad[] }): Board {
  return { ...board, pads: board.pads.map(migratePad) };
}
