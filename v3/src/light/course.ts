/**
 * @fileoverview course — a light course: from one light to another over minutes, run by the app
 * (docs/product/features/light.md#light-course-and-short-lights, K1 and K2)
 *
 * A WLED crossfade lasts at most 65 s ("Max transition time is 65 seconds", JSON API `tt`), so the
 * app keeps the course, as a lighting console keeps its cue: it sends the start at once, and then
 * at each step the point the course reaches one step later, with a transition of that step — the
 * lamp fades smoothly from point to point. A step is 10 s (a tenth of a short course). When the
 * browser runs the timer late — a hidden, silent page is woken once a minute (Chrome, timer
 * throttling) — the next transition takes the gap it measured, up to 60 s, so the fade stays
 * smooth. At the end the lamp keeps the end light. One course runs at a time. A short light holds
 * its sending while its time goes on (K3); a pause of the sound stops its time too (K4).
 */

import { signal } from '@preact/signals';
import type { LightCourse, LightPoint } from '../types';

/** The longest step of a course, in ms. */
export const STEP_MS = 10_000;

/** The longest transition the app asks for, in ms — below WLED's 65 s. */
export const TRANSITION_MAX_MS = 60_000;

/** Sends one point of the course with a transition of `transitionMs` to the course's lamps. */
export type SendPoint = (point: LightPoint, transitionMs: number) => void;

/** The minutes left of the running course, rounded up, or null when none runs — the status bar. */
export const courseMinutesLeft = signal<number | null>(null);

const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** Mixes two `#rrggbb` colors linearly: `t` 0 is `a`, 1 is `b`. */
export function mixColor(a: string, b: string, t: number): string {
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  const ch = (c: number, shift: number) => (c >> shift) & 255;
  return `#${[16, 8, 0].map((s) => hex(ch(ca, s) + (ch(cb, s) - ch(ca, s)) * t)).join('')}`;
}

/** The point a course of `durationMs` reaches `elapsedMs` after its start, held at its end. */
export function coursePoint(
  course: LightCourse,
  durationMs: number,
  elapsedMs: number,
): LightPoint {
  const t = Math.min(1, Math.max(0, elapsedMs / durationMs));
  return {
    color: mixColor(course.from.color, course.to.color, t),
    brightness: Math.round(
      course.from.brightness + (course.to.brightness - course.from.brightness) * t,
    ),
  };
}

/**
 * The running course: its timer, whether a short light holds its sending, whether a pause stopped
 * its clock, and the ways to send its point now, to stop its clock and to start it again.
 */
let running: {
  timer: ReturnType<typeof setInterval>;
  held: boolean;
  paused: boolean;
  resume: () => void;
  pause: () => void;
  unpause: () => void;
} | null = null;

/** Ends the running course; the lamp keeps the point it last reached. Nothing when none runs. */
export function stopCourse(): void {
  if (running) clearInterval(running.timer);
  running = null;
  courseMinutesLeft.value = null;
}

/**
 * Holds the running course while a short light is on (light.md K3): it goes on — the minutes count
 * and its end comes when it is due — but sends nothing. Nothing when none runs.
 */
export function holdCourse(): void {
  if (running) running.held = true;
}

/**
 * Ends the hold: sends the point the course has reached by now, at once, and goes on from there.
 * Returns false when no course runs any more — it ended meanwhile, or none was running.
 */
export function releaseCourse(): boolean {
  if (!running) return false;
  running.held = false;
  running.resume();
  return true;
}

/**
 * Stops the course's clock while the sound is paused (light.md K4): the lamp gets the point reached
 * now at once, so it stands still too (unless a short light is on), and the minutes stand. Nothing
 * when none runs or it is paused already.
 */
export function pauseCourse(): void {
  if (running && !running.paused) running.pause();
}

/** Starts the course's clock again after a pause; it goes on from the point it stood at. */
export function resumeCourse(): void {
  if (running?.paused) running.unpause();
}

/**
 * Starts `course` and ends one that runs: sends its start at once, then a point each step until its
 * end. `durationMs` shortens it (TRY); `now` is the clock (tests).
 */
export function startCourse(
  course: LightCourse,
  send: SendPoint,
  durationMs = course.minutes * 60_000,
  now: () => number = Date.now,
): void {
  stopCourse();
  // The start moves later by every pause, so the course's time leaves the paused time out
  let start = now();
  let pausedAt = 0;
  const step = Math.min(STEP_MS, durationMs / 10);
  let last = start;
  const elapsedNow = () => (running?.paused ? pausedAt : now()) - start;
  send(course.from, 0);
  courseMinutesLeft.value = Math.ceil(durationMs / 60_000);
  const timer = setInterval(() => {
    if (running?.paused) return;
    const t = now();
    const elapsed = t - start;
    // A late timer measured a longer gap: the next transition takes it, up to the limit
    const gap = Math.min(TRANSITION_MAX_MS, Math.max(step, t - last));
    last = t;
    const target = Math.min(durationMs, elapsed + gap);
    if (!running?.held) {
      send(coursePoint(course, durationMs, target), Math.max(0, target - elapsed));
    }
    if (target >= durationMs) {
      stopCourse();
      return;
    }
    courseMinutesLeft.value = Math.ceil((durationMs - elapsed) / 60_000);
  }, step);
  running = {
    timer,
    held: false,
    paused: false,
    resume: () => send(coursePoint(course, durationMs, elapsedNow()), 0),
    pause: () => {
      if (!running) return;
      pausedAt = now();
      running.paused = true;
      if (!running.held) send(coursePoint(course, durationMs, pausedAt - start), 0);
    },
    unpause: () => {
      if (!running) return;
      const t = now();
      start += t - pausedAt;
      last = t;
      running.paused = false;
    },
  };
}
