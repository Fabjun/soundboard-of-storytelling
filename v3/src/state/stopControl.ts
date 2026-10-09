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
 * fadeOutAll: that one also stops a pad started during the fade when the fade ends (engine bug,
 * pinned in tests/unit/audio/engine.test.ts; the engine stays unchanged,
 * docs/architecture/0048-pad-pool-decks.md#4-audio-engine--change-under-product-owner-control).
 */

import { signal } from '@preact/signals';
import { stop as stopPad, stopAll as stopEverything } from '../audio/index';
import { boards, playingPads } from './store';

/** Seconds the first STOP ALL press fades over — V1's fade-out-all default (K16). */
export const STOP_ALL_FADE = 2.5;

/** True while the first STOP ALL stage fades — a second press now stops at once. */
export const stopAllFading = signal(false);

/** What stopControl needs from the audio engine; tests pass their own. */
export interface StopControlAudio {
  stop: (padId: string, immediate?: boolean, fadeOut?: number) => void;
  stopAll: () => void;
}

const engine: StopControlAudio = { stop: stopPad, stopAll: stopEverything };

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
  if (stopAllFading.value) {
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
  audio.stop(last, false, padFadeOut(last));
}
