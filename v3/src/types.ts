// ─────────────────────────────────────────────────────────────────────────────
// V3.0 Shared TypeScript Types
// Source of truth: V3_CONCEPT_BRIEF.md §4.1
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

export type Board = {
  id: string;
  name: string;
  themeId: string;
  settings: {
    quickAccessLayout: 'tabs' | 'stack' | 'hidden';
    quickAccessSetCount: number; // default 1
  };
  decks: Deck[];
  sets: PadSet[];
};

export type Deck = {
  id: string;
  name: string;
  order: number;
  gridConfig: {
    cols: number;
    rows: number;
    gap: number;
    padSize: string;
  };
  pads: Pad[];
};

/**
 * A named quick-access collection of Pads.
 * Named "PadSet" (not "Set") to avoid collision with TypeScript built-in Set<T>.
 */
export type PadSet = {
  id: string;
  name: string;
  order: number;
  pads: Pad[];
};

export type PadType = 'single' | 'loop' | 'playlist' | 'combo';

export type PadPosition = {
  col: number; // 0-indexed, 0..cols-1
  row: number; // 0-indexed, 0..rows-1
};

/** Fields shared by every pad type. */
export type PadBase = {
  id: string;
  name: string;
  /** Grid position; null = unplaced (Slice 8+). Slice 3 always assigns a real position. */
  position: PadPosition | null;
  hotkey?: string;
  iconRef?: string;
  color?: string;
  volume: number; // 0–100
  fadeIn: number; // seconds
  fadeOut: number; // seconds
};

/** One step in a combo sequence. */
export type ComboStep = {
  /** UUIDs of pads on the same board to trigger simultaneously. */
  padIds: string[];
  /** How long to wait before advancing to the next step (seconds). */
  duration?: number;
  /** Special directive: stop all currently playing pads first. */
  stopAll?: boolean;
  /** Special directive: fade all pads out over this duration (seconds). */
  fadeOutAll?: number;
};

/** One-shot playback. libraryItemRef points to a single audio file (hash). */
export type SinglePad = PadBase & {
  type: 'single';
  libraryItemRef?: string; // optional: pad may have no source yet
  trimStart?: number;
  trimEnd?: number;
};

/** Infinite-loop playback. libraryItemRef points to a single audio file (hash). */
export type LoopPad = PadBase & {
  type: 'loop';
  libraryItemRef?: string; // optional: pad may have no source yet
  trimStart?: number;
  trimEnd?: number;
};

/** Sequential playlist. files is an ordered list of library item hashes. */
export type PlaylistPad = PadBase & {
  type: 'playlist';
  files: string[]; // ordered list of hashes; may be empty
  shuffle?: boolean;
};

/** Combo sequence: a chain of steps, each triggering one or more pads. */
export type ComboPad = PadBase & {
  type: 'combo';
  steps: ComboStep[]; // may be empty
};

/** Discriminated union of all pad types. Use type guards to narrow. */
export type Pad = SinglePad | LoopPad | PlaylistPad | ComboPad;

// Type guards — prefer these over inline `pad.type === 'x'` comparisons.
export const isSinglePad = (p: Pad): p is SinglePad => p.type === 'single';
export const isLoopPad = (p: Pad): p is LoopPad => p.type === 'loop';
export const isPlaylistPad = (p: Pad): p is PlaylistPad => p.type === 'playlist';
export const isComboPad = (p: Pad): p is ComboPad => p.type === 'combo';

export type LibraryItemType = 'audio' | 'icon' | 'image';

/**
 * LibraryItemMeta — safe working-memory type.
 * Stored in Preact Signals state. Never contains raw audio data.
 * The `id` field IS the SHA-256 hash of the file's raw bytes — no separate UUID.
 */
export type LibraryItemMeta = {
  id: string; // SHA-256 hash of the raw file bytes — IS the identity; no separate UUID
  type: LibraryItemType;
  name: string;
  size: number; // bytes
  tags: string[];
  addedAt: number; // ms since epoch
  duration: number; // seconds (0 for non-audio types)
  peaks: number[]; // 30 peak values [0–1], computed once at upload time
};

/**
 * LibraryItem — full entry as persisted in IndexedDB.
 * NEVER stored in component state, working arrays, or Preact Signals.
 * Retrieve via libGet(id) only when audio playback is needed (Slice 4+).
 */
export type LibraryItem = LibraryItemMeta & {
  blob: Blob; // raw audio — only lives in IDB, never in working memory
};

/**
 * Result of a batch upload operation.
 */
export type UploadResult = {
  imported: number;
  skipped: number;
  errors: string[]; // per-file error messages, e.g. "thunder.wav: decode failed"
};

// ---------------------------------------------------------------------------
// App state shape
//
// The canonical runtime store lives in src/state/store.ts as Preact Signals.
// This interface documents the complete shape for type safety.
// ---------------------------------------------------------------------------

export type AppMode = 'play' | 'edit';

export type AudioContextState = 'locked' | 'running' | 'suspended';

export interface AppState {
  currentBoardId: string | null;
  currentDeckId: string | null;
  currentMode: AppMode;
  activeTheme: string;
  activeSetIds: string[];
  /** IDs of pads currently in one-shot playback */
  playingPads: ReadonlySet<string>;
  /** IDs of pads currently looping */
  loopingPads: ReadonlySet<string>;
  masterVolume: number; // 0–100
}
