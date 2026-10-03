/**
 * @fileoverview playHistory — "Last played" is recorded when a pad starts (E1), from the playing-pads signal.
 * Cases: a start is recorded once (not again while it keeps playing), a new start after a stop
 * is recorded again, several pads, stopping the recorder.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB } from '../../src/db/idb';
import { addPlayingPad, playingPads, removePlayingPad } from '../../src/state/store';
import { getLastPlayed, loadPrefs } from '../../src/state/prefs';
import { startPlayHistory } from '../../src/state/playHistory';

let clock = 1000;
let stop: () => void;

beforeEach(async () => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  await loadPrefs();
  playingPads.value = new Set();
  clock = 1000;
  stop = startPlayHistory(() => clock);
});
afterEach(() => stop());

describe('play history', () => {
  it('records when a pad starts, once while it keeps playing', () => {
    addPlayingPad('a');
    expect(getLastPlayed('a')).toBe(1000);
    clock = 2000;
    addPlayingPad('b'); // a still plays — not recorded again
    expect(getLastPlayed('a')).toBe(1000);
    expect(getLastPlayed('b')).toBe(2000);
  });

  it('a new start after a stop is recorded again', () => {
    addPlayingPad('a');
    removePlayingPad('a');
    clock = 5000;
    addPlayingPad('a');
    expect(getLastPlayed('a')).toBe(5000);
  });

  it('records nothing after it is stopped; never-played pads stay null', () => {
    stop();
    addPlayingPad('a');
    expect(getLastPlayed('a')).toBeNull();
  });
});
