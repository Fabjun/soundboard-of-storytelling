/**
 * @fileoverview padLight — a pad's light next to its sound (light.md C1–C6, ADR-0091)
 *
 * The lamps and the sender are stand-ins. Cases: no light sends nothing; a preset to all lamps or
 * to the one named; off; a lamp named but gone sends nothing; a failed lamp marks the trouble and a
 * good round clears it; the call returns before any lamp answers (fire and forget). A light on its
 * own — the board's base light — goes out the same way, and none sends nothing. A course (K1, K3)
 * sends its start at once and runs on; another light ends it, a pad without light does not; with
 * no lamp to reach none starts; TRY's shortened course reaches its end in 10 s. A short light (K3)
 * holds a running course, and when its pad stops the course goes on from where it got to; after a
 * preset base the preset comes back; a course that ended meanwhile comes back as its end light;
 * the stop of another pad, or of a short light another light followed, changes nothing; a course
 * is never short.
 */

import type { Lamp } from '../../src/state/prefs';
import type { LightCourse, Pad, PadLight } from '../../src/types';
import {
  COURSE_TRY_MS,
  endPadLight,
  lampsFor,
  lightCommand,
  lightTrouble,
  startLight,
  startPadLight,
} from '../../src/light/padLight';
import { courseMinutesLeft, stopCourse } from '../../src/light/course';
import { EFFECT_DEFAULT, type LightCommand, type LightResult } from '../../src/light/wled';
import { newPad } from '../../src/lib/padUtils';

const lamps: Lamp[] = [
  { id: 'a', name: 'Floor', address: '192.168.1.50' },
  { id: 'b', name: 'Strip', address: '192.168.1.51' },
];

const withLight = (light?: PadLight): Pad => ({
  ...newPad('p', 'single', 'Thunder', ['h']),
  ...(light ? { light } : {}),
});

/** A sender that records each call and answers `result`. */
function sender(result: LightResult = { kind: 'ok' }) {
  const calls: [string, LightCommand][] = [];
  return {
    calls,
    send: (address: string, command: LightCommand) => {
      calls.push([address, command]);
      return Promise.resolve(result);
    },
  };
}

beforeEach(() => {
  lightTrouble.value = false;
});

describe('lightCommand / lampsFor', () => {
  it('a preset is {preset}, off is {off}; all lamps or the one named, none when it is gone', () => {
    expect(lightCommand({ lamp: 'all', preset: 4 })).toEqual({ preset: 4 });
    expect(lightCommand({ lamp: 'a', off: true })).toEqual({ off: true });
    expect(lightCommand({ lamp: 'all', effect: EFFECT_DEFAULT })).toEqual({
      effect: EFFECT_DEFAULT,
    });
    expect(lampsFor({ lamp: 'all', preset: 1 }, lamps).map((l) => l.id)).toEqual(['a', 'b']);
    expect(lampsFor({ lamp: 'b', preset: 1 }, lamps).map((l) => l.id)).toEqual(['b']);
    expect(lampsFor({ lamp: 'gone', preset: 1 }, lamps)).toEqual([]);
  });
});

describe('startLight (a board base light)', () => {
  it('sends a light on its own to its lamps; none sends nothing', async () => {
    const s = sender();
    expect(await startLight(undefined, lamps, s.send)).toEqual([]);
    await startLight({ lamp: 'a', preset: 3 }, lamps, s.send);
    expect(s.calls).toEqual([['192.168.1.50', { preset: 3 }]]);
  });
});

describe('startPadLight', () => {
  it('a pad without light, or no pad, sends nothing', async () => {
    const s = sender();
    expect(await startPadLight(withLight(), lamps, s.send)).toEqual([]);
    expect(await startPadLight(null, lamps, s.send)).toEqual([]);
    expect(s.calls).toEqual([]);
  });

  it('sends the preset to every lamp named, and off to one', async () => {
    const s = sender();
    await startPadLight(withLight({ lamp: 'all', preset: 7 }), lamps, s.send);
    await startPadLight(withLight({ lamp: 'b', off: true }), lamps, s.send);
    expect(s.calls).toEqual([
      ['192.168.1.50', { preset: 7 }],
      ['192.168.1.51', { preset: 7 }],
      ['192.168.1.51', { off: true }],
    ]);
  });

  it('a lamp that fails marks the trouble; a round that reaches every lamp clears it', async () => {
    await startPadLight(
      withLight({ lamp: 'all', preset: 1 }),
      lamps,
      sender({ kind: 'blocked' }).send,
    );
    expect(lightTrouble.value).toBe(true);
    await startPadLight(withLight({ lamp: 'all', preset: 1 }), lamps, sender().send);
    expect(lightTrouble.value).toBe(false);
  });

  it('returns before a lamp answers — the sound never waits', async () => {
    let answer: (r: LightResult) => void = () => {};
    const slow = (): Promise<LightResult> => new Promise((resolve) => (answer = resolve));
    let settled = false;
    const done = startPadLight(withLight({ lamp: 'a', preset: 2 }), lamps, slow).then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    answer({ kind: 'ok' });
    await done;
    expect(settled).toBe(true);
  });
});

