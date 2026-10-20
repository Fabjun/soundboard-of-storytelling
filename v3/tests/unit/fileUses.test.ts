/**
 * @fileoverview fileUses — which pads play a library file (Slice 16a)
 */

import { describe, expect, it } from 'vitest';
import type { Board, Pad } from '../../src/types';
import { fileUses, soundLossText } from '../../src/lib/fileUses';
import { newPad } from '../../src/lib/padUtils';

const board = (id: string, name: string, pads: Pad[]): Board => ({
  id,
  name,
  themeId: 'hearth',
  pads,
  decks: [],
  padSize: 88,
  quickAccess: [],
});

describe('fileUses', () => {
  it('lists every pad of every board that holds the file, with its board', () => {
    const uses = fileUses([
      board('b1', 'Night', [
        newPad('p1', 'single', 'Rain', ['h1']),
        newPad('p2', 'loop', 'Wind', ['h2', 'h1']),
      ]),
      board('b2', 'Day', [newPad('p3', 'single', 'Birds', ['h1'])]),
    ]);
    expect(uses.get('h1')).toEqual([
      { board: 'Night', pad: 'Rain' },
      { board: 'Night', pad: 'Wind' },
      { board: 'Day', pad: 'Birds' },
    ]);
    expect(uses.get('h2')).toEqual([{ board: 'Night', pad: 'Wind' }]);
  });

  it('counts a pad that holds a file twice once; a combo holds no file; unused files are absent', () => {
    const combo = newPad('c', 'combo', 'Storm');
    const uses = fileUses([
      board('b', 'Night', [newPad('p', 'loop', 'Rain', ['h1', 'h1']), combo]),
    ]);
    expect(uses.get('h1')).toHaveLength(1);
    expect(uses.has('nobody')).toBe(false);
    expect(fileUses([])).toEqual(new Map());
  });
});

describe('soundLossText', () => {
  it('says nothing for no pad, one pad in the singular, more in the plural', () => {
    expect(soundLossText(0)).toBe('');
    expect(soundLossText(1)).toBe('1 pad loses its sound');
    expect(soundLossText(3)).toBe('3 pads lose their sound');
  });
});
