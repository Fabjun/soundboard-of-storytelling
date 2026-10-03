/**
 * @fileoverview Audio Facade — public API + Signal bridge
 *
 * Phase 3 of Slice 4. All audio interactions go through this module;
 * engine.ts internals are never imported directly from components.
 */

import type { LoopPad, Pad, PadFile, SinglePad } from '../types';
import type { EnginePad } from './types';
import {
  playOnce,
  playLoop,
  playPlaylist,
  playCombo,
  stopPad,
  stopAllInternal,
  fadeOutAllInternal,
  isPlayingInternal,
  configureCallbacks,
} from './engine';
import {
  boards,
  addPlayingPad,
  removePlayingPad,
  addLoopingPad,
  removeLoopingPad,
  previewPlaying,
} from '../state/store';

/** The engine id the PAD editor's preview plays under — never a pad id (nanoid has no "_"). */
export const PREVIEW_ID = '__preview__';

// ── Signal bridge (call once at app boot in main.tsx) ─────────────────────────

/**
 * Wires the audio engine's pad-started/stopped events to Preact Signal setters.
 * Must be called once before the first play().
 */
export function initAudioBridge(): void {
  configureCallbacks({
    onPadStarted: (id, isLoop) => {
      // The PAD editor's preview is no pad playing: no glow, no "last played"
      if (id === PREVIEW_ID) {
        previewPlaying.value = true;
        return;
      }
      addPlayingPad(id);
      // A Loop with several files plays as the engine's playlist, which reports isLoop = false:
      // the glow follows the pad type (owner decision 2026-10-02, PR #36).
      if (isLoop || findPad(id)?.type === 'loop') addLoopingPad(id);
    },
    onPadStopped: (id) => {
      if (id === PREVIEW_ID) {
        previewPlaying.value = false;
        return;
      }
      removePlayingPad(id);
      removeLoopingPad(id);
    },
    // Combo steps reference pads of the board's pool (ADR-0048) — looked up and mapped to the
    // engine's shapes; the engine itself is unchanged.
    getPad: (id) => {
      const pad = findPad(id);
      return pad ? toEnginePad(pad) : null;
    },
  });
}

