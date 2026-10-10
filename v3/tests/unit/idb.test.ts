/**
 * @fileoverview idb — unit tests for the IndexedDB layer
 *
 * Uses fake-indexeddb for an in-memory IDB implementation.
 * A fresh IDBFactory instance is created before each test to ensure full
 * isolation (no shared state between tests).
 *
 * _resetDB() is called to null the idb.ts module singleton so that the next
 * getDB() call opens a fresh database against the new IDBFactory.
 */

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
  libDelete,
  libGet,
  libPut,
  libGetAllMeta,
  libRename,
  _resetDB,
  kvDelete,
  kvGetAll,
  kvPut,
} from '../../src/db/idb';
import { newPad } from '../../src/lib/padUtils';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeBoard(id: string, name = 'Test Board'): Board {
  return {
    id,
    name,
    themeId: 'hearth',
    pads: [],
    decks: [],
    padSize: 88,
    quickAccess: [],
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
    expect(fetched?.pads).toHaveLength(0);
    expect(fetched?.quickAccess).toHaveLength(0);
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

// ── libDelete ────────────────────────────────────────────────────────────────

describe('libDelete', () => {
  test('removes only the target entry, audio included; a missing id is no error', async () => {
    await libPut(makeLibraryItem('a'));
    await libPut(makeLibraryItem('b'));
    await libDelete('a');
    expect((await libGetAllMeta()).map((m) => m.id)).toEqual(['b']);
    expect(await libGet('a')).toBeNull();
    await expect(libDelete('gone')).resolves.toBeUndefined();
  });
});

// ── Upgrade v1 → current (a database from before the boards store) ────────────

describe('DB upgrade from v1', () => {
  test('a database with only the library store gets the others; library audio is untouched', async () => {
    const v1 = await openDB('sos-v3', 1, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
      },
    });
    await v1.put('library', makeLibraryItem('A', 'keep.mp3'));
    v1.close();

    expect((await libGetAllMeta()).map((m) => m.name)).toEqual(['keep.mp3']);
    expect(await boardGetAll()).toEqual([]);
    await kvPut('k', 1);
    expect(await kvGetAll()).toEqual([['k', 1]]);
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

// ── Upgrade v3 → v4 (ADR-0048, Slice 9c) ──────────────────────────────────────

describe('DB upgrade to v4', () => {
  test('clears only the boards store (decks with pads inside); library audio is untouched', async () => {
    // A v3 database: decks still carry their own pads (format before the pad pool)
    const v3 = await openDB('sos-v3', 3, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
        db.createObjectStore('boards', { keyPath: 'id' });
      },
    });
    await v3.put('boards', {
      id: 'OLD',
      name: 'Old board',
      decks: [{ id: 'd', pads: [] }],
      sets: [],
    });
    await v3.put('library', makeLibraryItem('HASH1', 'keep.mp3'));
    v3.close();

    expect(await boardGetAll()).toEqual([]);
    expect((await libGetAllMeta()).map((m) => m.id)).toEqual(['HASH1']);
  });

  test('a board in the v4 format survives a reopen', async () => {
    const b = { ...makeBoard('b4'), pads: [], quickAccess: [] };
    await boardPut(b);
    _resetDB();
    expect(await boardGet('b4')).toEqual(b);
  });
});

// ── Upgrade v4 → v5 (ADR-0048, Slice 9d) ──────────────────────────────────────

describe('DB upgrade to v5', () => {
  test('clears only the boards store (pads with libraryItemRef / playlists); library audio is untouched', async () => {
    // A v4 database: pool pads still in the old shape (one libraryItemRef, playlist type)
    const v4 = await openDB('sos-v3', 4, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
        db.createObjectStore('boards', { keyPath: 'id' });
      },
    });
    await v4.put('boards', {
      ...makeBoard('OLD'),
      pads: [
        { id: 's', type: 'single', libraryItemRef: 'HASH1' },
        { id: 'p', type: 'playlist', files: ['HASH1'] },
      ],
      quickAccess: [],
    });
    await v4.put('library', makeLibraryItem('HASH1', 'keep.mp3'));
    v4.close();

    expect(await boardGetAll()).toEqual([]);
    expect((await libGetAllMeta()).map((m) => m.id)).toEqual(['HASH1']);
  });

  test('a board in the v5 format survives a reopen', async () => {
    const b = {
      ...makeBoard('b5'),
      pads: [newPad('p', 'loop', 'Rain', ['HASH1', 'HASH2'])],
      quickAccess: [],
    };
    await boardPut(b);
    _resetDB();
    expect(await boardGet('b5')).toEqual(b);
  });
});

// ── Upgrade v5 → v6 (key-value store for preferences, 2026-10-02) ─────────────

describe('DB upgrade to v6', () => {
  test('only adds the key-value store — boards and library audio stay', async () => {
    const v5 = await openDB('sos-v3', 5, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
        db.createObjectStore('boards', { keyPath: 'id' });
      },
    });
    const board = { ...makeBoard('KEEP'), pads: [], quickAccess: [] };
    await v5.put('boards', board);
    await v5.put('library', makeLibraryItem('HASH1', 'keep.mp3'));
    v5.close();

    expect(await boardGetAll()).toEqual([board]);
    expect((await libGetAllMeta()).map((m) => m.id)).toEqual(['HASH1']);
    await kvPut('last-backup', 1);
    expect(await kvGetAll()).toEqual([['last-backup', 1]]);
    await kvDelete('last-backup');
    expect(await kvGetAll()).toEqual([]);
  });
});

