// @vitest-environment jsdom
/**
 * @fileoverview keyControl — a key plays its pad on a board in GAME (Slice 12a, ADR-0077).
 * Cases: plays in GAME (K3) and not in SETUP or off the board; a second press while it plays
 * does not stop or restart it (K4); the deck shown decides, and in All pads the deck last
 * selected (K14); unknown, reserved, held-down and modified keys; a focused text field keeps its
 * keys, a focused button or slider does not; nothing after it is stopped. Live-control keys moved
 * in Settings (K12): the new keys act, the old ones are free for pads; Enter stays fixed; a moved
 * key other than Enter and Space wins before a focused control.
 */

import type { Board, Pad, SinglePad } from '../../src/types';
import {
  allPadsView,
  boards,
  currentBoardId,
  currentDeckId,
  currentMode,
  currentScreen,
} from '../../src/state/store';
import { startKeyControl } from '../../src/state/keyControl';
import { DEFAULT_CONTROL_KEYS, type ControlKeys } from '../../src/lib/padKeys';

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

const testBoard: Board = {
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
      placements: [{ padId: 'a', position: { col: 0, row: 0 }, hotkey: 'Numpad1' }],
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

let played: string[];
let playing: Set<string>;
let stop: () => void;
/** What the Settings choice says Enter stops — read by keyControl at each press. */
let enterStopsAll: boolean;
/** The keys of STOP ALL and PAUSE as Settings has them — read at each press. */
let controlKeys: ControlKeys;

function press(code: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  const e = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
}

beforeEach(() => {
  played = [];
  playing = new Set();
  enterStopsAll = false;
  controlKeys = DEFAULT_CONTROL_KEYS;
  boards.value = [testBoard];
  currentBoardId.value = 'b';
  currentDeckId.value = 'd1';
  allPadsView.value = false;
  currentScreen.value = 'board';
  currentMode.value = 'play';
  stop = startKeyControl(
    {
      play: (id: string, pad: Pad) => {
        played.push(`${id}:${pad.name}`);
        playing.add(id);
      },
      isPlaying: (id) => playing.has(id),
    },
    document,
    {
      pressStopAll: () => played.push('STOP ALL'),
      stopLast: () => played.push('STOP LAST'),
      togglePause: () => played.push('PAUSE'),
      enterStopsAll: () => enterStopsAll,
      controlKeys: () => controlKeys,
    },
  );
});
afterEach(() => {
  stop();
  document.body.innerHTML = '';
});

describe('a key plays its pad', () => {
  it('in GAME on a board, and takes the key from the browser', () => {
    const e = press('Numpad1');
    expect(played).toEqual(['a:a']);
    expect(e.defaultPrevented).toBe(true);
  });

  it('not in SETUP and not off the board (K3)', () => {
    currentMode.value = 'edit';
    press('Numpad1');
    currentMode.value = 'play';
    currentScreen.value = 'board-list';
    press('Numpad1');
    expect(played).toEqual([]);
  });

  it('a second press while the pad plays changes nothing (K4)', () => {
    press('Numpad1');
    press('Numpad1');
    expect(played).toEqual(['a:a']);
  });

  it('plays the pad of the deck shown, and in All pads the deck last selected (K14)', () => {
    currentDeckId.value = 'd2';
    press('Numpad1');
    allPadsView.value = true;
    playing.clear();
    press('Numpad1');
    expect(played).toEqual(['b:b', 'b:b']);
  });
});

describe('keys that play nothing', () => {
  it('a key no pad holds, the main-keyboard 1 and a reserved key stay with the browser', () => {
    for (const code of ['Numpad2', 'Digit1', 'Escape', 'Tab']) {
      const e = press(code);
      expect(e.defaultPrevented).toBe(false);
    }
    expect(played).toEqual([]);
  });

  it('a held-down key repeating, or a key with Ctrl / Alt / Cmd', () => {
    press('Numpad1', { repeat: true });
    press('Numpad1', { ctrlKey: true });
    press('Numpad1', { altKey: true });
    press('Numpad1', { metaKey: true });
    expect(played).toEqual([]);
  });

  it('a key another handler already took', () => {
    const taken = (e: Event) => e.preventDefault();
    document.body.addEventListener('keydown', taken);
    press('Numpad1');
    document.body.removeEventListener('keydown', taken);
    expect(played).toEqual([]);
  });

  it('a focused text field keeps its keys; a focused button or slider does not', () => {
    const field = document.createElement('input');
    const area = document.createElement('textarea');
    const slider = Object.assign(document.createElement('input'), { type: 'range' });
    const button = document.createElement('button');
    document.body.append(field, area, slider, button);
    press('Numpad1', {}, field);
    press('Numpad1', {}, area);
    expect(played).toEqual([]);
    press('Numpad1', {}, button);
    playing.clear();
    press('Numpad1', {}, slider);
    expect(played).toEqual(['a:a', 'a:a']);
  });

  it('a key on a focused checkbox, radio, color, file or form button still plays its pad', () => {
    const types = ['checkbox', 'radio', 'color', 'file', 'submit', 'reset', 'button'];
    for (const type of types) {
      const input = Object.assign(document.createElement('input'), { type });
      document.body.append(input);
      playing.clear();
      press('Numpad1', {}, input);
    }
    expect(played).toHaveLength(types.length);
  });

  it('an editable region and a number field keep their keys', () => {
    const region = document.createElement('div');
    // jsdom has no editing: the flag a browser sets for contenteditable is set by hand
    Object.defineProperty(region, 'isContentEditable', { value: true });
    const number = Object.assign(document.createElement('input'), { type: 'number' });
    document.body.append(region, number);
    press('Numpad1', {}, region);
    press('Numpad1', {}, number);
    expect(played).toEqual([]);
  });

  it('a key sent to the page itself, not to an element, still plays', () => {
    press('Numpad1', {}, document);
    expect(played).toEqual(['a:a']);
  });

  it('a reserved key plays nothing even when a pad holds it (a binding from an import)', () => {
    const [d1, d2] = testBoard.decks;
    const escape = { ...d1.placements[0], hotkey: 'Escape' };
    boards.value = [{ ...testBoard, decks: [{ ...d1, placements: [escape] }, d2] }];
    const e = press('Escape');
    expect(played).toEqual([]);
    expect(e.defaultPrevented).toBe(false);
  });

  it('nothing, and no error, when the deck it remembers is gone', () => {
    // An error thrown in a listener does not reach dispatchEvent — the window reports it
    const errors: unknown[] = [];
    const onError = (e: ErrorEvent) => {
      errors.push(e.error);
      e.preventDefault();
    };
    window.addEventListener('error', onError);
    currentDeckId.value = 'deleted';
    press('Numpad1');
    window.removeEventListener('error', onError);
    expect(errors).toEqual([]);
    expect(played).toEqual([]);
  });

  it('nothing once it is stopped', () => {
    stop();
    press('Numpad1');
    expect(played).toEqual([]);
  });
});

describe('quick-access keys (K13, Slice 13d)', () => {
  /** The test board with pad b in the quick-access bar on KeyQ — b is placed only in Deck 2. */
  const withBarKey = (code = 'KeyQ') => {
    boards.value = [{ ...testBoard, quickAccess: [{ padId: 'b', hotkey: code }] }];
  };

  it('a bar key plays its pad in every deck and in All pads', () => {
    withBarKey();
    press('KeyQ'); // Deck 1 shown — b is not in it
    currentDeckId.value = 'd2';
    playing.clear();
    press('KeyQ');
    allPadsView.value = true;
    playing.clear();
    press('KeyQ');
    expect(played).toEqual(['b:b', 'b:b', 'b:b']);
  });

  it('a bar key plays even when the deck it remembers is gone', () => {
    withBarKey();
    currentDeckId.value = 'deleted';
    press('KeyQ');
    expect(played).toEqual(['b:b']);
  });

  it('a key held by the bar and a deck (data from before the check) plays the bar pad', () => {
    withBarKey('Numpad1'); // Deck 1 plays a on Numpad1
    press('Numpad1');
    expect(played).toEqual(['b:b']);
  });
});

describe('stop keys (Slice 12b)', () => {
  it('the numpad decimal is STOP ALL, the numpad Enter and Enter stop the last sound (K5, K6)', () => {
    for (const code of ['NumpadDecimal', 'NumpadEnter', 'Enter']) {
      expect(press(code).defaultPrevented).toBe(true);
    }
    expect(played).toEqual(['STOP ALL', 'STOP LAST', 'STOP LAST']);
  });

  it('only in GAME on a board, never in a text field, not held down', () => {
    currentMode.value = 'edit';
    press('NumpadDecimal');
    currentMode.value = 'play';
    const field = document.createElement('input');
    document.body.append(field);
    press('NumpadEnter', {}, field);
    press('NumpadDecimal', { repeat: true });
    expect(played).toEqual([]);
  });

  it('a focused control keeps its Enter; the numpad stop keys win before it sees them', () => {
    const button = document.createElement('button');
    const seen: string[] = [];
    button.addEventListener('keydown', (e) => seen.push(e.code));
    document.body.append(button);
    press('Enter', {}, button);
    press('NumpadEnter', {}, button);
    press('NumpadDecimal', {}, button);
    expect(seen).toEqual(['Enter']);
    expect(played).toEqual(['STOP LAST', 'STOP ALL']);
  });

  it('with Enter set to STOP ALL in Settings, both Enter keys stop all (settings.md S2)', () => {
    enterStopsAll = true;
    press('NumpadEnter');
    press('Enter');
    press('NumpadDecimal');
    expect(played).toEqual(['STOP ALL', 'STOP ALL', 'STOP ALL']);
    enterStopsAll = false; // read at each press
    press('Enter');
    expect(played.at(-1)).toBe('STOP LAST');
  });
});

describe('Space (Slice 12d)', () => {
  it('pauses / resumes in GAME; a focused control keeps its Space', () => {
    expect(press('Space').defaultPrevented).toBe(true);
    const button = document.createElement('button');
    document.body.append(button);
    press('Space', {}, button);
    currentMode.value = 'edit';
    press('Space');
    expect(played).toEqual(['PAUSE']);
  });
});

describe('live-control keys moved in Settings (K12)', () => {
  const withKey = (code: string) => {
    boards.value = [{ ...testBoard, quickAccess: [{ padId: 'b', hotkey: code }] }];
  };

  it('the new keys stop all and pause; read at each press', () => {
    controlKeys = { stopAll: 'KeyS', pause: 'KeyP' };
    expect(press('KeyS').defaultPrevented).toBe(true);
    expect(press('KeyP').defaultPrevented).toBe(true);
    expect(played).toEqual(['STOP ALL', 'PAUSE']);
  });

  it('the old keys are free: a pad that holds one plays, Space no longer pauses', () => {
    controlKeys = { stopAll: 'KeyS', pause: 'KeyP' };
    withKey('NumpadDecimal');
    press('NumpadDecimal');
    expect(press('Space').defaultPrevented).toBe(false);
    expect(played).toEqual(['b:b']);
  });

  it('the two actions can swap keys: Space stops all, the numpad decimal pauses', () => {
    controlKeys = { stopAll: 'Space', pause: 'NumpadDecimal' };
    press('Space');
    press('NumpadDecimal');
    expect(played).toEqual(['STOP ALL', 'PAUSE']);
  });

  it('Enter stays the stop key whatever is moved', () => {
    controlKeys = { stopAll: 'KeyS', pause: 'KeyP' };
    press('Enter');
    press('NumpadEnter');
    expect(played).toEqual(['STOP LAST', 'STOP LAST']);
  });

  it('a moved key wins before a focused control; Space on a control stays with the control', () => {
    controlKeys = { stopAll: 'KeyS', pause: 'Space' };
    const button = document.createElement('button');
    const seen: string[] = [];
    button.addEventListener('keydown', (e) => seen.push(e.code));
    document.body.append(button);
    press('KeyS', {}, button);
    press('Space', {}, button);
    expect(seen).toEqual(['Space']);
    expect(played).toEqual(['STOP ALL']);
  });
});
