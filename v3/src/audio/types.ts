// ─────────────────────────────────────────────────────────────────────────────
// Audio engine — internal types
// ─────────────────────────────────────────────────────────────────────────────

import type { ComboPad, PadBase } from '../types';

// ── Pad shapes the engine plays (V1's model) ─────────────────────────────────
// The engine is V1 code and stays unchanged (CLAUDE.md, ADR-0048 engine rule). The app's
// model (Single / Loop with `files` + `order`, ADR-0048) is mapped to these shapes by
// toEnginePad() in index.ts — the engine never sees the app's pad types.

/** One file, played once. */
export type EngineSinglePad = PadBase & {
  type: 'single';
  libraryItemRef?: string;
  trimStart?: number;
  trimEnd?: number;
};

/** One file, repeated seamlessly. */
export type EngineLoopPad = PadBase & {
  type: 'loop';
  libraryItemRef?: string;
  trimStart?: number;
  trimEnd?: number;
};

/** Several files one after another (alone: repeats the list; in a combo: plays it once). */
export type EnginePlaylistPad = PadBase & {
  type: 'playlist';
  files: string[];
  shuffle?: boolean;
  /**
   * The list repeats until stopped — a Loop with several files (ADR-0048). In a combo such a
   * child runs in the background like a one-file loop (owner decision 2026-10-02, PR #36).
   */
  loop?: boolean;
};

export type EnginePad = EngineSinglePad | EngineLoopPad | EnginePlaylistPad | ComboPad;

/** Callbacks wired by index.ts to connect engine events to Preact Signals. */
export type AudioCallbacks = {
  onPadStarted: (id: string, isLoop: boolean) => void;
  onPadStopped: (id: string) => void;
  /** Resolves a pad by ID — required for combo step execution. */
  getPad: (id: string) => EnginePad | null;
};

/**
 * A self-contained playable handle produced by createPadInstance().
 * Used exclusively inside the combo sequencer.
 */
export type PadInstance = {
  start: (onEnded: (() => void) | null) => void;
  stop: () => void;
};

/** Per-combo runtime state stored in comboState[padId]. */
export type ComboRuntimeState = {
  stopped: boolean;
  bgInstances: PadInstance[];
  currentFgInstances: PadInstance[];
  onFinish: (() => void) | null;
  pauseTimer?: ReturnType<typeof setTimeout>;
  /** Reference to the ComboPad for cleanup: iterate steps to stop nested combos. */
  pad: ComboPad;
};