// ── Upgrade v6 → v7 (a trim per file, ADR-0068, 2026-10-03) ──────────────────

describe('DB upgrade to v7', () => {
  /** Pads in the shape stored before ADR-0068: hashes, one trim per pad. */
  const legacyPads = [
    {
      ...base('s'),
      type: 'single',
      files: ['A', 'B'],
      order: 'sequential',
      trimStart: 1,
      trimEnd: 3,
    },
    { ...base('l'), type: 'loop', files: ['A', 'B'], order: 'shuffle', trimStart: 2 },
    { ...base('c'), type: 'combo', steps: [{ padIds: ['s'] }] },
  ];
  function base(id: string) {
    return { id, name: id, volume: 80, fadeIn: 0, fadeOut: 0 };
  }

  test('converts the stored boards in place — never clears them; library and preferences stay', async () => {
    const v6 = await openDB('sos-v3', 6, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
        db.createObjectStore('boards', { keyPath: 'id' });
        db.createObjectStore('keyval');
      },
    });
    await v6.put('boards', { ...makeBoard('MINE'), pads: legacyPads });
    await v6.put('library', makeLibraryItem('A', 'keep.mp3'));
    await v6.put('keyval', 7, 'last-backup');
    v6.close();

    const [board] = await boardGetAll();
    expect(board.id).toBe('MINE');
    expect(board.pads).toEqual([
      {
        ...base('s'),
        type: 'single',
        order: 'sequential',
        files: [
          { hash: 'A', trimStart: 1, trimEnd: 3 },
          { hash: 'B', trimStart: 1, trimEnd: 3 },
        ],
      },
      // A Loop with several files played them whole: no file gets the trim
      { ...base('l'), type: 'loop', order: 'shuffle', files: [{ hash: 'A' }, { hash: 'B' }] },
      legacyPads[2],
    ]);
    expect((await libGetAllMeta()).map((m) => m.id)).toEqual(['A']);
    expect(await kvGetAll()).toEqual([['last-backup', 7]]);
  });

  test('a v5 database is converted too (v5 → v7 in one upgrade)', async () => {
    const v5 = await openDB('sos-v3', 5, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
        db.createObjectStore('boards', { keyPath: 'id' });
      },
    });
    await v5.put('boards', { ...makeBoard('MINE'), pads: [legacyPads[0]] });
    v5.close();

    const [board] = await boardGetAll();
    expect(board.pads[0]).toMatchObject({ files: [{ hash: 'A', trimStart: 1 }, { hash: 'B' }] });
  });
});

// ── Upgrade v7 → v8 (up to 4 icon keys per pad, ADR-0070, 2026-10-04) ────────

describe('DB upgrade to v8', () => {
  const pad = (id: string, extra: Record<string, unknown>) => ({
    id,
    name: id,
    volume: 80,
    fadeIn: 0,
    fadeOut: 0,
    type: 'single',
    files: [{ hash: 'A' }],
    order: 'sequential',
    ...extra,
  });

  test("V1's icon id kept in iconRef becomes an icon key; an unknown one is dropped; boards are kept", async () => {
    const v7 = await openDB('sos-v3', 7, {
      upgrade(db) {
        db.createObjectStore('library', { keyPath: 'id' });
        db.createObjectStore('boards', { keyPath: 'id' });
        db.createObjectStore('keyval');
      },
    });
    await v7.put('boards', {
      ...makeBoard('MINE'),
      pads: [
        pad('known', { iconRef: 'clock' }),
        pad('unknown', { iconRef: 'not-an-icon' }),
        pad('none', {}),
      ],
    });
    v7.close();

    const [board] = await boardGetAll();
    expect(board.id).toBe('MINE');
    expect(board.pads).toEqual([
      pad('known', { icons: ['pixelarticons:clock-face'] }),
      pad('unknown', {}),
      pad('none', {}),
    ]);
  });
});

// ── Upgrade v8/v9 → v10 (one pad size per board, ADR-0075, owner decision 2026-10-06) ──

describe('DB upgrade to v10', () => {
  const deck = (id: string, order: number, padSize: unknown) => ({
    id,
    name: id,
    order,
    gridConfig: { cols: 4, rows: 4, gap: 8, padSize },
    placements: [],
  });
  const { padSize: _, ...noSize } = makeBoard('MINE');

  test.each([
    [8, 'md', 88],
    [9, 120, 120],
  ])(
    "from v%i the board takes its first deck's size (%s → %i); decks lose theirs; data kept",
    async (version, firstSize, expected) => {
      const old = await openDB('sos-v3', version, {
        upgrade(db) {
          db.createObjectStore('library', { keyPath: 'id' });
          db.createObjectStore('boards', { keyPath: 'id' });
          db.createObjectStore('keyval');
        },
      });
      await old.put('boards', {
        ...noSize,
        decks: [deck('later', 1, 60), deck('first', 0, firstSize)],
      });
      await old.put('keyval', 7, 'last-backup');
      old.close();

      const [board] = await boardGetAll();
      expect(board.id).toBe('MINE');
      expect(board.padSize).toBe(expected);
      expect(board.decks.every((d) => !('padSize' in d.gridConfig))).toBe(true);
      expect(await kvGetAll()).toEqual([['last-backup', 7]]);
    },
  );
});