describe('startLight with a course (light.md K1, K3)', () => {
  const course: LightCourse = {
    from: { color: '#ffffff', brightness: 255 },
    to: { color: '#ff0000', brightness: 55 },
    minutes: 20,
  };
  const day: PadLight = { lamp: 'all', course };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    stopCourse();
    vi.useRealTimers();
  });

  it('sends the start to every lamp at once and runs on; its first command is the start', async () => {
    const s = sender();
    await startLight(day, lamps, s.send);
    expect(lightCommand(day)).toEqual({ point: course.from, transitionMs: 0 });
    expect(s.calls).toEqual([
      ['192.168.1.50', { point: course.from, transitionMs: 0 }],
      ['192.168.1.51', { point: course.from, transitionMs: 0 }],
    ]);
    expect(courseMinutesLeft.value).toBe(20);
    vi.advanceTimersByTime(10_000);
    expect(s.calls).toHaveLength(4);
  });

  it('another light ends the course; a pad without light leaves it running', async () => {
    const s = sender();
    await startLight(day, lamps, s.send);
    await startPadLight(withLight(), lamps, s.send);
    expect(courseMinutesLeft.value).toBe(20);
    await startLight({ lamp: 'all', preset: 3 }, lamps, s.send);
    expect(courseMinutesLeft.value).toBeNull();
    const count = s.calls.length;
    vi.advanceTimersByTime(60_000);
    expect(s.calls).toHaveLength(count);
  });

  it('no lamp to reach starts no course; TRY reaches the end light in 10 s', async () => {
    const s = sender();
    expect(await startLight({ lamp: 'gone', course }, lamps, s.send)).toEqual([]);
    expect(courseMinutesLeft.value).toBeNull();
    await startLight({ lamp: 'a', course }, lamps, s.send, COURSE_TRY_MS);
    vi.advanceTimersByTime(COURSE_TRY_MS);
    expect(s.calls.at(-1)).toEqual(['192.168.1.50', expect.objectContaining({ point: course.to })]);
    expect(courseMinutesLeft.value).toBeNull();
  });
});

describe('a short light and the base it returns to (light.md K3)', () => {
  const course: LightCourse = {
    from: { color: '#ffffff', brightness: 255 },
    to: { color: '#ff0000', brightness: 55 },
    minutes: 20,
  };
  const flash: PadLight = { lamp: 'a', effect: { ...EFFECT_DEFAULT, fx: 57 }, short: true };
  const thunder = { ...withLight(flash), id: 'thunder' };
  const MIN = 60_000;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    stopCourse();
    vi.useRealTimers();
  });

  it('holds a running course; when its pad stops, the course goes on from where it got to', async () => {
    const s = sender();
    await startLight({ lamp: 'a', course }, lamps, s.send);
    vi.advanceTimersByTime(5 * MIN);
    await startPadLight(thunder, lamps, s.send);
    expect(s.calls.at(-1)).toEqual(['192.168.1.50', lightCommand(flash)]);
    const during = s.calls.length;
    vi.advanceTimersByTime(MIN);
    expect(s.calls).toHaveLength(during); // the course sends nothing over the flash
    await endPadLight('thunder');
    expect(s.calls.at(-1)).toEqual([
      '192.168.1.50',
      // 6 of 20 minutes, t = 0.3: brightness 255 − 200 × 0.3, green and blue 255 × 0.7 ≈ 179
      { point: { color: '#ffb3b3', brightness: 195 }, transitionMs: 0 },
    ]);
    expect(courseMinutesLeft.value).toBe(14);
  });

  it('after a preset base the preset comes back; a course that ended meanwhile, its end light', async () => {
    const s = sender();
    await startLight({ lamp: 'a', preset: 4 }, lamps, s.send);
    await startPadLight(thunder, lamps, s.send);
    await endPadLight('thunder');
    expect(s.calls.at(-1)).toEqual(['192.168.1.50', { preset: 4 }]);

    await startLight({ lamp: 'a', course: { ...course, minutes: 1 } }, lamps, s.send);
    await startPadLight(thunder, lamps, s.send);
    vi.advanceTimersByTime(2 * MIN);
    await endPadLight('thunder');
    expect(s.calls.at(-1)).toEqual(['192.168.1.50', { point: course.to, transitionMs: 0 }]);
  });

  it("another pad's stop, or a short light another light followed, changes nothing", async () => {
    const s = sender();
    await startLight({ lamp: 'a', preset: 4 }, lamps, s.send);
    await startPadLight(thunder, lamps, s.send);
    const count = s.calls.length;
    expect(await endPadLight('rain')).toEqual([]);
    await startLight({ lamp: 'a', preset: 9 }, lamps, s.send);
    expect(await endPadLight('thunder')).toEqual([]);
    expect(s.calls).toHaveLength(count + 1); // only the preset 9
  });

  it('a course marked short is still a course: it becomes the base', async () => {
    const s = sender();
    await startPadLight(
      { ...withLight({ lamp: 'a', course, short: true }), id: 'day' },
      lamps,
      s.send,
    );
    expect(courseMinutesLeft.value).toBe(20);
    expect(await endPadLight('day')).toEqual([]);
    expect(courseMinutesLeft.value).toBe(20);
  });
});
