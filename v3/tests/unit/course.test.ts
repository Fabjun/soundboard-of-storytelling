/**
 * @fileoverview course — a light course the app runs (light.md K1, K2)
 *
 * On a simulated clock. Edge cases: the colors at 0, half and the end, and past the end; the start
 * is sent at once with no transition; each step sends the point one step ahead with that step as
 * its transition; the last step lands on the end and stops; the minutes left count down and clear;
 * a late timer lengthens the transition to the gap it measured, up to 60 s; a short course takes a
 * tenth of its length as its step; a new course and stopCourse end the running one. A hold (a
 * short light, K3) sends nothing while the course goes on; the release sends the point reached by
 * then, at once; a course that ended while held releases nothing; hold and release without a course
 * do nothing.
 */

import type { LightCourse, LightPoint } from '../../src/types';
import {
  STEP_MS,
  TRANSITION_MAX_MS,
  courseMinutesLeft,
  coursePoint,
  holdCourse,
  mixColor,
  releaseCourse,
  startCourse,
  stopCourse,
} from '../../src/light/course';

const day: LightCourse = {
  from: { color: '#ffffff', brightness: 255 },
  to: { color: '#ff0000', brightness: 55 },
  minutes: 20,
};
const MIN = 60_000;

/** A sender that records each point with its transition. */
function recorder() {
  const sent: [LightPoint, number][] = [];
  return { sent, send: (p: LightPoint, ms: number) => void sent.push([p, ms]) };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stopCourse();
  vi.useRealTimers();
});

describe('mixColor / coursePoint', () => {
  it('blends each channel linearly; 0 is the start, 1 the end', () => {
    expect(mixColor('#ffffff', '#ff0000', 0)).toBe('#ffffff');
    expect(mixColor('#ffffff', '#ff0000', 1)).toBe('#ff0000');
    expect(mixColor('#ffffff', '#ff0000', 0.5)).toBe('#ff8080');
    expect(mixColor('#000000', '#0a1428', 0.5)).toBe('#050a14');
  });

  it('the point at the start, half way, the end, and held past it', () => {
    const d = 20 * MIN;
    expect(coursePoint(day, d, 0)).toEqual(day.from);
    expect(coursePoint(day, d, d / 2)).toEqual({ color: '#ff8080', brightness: 155 });
    expect(coursePoint(day, d, d)).toEqual(day.to);
    expect(coursePoint(day, d, d * 2)).toEqual(day.to);
    expect(coursePoint(day, d, -5)).toEqual(day.from);
  });
});

describe('startCourse', () => {
  it('sends the start at once, then each step the point one step ahead over that step', () => {
    const r = recorder();
    startCourse(day, r.send, undefined, Date.now);
    expect(r.sent).toEqual([[day.from, 0]]);
    expect(courseMinutesLeft.value).toBe(20);
    vi.advanceTimersByTime(STEP_MS);
    expect(r.sent[1]).toEqual([coursePoint(day, 20 * MIN, 2 * STEP_MS), STEP_MS]);
    vi.advanceTimersByTime(STEP_MS);
    expect(r.sent[2]).toEqual([coursePoint(day, 20 * MIN, 3 * STEP_MS), STEP_MS]);
  });

  it('the last step lands on the end light and stops; the minutes left count down and clear', () => {
    const r = recorder();
    startCourse(day, r.send, undefined, Date.now);
    vi.advanceTimersByTime(10 * MIN);
    expect(courseMinutesLeft.value).toBe(10);
    vi.advanceTimersByTime(10 * MIN);
    const last = r.sent.at(-1)!;
    expect(last[0]).toEqual(day.to);
    expect(courseMinutesLeft.value).toBeNull();
    const count = r.sent.length;
    vi.advanceTimersByTime(5 * MIN);
    expect(r.sent.length).toBe(count); // nothing after the end
  });

  it('a late timer takes the gap it measured as the transition, up to 60 s', () => {
    const r = recorder();
    let clock = 0;
    startCourse(day, r.send, undefined, () => clock);
    clock = 45_000; // the step came 45 s late, as on a hidden page
    vi.advanceTimersByTime(STEP_MS);
    expect(r.sent[1]).toEqual([coursePoint(day, 20 * MIN, 90_000), 45_000]);
    clock = 245_000; // 200 s later — the transition stays below WLED's 65 s
    vi.advanceTimersByTime(STEP_MS);
    expect(r.sent[2][1]).toBe(TRANSITION_MAX_MS);
  });

  it('a short course steps a tenth of its length: TRY plays the whole way in 10 s', () => {
    const r = recorder();
    startCourse(day, r.send, 10_000, Date.now);
    vi.advanceTimersByTime(10_000);
    // The start and nine steps of 1 s: the one at 9 s already sends the end, reached at 10 s
    expect(r.sent).toHaveLength(10);
    expect(r.sent[1][1]).toBe(1_000);
    expect(r.sent.at(-1)![0]).toEqual(day.to);
    expect(courseMinutesLeft.value).toBeNull();
  });

  it('a new course ends the running one; stopCourse ends it and clears the minutes', () => {
    const a = recorder();
    const b = recorder();
    startCourse(day, a.send, undefined, Date.now);
    startCourse({ ...day, minutes: 5 }, b.send, undefined, Date.now);
    vi.advanceTimersByTime(STEP_MS);
    expect(a.sent).toHaveLength(1);
    expect(b.sent).toHaveLength(2);
    stopCourse();
    vi.advanceTimersByTime(STEP_MS);
    expect(b.sent).toHaveLength(2);
    expect(courseMinutesLeft.value).toBeNull();
  });
});

describe('holdCourse / releaseCourse (a short light, K3)', () => {
  it('a hold sends nothing while the course goes on; the release sends where it got to, at once', () => {
    const r = recorder();
    startCourse(day, r.send, undefined, Date.now);
    vi.advanceTimersByTime(STEP_MS);
    holdCourse();
    vi.advanceTimersByTime(5 * MIN);
    expect(r.sent).toHaveLength(2); // the start and the first step only
    expect(courseMinutesLeft.value).toBe(15); // the minutes go on counting
    expect(releaseCourse()).toBe(true);
    expect(r.sent[2]).toEqual([coursePoint(day, 20 * MIN, 5 * MIN + STEP_MS), 0]);
    vi.advanceTimersByTime(STEP_MS);
    expect(r.sent).toHaveLength(4); // and it sends again
  });

  it('a course that ended while held releases nothing; without a course both do nothing', () => {
    const r = recorder();
    startCourse(day, r.send, undefined, Date.now);
    holdCourse();
    vi.advanceTimersByTime(25 * MIN);
    expect(courseMinutesLeft.value).toBeNull();
    expect(releaseCourse()).toBe(false);
    expect(r.sent).toEqual([[day.from, 0]]);
    holdCourse();
    expect(releaseCourse()).toBe(false);
  });
});
