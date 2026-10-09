/**
 * @fileoverview stopControl — STOP ALL in two stages (K9, K16) and "stop the last sound" (K5),
 * Slice 12b. Cases: nothing plays → nothing happens; the first press fades every playing pad
 * pad by pad over 2.5 s; a second press while it fades stops everything at once; after the fade
 * a press starts a new first stage; Enter stops the last started pad with its own fade-out, then
 * the one before; a pad not in any pool stops without a fade.
 */

import type { Board, SinglePad } from '../../src/types';
import { boards, playingPads } from '../../src/state/store';
import {
  STOP_ALL_FADE,
  pressStopAll,
  stopAllFading,
  stopLast,
  type StopControlAudio,
} from '../../src/state/stopControl';

const single = (id: string, fadeOut: number): SinglePad => ({
  id,
  type: 'single',
  files: [],
  order: 'sequential',
  name: id,
  volume: 80,
  fadeIn: 0,
  fadeOut,
});

const board: Board = {
  id: 'b',
  name: 'Board',
  themeId: 'hearth',
  pads: [single('a', 1), single('b', 0)],
  decks: [],
  padSize: 88,
  quickAccess: [],
};

let calls: string[];
const audio: StopControlAudio = {
  stop: (id, immediate = false, fadeOut = 0) => {
    calls.push(`stop ${id} ${immediate} ${fadeOut}`);
    // as the engine does: a stopped pad leaves the playing set at once, also when it fades
    const next = new Set(playingPads.value);
    next.delete(id);
    playingPads.value = next;
  },
  stopAll: () => {
    calls.push('stopAll');
    playingPads.value = new Set();
  },
};

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  boards.value = [board];
  playingPads.value = new Set();
  stopAllFading.value = false;
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('STOP ALL', () => {
  it('does nothing while nothing plays', () => {
    pressStopAll(audio);
    expect(calls).toEqual([]);
    expect(stopAllFading.value).toBe(false);
  });

  it('the first press fades every playing pad out over 2.5 s, pad by pad', () => {
    playingPads.value = new Set(['a', 'b']);
    pressStopAll(audio);
    expect(STOP_ALL_FADE).toBe(2.5);
    expect(calls).toEqual(['stop a false 2.5', 'stop b false 2.5']);
    expect(stopAllFading.value).toBe(true);
  });

  it('a second press while it fades stops everything at once', () => {
    playingPads.value = new Set(['a']);
    pressStopAll(audio);
    vi.advanceTimersByTime(2400);
    pressStopAll(audio);
    expect(calls).toEqual(['stop a false 2.5', 'stopAll']);
    expect(stopAllFading.value).toBe(false);
  });

  it('after the fade a press starts a new first stage', () => {
    playingPads.value = new Set(['a']);
    pressStopAll(audio);
    vi.advanceTimersByTime(2500);
    expect(stopAllFading.value).toBe(false);
    playingPads.value = new Set(['b']);
    pressStopAll(audio);
    expect(calls).toEqual(['stop a false 2.5', 'stop b false 2.5']);
  });
});

describe('stop the last sound (Enter)', () => {
  it('stops the pad started last with its own fade-out, then the one before', () => {
    playingPads.value = new Set(['a', 'b']);
    stopLast(audio);
    stopLast(audio);
    stopLast(audio);
    expect(calls).toEqual(['stop b false 0', 'stop a false 1']);
  });

  it('a playing id that is no pad of a pool stops without a fade', () => {
    playingPads.value = new Set(['x']);
    stopLast(audio);
    expect(calls).toEqual(['stop x false 0']);
  });
});
