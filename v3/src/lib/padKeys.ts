/**
 * @fileoverview padKeys — which key plays which pad, and how a key is shown (Slice 12, ADR-0077)
 *
 * A key is stored as `KeyboardEvent.code`, the physical key independent of the keyboard layout,
 * so the numpad's "1" (`Numpad1`) differs from the main keyboard's "1" (`Digit1`) — K1 in
 * docs/product/README.md#input-keyboard--numpad. V1 stored keys the same way, so imported keys
 * keep working. Keys belong to a deck's placement (ADR-0048): the same key can play different
 * pads in different decks.
 */

import type { Board, Deck, Pad } from '../types';

/**
 * Keys that never play a pad: they stop, pause or move focus (K5, K6, K7; Escape closes dialogs,
 * Tab moves focus). The value says why, in the words the PAD editor shows.
 */
export const RESERVED_KEYS: Readonly<Record<string, string>> = {
  Enter: 'stops the last sound',
  NumpadEnter: 'stops the last sound',
  NumpadDecimal: 'stops all sounds',
  Space: 'pauses all sounds',
  Escape: 'closes dialogs',
  Tab: 'moves between controls',
};

/** Modifier keys: pressed alone they are not a key of their own. */
const MODIFIERS = new Set([
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
]);

/** Tells whether a key code is a modifier, which the key field waits past. */
export function isModifierKey(code: string): boolean {
  return MODIFIERS.has(code);
}

/** Short labels for keys whose code says little on a small pad. */
const SYMBOLS: Readonly<Record<string, string>> = {
  NumpadAdd: 'N+',
  NumpadSubtract: 'N-',
  NumpadMultiply: 'N*',
  NumpadDivide: 'N/',
  NumpadEqual: 'N=',
  NumpadComma: 'N,',
  Period: '.',
  Comma: ',',
  Minus: '-',
  Equal: '=',
  Slash: '/',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  BracketLeft: '[',
  BracketRight: ']',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

/**
 * The short label a pad shows for its key: `Numpad1` → `N1` (the N tells the numpad from the
 * main keyboard), `Digit1` → `1`, `KeyA` → `A`, `NumpadAdd` → `N+`; any other code as it is.
 */
export function keyLabel(code: string): string {
  if (code in SYMBOLS) return SYMBOLS[code];
  const numpadDigit = /^Numpad(\d)$/.exec(code);
  if (numpadDigit) return `N${numpadDigit[1]}`;
  const digit = /^Digit(\d)$/.exec(code);
  if (digit) return digit[1];
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1];
  return code;
}

/** The pad of the board that the key plays in the deck, or null. */
export function padForKey(board: Board, deck: Deck, code: string): Pad | null {
  const placement = deck.placements.find((p) => p.hotkey === code);
  if (!placement) return null;
  return board.pads.find((p) => p.id === placement.padId) ?? null;
}

/** The id of the other pad in the deck that holds the key, or null (the pad itself excluded). */
export function keyHolder(deck: Deck, code: string, padId: string): string | null {
  return deck.placements.find((p) => p.hotkey === code && p.padId !== padId)?.padId ?? null;
}
