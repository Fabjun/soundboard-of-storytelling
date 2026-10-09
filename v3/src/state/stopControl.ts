/**
 * @fileoverview stopControl — STOP ALL in two stages and "stop the last sound" (Slice 12b)
 *
 * docs/product/README.md#input-keyboard--numpad (owner decisions 2026-10-08):
 *   - STOP ALL (K9, K16): the first press fades every sound out over STOP_ALL_FADE seconds; a
 *     second press while it fades stops everything at once — the theater standard (QLab: Escape
 *     fades, a second Escape hard-stops). The numpad's decimal key is the same action (K6).
 *   - Enter (K5): stops the sound started last, with that pad's own fade-out; the next press the
 *     one before it.
 *
 * The first stage fades pad by pad (`stop(id, false, fade)`) and not with the engine's
 * fadeOutAll: that one lets the pads go at once, so a tap on a fading pad would start it anew
 * instead of stopping it — not the behavior decided for STOP ALL.
 *
 * During a pause (Slice 12d, K8 "stop actions end the paused sounds") the audio clock stands
 * still, so a fade would never run: STOP ALL stops at once and ends the pause; Enter stops the
 * last sound at once and the others stay paused.
 */

import { signal } from '@preact/signals';
import {
  resume as resumeEverything,
  stop as stopPad,
  stopAll as stopEverything,
} from '../audio/index';
import { audioPaused, boards, playingPads } from './store';

/** Seconds the first STOP ALL press fades over — V1's fade-out-all default (K16). */
export const STOP_ALL_FADE = 2.5;

/** True while the first STOP ALL stage fades — a second press now stops at once. */
export const stopAllFading = signal(false);

/** What stopControl needs from the audio engine; tests pass their own. */
export interface StopControlAudio {
  stop: (padId: string, immediate?: boolean, fadeOut?: number) => void;
  stopAll: () => void;
  resume: () => void;
}

const engine: StopControlAudio = {
  stop: stopPad,
  stopAll: stopEverything,
  resume: resumeEverything,
};

let fadeTimer: ReturnType<typeof setTimeout> | undefined;

/** Ends the fading stage (its time is over, or the second press came). */
function endFade(): void {
  clearTimeout(fadeTimer);
  fadeTimer = undefined;
  stopAllFading.value = false;
}

/**
 * One press of STOP ALL: fades everything out, or — while that fade runs — stops everything at
 * once. With nothing playing and no fade running it does nothing.
 */
export function pressStopAll(audio: StopControlAudio = engine): void {
  if (stopAllFading.value || audioPaused.value) {
    stopAllNow(audio);
    return;
  }
  const playing = [...playingPads.value];
  if (playing.length === 0) return;
  for (const id of playing) audio.stop(id, false, STOP_ALL_FADE);
  stopAllFading.value = true;
  fadeTimer = setTimeout(endFade, STOP_ALL_FADE * 1000);
}

/**
 * Stops everything at once and ends a running STOP ALL fade — the second stage of STOP ALL, and
 * what a mode switch does (Slice 12c, docs/product/README.md#switching-modes).
 */
export function stopAllNow(audio: StopControlAudio = engine): void {
  endFade();
  audio.stopAll();
  // Nothing is left to resume — end the pause, so the next sound is not held back
  if (audioPaused.value) audio.resume();
}

/** The pad with this id in any board's pool (a combo's own id is a pad too). */
function padFadeOut(id: string): number {
  for (const board of boards.value) {
    const pad = board.pads.find((p) => p.id === id);
    if (pad) return pad.fadeOut;
  }
  return 0;
}

/** Stops the sound started last (K5), with its pad's fade-out. Nothing plays → nothing happens. */
export function stopLast(audio: StopControlAudio = engine): void {
  const last = [...playingPads.value].at(-1);
  if (last === undefined) return;
  if (!audioPaused.value) {
    audio.stop(last, false, padFadeOut(last));
    return;
  }
  audio.stop(last, true);
  // The last paused sound is gone — nothing is paused any more
  if (playingPads.value.size === 0) audio.resume();
}
