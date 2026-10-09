// @vitest-environment jsdom
/**
 * @fileoverview keyControl — a key plays its pad on a board in GAME (Slice 12a, ADR-0077).
 * Cases: plays in GAME (K3) and not in SETUP or off the board; a second press while it plays
 * does not stop or restart it (K4); the deck shown decides, and in All pads the deck last
 * selected (K14); unknown, reserved, held-down and modified keys; a focused text field keeps its
 * keys, a focused button or slider does not; nothing after it is stopped.
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

function press(code: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
  const e = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
}

beforeEach(() => {
  played = [];
  playing = new Set();
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

  it('nothing once it is stopped', () => {
    stop();
    press('Numpad1');
    expect(played).toEqual([]);
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
