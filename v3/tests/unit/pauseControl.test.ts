/**
 * @fileoverview pauseControl — Space pauses every sound and resumes it (Slice 12d, K7).
 * Cases: pauses while something plays; resumes while paused; nothing playing → nothing.
 */

import { audioPaused, playingPads } from '../../src/state/store';
import { togglePause, type PauseAudio } from '../../src/state/pauseControl';

let calls: string[];
const audio: PauseAudio = {
  pause: () => {
    calls.push('pause');
    audioPaused.value = true;
  },
  resume: () => {
    calls.push('resume');
    audioPaused.value = false;
  },
};

beforeEach(() => {
  calls = [];
  audioPaused.value = false;
  playingPads.value = new Set();
});

describe('Space', () => {
  it('pauses what plays, and the next press resumes it', () => {
    playingPads.value = new Set(['a']);
    togglePause(audio);
    togglePause(audio);
    expect(calls).toEqual(['pause', 'resume']);
  });

  it('with nothing playing it does nothing', () => {
    togglePause(audio);
    expect(calls).toEqual([]);
    expect(audioPaused.value).toBe(false);
  });
});
