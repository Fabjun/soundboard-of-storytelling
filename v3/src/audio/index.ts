// ─────────────────────────────────────────────────────────────────────────────
// Audio Facade — public API + Signal bridge
//
// Phase 3 of Slice 4. All audio interactions go through this module;
// engine.ts internals are never imported directly from components.
// ─────────────────────────────────────────────────────────────────────────────

import type { Pad } from '../types';
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
 * Wire the audio engine's pad-started/stopped events to Preact Signal setters.
 * Must be called once before the first play().
 */
export function initAudioBridge(): void {
  configureCallbacks({
    onPadStarted: (id, isLoop) => {
      addPlayingPad(id);
      if (isLoop) addLoopingPad(id);
    },
    onPadStopped: (id) => {
      removePlayingPad(id);
      removeLoopingPad(id);
    },
    // Combo steps reference pads of the board's pool (ADR-0048) — lookup only, engine unchanged.
    getPad: (id) => {
      for (const board of boards.value) {
        const pad = board.pads.find((p) => p.id === id);
        if (pad) return pad;
      }
      return null;
    },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export { initAudio } from './engine';

export async function play(padId: string, pad: Pad): Promise<void> {
  switch (pad.type) {
    case 'single':
      return playOnce(padId, pad);
    case 'loop':
      return playLoop(padId, pad);
    case 'playlist':
      playPlaylist(padId, pad);
      return;
    case 'combo':
      playCombo(padId, pad);
      return;
  }
}

export function stop(padId: string, immediate = false, fadeOut = 0): void {
  stopPad(padId, immediate, fadeOut);
}

export function stopAll(): void {
  stopAllInternal();
}

export function fadeOutAll(duration: number): void {
  fadeOutAllInternal(duration);
}

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
