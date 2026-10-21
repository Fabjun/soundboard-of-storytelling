/**
 * @fileoverview fileUses — which pads play a library file (Slice 16a, docs/product/features/library.md#l5-what-in-use-shows)
 *
 * A Single or Loop pad holds its files by their hash (ADR-0048); a combo plays other pads, so it
 * holds no file itself. Read from the boards in memory (JSON, no audio), for the "in N pads" of a
 * library row and for what a delete tells — V1 warned "Pads using it will no longer play".
 */

import type { Board } from '../types';
import { isComboPad } from '../types';

/** One pad that plays a file: its name and its board's name. */
export interface FileUse {
  board: string;
  pad: string;
}

/**
 * Maps each file hash to the pads that play it, over all boards; a pad that holds a file twice
 * counts once. Files no pad plays are not in the map.
 */
export function fileUses(boards: readonly Board[]): Map<string, FileUse[]> {
  const uses = new Map<string, FileUse[]>();
  for (const board of boards) {
    for (const pad of board.pads) {
      if (isComboPad(pad)) continue;
      for (const hash of new Set(pad.files.map((f) => f.hash))) {
        const list = uses.get(hash) ?? [];
        list.push({ board: board.name, pad: pad.name });
        uses.set(hash, list);
      }
    }
  }
  return uses;
}

/** Counts the pads that play at least one of `hashes`; a pad that plays several counts once. */
export function padsUsing(boards: readonly Board[], hashes: readonly string[]): number {
  const wanted = new Set(hashes);
  let count = 0;
  for (const board of boards) {
    for (const pad of board.pads) {
      if (!isComboPad(pad) && pad.files.some((f) => wanted.has(f.hash))) count++;
    }
  }
  return count;
}

/** Says how many pads lose their sound, e.g. "1 pad loses its sound"; empty when none does. */
export function soundLossText(count: number): string {
  if (count === 0) return '';
  return count === 1 ? '1 pad loses its sound' : `${count} pads lose their sound`;
}
