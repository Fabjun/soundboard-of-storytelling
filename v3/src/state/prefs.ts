// ─────────────────────────────────────────────────────────────────────────────
// Preferences — small UI state kept in IndexedDB (ADR-0062, owner decision 2026-10-02)
//
// IndexedDB, not the synchronous Web Storage API, which web.dev "Storage for the web" advises
// against (it blocks the main thread). All entries are small and are read
// once at app start (loadPrefs, before the first render), so reading stays synchronous and the
// screen never flashes a default first. Writes update the cache at once and are saved in the
// background, counted in pendingSaves like board saves.
// Keys: `<name>[:<id>]` in the `keyval` store.
// ─────────────────────────────────────────────────────────────────────────────

import { signal } from '@preact/signals';
import { kvDelete, kvGetAll, kvPut } from '../db/idb';
import { DEFAULT_PAD_SORT, isPadSort, type PadSort } from '../lib/padSort';
import { pendingSaves } from './store';

const cache = new Map<string, unknown>();

/** Counts changes to the preferences — read it in a component to re-render when one changes. */
export const prefsVersion = signal(0);

/** Reads every preference into memory — call once at app start, before the first render. */
export async function loadPrefs(): Promise<void> {
  try {
    cache.clear();
    for (const [key, value] of await kvGetAll()) cache.set(key, value);
    prefsVersion.value++;
  } catch (e) {
    console.error('Loading preferences failed — defaults are used:', e);
  }
}

function write(key: string, value: unknown | undefined): void {
  if (value === undefined) cache.delete(key);
  else cache.set(key, value);
  prefsVersion.value++;
  pendingSaves.value++;
  (value === undefined ? kvDelete(key) : kvPut(key, value))
    .catch((e: unknown) => console.error(`Saving the preference ${key} failed:`, e))
    .finally(() => pendingSaves.value--);
}

// ── Last view of a board (owner decision 2026-10-02) ─────────────────────────

/** The view a board showed last: a deck id, or the All pads view. */
export type BoardView = { kind: 'deck'; deckId: string } | { kind: 'all-pads' };

const lastViewKey = (boardId: string) => `last-view:${boardId}`;

/** The view this board showed last, or null when none is stored. */
export function getLastView(boardId: string): BoardView | null {
  const v = cache.get(lastViewKey(boardId));
  if (v === 'all-pads') return { kind: 'all-pads' };
  if (typeof v === 'string' && v.startsWith('deck:')) return { kind: 'deck', deckId: v.slice(5) };
  return null;
}

export function setLastView(boardId: string, view: BoardView): void {
  write(lastViewKey(boardId), view.kind === 'all-pads' ? 'all-pads' : `deck:${view.deckId}`);
}

/** Forgets the stored view, e.g. when the board is deleted. */
export function clearLastView(boardId: string): void {
  write(lastViewKey(boardId), undefined);
}

// ── Last backup (D3) ─────────────────────────────────────────────────────────

const LAST_BACKUP_KEY = 'last-backup';

/** When the last backup was saved (ms since epoch), or null when there was none. */
export function getLastBackup(): number | null {
  const v = cache.get(LAST_BACKUP_KEY);
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export function setLastBackup(when: number): void {
  write(LAST_BACKUP_KEY, when);
}

// ── Sort of the All pads view, per board (owner decision 2026-10-02, E1) ────

const padSortKey = (boardId: string) => `pad-sort:${boardId}`;

/** The sort chosen for this board's All pads view — by name until one is chosen. */
export function getPadSort(boardId: string): PadSort {
  const v = cache.get(padSortKey(boardId));
  return isPadSort(v) ? v : DEFAULT_PAD_SORT;
}

export function setPadSort(boardId: string, sort: PadSort): void {
  write(padSortKey(boardId), { key: sort.key, reversed: sort.reversed });
}

// ── Last played, per pad (owner decision 2026-10-02, E1 "Last played") ──────

const lastPlayedKey = (padId: string) => `last-played:${padId}`;

/** When a pad was last played (ms since epoch), or null when never. */
export function getLastPlayed(padId: string): number | null {
  const v = cache.get(lastPlayedKey(padId));
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

export function setLastPlayed(padId: string, when: number): void {
  write(lastPlayedKey(padId), when);
}
