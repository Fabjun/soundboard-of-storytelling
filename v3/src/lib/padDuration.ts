/**
 * @fileoverview padDuration — how long a pad plays, as the pad shows it (owner decision 2026-10-11)
 *
 * Soundboards show a sound's running time on its tile (Farrago: the duration, and elapsed or
 * remaining time while it plays). A pad shows it from the medium size on, after the name and the
 * icon in importance. Each file counts with its trim (src/lib/trimRange.ts, the PAD editor's
 * rules). A Single with several files plays one per trigger — it shows the shortest and the
 * longest; a Loop plays its files one after another — it shows one pass and how often it runs
 * (∞ until stopped, ×N for a repeat count, ADR-0069). A Combo shows nothing: its steps, waits and
 * loops have no single length.
 */

import type { Pad, PadFile } from '../types';
import { fromPad } from './trimRange';
import { formatDuration } from './upload';

/** Returns how long `file` plays — its trimmed region of `duration` seconds; null when unknown. */
export function fileSeconds(file: PadFile, duration: number | undefined): number | null {
  if (!duration || duration <= 0) return null;
  const v = fromPad({ ...file, fadeIn: 0, fadeOut: 0 }, duration);
  return v.trimEnd - v.trimStart;
}

/** Shows seconds as m:ss, rounded up — a short sound never reads 0:00. */
const show = (s: number): string => formatDuration(Math.ceil(s));

/**
 * Returns the running time the pad shows, or null (a Combo, or no file with a known length).
 * `durationOf` gives a library file's length in seconds by its hash.
 */
export function padDurationText(
  pad: Pad,
  durationOf: (hash: string) => number | undefined,
): string | null {
  if (pad.type === 'combo') return null;
  const lengths = pad.files
    .map((f) => fileSeconds(f, durationOf(f.hash)))
    .filter((s): s is number => s !== null);
  if (lengths.length === 0) return null;
  if (pad.type === 'loop') {
    const pass = show(lengths.reduce((a, b) => a + b, 0));
    return pad.repeat ? `${pass} ×${pad.repeat}` : `${pass} ∞`;
  }
  const lo = show(Math.min(...lengths));
  const hi = show(Math.max(...lengths));
  return lo === hi ? lo : `${lo}–${hi}`;
}
