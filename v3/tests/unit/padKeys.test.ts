/**
 * @fileoverview padKeys — key → pad in a deck, the other holder of a key, short key labels,
 * reserved and modifier keys (Slice 12a, ADR-0077).
 * Cases: a key found / not found / found in another deck only; a placement whose pad is gone;
 * the holder excludes the pad itself; labels for numpad, main digits, letters, symbols, unknown
 * codes; the reserved keys of 12b / 12d.
 */

import type { Board, SinglePad } from '../../src/types';
import {
  RESERVED_KEYS,
  isModifierKey,
  keyHolder,
  keyLabel,
  padForKey,
} from '../../src/lib/padKeys';

const grid = { cols: 4, rows: 4, gap: 4 };

const single = (id: string): SinglePad => ({
  id,
  type: 'single',
  files: [],
  order: 'sequential',
  name: id,
  volume: 80,
  fadeIn: 0,
  fadeOut: 0,
});

function board(): Board {
  return {
    id: 'b',
    name: 'Board',
    themeId: 'hearth',
    pads: [single('a'), single('b')],
    decks: [
      {
        id: 'd1',
        name: 'Deck 1',
        order: 0,
        gridConfig: grid,
        placements: [
          { padId: 'a', position: { col: 0, row: 0 }, hotkey: 'Numpad1' },
          { padId: 'b', position: { col: 1, row: 0 } },
          { padId: 'gone', position: { col: 2, row: 0 }, hotkey: 'Numpad9' },
        ],
      },
      {
        id: 'd2',
        name: 'Deck 2',
        order: 1,
        gridConfig: grid,
        placements: [{ padId: 'b', position: { col: 0, row: 0 }, hotkey: 'Numpad1' }],
      },
    ],
    padSize: 88,
    quickAccess: [],
  };
}

describe('padForKey', () => {
  it('finds the pad that holds the key in the deck — the same key plays another pad elsewhere', () => {
    const b = board();
    expect(padForKey(b, b.decks[0], 'Numpad1')?.id).toBe('a');
    expect(padForKey(b, b.decks[1], 'Numpad1')?.id).toBe('b');
  });

  it('is null for a key nobody holds, and for a placement whose pad is not in the pool', () => {
    const b = board();
    expect(padForKey(b, b.decks[0], 'Numpad2')).toBeNull();
    expect(padForKey(b, b.decks[0], 'Numpad9')).toBeNull();
  });

  it('tells the numpad 1 from the main keyboard 1', () => {
    const b = board();
    expect(padForKey(b, b.decks[0], 'Digit1')).toBeNull();
  });
});

describe('keyHolder', () => {
  it('names the other pad that holds the key, never the pad itself', () => {
    const deck = board().decks[0];
    expect(keyHolder(deck, 'Numpad1', 'b')).toBe('a');
    expect(keyHolder(deck, 'Numpad1', 'a')).toBeNull();
    expect(keyHolder(deck, 'Numpad5', 'b')).toBeNull();
  });
});

describe('keyLabel', () => {
  it.each([
    ['Numpad1', 'N1'],
    ['Numpad0', 'N0'],
    ['Digit1', '1'],
    ['KeyA', 'A'],
    ['NumpadAdd', 'N+'],
    ['NumpadSubtract', 'N-'],
    ['Period', '.'],
    ['ArrowUp', '↑'],
    ['F5', 'F5'],
    ['IntlBackslash', 'IntlBackslash'],
  ])('%s → %s', (code, label) => {
    expect(keyLabel(code)).toBe(label);
  });
});

describe('reserved and modifier keys', () => {
  it('keeps Enter, Space, the numpad decimal and Escape for their own controls', () => {
    for (const code of ['Enter', 'NumpadEnter', 'NumpadDecimal', 'Space', 'Escape', 'Tab'])
      expect(code in RESERVED_KEYS).toBe(true);
    expect('Numpad1' in RESERVED_KEYS).toBe(false);
  });

  it('knows the modifiers, and nothing else as one', () => {
    expect(isModifierKey('ShiftLeft')).toBe(true);
    expect(isModifierKey('NumLock')).toBe(true);
    expect(isModifierKey('Numpad1')).toBe(false);
  });
});