/** The app pad with this id — pads live in the boards' pools (ADR-0048). */
function findPad(id: string): Pad | null {
  for (const board of boards.value) {
    const pad = board.pads.find((p) => p.id === id);
    if (pad) return pad;
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export { initAudio } from './engine';

// ── App pads → engine shapes (ADR-0048) ─────────────────────────────────────

/** The trim of a file as the engine's one-file shapes take it — nothing for no file. */
function trimOf(file: PadFile | undefined): { trimStart?: number; trimEnd?: number } {
  return { trimStart: file?.trimStart, trimEnd: file?.trimEnd };
}

/** Next file index per Single pad with `sequential` order ("the next one in turn"). */
const singleTurn = new Map<string, number>();

/** The file a Single pad plays on this trigger, with its trim: the next in turn, or a random one. */
function pickSingleFile(pad: SinglePad): PadFile | undefined {
  if (pad.files.length === 0) return undefined;
  if (pad.order === 'shuffle') return pad.files[Math.floor(Math.random() * pad.files.length)];
  const i = (singleTurn.get(pad.id) ?? 0) % pad.files.length;
  singleTurn.set(pad.id, i + 1);
  return pad.files[i];
}

/**
 * Maps an app pad (ADR-0048: Single / Loop with `files` + `order`) to the shape V1's engine
 * plays: Single → one file per trigger; Loop with one file → seamless loop; Loop with several
 * files → the engine's playlist (repeats the list alone; plays it once inside a combo). Each file
 * plays within its own trim (ADR-0068).
 */
export function toEnginePad(pad: Pad): EnginePad {
  switch (pad.type) {
    case 'single': {
      const { files: _files, order: _order, ...rest } = pad;
      const file = pickSingleFile(pad);
      return { ...rest, ...trimOf(file), libraryItemRef: file?.hash };
    }
    case 'loop': {
      const { files, order, ...rest } = pad;
      if (files.length <= 1)
        return { ...rest, ...trimOf(files[0]), libraryItemRef: files[0]?.hash };
      return { ...rest, type: 'playlist', files, shuffle: order === 'shuffle', loop: true };
    }
    case 'combo':
      return pad;
  }
}

/**
 * Plays a pad the way its type says: a Single once (the next or a random file), a Loop until it
 * is stopped (several files one after another), a Combo step by step. `padId` names the playing
 * instance for `stop` and the playing signals.
 */
export async function play(padId: string, pad: Pad): Promise<void> {
  const enginePad = toEnginePad(pad);
  switch (enginePad.type) {
    case 'single':
      return playOnce(padId, enginePad);
    case 'loop':
      return playLoop(padId, enginePad);
    case 'playlist':
      playPlaylist(padId, enginePad);
      return;
    case 'combo':
      playCombo(padId, enginePad);
      return;
  }
}

/**
 * Stops a pad, fading it out over `fadeOut` seconds (callers pass the pad's own fade-out);
 * `immediate` cuts it off regardless. A running combo stops at once.
 */
export function stop(padId: string, immediate = false, fadeOut = 0): void {
  stopPad(padId, immediate, fadeOut);
}

/**
 * Stops everything that plays, at once.
 *
 * @reserved Slice 12 — STOP ALL, K9 / K16 (docs/product/README.md#input-keyboard--numpad)
 */
export function stopAll(): void {
  stopAllInternal();
}

/**
 * Fades everything that plays out over `duration` seconds; running combos stop at once.
 *
 * @reserved Slice 12 — STOP ALL in two stages, the first fades, K16 (docs/product/README.md#input-keyboard--numpad)
 */
export function fadeOutAll(duration: number): void {
  fadeOutAllInternal(duration);
}

/** Tells whether the pad is playing now. */
export function isPlaying(padId: string): boolean {
  return isPlayingInternal(padId);
}

// ── Preview (PAD editor, Slice 15a) ──────────────────────────────────────────

/**
 * Plays one `file` of the pad the way the pad plays it — with the pad's volume and fades, from the
 * file's trim start to its trim end (ADR-0068); a Loop repeats the region. The preview may start
 * later, at `from` (a tap into the waveform), and then starts at full volume; a Loop still repeats
 * its whole region afterwards. Restarts a preview that runs; it plays under `PREVIEW_ID`.
 */
export function previewFile(pad: SinglePad | LoopPad, file: PadFile, from: number): Promise<void> {
  stopPad(PREVIEW_ID, true);
  const trimStart = file.trimStart ?? 0;
  const start = Math.max(from, trimStart);
  const { files: _files, order: _order, ...rest } = pad;
  const shared = {
    ...rest,
    id: PREVIEW_ID,
    libraryItemRef: file.hash,
    trimEnd: file.trimEnd,
    fadeIn: start > trimStart ? 0 : pad.fadeIn,
  };
  if (rest.type === 'loop') {
    return playLoop(PREVIEW_ID, { ...shared, type: 'loop', trimStart, startAt: start });
  }
  return playOnce(PREVIEW_ID, { ...shared, type: 'single', trimStart: start });
}

/** Stops the preview at once (nothing happens when none runs). */
export function stopPreview(): void {
  stopPad(PREVIEW_ID, true);
}

/**
 * Stops `from` and starts `to` — a stub, not yet a crossfade (built in Slice 4, nothing calls it
 * yet). Signature uses Pad object (not just ID) — consistent with play().
 *
 * @reserved Parked — crossfade between pads (docs/product/README.md#pad-options)
 */
export function crossfade(from: string, to: Pad, _duration: number): void {
  stopPad(from, true);
  play(to.id, to);
}
