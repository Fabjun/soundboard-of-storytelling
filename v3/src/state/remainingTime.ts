/**
 * @fileoverview remainingTime — the time left of a playing pad (owner decision 2026-10-11)
 *
 * A pad shows its running time, and while it plays the time left, as Farrago does
 * (src/lib/padDuration.ts). The audio bridge records when each pad's sound ends on the audio
 * clock (`padEndsAt`); one timer reads that clock while any pad has an end — never one per pad —
 * and stops when none has. The audio clock stands still during a pause, so the time left does
 * too. A loop that runs until stopped has no end and keeps showing its running time.
 */

import { effect, signal } from '@preact/signals';
import { audioClock } from '../audio/index';
import { padEndsAt } from './store';

/** How often the time left is read, in ms — often enough that a whole second never lags behind. */
export const REMAINING_TICK_MS = 250;

/** The audio clock as last read, in seconds; it moves only while a pad shows a time left. */
export const audioNow = signal(0);

/**
 * Keeps `audioNow` current while any playing pad has an end, with one timer for all of them;
 * returns a function that stops it. `read` is the audio clock — tests pass their own.
 */
export function startRemainingClock(read: () => number = audioClock): () => void {
  let timer: ReturnType<typeof setInterval> | undefined;
  const stopTimer = () => {
    clearInterval(timer);
    timer = undefined;
  };
  const dispose = effect(() => {
    const active = padEndsAt.value.size > 0;
    if (active && timer === undefined) {
      audioNow.value = read();
      timer = setInterval(() => (audioNow.value = read()), REMAINING_TICK_MS);
    } else if (!active && timer !== undefined) stopTimer();
  });
  return () => {
    dispose();
    stopTimer();
  };
}

/** Returns the seconds left of a pad's sound, or null when it has no end (not playing, or a loop). */
export function remainingSeconds(padId: string): number | null {
  const end = padEndsAt.value.get(padId);
  return end === undefined ? null : Math.max(0, end - audioNow.value);
}
