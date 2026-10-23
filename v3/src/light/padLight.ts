/**
 * @fileoverview light — starts a pad's light next to its sound (docs/product/features/light.md
 * C1–C6, ADR-0091)
 *
 * The audio bridge calls `startPadLight` for every pad that starts — also each pad a combo step
 * plays (C4) — so the light needs no change in the audio engine. Fire and forget: nothing awaits
 * the lamp (G2), a lamp that does not answer marks `lightTrouble`, and the next pad tries again (C6).
 */

import { signal } from '@preact/signals';
import type { Pad, PadLight } from '../types';
import { getLamps, type Lamp } from '../state/prefs';
import { sendLight, type LightCommand, type LightResult } from './wled';

/** True while the last light command reached no lamp — the status bar shows it (C6). */
export const lightTrouble = signal(false);

/** The command a pad's light sends: its preset, or off. */
export function lightCommand(light: PadLight): LightCommand {
  return 'off' in light ? { off: true } : { preset: light.preset };
}

/** The lamps a pad's light goes to: all of them, or the one it names (none when that is gone). */
export function lampsFor(light: PadLight, lamps: readonly Lamp[]): Lamp[] {
  return light.lamp === 'all' ? [...lamps] : lamps.filter((l) => l.id === light.lamp);
}

/**
 * Sends the pad's light to its lamps, if it has one, and returns at once; resolves the results for
 * tests. Never throws, never waits on the sound path.
 */
export function startPadLight(
  pad: Pad | null,
  lamps: readonly Lamp[] = getLamps(),
  send: (address: string, command: LightCommand) => Promise<LightResult> = sendLight,
): Promise<LightResult[]> {
  if (!pad?.light) return Promise.resolve([]);
  const command = lightCommand(pad.light);
  const calls = lampsFor(pad.light, lamps).map((l) => send(l.address, command));
  const done = Promise.all(calls).then((results) => {
    lightTrouble.value = results.some((r) => r.kind !== 'ok');
    return results;
  });
  return done;
}
