/**
 * @fileoverview editHistory — unit tests: undo and redo for an editor's draft (2026-10-11)
 * Edge-case checklist: nothing to undo / redo, one step, several, undo then redo back, a change
 * after an undo drops the redo, merging within and exactly at MERGE_MS, another kind or no kind
 * never merges, the limit of the past.
 */

import { LIMIT, MERGE_MS, record, redo, seal, startHistory, undo } from '../../src/lib/editHistory';

describe('editHistory', () => {
  it('starts with nothing to undo or redo; undo and redo change nothing then', () => {
    const h = startHistory('a');
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it('undoes and redoes step by step', () => {
    let h = record(startHistory('a'), 'b', undefined, 0);
    h = record(h, 'c', undefined, 1000);
    h = undo(h);
    expect(h.present).toBe('b');
    h = undo(h);
    expect(h.present).toBe('a');
    expect(undo(h)).toBe(h);
    h = redo(h);
    h = redo(h);
    expect(h.present).toBe('c');
    expect(redo(h)).toBe(h);
  });

  it('a change after an undo drops what could be redone', () => {
    let h = record(startHistory('a'), 'b', undefined, 0);
    h = record(undo(h), 'x', undefined, 1000);
    expect(h.future).toEqual([]);
    expect(undo(h).present).toBe('a');
  });

  it('changes of one kind within MERGE_MS are one step; at MERGE_MS a new one', () => {
    let h = record(startHistory(''), 'R', 'name', 0);
    h = record(h, 'Ra', 'name', MERGE_MS - 1);
    h = record(h, 'Rai', 'name', 2 * MERGE_MS - 2);
    expect(h.past).toEqual(['']); // three letters, one step
    h = record(h, 'Rain', 'name', 3 * MERGE_MS - 2);
    expect(h.past).toEqual(['', 'Rai']);
  });

  it('another kind, or no kind, never merges', () => {
    let h = record(startHistory(0), 1, 'volume', 0);
    h = record(h, 2, 'fade', 10);
    h = record(h, 3, undefined, 20);
    h = record(h, 4, undefined, 30);
    expect(h.past).toEqual([0, 1, 2, 3]);
  });

  it('an undo ends the merging: the next change is a step of its own', () => {
    let h = record(startHistory('a'), 'b', 'name', 0);
    h = record(undo(h), 'c', 'name', 10);
    expect(h.past).toEqual(['a']);
    expect(h.present).toBe('c');
  });

  it('a sealed history (after SAVE) starts a new step with the next change', () => {
    let h = record(startHistory(''), 'Rain', 'name', 0);
    h = record(seal(h), 'Rainy', 'name', 10);
    expect(h.past).toEqual(['', 'Rain']);
    const plain = startHistory('x');
    expect(seal(plain)).toBe(plain);
  });

  it(`keeps at most ${LIMIT} steps in the past`, () => {
    let h = startHistory(0);
    for (let i = 1; i <= LIMIT + 5; i++) h = record(h, i, undefined, i * 1000);
    expect(h.past.length).toBe(LIMIT);
    expect(h.past[0]).toBe(5);
  });
});
