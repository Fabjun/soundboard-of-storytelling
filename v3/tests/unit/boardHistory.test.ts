/**
 * @fileoverview boardHistory — every board change can be undone and redone (ADR-0086)
 *
 * Through the one write path (src/state/boardWrites.ts): changes are recorded there, undo and
 * redo are written there. Real IndexedDB semantics via fake-indexeddb (fresh factory per test); a
 * failed save is produced with a value IndexedDB cannot store (a function → DataCloneError).
 */

import { IDBFactory } from 'fake-indexeddb';
import type { Board } from '../../src/types';
import { boardGet, _resetDB } from '../../src/db/idb';
import { boards, lastSaveFailed, pendingSaves, removeBoardFromStore } from '../../src/state/store';
import { LIMIT } from '../../src/lib/editHistory';
import { applyBoardChange, createBoard, stepBoard, updateBoard } from '../../src/state/boardWrites';
import { redoLabel, undoLabel } from '../../src/state/boardHistory';

const board = (id = 'b'): Board => ({
  id,
  name: 'Board',
  themeId: 'hearth',
  pads: [],
  decks: [],
  padSize: 88,
  quickAccess: [],
});

const named = (name: string) => (b: Board) => ({ ...b, name });

/**
 * Waits until no save runs — bounded, so a broken save count fails the test within a second
 * instead of hanging it (whenSaved waits for ever; under a mutant that never lets the count reach
 * 0 every test using it ran into the mutation run's timeout, 2026-10-19).
 */
const saved = () => vi.waitFor(() => expect(pendingSaves.value).toBe(0), { timeout: 1_000 });
const shown = (id = 'b') => boards.value.find((b) => b.id === id)!;

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  boards.value = [];
  lastSaveFailed.value = false;
});

describe('a new board', () => {
  it('has nothing to undo or redo', async () => {
    await createBoard(board());
    expect(undoLabel('b')).toBeNull();
    expect(redoLabel('b')).toBeNull();
    expect(stepBoard('b', 'undo')).toBeNull();
    expect(stepBoard('b', 'redo')).toBeNull();
    expect(stepBoard('nope', 'undo')).toBeNull();
  });
});

describe('undo and redo', () => {
  it('undo shows the board before the change and saves it; redo brings the change back', async () => {
    await createBoard(board());
    const before = shown();
    applyBoardChange('b', 'change', named('A'));
    expect(undoLabel('b')).not.toBeNull();

    expect(stepBoard('b', 'undo')).toBe(before);
    expect(shown()).toBe(before);
    await saved();
    expect((await boardGet('b'))!.name).toBe('Board');
    expect(undoLabel('b')).toBeNull();
    expect(redoLabel('b')).not.toBeNull();

    expect(stepBoard('b', 'redo')!.name).toBe('A');
    await saved();
    expect((await boardGet('b'))!.name).toBe('A');
    expect(redoLabel('b')).toBeNull();
  });

  it('steps back through several changes in order, and forward again', async () => {
    await createBoard(board());
    applyBoardChange('b', 'change', named('A'));
    applyBoardChange('b', 'change', named('B'));
    applyBoardChange('b', 'change', named('C'));
    expect(stepBoard('b', 'undo')!.name).toBe('B');
    expect(stepBoard('b', 'undo')!.name).toBe('A');
    expect(stepBoard('b', 'undo')!.name).toBe('Board');
    expect(stepBoard('b', 'undo')).toBeNull();
    expect(stepBoard('b', 'redo')!.name).toBe('A');
    expect(stepBoard('b', 'redo')!.name).toBe('B');
    await saved();
  });

  it('names the change ↶ takes back and the change ↷ brings back', async () => {
    await createBoard(board());
    applyBoardChange('b', 'rename to A', named('A'));
    applyBoardChange('b', 'rename to B', named('B'));
    expect(undoLabel('b')).toBe('rename to B');
    expect(redoLabel('b')).toBeNull();
    stepBoard('b', 'undo');
    expect(undoLabel('b')).toBe('rename to A');
    expect(redoLabel('b')).toBe('rename to B');
    stepBoard('b', 'undo');
    expect(undoLabel('b')).toBeNull();
    expect(redoLabel('b')).toBe('rename to A');
    await saved();
  });

  it('an undo is not a step of its own: undoing twice goes back two changes', async () => {
    await createBoard(board());
    applyBoardChange('b', 'change', named('A'));
    applyBoardChange('b', 'change', named('B'));
    stepBoard('b', 'undo');
    expect(stepBoard('b', 'undo')!.name).toBe('Board');
    await saved();
  });

  it('a new change after an undo drops what could be redone', async () => {
    await createBoard(board());
    applyBoardChange('b', 'change', named('A'));
    stepBoard('b', 'undo');
    await updateBoard('b', 'change', named('X'));
    expect(redoLabel('b')).toBeNull();
    expect(stepBoard('b', 'undo')!.name).toBe('Board');
    await saved();
  });

  it('a change that changes nothing is no step', async () => {
    await createBoard(board());
    applyBoardChange('b', 'change', (b) => b);
    expect(undoLabel('b')).toBeNull();
  });

  it('keeps the last LIMIT steps', async () => {
    await createBoard(board());
    for (let i = 1; i <= LIMIT + 1; i++) applyBoardChange('b', 'change', named(`n${i}`));
    let undone = 0;
    while (stepBoard('b', 'undo')) undone++;
    expect(undone).toBe(LIMIT);
    expect(shown().name).toBe('n1');
    await saved();
  });

  it('each board has its own history', async () => {
    await createBoard(board('a'));
    await createBoard(board('b'));
    applyBoardChange('a', 'change', named('A'));
    expect(undoLabel('a')).not.toBeNull();
    expect(undoLabel('b')).toBeNull();
    applyBoardChange('b', 'change', named('B'));
    stepBoard('a', 'undo');
    expect(shown('b').name).toBe('B');
    expect(shown('a').name).toBe('Board');
    await saved();
  });
});

describe('the store is the truth', () => {
  it('a failed save shows the stored board, and the history starts again from it', async () => {
    await createBoard(board());
    await updateBoard('b', 'change', named('A'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // A function cannot be stored in IndexedDB (structured clone) → the save fails.
    await updateBoard('b', 'change', (b) => ({ ...b, name: 'broken', extra: () => 0 }) as Board);
    error.mockRestore();
    expect(shown().name).toBe('A');
    expect(undoLabel('b')).toBeNull();
    expect(stepBoard('b', 'undo')).toBeNull();
    expect(shown().name).toBe('A');
  });

  it('a board deleted and created again with the same id has no steps of its old life', async () => {
    await createBoard(board());
    applyBoardChange('b', 'change', named('old'));
    await saved();
    removeBoardFromStore('b');
    await createBoard(board());
    expect(undoLabel('b')).toBeNull();
    expect(stepBoard('b', 'undo')).toBeNull();
    expect(shown().name).toBe('Board');
  });
});
