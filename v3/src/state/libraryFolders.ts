/**
 * @fileoverview libraryFolders — the library's folders (Slice 16c, library.md L2, ADR-0088)
 *
 * A file is in one folder or in none, as in V1. The folders live in one map from file id to
 * folder name in the key-value store (`library-folders`, read before the first render with the
 * other preferences), not on the library entries: IndexedDB has no partial update, and an entry
 * holds its audio, so a field there would make every move and rename rewrite audio records. While
 * the map was never written it is derived from the tags — a V1 import keeps each file's folder as
 * its one tag (owner decision B9) — and the first change stores it.
 */

import type { LibraryItemMeta } from '../types';
import { getLibraryFolderMap, setLibraryFolderMap } from './prefs';
import { libraryItems } from './store';
import { trashItems } from './libraryTrash';

/** The longest folder name, in characters (V1's limit). */
export const FOLDER_NAME_MAX = 40;

/** File id → folder name; a file that is not in it is in no folder. */
export type FolderMap = Readonly<Record<string, string>>;

/** A folder of the library and how many of its files are listed. */
export interface FolderInfo {
  name: string;
  count: number;
}

/** Derives the map from the entries' tags: a file whose tags are exactly one name is in it (B9). */
export function foldersFromTags(
  entries: readonly Pick<LibraryItemMeta, 'id' | 'tags'>[],
): FolderMap {
  const map: Record<string, string> = {};
  for (const { id, tags } of entries) {
    const name = tags.length === 1 ? cleanName(tags[0]) : '';
    if (name) map[id] = name;
  }
  return map;
}

/** The map in force: the stored one, or the one derived from the tags while none is stored. */
export function folderMap(): FolderMap {
  return getLibraryFolderMap() ?? foldersFromTags([...libraryItems.value, ...trashItems.value]);
}

/** Lists the folders the given files use, by name (case ignored), each with its number of files. */
export function folderList(
  items: readonly Pick<LibraryItemMeta, 'id'>[],
  map: FolderMap,
): FolderInfo[] {
  const counts = new Map<string, number>();
  for (const { id } of items) {
    const name = map[id];
    if (name !== undefined) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, FOLDER_NAME_MAX).trim();
}

/**
 * Cleans a typed folder name — trimmed, inner spaces as one, at most `FOLDER_NAME_MAX` characters
 * — and returns the existing folder it matches except for case, as on a Mac's default volume.
 * Empty when nothing is left.
 */
export function cleanFolderName(raw: string, existing: readonly string[]): string {
  const name = cleanName(raw);
  const lower = name.toLowerCase();
  return existing.find((f) => f.toLowerCase() === lower) ?? name;
}

/** Stores the map, without entries of files that are neither in the library nor in the trash. */
function store(next: Record<string, string>): void {
  const known = new Set([...libraryItems.value, ...trashItems.value].map((m) => m.id));
  setLibraryFolderMap(Object.fromEntries(Object.entries(next).filter(([id]) => known.has(id))));
}

/**
 * Puts the files in `folder`, or in no folder (null). Returns the folders they had before — what
 * `restoreFolders` needs for an UNDO.
 */
export function moveToFolder(ids: readonly string[], folder: string | null): FolderMap {
  const map = folderMap();
  const before = pick(map, ids);
  const next: Record<string, string> = { ...map };
  for (const id of ids) {
    if (folder === null) delete next[id];
    else next[id] = folder;
  }
  store(next);
  return before;
}

/**
 * Puts files in the folders a backup or an upload names (file id → name), in one write; a name
 * that matches an existing folder except for case joins it. Files left out keep their folder.
 */
export function assignFolders(assignments: FolderMap): void {
  const entries = Object.entries(assignments);
  if (entries.length === 0) return;
  const map = folderMap();
  const names = [...new Set(Object.values(map))];
  const next: Record<string, string> = { ...map };
  for (const [id, raw] of entries) {
    const name = cleanFolderName(raw, names);
    if (!name) continue;
    if (!names.includes(name)) names.push(name);
    next[id] = name;
  }
  store(next);
}

/** Gives the files the folders `before` names, and no folder to those it leaves out. */
export function restoreFolders(ids: readonly string[], before: FolderMap): void {
  const next: Record<string, string> = { ...folderMap() };
  for (const id of ids) {
    const name = before[id];
    if (name === undefined) delete next[id];
    else next[id] = name;
  }
  store(next);
}

/** Renames a folder; a name another folder has already joins the two. */
export function renameFolder(from: string, to: string): void {
  const next: Record<string, string> = { ...folderMap() };
  for (const id of Object.keys(next)) if (next[id] === from) next[id] = to;
  store(next);
}

/**
 * Removes a folder: its files stay in the library, in no folder. Returns the ids that were in it,
 * for an UNDO (`moveToFolder(ids, name)`).
 */
export function removeFolder(name: string): string[] {
  const map = folderMap();
  const ids = Object.keys(map).filter((id) => map[id] === name);
  moveToFolder(ids, null);
  return ids;
}

function pick(map: FolderMap, ids: readonly string[]): FolderMap {
  const out: Record<string, string> = {};
  for (const id of ids) {
    const name = map[id];
    if (name !== undefined) out[id] = name;
  }
  return out;
}
