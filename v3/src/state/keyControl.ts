/**
 * @fileoverview keyControl — a key plays its pad in GAME (Slice 12a, ADR-0077)
 *
 * One document listener, added once at app start. It reads the screen, the mode, the board and
 * the deck at the moment the key is pressed (the signals), so it never acts on an old state.
 * Rules (docs/product/README.md#input-keyboard--numpad):
 *   - only on a board in GAME (K3) — in SETUP keys do nothing;
 *   - the deck shown, or in All pads the deck last selected (K14: `currentDeckId` stays); the
 *     quick-access bar's keys first, board-wide in every view (K13, Slice 13d) — the PAD editor
 *     keeps them apart from the deck keys (K2);
 *   - a key whose pad already plays does nothing — a second press never stops it (K4);
 *   - never while a text field has focus, with Ctrl / Alt / Cmd held, or for a held-down key;
 *   - stop keys (Slice 12b): the numpad's Enter stops the sound started last (K5) — or every
 *     sound, the same as STOP ALL, when Settings says so (V1's ENTER KEY STOP, settings.md S2); the
 *     main Enter does that too; STOP ALL (K6, two stages) and PAUSE (K7: pause and resume) have a
 *     key each — the numpad's decimal and Space until moved in Settings (K12) — read at each press;
 *   - Enter and Space belong to a focused control (a button's own keys, WAI-ARIA button pattern);
 *     every other live-control key wins before a focused control sees it (capture phase);
 *   - the other reserved keys (Escape, Tab) are left to their own controls.
 */

import { play as playPad, isPlaying as padIsPlaying } from '../audio/index';
import { padForKey, quickAccessPadForKey, reservedKeys, type ControlKeys } from '../lib/padKeys';
import type { Pad } from '../types';
import { currentBoard, currentDeck, currentMode, currentScreen } from './store';
import { pressStopAll, stopLast } from './stopControl';
import { togglePause } from './pauseControl';
import { getControlKeys, getEnterStop } from './prefs';

/** What keyControl needs from the audio engine; tests pass their own. */
export interface KeyControlAudio {
  play: (padId: string, pad: Pad) => unknown;
  isPlaying: (padId: string) => boolean;
}

/** The actions the stop keys and Space call; tests pass their own. */
export interface KeyControlStops {
  pressStopAll: () => void;
  stopLast: () => void;
  togglePause: () => void;
  /** Whether Enter stops all sounds instead of the last one — read at each press (Settings). */
  enterStopsAll: () => boolean;
  /** The keys of STOP ALL and PAUSE — read at each press (Settings, K12). */
  controlKeys: () => ControlKeys;
}

/** The keys a focused control uses itself (WAI-ARIA button pattern). */
const ACTIVATING = new Set(['Enter', 'Space']);

/** Elements Enter and Space activate — a focused one keeps its key. */
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
  stops: KeyControlStops = {
    pressStopAll: () => pressStopAll(),
    stopLast: () => stopLast(),
    togglePause: () => togglePause(),
    enterStopsAll: () => getEnterStop() === 'all',
    controlKeys: () => getControlKeys(),
  },
): () => void {
  /** Enter — the numpad's and the main one: the sound started last, or all (settings.md S2). */
  const enterStop = () => (stops.enterStopsAll() ? stops.pressStopAll() : stops.stopLast());

  /** In GAME on a board, a plain key press outside a text field. */
  const applies = (e: KeyboardEvent) =>
    !e.repeat &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey &&
    currentScreen.value === 'board' &&
    currentMode.value === 'play' &&
    !takesText(e.target);

  /** The live-control action of a key: the Enters, then the keys of STOP ALL and PAUSE. */
  const actionFor = (code: string): (() => void) | null => {
    if (code === 'Enter' || code === 'NumpadEnter') return enterStop;
    const keys = stops.controlKeys();
    if (code === keys.stopAll) return stops.pressStopAll;
    if (code === keys.pause) return stops.togglePause;
    return null;
  };

  // Live-control keys other than Enter and Space, in the capture phase: they win before a focused
  // pad or button sees the key — its Enter handler would otherwise toggle it as well (e.key is
  // 'Enter' for the numpad's Enter too).
  const onControlKey = (e: KeyboardEvent) => {
    if (ACTIVATING.has(e.code)) return;
    const action = actionFor(e.code);
    if (!action || !applies(e)) return;
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || !applies(e)) return;
    if (ACTIVATING.has(e.code)) {
      const onControl = e.target instanceof Element && e.target.closest(CONTROLS) !== null;
      if (onControl) return;
      const action = actionFor(e.code);
      if (action) {
        e.preventDefault(); // Space would also scroll the page
        action();
        return;
      }
    }
    if (e.code in reservedKeys(stops.controlKeys())) return;
    const board = currentBoard.value;
    if (!board) return;
    // The quick-access bar's keys work board-wide, in every view (K13); then the deck's (K14)
    const deck = currentDeck.value;
    const pad =
      quickAccessPadForKey(board, e.code) ?? (deck ? padForKey(board, deck, e.code) : null);
    if (!pad) return;
    e.preventDefault();
    if (!audio.isPlaying(pad.id)) void audio.play(pad.id, pad);
  };
  doc.addEventListener('keydown', onControlKey, true);
  doc.addEventListener('keydown', onKey);
  return () => {
    doc.removeEventListener('keydown', onControlKey, true);
    doc.removeEventListener('keydown', onKey);
  };
}
