// ─────────────────────────────────────────────────────────────────────────────
// idb — unit tests for the IndexedDB layer
//
// Uses fake-indexeddb for an in-memory IDB implementation.
// A fresh IDBFactory instance is created before each test to ensure full
// isolation (no shared state between tests).
//
// _resetDB() is called to null the idb.ts module singleton so that the next
// getDB() call opens a fresh database against the new IDBFactory.
// ─────────────────────────────────────────────────────────────────────────────

// fake-indexeddb/auto is loaded via vitest setupFiles (tests/unit/setup.ts).
// IDBFactory is imported here only to create fresh per-test instances.
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import type { Board, LibraryItem } from '../../src/types';
import {
  boardPut,
  boardGet,
  boardGetAll,
  boardDelete,
  libPut,
  libGetAllMeta,
  libRename,
  _resetDB,
} from '../../src/db/idb';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeBoard(id: string, name = 'Test Board'): Board {
  return {
    id,
    name,
    themeId: 'hearth',
    settings: { quickAccessLayout: 'hidden', quickAccessSetCount: 1 },
    decks: [],
    sets: [],
  };
}

function makeLibraryItem(id: string, name = 'test.mp3'): LibraryItem {
  return {
    id,
    type: 'audio',
    name,
    size: 1024,
    tags: [],
    addedAt: 1_000_000,
    duration: 5,
    peaks: new Array<number>(30).fill(0.5),
    blob: new Blob(['fake audio bytes'], { type: 'audio/mpeg' }),
  };
}

// ── Fresh IDB per test ────────────────────────────────────────────────────────

beforeEach(() => {
  // Fresh in-memory IDBFactory → each test gets an isolated database.
  // Cast through Record<string,unknown> avoids any use of 'any' while
  // side-stepping the DOM IDBFactory type mismatch (runtime compatible).
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB(); // null the idb.ts _db singleton so next getDB() call re-opens
});

// ── Board round-trip ──────────────────────────────────────────────────────────

describe('boardPut → boardGet', () => {
  test('round-trip preserves all fields', async () => {
    const b = makeBoard('b1', 'My Board');
    await boardPut(b);
    const fetched = await boardGet('b1');
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe('b1');
    expect(fetched?.name).toBe('My Board');
    expect(fetched?.themeId).toBe('hearth');
    expect(fetched?.decks).toHaveLength(0);
    expect(fetched?.sets).toHaveLength(0);
  });

  test('boardGet returns null for non-existent id', async () => {
    const result = await boardGet('GHOST');
    expect(result).toBeNull();
  });

  test('upsert: second put with same id replaces the entry', async () => {
    await boardPut(makeBoard('b1', 'Original'));
    await boardPut(makeBoard('b1', 'Updated'));
    const fetched = await boardGet('b1');
    expect(fetched?.name).toBe('Updated');
  });
});

// ── boardGetAll ───────────────────────────────────────────────────────────────

describe('boardGetAll', () => {
  test('returns empty array when no boards exist', async () => {
    const all = await boardGetAll();
    expect(all).toEqual([]);
  });

  test('returns all stored boards (by id, order not guaranteed)', async () => {
    await boardPut(makeBoard('b1'));
    await boardPut(makeBoard('b2'));
    await boardPut(makeBoard('b3'));
    const all = await boardGetAll();
    expect(all).toHaveLength(3);
    const ids = all.map((b) => b.id).sort();
    expect(ids).toEqual(['b1', 'b2', 'b3']);
  });
});

// ── boardDelete ───────────────────────────────────────────────────────────────

describe('boardDelete', () => {
  test('removes the board from IDB', async () => {
    await boardPut(makeBoard('b1'));
    await boardDelete('b1');
    expect(await boardGet('b1')).toBeNull();
    expect(await boardGetAll()).toHaveLength(0);
  });

  test('deleting non-existent id does not throw', async () => {
    await expect(boardDelete('GHOST')).resolves.not.toThrow();
  });

  test('only deletes the target board, not others', async () => {
    await boardPut(makeBoard('b1'));
    await boardPut(makeBoard('b2'));
    await boardDelete('b1');
    expect(await boardGet('b2')).not.toBeNull();
  });
});

