/**
 * @fileoverview V3.0 IndexedDB Layer
 *
 * Database: 'sos-v3', version `DB_VERSION` (see the upgrade steps below)
 * Object stores:
 *   'library'  (keyPath: 'id')  — LibraryItem entries (includes blob) [since v1]
 *   'boards'   (keyPath: 'id')  — Board documents (JSON, no blobs)    [since v2]
 *   'keyval'   (out-of-line keys) — small preferences and stats       [since v6]
 *
 * MEMORY SAFETY RULES (carried over from V1 — see CLAUDE.md#iphone--ios-safari--memory--stability-rules-critical):
 *   - libGetAllMeta() uses a cursor and NEVER references cursor.value.blob.
 *     At most one full record is in RAM at a time during enumeration.
 *   - libGet() loads one full entry (with blob) — only when the audio itself is needed
 *     (playback, backup export, rename, fine peaks), one entry at a time.
 *   - libRename() briefly holds one Blob in RAM (IDB has no partial-update;
 *     it must read the full entry, patch the name, and re-put). The Blob is
 *     released as soon as libRename() returns. This is intentional and safe.
 *
 * BOARD PERSISTENCE TRADE-OFF (conscious decision):
 *   Boards are stored as complete JSON documents containing embedded Decks and
 *   Pads. Any pad edit rewrites the entire Board document. At 5 Decks × 16 Pads
 *   this is ~50 KB — fast and unproblematic. If boards grow significantly (20+
 *   decks), write-amplification may become measurable. Optimization path (only
 *   if measured): separate 'decks' store with Board holding deck IDs only.
 *   Do not optimize until the problem is observed and quantified.
 */

import { openDB, type IDBPDatabase, type IDBPObjectStore } from 'idb';
import type { Board, LibraryItem, LibraryItemMeta } from '../types';
import { migrateBoard } from '../lib/padFiles';

// ── DB singleton ─────────────────────────────────────────────────────────────

const DB_NAME = 'sos-v3';
const DB_VERSION = 10;

let _db: IDBPDatabase | null = null;

/** @internal Test-only: resets the DB singleton so unit tests get a fresh IDBFactory. */
export function _resetDB(): void {
  _db = null;
}

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      // v1: library store (audio blobs + metadata)
      if (oldVersion < 1) {
        db.createObjectStore('library', { keyPath: 'id' });
      }
      // v2: boards store (Board documents — JSON only, no blobs)
      if (oldVersion < 2) {
        db.createObjectStore('boards', { keyPath: 'id' });
      }
      // v3: Board field `scenes` renamed to `decks` (ADR-0048, Slice 9b). Stored boards
      // are old-format test data → clear ONLY the boards store. The library store (audio)
      // is untouched, and no other database (e.g. V1's 'botc' on the same origin) is touched.
      // v4: pad pool — pads move from the decks into Board.pads, decks hold placements, sets are
      // replaced by Board.quickAccess (ADR-0048, Slice 9c). Same rule as v3: clear ONLY the boards
      // store (old-format test data); library and other databases untouched. One clear covers
      // both steps when a v2 database is upgraded straight to v4.
      // v5: Single / Loop pads hold `files` + `order`; Playlist merges into Loop (ADR-0048,
      // Slice 9d). Same rule: clear ONLY the boards store; one clear covers every older step.
      if (oldVersion >= 2 && oldVersion < 5) {
        void tx.objectStore('boards').clear();
      }
      // v6: a small key-value store for UI preferences and per-pad stats (owner decision
      // 2026-10-02: IndexedDB, not Web Storage — ADR-0062). Only ADDS a store: boards and
      // library stay as they are.
      if (oldVersion < 6) {
        db.createObjectStore('keyval');
      }
      // v7: every file of a Single / Loop pad has its own trim (ADR-0068). The boards are the
      // owner's real data now — CONVERTED in place, never cleared (`migrateBoard` keeps how each
      // pad sounded). Inside the upgrade transaction, so a failure leaves the old version intact.
      // v8: pads hold up to 4 icon keys (ADR-0070); V1's icon id that the import kept in
      // `iconRef` becomes a key. Same rule: converted in place. One pass covers both steps
      // (`migrateBoard` does every conversion), so a v5–v6 database is read only once.
      // v9: each deck's `padSize` is a size in px, set with the PAD SIZE slider (ADR-0075); the old
      // word ('md', '1fr' — never used) becomes the default. Same rule: converted in place.
      // v10: one pad size per board instead of per deck (owner decision 2026-10-06) — the board
      // takes its first deck's size. Same rule: converted in place.
      if (oldVersion >= 5 && oldVersion < 10) {
        void migrateStoredBoards(tx.objectStore('boards'));
      }
    },
  });
  return _db;
}

/**
 * Converts every stored board to the current pad shape (`migrateBoard`), one board at a time through a cursor
 * (boards are small JSON documents — no audio is read). Only awaits requests of the upgrade
 * transaction, so the transaction stays open until the last board is written.
 */
