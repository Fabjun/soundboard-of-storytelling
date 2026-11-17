/**
 * @fileoverview remainingTime — the time left of a playing pad (src/state/remainingTime.ts)
 *
 * Cases: no timer while no pad has an end; the clock is read at once and every tick while one
 * has; the time left counts down and never below 0; a pad without an end (not playing, a loop)
 * has none; a stopped pad drops its end and the timer stops with the last one; the returned
 * function stops the clock.
 */

import { padEndsAt, removePlayingPad, setPadEnd } from '../../src/state/store';
import {
  REMAINING_TICK_MS,
  audioNow,
  remainingSeconds,
  startRemainingClock,
} from '../../src/state/remainingTime';

let clock: number;
let reads: number;
const read = () => {
  reads++;
  return clock;
};

beforeEach(() => {
  vi.useFakeTimers();
  padEndsAt.value = new Map();
  audioNow.value = 0;
  clock = 0;
  reads = 0;
});
afterEach(() => vi.useRealTimers());

describe('the clock of the time left', () => {
  it('reads nothing while no pad has an end; reads at once and each tick while one has', () => {
    const stop = startRemainingClock(read);
    vi.advanceTimersByTime(REMAINING_TICK_MS * 4);
    expect(reads).toBe(0);

    clock = 10;
    setPadEnd('s', 13);
    expect(audioNow.value).toBe(10);
    expect(remainingSeconds('s')).toBe(3);
    clock = 12.5;
    vi.advanceTimersByTime(REMAINING_TICK_MS);
    expect(remainingSeconds('s')).toBe(0.5);
    clock = 14;
    vi.advanceTimersByTime(REMAINING_TICK_MS);
    expect(remainingSeconds('s')).toBe(0); // never below 0
    stop();
  });

  it('a pad without an end has no time left', () => {
    const stop = startRemainingClock(read);
    setPadEnd('s', 5);
    expect(remainingSeconds('l')).toBeNull();
    stop();
  });

  it('a stopped pad drops its end; the timer stops with the last one', () => {
    const stop = startRemainingClock(read);
    setPadEnd('a', 5);
    setPadEnd('b', 6);
    removePlayingPad('a');
    expect(padEndsAt.value.has('a')).toBe(false);
    vi.advanceTimersByTime(REMAINING_TICK_MS);
    const before = reads;
    removePlayingPad('b');
    vi.advanceTimersByTime(REMAINING_TICK_MS * 4);
    expect(reads).toBe(before);
    stop();
  });

  it('the returned function stops the clock', () => {
    const stop = startRemainingClock(read);
    setPadEnd('s', 5);
    stop();
    const before = reads;
    vi.advanceTimersByTime(REMAINING_TICK_MS * 4);
    expect(reads).toBe(before);
  });
});
