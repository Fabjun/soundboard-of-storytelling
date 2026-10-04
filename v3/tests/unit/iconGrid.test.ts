/**
 * @fileoverview iconGrid — columns from CSS, rows, and the APG arrow keys of the icon picker
 */
import { describe, it, expect } from 'vitest';
import { moveIndex, rowCount, rowKeys, trackCount } from '../../src/lib/iconGrid';

describe('shape', () => {
  it('trackCount counts the column sizes of a computed grid-template-columns', () => {
    expect(trackCount('47.5px 47.5px 47.5px')).toBe(3);
    expect(trackCount(' 88px ')).toBe(1);
    // Not laid out yet (no grid, or no width): one column, never zero
    expect(trackCount('none')).toBe(1);
    expect(trackCount('')).toBe(1);
  });

  it('rowCount and rowKeys split the icons into rows; the last row may be shorter', () => {
    const keys = ['a', 'b', 'c', 'd', 'e'];
    expect(rowCount(5, 2)).toBe(3);
    expect(rowCount(0, 4)).toBe(0);
    expect(rowCount(4, 0)).toBe(4); // a column count of 0 counts as 1
    expect(rowKeys(keys, 0, 2)).toEqual(['a', 'b']);
    expect(rowKeys(keys, 2, 2)).toEqual(['e']);
    expect(rowKeys(keys, 3, 2)).toEqual([]);
  });
});

describe('arrow keys (APG layout grid)', () => {
  // 7 icons in 3 columns:  0 1 2 / 3 4 5 / 6
  const move = (index: number, key: string) => moveIndex(index, key, 3, 7);

  it('left and right move by one icon, on to the next or previous row', () => {
    expect(move(1, 'ArrowRight')).toBe(2);
    expect(move(2, 'ArrowRight')).toBe(3);
    expect(move(3, 'ArrowLeft')).toBe(2);
  });

  it('up and down move by one row', () => {
    expect(move(1, 'ArrowDown')).toBe(4);
    expect(move(4, 'ArrowUp')).toBe(1);
    expect(move(3, 'ArrowDown')).toBe(6);
  });

  it('Home and End go to the start and end of the row; the short last row ends at its last icon', () => {
    expect(move(4, 'Home')).toBe(3);
    expect(move(4, 'End')).toBe(5);
    expect(move(6, 'End')).toBe(6);
  });

  it('where no icon is, the focus stays', () => {
    expect(move(0, 'ArrowLeft')).toBe(0);
    expect(move(1, 'ArrowUp')).toBe(1);
    expect(move(6, 'ArrowRight')).toBe(6);
    expect(move(4, 'ArrowDown')).toBe(4); // below 4 there is no icon (the last row has one)
  });

  it('any other key is not a move', () => {
    expect(move(1, 'Enter')).toBeNull();
    expect(move(1, 'a')).toBeNull();
  });
});
