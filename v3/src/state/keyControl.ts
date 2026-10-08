/**
 * @fileoverview keyControl — a key plays its pad in GAME (Slice 12a, ADR-0077)
 *
 * One document listener, added once at app start. It reads the screen, the mode, the board and
 * the deck at the moment the key is pressed (the signals), so it never acts on an old state.
 * Rules (docs/product/README.md#input-keyboard--numpad):
 *   - only on a board in GAME (K3) — in SETUP keys do nothing;
 *   - the deck shown, or in All pads the deck last selected (K14: `currentDeckId` stays);
 *   - a key whose pad already plays does nothing — a second press never stops it (K4);
 *   - never while a text field has focus, with Ctrl / Alt / Cmd held, or for a held-down key;
 *   - reserved keys (Enter, Space, Numpad decimal …) are left to their own controls.
 */

import { play as playPad, isPlaying as padIsPlaying } from '../audio/index';
import { RESERVED_KEYS, padForKey } from '../lib/padKeys';
import type { Pad } from '../types';
import { currentBoard, currentDeck, currentMode, currentScreen } from './store';

/** What keyControl needs from the audio engine; tests pass their own. */
export interface KeyControlAudio {
  play: (padId: string, pad: Pad) => unknown;
  isPlaying: (padId: string) => boolean;
}

/** Input types that take no typing — a key pressed on them may still play a pad. */
const NON_TEXT_INPUTS = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** Tells whether the element takes typed text, so its keys belong to it. */
function takesText(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  return target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type);
}

/** Starts listening for keys; returns a function that stops it. Call once at app start. */
export function startKeyControl(
  audio: KeyControlAudio = { play: playPad, isPlaying: padIsPlaying },
  doc: Document = document,
): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (currentScreen.value !== 'board' || currentMode.value !== 'play') return;
    if (e.code in RESERVED_KEYS || takesText(e.target)) return;
    const board = currentBoard.value;
    const deck = currentDeck.value;
    if (!board || !deck) return;
    const pad = padForKey(board, deck, e.code);
    if (!pad) return;
    e.preventDefault();
    if (!audio.isPlaying(pad.id)) void audio.play(pad.id, pad);
  };
  doc.addEventListener('keydown', onKey);
  return () => doc.removeEventListener('keydown', onKey);
}
