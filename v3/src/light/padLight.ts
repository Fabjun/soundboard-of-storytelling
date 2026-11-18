/**
 * @fileoverview light — starts a pad's light next to its sound (docs/product/features/light.md
 * C1–C6, ADR-0091)
 *
 * The audio bridge calls `startPadLight` for every pad that starts — also each pad a combo step
 * plays (C4) — so the light needs no change in the audio engine; a board's base light goes out
 * through `startLight` when the board switches to GAME. Fire and forget: nothing awaits the lamp
 * (G2), a lamp that does not answer marks `lightTrouble`, and the next light tries again (C6).
 * A course runs on in `v3/src/light/course.ts` (light.md K1); any other light a pad starts ends it,
 * as the light that follows replaces it (K3). Every light is the base, unless it is short: a short
 * light (a flash with the thunder) lasts while its pad's sound plays — the bridge calls
 * `endPadLight` when the pad stops — and then the base comes back, a course at the point it has
 * reached meanwhile (light.md K3, as a console's submaster restores the background state).
 */

import { signal } from '@preact/signals';
import type { Pad, PadLight } from '../types';
import { getLamps, type Lamp } from '../state/prefs';
import { sendLight, type LightCommand, type LightResult } from './wled';
import { holdCourse, releaseCourse, startCourse, stopCourse } from './course';

/** True while the last light command reached no lamp — the status bar shows it (C6). */
export const lightTrouble = signal(false);

/** How long TRY plays a course, in ms — its whole way, shortened. */
export const COURSE_TRY_MS = 10_000;

/** The command a pad's light sends first: its preset, its effect, a course's start, or off. */
export function lightCommand(light: PadLight): LightCommand {
  if ('off' in light) return { off: true };
  if ('effect' in light) return { effect: light.effect };
  if ('course' in light) return { point: light.course.from, transitionMs: 0 };
  return { preset: light.preset };
}

/** The lamps a pad's light goes to: all of them, or the one it names (none when that is gone). */
export function lampsFor(light: PadLight, lamps: readonly Lamp[]): Lamp[] {
  return light.lamp === 'all' ? [...lamps] : lamps.filter((l) => l.id === light.lamp);
}

/** Sends one command to one lamp — the WLED client, or a stand-in in tests. */
type Send = (address: string, command: LightCommand) => Promise<LightResult>;

/** The base light: the last light sent that is not short, with the lamps and the sender it used. */
let base: { light: PadLight; lamps: readonly Lamp[]; send: Send } | null = null;

/** The pad whose short light is on, or null. */
let shortOf: string | null = null;

/** Tells whether a light is short (K3) — a course never is: it is the base it replaces. */
const isShort = (light: PadLight): boolean => light.short === true && !('course' in light);

/**
 * Sends the pad's light to its lamps, if it has one, and returns at once; resolves the results for
 * tests. Never throws, never waits on the sound path. A short light holds a running course.
 */
export function startPadLight(
  pad: Pad | null,
  lamps: readonly Lamp[] = getLamps(),
  send: Send = sendLight,
): Promise<LightResult[]> {
  const light = pad?.light;
  if (!pad || !light || !isShort(light)) return startLight(light, lamps, send);
  shortOf = pad.id;
  holdCourse();
  return sendAll(lampsFor(light, lamps), lightCommand(light), send);
}

/**
 * Ends the short light of the pad `padId` when its sound stops: the base comes back — a running
 * course at the point it has reached, one that ended at its end light, any other light as it was.
 * Nothing when another light came since, or none was short. Resolves the results for tests.
 */
export function endPadLight(padId: string): Promise<LightResult[]> {
  if (shortOf !== padId) return Promise.resolve([]);
  shortOf = null;
  if (releaseCourse() || !base) return Promise.resolve([]);
  const { light, lamps, send } = base;
  const command: LightCommand =
    'course' in light ? { point: light.course.to, transitionMs: 0 } : lightCommand(light);
  return sendAll(lampsFor(light, lamps), command, send);
}

/** Sends `command` to every lamp of `targets` and marks or clears `lightTrouble` (C6). */
function sendAll(
  targets: readonly Lamp[],
  command: LightCommand,
  send: Send,
): Promise<LightResult[]> {
  return Promise.all(targets.map((l) => send(l.address, command))).then((results) => {
    lightTrouble.value = results.some((r) => r.kind !== 'ok');
    return results;
  });
}

/**
 * Sends a light — a pad's, or a board's base light — to its lamps and returns at once; nothing for
 * no light. A course starts there and runs on (`courseMs` shortens it, for TRY); any other light
 * ends a running course. The light becomes the base, and a short light that is on is over.
 * Resolves the results of the first call, for TRY and tests.
 */
export function startLight(
  light: PadLight | undefined,
  lamps: readonly Lamp[] = getLamps(),
  send: Send = sendLight,
  courseMs?: number,
): Promise<LightResult[]> {
  if (!light) return Promise.resolve([]);
  base = { light, lamps, send };
  shortOf = null;
  const targets = lampsFor(light, lamps);
  if (!('course' in light)) {
    stopCourse();
    return sendAll(targets, lightCommand(light), send);
  }
  if (targets.length === 0) return Promise.resolve([]);
  let first: Promise<LightResult[]> | null = null;
  startCourse(
    light.course,
    (point, transitionMs) => {
      const sent = sendAll(targets, { point, transitionMs }, send);
      first ??= sent; // the start, sent at once
    },
    courseMs,
  );
  return first ?? Promise.resolve([]);
}

/** Plays a light at once for TRY: a course over `COURSE_TRY_MS`, any other light as it is. */
export function tryLight(light: PadLight): Promise<LightResult[]> {
  return startLight(light, getLamps(), sendLight, COURSE_TRY_MS);
}
