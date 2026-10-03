/**
 * @fileoverview Trim range — the rules behind the PAD editor's trim and fade handles (Slice 15a)
 *
 * The editor works on four handles on the timeline of one file, in seconds: trim start, trim end,
 * the end of the fade-in and the start of the fade-out. Every change goes through `moveHandle`,
 * which keeps the rules: start before end with at least `MIN_REGION` between them, fades inside
 * the trimmed region and not longer than `MAX_FADE` (the fade sliders' range), fade-in and
 * fade-out not overlapping. Keyboard steps follow the WAI-ARIA slider pattern (arrows, Page
 * Up / Down, Home / End). The pad stores `trimEnd` only when it ends before the file does.
 */

/** Smallest trimmed region, in seconds. */
export const MIN_REGION = 0.1;
/** Longest fade, in seconds — the range of the fade sliders. */
export const MAX_FADE = 10;
/** One arrow key step, in seconds. */
export const STEP = 0.1;
/** One Page Up / Page Down step, in seconds. */
export const PAGE_STEP = 1;

/** The four handles on the timeline. */
export type Handle = 'trimStart' | 'trimEnd' | 'fadeIn' | 'fadeOut';

/** The editor's values: the trimmed region (end always set) and the fade lengths, in seconds. */
export interface TrimValues {
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
}

const round = (s: number): number => Math.round(s * 100) / 100;
const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/**
 * Returns the editor's values for a pad: a stored `trimEnd` of 0, missing or not after the start
 * means "to the end of the file"; values outside the file are pulled in.
 */
export function fromPad(
  pad: { trimStart?: number; trimEnd?: number; fadeIn: number; fadeOut: number },
  duration: number,
): TrimValues {
  const trimStart = clamp(pad.trimStart ?? 0, 0, Math.max(0, duration - MIN_REGION));
  const end = pad.trimEnd && pad.trimEnd > trimStart ? pad.trimEnd : duration;
  const v = {
    trimStart,
    trimEnd: clamp(end, trimStart + MIN_REGION, duration),
    fadeIn: 0,
    fadeOut: 0,
  };
  return fitFades({ ...v, fadeIn: pad.fadeIn, fadeOut: pad.fadeOut });
}

/** Returns the pad's fields for the values: `trimEnd` undefined when it is the end of the file. */
export function toPad(
  v: TrimValues,
  duration: number,
): { trimStart?: number; trimEnd?: number; fadeIn: number; fadeOut: number } {
  return {
    trimStart: v.trimStart > 0 ? v.trimStart : undefined,
    trimEnd: v.trimEnd < duration ? v.trimEnd : undefined,
    fadeIn: v.fadeIn,
    fadeOut: v.fadeOut,
  };
}

/** Returns where a handle sits on the timeline, in seconds. */
export function handlePosition(v: TrimValues, handle: Handle): number {
  switch (handle) {
    case 'trimStart':
      return v.trimStart;
    case 'trimEnd':
      return v.trimEnd;
    case 'fadeIn':
      return round(v.trimStart + v.fadeIn);
    case 'fadeOut':
      return round(v.trimEnd - v.fadeOut);
  }
}

/** Returns the lowest and highest position a handle may take now, in seconds. */
export function handleRange(v: TrimValues, handle: Handle, duration: number): [number, number] {
  switch (handle) {
    case 'trimStart':
      return [0, round(v.trimEnd - MIN_REGION)];
    case 'trimEnd':
      return [round(v.trimStart + MIN_REGION), duration];
    case 'fadeIn':
      return [
        v.trimStart,
        round(v.trimStart + Math.min(MAX_FADE, v.trimEnd - v.trimStart - v.fadeOut)),
      ];
    case 'fadeOut':
      return [round(v.trimEnd - Math.min(MAX_FADE, v.trimEnd - v.trimStart - v.fadeIn)), v.trimEnd];
  }
}

/** Shrinks the fades so they fit the region, fade-in first, without overlapping. */
function fitFades(v: TrimValues): TrimValues {
  const length = v.trimEnd - v.trimStart;
  const fadeIn = round(clamp(v.fadeIn, 0, Math.min(MAX_FADE, length)));
  const fadeOut = round(clamp(v.fadeOut, 0, Math.min(MAX_FADE, length - fadeIn)));
  return { ...v, fadeIn, fadeOut };
}

/**
 * Returns the values after one handle is moved to `position` seconds, every rule kept: the
 * position is pulled into the handle's range, and fades shrink when the region does.
 */
export function moveHandle(
  v: TrimValues,
  handle: Handle,
  position: number,
  duration: number,
): TrimValues {
  const [lo, hi] = handleRange(v, handle, duration);
  const p = round(clamp(position, lo, hi));
  switch (handle) {
    case 'trimStart':
      return fitFades({ ...v, trimStart: p });
    case 'trimEnd':
      return fitFades({ ...v, trimEnd: p });
    case 'fadeIn':
      return { ...v, fadeIn: round(p - v.trimStart) };
    case 'fadeOut':
      return { ...v, fadeOut: round(v.trimEnd - p) };
  }
}

/**
 * Returns the position a key moves a handle to, or null for a key the slider does not handle
 * (WAI-ARIA slider pattern: arrows ±`STEP`, Page Up / Down ±`PAGE_STEP`, Home / End to its range).
 */
export function keyTarget(
  v: TrimValues,
  handle: Handle,
  key: string,
  duration: number,
): number | null {
  const [lo, hi] = handleRange(v, handle, duration);
  return stepTarget(handlePosition(v, handle), lo, hi, key);
}

/**
 * Returns where a key moves a slider at `at` with the range `lo`–`hi`, or null for a key the
 * slider does not handle — the WAI-ARIA slider keys, shared by the handles and the playback
 * position (APG Media Seek Slider).
 */
export function stepTarget(at: number, lo: number, hi: number, key: string): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return at + STEP;
    case 'ArrowLeft':
    case 'ArrowDown':
      return at - STEP;
    case 'PageUp':
      return at + PAGE_STEP;
    case 'PageDown':
      return at - PAGE_STEP;
    case 'Home':
      return lo;
    case 'End':
      return hi;
    default:
      return null;
  }
}
