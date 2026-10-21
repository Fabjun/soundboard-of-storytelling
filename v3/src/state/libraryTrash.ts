/**
 * @fileoverview libraryTrash — "Recently deleted" of the library (Slice 16a, ADR-0087)
 *
 * A deleted file moves to the IndexedDB store `trash` and waits there 30 days, as Apple Photos and
 * Google Photos keep deleted items; then the next app start removes it for good. While it is in
 * the trash no pad plays it — the audio engine reads files from the library only — and RESTORE or
 * the toast's UNDO puts it back, with every pad that used it. Every write counts as a running save
 * (`pendingSaves`), so RELOAD and the E2E save marker wait for it.
 */

import { signal } from '@preact/signals';
import { libMoveToTrash, trashDelete, trashGetAllMeta, trashRestore } from '../db/idb';
import type { TrashItemMeta } from '../types';
import { addLibraryItemMeta, libraryItems, pendingSaves, removeLibraryItemMeta } from './store';

/** How many days a deleted file stays restorable. */
export const TRASH_DAYS = 30;

const DAY_MS = 86_400_000;

/** The files in the trash, metadata only, in the order they were deleted. */
export const trashItems = signal<TrashItemMeta[]>([]);

/** Days left before a trashed file goes for good — rounded up, never below 0. */
export function daysLeft(item: TrashItemMeta, now: number): number {
  return Math.max(0, Math.ceil((item.deletedAt + TRASH_DAYS * DAY_MS - now) / DAY_MS));
}

async function counted<T>(write: () => Promise<T>): Promise<T> {
  pendingSaves.value++; // synchronously, before the first await
  try {
    return await write();
  } finally {
    pendingSaves.value--;
  }
}

/**
 * Loads the trash and removes for good what has waited `TRASH_DAYS` — at app start, before the
 * first render (src/state/boot.ts).
 */
export async function loadTrash(now = Date.now()): Promise<void> {
  const all = await trashGetAllMeta();
  const due = new Set(all.filter((t) => daysLeft(t, now) === 0).map((t) => t.id));
  await counted(() => trashDelete([...due]));
  trashItems.value = all.filter((t) => !due.has(t.id)).sort((a, b) => a.deletedAt - b.deletedAt);
}

/**
 * Moves a library file to the trash. Resolves with its entry there, or null when it was not in the
 * library (it leaves the list either way).
 */
export async function trashFile(id: string, now = Date.now()): Promise<TrashItemMeta | null> {
  const moved = await counted(() => libMoveToTrash(id, now));
  removeLibraryItemMeta(id);
  if (moved) trashItems.value = [...trashItems.value.filter((t) => t.id !== id), moved];
  return moved;
}

/**
 * Moves library files to the trash one after another — the one way for a single and a bulk delete
 * (library.md D4). Resolves with the entries that reached the trash, in the order given.
 */
export async function trashFiles(
  ids: readonly string[],
  now = Date.now(),
): Promise<TrashItemMeta[]> {
  const moved: TrashItemMeta[] = [];
  for (const id of ids) {
    const entry = await trashFile(id, now);
    if (entry) moved.push(entry);
  }
  return moved;
}

/** Puts trashed files back into the library one after another — the UNDO of `trashFiles`. */
export async function restoreFiles(ids: readonly string[]): Promise<void> {
  for (const id of ids) await restoreFile(id);
}

/** Puts a trashed file back into the library; resolves false when it was not in the trash. */
export async function restoreFile(id: string): Promise<boolean> {
  const meta = await counted(() => trashRestore(id));
  trashItems.value = trashItems.value.filter((t) => t.id !== id);
  if (!meta) return false;
  if (!libraryItems.value.some((m) => m.id === id)) addLibraryItemMeta(meta);
  return true;
}

/** Deletes trashed files for good: the given ids, or the whole trash (EMPTY). */
export async function deleteForGood(ids?: string[]): Promise<void> {
  await counted(() => trashDelete(ids));
  trashItems.value = ids ? trashItems.value.filter((t) => !ids.includes(t.id)) : [];
}
