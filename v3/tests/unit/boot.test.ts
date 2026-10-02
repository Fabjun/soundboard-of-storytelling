// ─────────────────────────────────────────────────────────────────────────────
// boot — unit tests: the stored state is in the store before the first render
//
// IDB is fake-indexeddb (fresh per test). The library load can be made to fail, to show that
// one failing load does not stop the other.
// ─────────────────────────────────────────────────────────────────────────────

import { IDBFactory } from 'fake-indexeddb';
import type { Board, LibraryItem } from '../../src/types';
import { _resetDB, boardPut, libPut } from '../../src/db/idb';
import type * as IdbModule from '../../src/db/idb';
import { boards, libraryItems } from '../../src/state/store';
import { loadStoredState } from '../../src/state/boot';

const failing = vi.hoisted(() => ({ library: false }));
vi.mock('../../src/db/idb', async (importOriginal) => {
  const real = await importOriginal<typeof IdbModule>();
  return {
    ...real,
    libGetAllMeta: () =>
      failing.library
        ? Promise.reject(new Error('library store unreadable'))
        : real.libGetAllMeta(),
  };
});

const board: Board = {
  id: 'b1',
  name: 'Night',
  themeId: 'hearth',
  settings: { quickAccessLayout: 'hidden', quickAccessSetCount: 1 },
  decks: [],
  sets: [],
};

const item: LibraryItem = {
  id: 'h1',
  type: 'audio',
  name: 'owl.mp3',
  size: 16,
  tags: [],
  addedAt: 1_000_000,
  duration: 2,
  peaks: [0.5],
  blob: new Blob(['fake audio bytes'], { type: 'audio/mpeg' }),
};

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  boards.value = [];
  libraryItems.value = [];
  failing.library = false;
});

describe('loadStoredState', () => {
  test('puts the stored boards and the library list (no audio) into the store', async () => {
    await boardPut(board);
    await libPut(item);
    await loadStoredState();
    expect(boards.value).toEqual([board]);
    expect(libraryItems.value.map((m) => m.id)).toEqual(['h1']);
    expect(libraryItems.value[0]).not.toHaveProperty('blob');
  });

  test('an empty database gives empty lists', async () => {
    await loadStoredState();
    expect(boards.value).toEqual([]);
    expect(libraryItems.value).toEqual([]);
  });

  test('a failing library load is logged and does not stop the boards', async () => {
    await boardPut(board);
    failing.library = true;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(loadStoredState()).resolves.toBeUndefined();
    expect(boards.value).toEqual([board]);
    expect(libraryItems.value).toEqual([]);
    expect(log).toHaveBeenCalledWith('Library bootstrap failed:', expect.any(Error));
    log.mockRestore();
  });
});
