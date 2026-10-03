/**
 * @fileoverview Audio Facade — public API + Signal bridge
 *
 * Phase 3 of Slice 4. All audio interactions go through this module;
 * engine.ts internals are never imported directly from components.
 */

import type { Pad, SinglePad } from '../types';
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
} from '../state/store';

// ── Signal bridge (call once at app boot in main.tsx) ─────────────────────────

/**
 * Wires the audio engine's pad-started/stopped events to Preact Signal setters.
 * Must be called once before the first play().
 */
export function initAudioBridge(): void {
  configureCallbacks({
    onPadStarted: (id, isLoop) => {
      addPlayingPad(id);
      // A Loop with several files plays as the engine's playlist, which reports isLoop = false:
      // the glow follows the pad type (owner decision 2026-10-02, PR #36).
      if (isLoop || findPad(id)?.type === 'loop') addLoopingPad(id);
    },
    onPadStopped: (id) => {
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

/** Next file index per Single pad with `sequential` order ("the next one in turn"). */
const singleTurn = new Map<string, number>();

/** The file a Single pad plays on this trigger: the next in turn, or a random one. */
function pickSingleFile(pad: SinglePad): string | undefined {
  if (pad.files.length === 0) return undefined;
  if (pad.order === 'shuffle') return pad.files[Math.floor(Math.random() * pad.files.length)];
  const i = (singleTurn.get(pad.id) ?? 0) % pad.files.length;
  singleTurn.set(pad.id, i + 1);
  return pad.files[i];
}

/**
 * Maps an app pad (ADR-0048: Single / Loop with `files` + `order`) to the shape V1's engine
 * plays: Single → one file per trigger; Loop with one file → seamless loop; Loop with several
 * files → the engine's playlist (repeats the list alone; plays it once inside a combo).
 */
export function toEnginePad(pad: Pad): EnginePad {
  switch (pad.type) {
    case 'single': {
      const { files: _files, order: _order, ...rest } = pad;
      return { ...rest, libraryItemRef: pickSingleFile(pad) };
    }
    case 'loop': {
      const { files, order, trimStart, trimEnd, ...rest } = pad;
      if (files.length <= 1) return { ...rest, libraryItemRef: files[0], trimStart, trimEnd };
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

/** Stops everything that plays, at once. */
export function stopAll(): void {
  stopAllInternal();
}

/** Fades everything that plays out over `duration` seconds; running combos stop at once. */
export function fadeOutAll(duration: number): void {
  fadeOutAllInternal(duration);
}

/** Tells whether the pad is playing now. */
export function isPlaying(padId: string): boolean {
  return isPlayingInternal(padId);
}

/**
 * Crossfade stub (Slice 4): stops `from` and starts `to`.
 * Simultaneous audio crossfade is a future feature (Slice 8+).
 * Signature uses Pad object (not just ID) — consistent with play().
 */
export function crossfade(from: string, to: Pad, _duration: number): void {
  stopPad(from, true);
  play(to.id, to);
}
