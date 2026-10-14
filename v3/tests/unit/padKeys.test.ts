/**
 * @fileoverview padKeys — key → pad in a deck, the other holder of a key, short key labels,
 * reserved and modifier keys (Slice 12a, ADR-0077).
 * Cases: a key found / not found / found in another deck only; a placement whose pad is gone;
 * the holder excludes the pad itself; labels for numpad, main digits, letters, every symbol,
 * unknown codes and codes that only look like a digit or letter code; the fixed keys and the
 * movable live-control keys (K12) with the reason the PAD editor shows, one action left out for
 * its own field; the pad on any board that uses a key (bar before decks, a pad not in the pool
 * skipped, later boards searched); every modifier.
 */

import type { Board, SinglePad } from '../../src/types';
import {
  DEFAULT_CONTROL_KEYS,
  deckKeyUse,
  isModifierKey,
  keyHolder,
  keyLabel,
  padForKey,
  padUsingKey,
  quickAccessKeyHolder,
  quickAccessPadForKey,
  reservedKeys,
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

describe('quick-access keys (K13) and their clash with deck keys (K2)', () => {
  const withBar = (): Board => ({
    ...board(),
    quickAccess: [
      { padId: 'a', hotkey: 'KeyQ' },
      { padId: 'b' },
      { padId: 'gone', hotkey: 'KeyW' },
    ],
  });

  it('a bar key plays its pad board-wide; nothing for a free key or a pad not in the pool', () => {
    expect(quickAccessPadForKey(withBar(), 'KeyQ')?.id).toBe('a');
    expect(quickAccessPadForKey(withBar(), 'KeyE')).toBeNull();
    expect(quickAccessPadForKey(withBar(), 'KeyW')).toBeNull();
  });

  it('names the other bar pad that holds a key, never the pad itself', () => {
    expect(quickAccessKeyHolder(withBar(), 'KeyQ', 'b')).toBe('a');
    expect(quickAccessKeyHolder(withBar(), 'KeyQ', 'a')).toBeNull();
    expect(quickAccessKeyHolder(withBar(), 'KeyE', 'b')).toBeNull();
  });

  it('finds the first deck, in deck order, where a key is used', () => {
    const b = board();
    // Deck 2 first in the array, but last in order
    const reordered = { ...b, decks: [b.decks[1], b.decks[0]] };
    expect(deckKeyUse(reordered, 'Numpad1')).toEqual({ deck: b.decks[0], padId: 'a' });
    expect(deckKeyUse(b, 'Numpad9')?.deck.id).toBe('d1');
    expect(deckKeyUse(b, 'KeyQ')).toBeNull();
  });
});

describe('padUsingKey', () => {
  const other = (): Board => ({
    ...board(),
    id: 'b2',
    name: 'Other',
    pads: [single('c')],
    decks: [
      {
        ...board().decks[0],
        placements: [{ padId: 'c', position: { col: 0, row: 0 }, hotkey: 'KeyC' }],
      },
    ],
    quickAccess: [{ padId: 'c', hotkey: 'KeyQ' }],
  });

  it('finds a deck key or a bar key on any board, with the board', () => {
    const found = padUsingKey([board(), other()], 'KeyC');
    expect(found?.board.id).toBe('b2');
    expect(found?.pad.id).toBe('c');
    expect(padUsingKey([board(), other()], 'Numpad1')?.pad.id).toBe('a');
  });

  it('looks at the quick-access bar before the decks', () => {
    const b = { ...board(), quickAccess: [{ padId: 'b', hotkey: 'Numpad1' }] };
    expect(padUsingKey([b], 'Numpad1')?.pad.id).toBe('b');
  });

  it('skips a holder whose pad is not in the pool and goes on to the next one', () => {
    const b = board();
    b.decks[1].placements[0].hotkey = 'Numpad9'; // after the dangling Numpad9 of deck 1
    expect(padUsingKey([b], 'Numpad9')?.pad.id).toBe('b');
    expect(padUsingKey([board()], 'Numpad9')).toBeNull();
  });

  it('is null for a key no pad uses, and with no boards', () => {
    expect(padUsingKey([board(), other()], 'KeyZ')).toBeNull();
    expect(padUsingKey([], 'Numpad1')).toBeNull();
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
    ['NumpadDecimal', 'N.'],
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
    expect(reservedKeys(DEFAULT_CONTROL_KEYS)).toEqual({
      Enter: 'stops a sound',
      NumpadEnter: 'stops a sound',
      NumpadDecimal: 'stops all sounds',
      Space: 'pauses all sounds',
      Escape: 'closes dialogs',
      Tab: 'moves between controls',
    });
    expect('Numpad1' in reservedKeys(DEFAULT_CONTROL_KEYS)).toBe(false);
  });

  it('follows moved live-control keys: the old ones are free, the new ones reserved', () => {
    const reserved = reservedKeys({ stopAll: 'KeyS', pause: 'KeyP' });
    expect(reserved.KeyS).toBe('stops all sounds');
    expect(reserved.KeyP).toBe('pauses all sounds');
    expect('NumpadDecimal' in reserved).toBe(false);
    expect('Space' in reserved).toBe(false);
  });

  it("leaves one action's key out — its own key field may take it again", () => {
    const reserved = reservedKeys(DEFAULT_CONTROL_KEYS, 'pause');
    expect('Space' in reserved).toBe(false);
    expect(reserved.NumpadDecimal).toBe('stops all sounds');
    expect(reserved.Enter).toBe('stops a sound');
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
