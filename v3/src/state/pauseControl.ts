/**
 * @fileoverview pauseControl — Space pauses every sound and resumes it (Slice 12d, K7)
 *
 * docs/product/README.md#input-keyboard--numpad: K7 Space pauses all sounds (e.g. to talk at
 * the table) and resumes them on the next press; K8 any sound action resumes everything (the
 * audio facade's play does that), stop actions end the paused sounds (src/state/stopControl.ts),
 * a clearly visible PAUSED shows (the top bar). The details are the owner's decisions of
 * 2026-10-09; the engine part (pauseAll / resumeAll, src/audio/engine.ts, ADR-0079) is merged
 * after the owner's playback check.
 */

import { pause as pauseEverything, resume as resumeEverything } from '../audio/index';
import { audioPaused, playingPads } from './store';

/** What pauseControl needs from the audio facade; tests pass their own. */
export interface PauseAudio {
  pause: () => void;
  resume: () => void;
}

/**
 * Pauses every playing sound, or — while paused — resumes them. With nothing playing a pause
 * would only hide the next sound, so it does nothing then.
 */
export function togglePause(
  audio: PauseAudio = { pause: pauseEverything, resume: resumeEverything },
): void {
  if (audioPaused.value) {
    audio.resume();
    return;
  }
  if (playingPads.value.size === 0) return;
  audio.pause();
}
