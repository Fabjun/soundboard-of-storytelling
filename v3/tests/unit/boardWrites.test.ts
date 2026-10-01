// ─────────────────────────────────────────────────────────────────────────────
// boardWrites — every board change builds on the latest board and is saved in call order
// (BACKLOG "Bug: board writes from an outdated board copy lose changes").
// Real IndexedDB semantics via fake-indexeddb (fresh factory per test); a failed save is
// produced with a value IndexedDB cannot store (a function → DataCloneError), no mocks.
// ─────────────────────────────────────────────────────────────────────────────

import { IDBFactory } from 'fake-indexeddb';
import type { Board } from '../../src/types';
import { boardGet, _resetDB } from '../../src/db/idb';
import { boards } from '../../src/state/store';
import { createBoard, updateBoard } from '../../src/state/boardWrites';

const board = (): Board => ({
  id: 'b',
  name: 'Board',
  themeId: 'hearth',
  pads: [],
  decks: [],
  quickAccess: [],
});

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  boards.value = [];
});

const stored = () => boards.value.find((b) => b.id === 'b');

describe('createBoard', () => {
  it('shows the board and saves it', async () => {
    expect(await createBoard(board())).toEqual(board());
    expect(stored()).toEqual(board());
    expect(await boardGet('b')).toEqual(board());
  });
});

describe('updateBoard', () => {
  it('two changes started together both survive — the second builds on the first', async () => {
    await createBoard(board());
    // Not awaited one by one: the second starts while the first is still saving.
    await Promise.all([
      updateBoard('b', (b) => ({ ...b, name: `${b.name} A` })),
      updateBoard('b', (b) => ({ ...b, name: `${b.name} B` })),
    ]);
    expect(stored()!.name).toBe('Board A B');
    expect((await boardGet('b'))!.name).toBe('Board A B');
  });

  it('shows the change before the save has finished', async () => {
    await createBoard(board());
    const saving = updateBoard('b', (b) => ({ ...b, name: 'Now' }));
    expect(stored()!.name).toBe('Now');
    await saving;
  });

  it('writes nothing when the change returns the same board or the board is unknown', async () => {
    await createBoard(board());
    expect(await updateBoard('b', (b) => b)).toBeNull();
    expect(await updateBoard('nope', (b) => ({ ...b, name: 'x' }))).toBeNull();
    expect(boards.value).toHaveLength(1);
  });

  it('a failed save puts the stored board back on screen', async () => {
    await createBoard(board());
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // A function cannot be stored in IndexedDB (structured clone) → the save fails.
    const result = await updateBoard('b', (b) => ({
      ...b,
      name: 'unsaved',
      bad: () => 0,
    }));
    expect(result).toBeNull();
    expect(stored()!.name).toBe('Board');
    expect(error).toHaveBeenCalledWith('Board save failed:', expect.anything());
    error.mockRestore();
  });

  it('a failed save of a new board removes it from the screen again', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await createBoard(Object.assign(board(), { bad: () => 0 }))).toBeNull();
    expect(boards.value).toEqual([]);
    error.mockRestore();
  });
});
