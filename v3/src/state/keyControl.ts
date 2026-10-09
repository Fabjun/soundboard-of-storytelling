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
 *   - stop keys (Slice 12b): the numpad's decimal key is STOP ALL (K6, two stages), the numpad's
 *     Enter stops the sound started last (K5); the main Enter does that too unless a control has
 *     focus — then Enter activates the control (a button's own key, WAI-ARIA button pattern);
 *   - the other reserved keys (Space, Escape, Tab) are left to their own controls.
 */

import { play as playPad, isPlaying as padIsPlaying } from '../audio/index';
import { RESERVED_KEYS, padForKey } from '../lib/padKeys';
import type { Pad } from '../types';
import { currentBoard, currentDeck, currentMode, currentScreen } from './store';
import { pressStopAll, stopLast } from './stopControl';

/** What keyControl needs from the audio engine; tests pass their own. */
export interface KeyControlAudio {
  play: (padId: string, pad: Pad) => unknown;
  isPlaying: (padId: string) => boolean;
}

/** The stop actions the stop keys call; tests pass their own. */
export interface KeyControlStops {
  pressStopAll: () => void;
  stopLast: () => void;
}

/** Elements Enter activates — a focused one keeps its Enter. */
const CONTROLS =
  'button, a[href], summary, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="switch"], [role="menuitem"], [role="option"]';

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
  stops: KeyControlStops = { pressStopAll: () => pressStopAll(), stopLast: () => stopLast() },
): () => void {
  /** In GAME on a board, a plain key press outside a text field. */
  const applies = (e: KeyboardEvent) =>
    !e.repeat &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey &&
    currentScreen.value === 'board' &&
    currentMode.value === 'play' &&
    !takesText(e.target);

  // The numpad's stop keys, in the capture phase: they win before a focused pad or button sees
  // the key — its Enter handler would otherwise toggle it as well (e.key is 'Enter' for both).
  const onNumpadStop = (e: KeyboardEvent) => {
    const stop =
      e.code === 'NumpadDecimal'
        ? stops.pressStopAll
        : e.code === 'NumpadEnter'
          ? stops.stopLast
          : null;
    if (!stop || !applies(e)) return;
    e.preventDefault();
    e.stopPropagation();
    stop();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || !applies(e)) return;
    if (e.code === 'Enter') {
      const onControl = e.target instanceof Element && e.target.closest(CONTROLS) !== null;
      if (onControl) return;
      e.preventDefault();
      stops.stopLast();
      return;
    }
    if (e.code in RESERVED_KEYS) return;
    const board = currentBoard.value;
    const deck = currentDeck.value;
    if (!board || !deck) return;
    const pad = padForKey(board, deck, e.code);
    if (!pad) return;
    e.preventDefault();
    if (!audio.isPlaying(pad.id)) void audio.play(pad.id, pad);
  };
  doc.addEventListener('keydown', onNumpadStop, true);
  doc.addEventListener('keydown', onKey);
  return () => {
    doc.removeEventListener('keydown', onNumpadStop, true);
    doc.removeEventListener('keydown', onKey);
  };
}