async function migrateStoredBoards(
  store: IDBPObjectStore<unknown, string[], 'boards', 'versionchange'>,
): Promise<void> {
  let cursor = await store.openCursor();
  while (cursor) {
    await cursor.update(migrateBoard(cursor.value as Board));
    cursor = await cursor.continue();
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Lists all library entries — metadata only, blob excluded. Read at app start
 * (src/state/boot.ts, fills the library list) and for the backup export.
 *
 * Memory safety: uses a cursor and destructures only scalar/array fields from
 * cursor.value. The blob field is never referenced, so the Blob object is
 * GC-eligible after each cursor.continue(). At most one IDB record is loaded
 * at a time, regardless of library size.
 */
export async function libGetAllMeta(): Promise<LibraryItemMeta[]> {
  const db = await getDB();
  const results: LibraryItemMeta[] = [];
  let cursor = await db.transaction('library', 'readonly').store.openCursor();
  while (cursor) {
    // Destructure only the meta fields — blob is intentionally NOT referenced.
    // cursor.value goes out of scope after this block; Blob is GC-eligible.
    const { id, type, name, size, tags, addedAt, duration, peaks } = cursor.value as LibraryItem;
    results.push({ id, type, name, size, tags, addedAt, duration, peaks });
    cursor = await cursor.continue();
  }
  return results;
}

/**
 * Loads a single full entry including its Blob.
 * Only call this when the audio data itself is needed (playback, backup export, rename, fine
 * peaks), one entry at a time. The caller is responsible for releasing the Blob reference after use.
 */
export async function libGet(id: string): Promise<LibraryItem | null> {
  const db = await getDB();
  const entry = (await db.get('library', id)) as LibraryItem | undefined;
  return entry ?? null;
}

/**
 * Adds or updates a complete library entry (upsert).
 * Called once per file during upload, after peaks/duration are computed, and to write an entry
 * back whole (rename, fine peaks) — IndexedDB has no partial update.
 */
export async function libPut(item: LibraryItem): Promise<void> {
  const db = await getDB();
  await db.put('library', item);
}

/**
 * Deletes a library entry by id (SHA-256 hash).
 */
export async function libDelete(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('library', id);
}

/**
 * Renames a library entry.
 *
 * Note: IDB has no partial-update — this reads the full entry (including Blob),
 * patches the name, and writes it back. The Blob is held in RAM only for the
 * duration of this call and released when the function returns. This is
 * intentional; the alternative (separate name store) adds schema complexity
 * not justified by a single-field patch.
 */
export async function libRename(id: string, newName: string): Promise<void> {
  const entry = await libGet(id);
  if (!entry) return;
  await libPut({ ...entry, name: newName });
}

// ── Board API ─────────────────────────────────────────────────────────────────
//
// Boards are stored as complete JSON documents (Board contains Decks and Pads).
// No blobs live in Board documents — memory safety is not a concern here.
// See the BOARD PERSISTENCE TRADE-OFF comment at the top of this file.

/**
 * Loads all boards from IDB — read at app start (src/state/boot.ts, fills the board list) and
 * for the backup export.
 * Safe to call at any library size — Board documents contain no blobs. Older board formats never
 * arrive here: the v4 upgrade clears them (ADR-0048), so no migration code is kept.
 */
export async function boardGetAll(): Promise<Board[]> {
  const db = await getDB();
  const raw = (await db.getAll('boards')) as Board[];
  return raw;
}

/**
 * Loads a single board by id — the stored version, which src/state/boardWrites.ts shows again
 * after a save failed.
 */
export async function boardGet(id: string): Promise<Board | null> {
  const db = await getDB();
  const entry = (await db.get('boards', id)) as Board | undefined;
  return entry ?? null;
}

/**
 * Adds or updates a board (upsert).
 * Always writes the complete Board document — trade-off: any pad or deck edit rewrites the whole
 * document, about 50 KB at 5 decks × 16 pads (BOARD PERSISTENCE TRADE-OFF at the top of this
 * file, ADR-0010). Called through src/state/boardWrites.ts after any change.
 */
export async function boardPut(board: Board): Promise<void> {
  const db = await getDB();
  await db.put('boards', board);
}

/**
 * Deletes a board by id — with its decks and pads, which live inside the board document.
 */
export async function boardDelete(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('boards', id);
}

// ── Key-value store (preferences, per-pad stats) — small values only, never audio or boards ───

/** Every key-value entry — small, so read in one go at app start (src/state/prefs.ts). */
export async function kvGetAll(): Promise<[string, unknown][]> {
  const db = await getDB();
  const tx = db.transaction('keyval', 'readonly');
  const entries: [string, unknown][] = [];
  for await (const cursor of tx.store) entries.push([String(cursor.key), cursor.value]);
  return entries;
}

/** Stores one key-value entry (a preference), replacing an earlier value. */
export async function kvPut(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('keyval', value, key);
}

/** Deletes one key-value entry; a missing key is not an error. */
export async function kvDelete(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('keyval', key);
}
