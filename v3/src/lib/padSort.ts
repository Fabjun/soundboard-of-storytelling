/**
 * @fileoverview Pad sort — the order of the All pads view (owner decision 2026-10-02, E1)
 *
 * Modeled on the Finder (Apple Support "Sort and arrange items in the Finder on Mac"): sort keys
 * like Name, Date Added, Date Modified, Kind; each has a natural direction (names A→Z, dates
 * newest first), a second choice reverses it, and the choice is remembered per board (per folder
 * in the Finder). Pads without a value (never played, no date) always come last; equal values
 * are ordered by name, then id, so the order is stable.
 */

import type { Pad, PadType } from '../types';

/** What All pads can be sorted by. */
export type PadSortKey =
  'name' | 'added' | 'modified' | 'kind' | 'unplaced' | 'duration' | 'played';

/** A sort choice: the key, and whether its natural direction is reversed. */
export type PadSort = { key: PadSortKey; reversed: boolean };

/** The order of a board whose sort was never chosen: by name, A→Z. */
export const DEFAULT_PAD_SORT: PadSort = { key: 'name', reversed: false };

/** Menu labels. */
export const PAD_SORT_LABELS: Record<PadSortKey, string> = {
  name: 'Name',
  added: 'Date added',
  modified: 'Date modified',
  kind: 'Kind',
  unplaced: 'Not in a deck first',
  duration: 'Duration',
  played: 'Last played',
};

/** The keys in menu order. */
export const PAD_SORT_KEYS: readonly PadSortKey[] = [
  'name',
  'added',
  'modified',
  'kind',
  'unplaced',
  'duration',
  'played',
];

/** A stored sort choice, if it is a valid one. */
export function isPadSort(v: unknown): v is PadSort {
  return (
    typeof v === 'object' &&
    v !== null &&
    'key' in v &&
    'reversed' in v &&
    typeof v.reversed === 'boolean' &&
    PAD_SORT_KEYS.some((k) => k === v.key)
  );
}

/** What sorting needs to know beyond the pads themselves. */
export interface PadSortContext {
  /** In how many decks a pad is placed. */
  deckCount: (padId: string) => number;
  /** Length of a library file in seconds, or undefined when unknown. */
  fileDuration: (fileId: string) => number | undefined;
  /** When a pad was last played (ms since epoch), or null when never. */
  lastPlayed: (padId: string) => number | null;
}

const KIND_RANK: Record<PadType, number> = { single: 0, loop: 1, combo: 2 };

/**
 * A pad's length for sorting (provisional, 2026-10-02): Single — its longest file (it plays one
 * per trigger); Loop — one pass through its files; Combo — the sum of its steps' waits and
 * fade-outs. A file counts with its trimmed length — what is heard (ADR-0068). Undefined when
 * nothing is known.
 */
export function padDuration(pad: Pad, ctx: PadSortContext): number | undefined {
  if (pad.type === 'combo') {
    const total = pad.steps.reduce(
      (s, step) => s + (step.duration ?? 0) + (step.fadeOutAll ?? 0),
      0,
    );
    return total > 0 ? total : undefined;
  }
  const known = pad.files
    .map((f) => {
      const duration = ctx.fileDuration(f.hash);
      if (duration === undefined) return undefined;
      const start = f.trimStart ?? 0;
      const end = f.trimEnd && f.trimEnd > start ? Math.min(f.trimEnd, duration) : duration;
      return Math.max(0, end - start);
    })
    .filter((d): d is number => d !== undefined);
  if (known.length === 0) return undefined;
  return pad.type === 'single' ? Math.max(...known) : known.reduce((a, b) => a + b, 0);
}

/** The value a key sorts by, in its natural direction (smaller first), or undefined (last). */
function sortValue(pad: Pad, key: PadSortKey, ctx: PadSortContext): number | undefined {
  switch (key) {
    case 'name':
      return 0; // decided by the name tie-break
    case 'added':
      return pad.addedAt === undefined ? undefined : -pad.addedAt; // newest first
    case 'modified':
      return pad.modifiedAt === undefined ? undefined : -pad.modifiedAt;
    case 'kind':
      return KIND_RANK[pad.type];
    case 'unplaced':
      return ctx.deckCount(pad.id) === 0 ? 0 : 1;
    case 'duration':
      return padDuration(pad, ctx);
    case 'played': {
      const t = ctx.lastPlayed(pad.id);
      return t === null ? undefined : -t; // most recent first
    }
  }
}

type Named = { id: string; name: string };

const byName = (a: Named, b: Named) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id);

// The one ordering of both lists: by a value in its natural direction (smaller first), no value
// always last, equal values by name then id; the name order follows the direction only when
// sorting by name
function inOrder<T extends Named>(
  items: readonly T[],
  valueOf: (item: T) => number | undefined,
  byNameKey: boolean,
  reversed: boolean,
): T[] {
  const dir = reversed ? -1 : 1;
  const values = new Map(items.map((t) => [t.id, valueOf(t)]));
  return [...items].sort((a, b) => {
    const va = values.get(a.id);
    const vb = values.get(b.id);
    if (va === undefined || vb === undefined) {
      if (va !== vb) return va === undefined ? 1 : -1; // no value: always last
    } else if (va !== vb) {
      return (va - vb) * dir;
    }
    return byNameKey ? byName(a, b) * dir : byName(a, b);
  });
}

/** The pads in the chosen order (a new array). */
export function sortPads(pads: readonly Pad[], sort: PadSort, ctx: PadSortContext): Pad[] {
  return inOrder(pads, (p) => sortValue(p, sort.key, ctx), sort.key === 'name', sort.reversed);
}

// ── The library's file list (Slice 16b, docs/product/features/library.md#l9-sort) ─────────────

/** What the library's file list can be sorted by — the keys of All pads a file has. */
export type LibrarySortKey = Extract<PadSortKey, 'name' | 'added' | 'duration'>;

/** A sort choice for the library: the key, and whether its natural direction is reversed. */
export type LibrarySort = { key: LibrarySortKey; reversed: boolean };

/** The library's keys in menu order (labels: `PAD_SORT_LABELS`). */
export const LIBRARY_SORT_KEYS: readonly LibrarySortKey[] = ['added', 'name', 'duration'];

/** The library's order when none was chosen: newest first, as V1's library (`date-desc`). */
export const DEFAULT_LIBRARY_SORT: LibrarySort = { key: 'added', reversed: false };

/** A stored library sort choice, if it is a valid one. */
export function isLibrarySort(v: unknown): v is LibrarySort {
  return isPadSort(v) && LIBRARY_SORT_KEYS.some((k) => k === v.key);
}

/** Library files in the chosen order (a new array): date added newest first, name A→Z, duration shortest first. */
export function sortLibrary<T extends Named & { addedAt: number; duration: number }>(
  files: readonly T[],
  sort: LibrarySort,
): T[] {
  const valueOf = (f: T): number | undefined => {
    switch (sort.key) {
      case 'name':
        return 0;
      case 'added':
        return -f.addedAt;
      case 'duration':
        return f.duration > 0 ? f.duration : undefined;
    }
  };
  return inOrder(files, valueOf, sort.key === 'name', sort.reversed);
}
