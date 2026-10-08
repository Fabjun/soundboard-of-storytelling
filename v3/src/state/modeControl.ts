/**
 * @fileoverview modeControl — switching GAME / SETUP and the Lock (Slice 12c)
 *
 * docs/product/README.md#switching-modes and #lock (owner decisions 2026-09-28):
 *   - switching modes stops every playing sound — at once (provisional detail 2026-10-08, review
 *     pending: SETUP must be silent before PREVIEW can be used, and the switch is deliberate —
 *     the Lock guards against an accidental one);
 *   - the Lock is a separate toggle in GAME; while on, the mode cannot leave GAME; off by default
 *     and after every reload (`modeLocked` lives in memory only).
 */

import type { AppMode } from '../types';
import { currentMode, modeLocked } from './store';
import { stopAllNow } from './stopControl';

/**
 * Switches to `mode`, stopping every sound first. Does nothing for the mode already shown or
 * while the Lock is on; returns whether it switched.
 */
export function switchMode(
  mode: AppMode,
  stopEverything: () => void = () => stopAllNow(),
): boolean {
  if (mode === currentMode.value || modeLocked.value) return false;
  stopEverything();
  currentMode.value = mode;
  return true;
}

/** Turns the Lock on or off — only in GAME, where it is shown. */
export function toggleModeLock(): void {
  if (currentMode.value !== 'play') return;
  modeLocked.value = !modeLocked.value;
}