// ── libGetAllMeta ─────────────────────────────────────────────────────────────

describe('libGetAllMeta', () => {
  test('returns empty array when library is empty', async () => {
    const metas = await libGetAllMeta();
    expect(metas).toEqual([]);
  });

  test('returns metadata without blob field (memory-safe cursor)', async () => {
    await libPut(makeLibraryItem('hash-abc', 'thunder.mp3'));
    const metas = await libGetAllMeta();
    expect(metas).toHaveLength(1);
    expect(metas[0].id).toBe('hash-abc');
    expect(metas[0].name).toBe('thunder.mp3');
    // blob must NOT be present — this is the core memory-safety invariant
    expect(metas[0]).not.toHaveProperty('blob');
  });

  test('returns all items in the library', async () => {
    await libPut(makeLibraryItem('hash-1', 'a.mp3'));
    await libPut(makeLibraryItem('hash-2', 'b.mp3'));
    const metas = await libGetAllMeta();
    expect(metas).toHaveLength(2);
    const ids = metas.map((m) => m.id).sort();
    expect(ids).toEqual(['hash-1', 'hash-2']);
  });

  test('preserves all metadata scalar fields', async () => {
    const item = makeLibraryItem('hash-x', 'rain.mp3');
    item.duration = 42;
    item.size = 9999;
    item.tags = ['ambient', 'rain'];
    await libPut(item);
    const [meta] = await libGetAllMeta();
    expect(meta.duration).toBe(42);
    expect(meta.size).toBe(9999);
    expect(meta.tags).toEqual(['ambient', 'rain']);
    expect(meta.peaks).toHaveLength(30);
  });
});

// ── libRename ────────────────────────────────────────────────────────────────

describe('libRename', () => {
  test('updates name, preserves all other fields', async () => {
    await libPut(makeLibraryItem('hash-r', 'original.mp3'));
    await libRename('hash-r', 'renamed.mp3');
    const metas = await libGetAllMeta();
    expect(metas[0].name).toBe('renamed.mp3');
    // Duration, size, peaks, tags unchanged
    expect(metas[0].duration).toBe(5);
    expect(metas[0].size).toBe(1024);
  });

  test('rename of non-existent id is a no-op (no throw)', async () => {
    await expect(libRename('GHOST', 'new.mp3')).resolves.not.toThrow();
  });
});

// ── Upgrade v2 → v3 (ADR-0048, Slice 9b) ──────────────────────────────────────

describe('DB upgrade to v3', () => {
  test('clears only the boards store; library audio and other databases are untouched', async () => {
    // Old v2 database with one old-format board and one library item
    const v2 = await openDB('sos-v3', 2, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
        db.createObjectStore('boards', { keyPath: 'id' });
      },
    });
    await v2.put('boards', { id: 'OLD', name: 'Old board', scenes: [] });
    await v2.put('library', makeLibraryItem('HASH1', 'keep.mp3'));
    v2.close();

    // A V1 database on the same origin must never be touched
    const v1 = await openDB('botc', 2, {
      upgrade(db) {
        db.createObjectStore('lib', { keyPath: 'hash' });
      },
    });
    await v1.put('lib', { hash: 'V1HASH', name: 'v1.mp3' });
    v1.close();

    expect(await boardGetAll()).toEqual([]);
    const lib = await libGetAllMeta();
    expect(lib.map((m) => m.id)).toEqual(['HASH1']);

    const v1Again = await openDB('botc', 2);
    expect(await v1Again.get('lib', 'V1HASH')).toEqual({ hash: 'V1HASH', name: 'v1.mp3' });
    v1Again.close();
  });
});
