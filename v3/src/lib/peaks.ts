/**
 * @fileoverview Waveform peaks — the stored resolution and the coarse view of it (ADR-0065)
 *
 * A library entry stores `PEAK_COUNT` peaks, computed once when the file is added — the
 * industry practice of pre-computing waveform data at ingest (BBC audiowaveform). The PAD
 * editor draws all of them; lists draw `LIST_BARS` bars, derived here. Entries stored before
 * ADR-0065 have 30 peaks and get fine ones the first time the editor needs them
 * (`ensureFinePeaks` in upload.ts).
 */

/** Peaks a library entry stores: fine enough to trim by eye in the PAD editor. */
export const PEAK_COUNT = 256;

/** Bars of the small waveform in lists (library rows, pad creation). */
export const LIST_BARS = 30;

/** Tells whether stored peaks are too coarse for the PAD editor (stored before ADR-0065). */
export function needsFinePeaks(peaks: readonly number[]): boolean {
  return peaks.length < PEAK_COUNT;
}

/**
 * Returns `bars` values from `peaks`, each the highest peak of its share — a coarser view of the
 * same audio. Peaks no longer than `bars` are returned unchanged.
 */
export function downsamplePeaks(peaks: readonly number[], bars: number): number[] {
  if (peaks.length <= bars) return [...peaks];
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const from = Math.floor((i * peaks.length) / bars);
    const to = Math.floor(((i + 1) * peaks.length) / bars);
    let max = 0;
    for (let j = from; j < to; j++) max = Math.max(max, peaks[j]);
    out.push(max);
  }
  return out;
}
