/**
 * @fileoverview padKeys — key → pad in a deck, the other holder of a key, short key labels,
 * reserved and modifier keys (Slice 12a, ADR-0077).
 * Cases: a key found / not found / found in another deck only; a placement whose pad is gone;
 * the holder excludes the pad itself; labels for numpad, main digits, letters, every symbol,
 * unknown codes and codes that only look like a digit or letter code; the reserved keys of
 * 12b / 12d with the reason the PAD editor shows; every modifier.
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
    ['F5', 'F5'],
    ['IntlBackslash', 'IntlBackslash'],
  ])('%s → %s', (code, label) => {
    expect(keyLabel(code)).toBe(label);
  });

  // Every symbol a pad can show — the weekly mutation run of 2026-10-09 found most untested
  it.each([
    ['NumpadAdd', 'N+'],
    ['NumpadSubtract', 'N-'],
    ['NumpadMultiply', 'N*'],
    ['NumpadDivide', 'N/'],
    ['NumpadEqual', 'N='],
    ['NumpadComma', 'N,'],
    ['Period', '.'],
    ['Comma', ','],
    ['Minus', '-'],
    ['Equal', '='],
    ['Slash', '/'],
    ['Backslash', '\\'],
    ['Semicolon', ';'],
    ['Quote', "'"],
    ['Backquote', '`'],
    ['BracketLeft', '['],
    ['BracketRight', ']'],
    ['ArrowUp', '↑'],
    ['ArrowDown', '↓'],
    ['ArrowLeft', '←'],
    ['ArrowRight', '→'],
  ])('symbol %s → %s', (code, label) => {
    expect(keyLabel(code)).toBe(label);
  });

  it.each(['Numpad10', 'XNumpad1', 'Digit10', 'XDigit1', 'KeyAB', 'XKeyA'])(
    '%s is shown as it is — only a whole numpad digit, digit or letter code is shortened',
    (code) => {
      expect(keyLabel(code)).toBe(code);
    },
  );
});

describe('reserved and modifier keys', () => {
  it('says in the PAD editor why a reserved key cannot play a pad', () => {
    expect(RESERVED_KEYS).toEqual({
      Enter: 'stops the last sound',
      NumpadEnter: 'stops the last sound',
      NumpadDecimal: 'stops all sounds',
      Space: 'pauses all sounds',
      Escape: 'closes dialogs',
      Tab: 'moves between controls',
    });
    expect('Numpad1' in RESERVED_KEYS).toBe(false);
  });

  it.each([
    'ShiftLeft',
    'ShiftRight',
    'ControlLeft',
    'ControlRight',
    'AltLeft',
    'AltRight',
    'MetaLeft',
    'MetaRight',
    'CapsLock',
    'NumLock',
    'Fn',
  ])('%s is a modifier — the key field waits for the next key', (code) => {
    expect(isModifierKey(code)).toBe(true);
  });

  it('nothing else counts as a modifier', () => {
    expect(isModifierKey('Numpad1')).toBe(false);
    expect(isModifierKey('KeyA')).toBe(false);
    expect(isModifierKey('')).toBe(false);
  });
});
