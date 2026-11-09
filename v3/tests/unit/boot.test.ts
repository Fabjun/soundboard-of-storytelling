/**
 * @fileoverview boot — unit tests: the stored state is in the store before the first render
 *
 * IDB is fake-indexeddb (fresh per test). Each of the five loads (library, boards, trash,
 * templates, own icons) can be made to fail, to show that one failing load is logged by name, keeps what the
 * store holds, and does not stop the others; loads that succeed log nothing.
 */

import { IDBFactory } from 'fake-indexeddb';
import type { Board, LibraryItem } from '../../src/types';
import { _resetDB, boardPut, libMoveToTrash, libPut } from '../../src/db/idb';
import type * as IdbModule from '../../src/db/idb';
import { boards, libraryItems } from '../../src/state/store';
import { trashItems } from '../../src/state/libraryTrash';
import { loadStoredState } from '../../src/state/boot';

const failing = vi.hoisted(() => ({
  library: false,
  boards: false,
  trash: false,
  templates: false,
  icons: false,
}));
vi.mock('../../src/db/idb', async (importOriginal) => {
  const real = await importOriginal<typeof IdbModule>();
  const unreadable = (what: string) => Promise.reject(new Error(`${what} store unreadable`));
  return {
    ...real,
    libGetAllMeta: () => (failing.library ? unreadable('library') : real.libGetAllMeta()),
    boardGetAll: () => (failing.boards ? unreadable('boards') : real.boardGetAll()),
    trashGetAllMeta: () => (failing.trash ? unreadable('trash') : real.trashGetAllMeta()),
    templateGetAll: () => (failing.templates ? unreadable('templates') : real.templateGetAll()),
    iconGetAllMeta: () => (failing.icons ? unreadable('icons') : real.iconGetAllMeta()),
  };
});

const board: Board = {
  id: 'b1',
  name: 'Night',
  themeId: 'hearth',
  pads: [],
  decks: [],
  padSize: 88,
  quickAccess: [],
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
  Object.assign(failing, {
    library: false,
    boards: false,
    trash: false,
    templates: false,
    icons: false,
  });
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
    expect(trashItems.value).toEqual([]);
  });

  test("the library's trash is in the store too (ADR-0087)", async () => {
    await libPut(item);
    await libMoveToTrash(item.id, Date.now());
    trashItems.value = [];
    await loadStoredState();
    expect(trashItems.value.map((t) => t.id)).toEqual(['h1']);
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

  test('a failing board, trash or template load is logged by name; the others still load', async () => {
    await boardPut(board);
    await libPut(item);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    failing.boards = true;
    await loadStoredState();
    expect(boards.value).toEqual([]); // kept as it was, not replaced by nothing
    expect(libraryItems.value.map((m) => m.id)).toEqual(['h1']);
    expect(log.mock.calls).toEqual([['Board bootstrap failed:', expect.any(Error)]]);

    log.mockClear();
    Object.assign(failing, { boards: false, trash: true, templates: true, icons: true });
    await loadStoredState();
    expect(boards.value).toEqual([board]);
    expect(log.mock.calls).toEqual([
      ['Trash bootstrap failed:', expect.any(Error)],
      ['Template bootstrap failed:', expect.any(Error)],
      ['Icon bootstrap failed:', expect.any(Error)],
    ]);
    log.mockRestore();
  });

  test('loads that succeed log nothing', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    await loadStoredState();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
