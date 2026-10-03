/**
 * @fileoverview Preview — the PAD editor's ▶ / ⏸ / ⏹ and the position of its playhead (Slice 15a)
 *
 * The preview plays through the audio facade (`previewFile`), which uses the engine unchanged
 * under its own id: it is no pad playing — no glow, no "last played" (`previewPlaying` in the
 * store tells whether it runs). The engine does not report a position, so this module remembers
 * when and where the preview started and derives the playhead from the clock: a Single runs from
 * its start to its trim end, a Loop wraps within its trimmed region.
 */

import { previewFile, stopPreview as stopEnginePreview } from '../audio/index';
import { previewPlaying } from '../state/store';
import type { LoopPad, PadFile, SinglePad } from '../types';

/** One preview run: what plays, from where, since when, and the region it may cover. */
export interface PreviewRun {
  /** Second of the file the run started at. */
  from: number;
  /** Clock time (ms) when it started. */
  startedAt: number;
  /** Trimmed region of the file, in seconds. */
  regionStart: number;
  regionEnd: number;
  loop: boolean;
}

let run: PreviewRun | null = null;

/**
 * Returns the playhead of a run at clock time `nowMs`, in seconds of the file: a Single stops at
 * its region end, a Loop wraps back to its region start.
 */
export function positionAt(r: PreviewRun, nowMs: number): number {
  const at = r.from + Math.max(0, nowMs - r.startedAt) / 1000;
  if (!r.loop) return Math.min(at, r.regionEnd);
  const length = r.regionEnd - r.regionStart;
  if (length <= 0 || at < r.regionEnd) return at;
  return r.regionStart + ((at - r.regionStart) % length);
}

/**
 * Starts the preview of one `file` of `pad` as the pad would play it, from `from` seconds (not
 * before the file's trim start, ADR-0068). `regionEnd` is the trim end — the file's duration when
 * it is not trimmed. Resolves once the engine has started it — or could not (file missing or
 * undecodable: `previewPlaying` stays false). The clock restarts then, as loading the file takes
 * time the playhead must not count.
 */
export function startPreview(
  pad: SinglePad | LoopPad,
  file: PadFile,
  from: number,
  regionEnd: number,
  now: () => number = () => performance.now(),
): Promise<void> {
  const regionStart = file.trimStart ?? 0;
  const loop = pad.type === 'loop';
  const started: PreviewRun = {
    from: Math.min(Math.max(from, regionStart), regionEnd),
    startedAt: now(),
    regionStart,
    regionEnd,
    loop,
  };
  run = started;
  return previewFile(pad, file, from).then(() => {
    started.startedAt = now();
  });
}

/** Stops the preview; nothing happens when none runs. */
export function stopPreview(): void {
  run = null;
  stopEnginePreview();
}

/** Returns the playhead in seconds of the file, or null while no preview plays. */
export function previewPosition(now: () => number = () => performance.now()): number | null {
  return run && previewPlaying.value ? positionAt(run, now()) : null;
}
