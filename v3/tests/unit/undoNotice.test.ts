/**
 * @fileoverview undoNotice — one undo toast at a time (Slice 18b)
 *
 * A new toast replaces the one before; hiding by id keeps a newer toast; hiding without an id
 * hides any (the board screen does that when the board is left).
 */

import { announceUndo, clearUndoNotice, undoNotice } from '../../src/state/undoNotice';

beforeEach(() => clearUndoNotice());

describe('undoNotice', () => {
  it('shows the toast with its message and undo; a new one replaces it with a new id', () => {
    const first = vi.fn();
    announceUndo('Deleted A', first);
    const shown = undoNotice.value!;
    expect(shown.message).toBe('Deleted A');
    shown.undo();
    expect(first).toHaveBeenCalledOnce();
    announceUndo('Deleted B', () => {});
    expect(undoNotice.value!.message).toBe('Deleted B');
    expect(undoNotice.value!.id).not.toBe(shown.id);
  });

  it('hiding by id hides only that toast; without an id any', () => {
    announceUndo('Deleted A', () => {});
    const old = undoNotice.value!.id;
    announceUndo('Deleted B', () => {});
    clearUndoNotice(old); // the first toast's time is up — the second stays
    expect(undoNotice.value!.message).toBe('Deleted B');
    clearUndoNotice(undoNotice.value!.id);
    expect(undoNotice.value).toBeNull();
    announceUndo('Deleted C', () => {});
    clearUndoNotice();
    expect(undoNotice.value).toBeNull();
  });
});
