// ─────────────────────────────────────────────────────────────────────────────
// V3.0 Shared TypeScript Types
// This file is the source of truth for the schema (docs/architecture/concept-brief.md#41--data-model);
// decisions: docs/architecture/0048-pad-pool-decks.md#1-data-model
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

export type Board = {
  id: string;
  name: string;
  themeId: string;
  /** Pad pool: every pad of the board, placed in any number of decks or in none (ADR-0048). */
  pads: Pad[];
  decks: Deck[];
  /** Board-wide quick-access bar (model since Slice 9c, UI in Slice 13). */
  quickAccess: QuickAccessEntry[];
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
  /** Which pads of the pool this deck shows, where, and with which key. */
  placements: Placement[];
};

/** A pad of the pool placed in a deck. Position and key belong to the placement, not the pad. */
export type Placement = {
  padId: string;
  position: PadPosition;
  hotkey?: string;
};

export type QuickAccessEntry = {
  padId: string;
  hotkey?: string;
};

export type PadType = Pad['type']; // single | loop | combo (Playlist merged into Loop, ADR-0048)

export type PadPosition = {
  col: number; // 0-indexed, 0..cols-1
  row: number; // 0-indexed, 0..rows-1
};

/** Fields shared by every pad type. */
export type PadBase = {
  id: string;
  name: string;
  iconRef?: string;
  color?: string;
  volume: number; // 0–100
  fadeIn: number; // seconds
  fadeOut: number; // seconds
};

/** One step in a combo sequence. */
export type ComboStep = {
  /** Ids of pads in the board's pool to trigger simultaneously. */
  padIds: string[];
  /** How long to wait before advancing to the next step (seconds). */
  duration?: number;
  /** Special directive: stop all currently playing pads first. */
  stopAll?: boolean;
  /** Special directive: fade all pads out over this duration (seconds). */
  fadeOutAll?: number;
};

/**
 * How a pad with several files uses them (ADR-0048): `sequential` — one after another, in the
 * order of `files`; `shuffle` — a random one each time.
 */
export type FileOrder = 'sequential' | 'shuffle';

/**
 * Plays once. With several files each trigger plays one of them — the next in turn
 * (`sequential`) or a random one (`shuffle`). `files` are library item hashes; may be empty.
 */
export type SinglePad = PadBase & {
  type: 'single';
  files: string[];
  order: FileOrder;
  trimStart?: number;
  trimEnd?: number;
};

/**
 * Runs until stopped. One file repeats seamlessly; several files play one after another, in
 * order or shuffled (the former Playlist type, ADR-0048). `files` may be empty.
 */
export type LoopPad = PadBase & {
  type: 'loop';
  files: string[];
  order: FileOrder;
  trimStart?: number;
  trimEnd?: number;
};

/** Combo sequence: a chain of steps, each triggering one or more pads. */
export type ComboPad = PadBase & {
  type: 'combo';
  steps: ComboStep[]; // may be empty
};

/** Discriminated union of all pad types. Use type guards to narrow. */
export type Pad = SinglePad | LoopPad | ComboPad;

// Type guards — prefer these over inline `pad.type === 'x'` comparisons.
export const isSinglePad = (p: Pad): p is SinglePad => p.type === 'single';
export const isLoopPad = (p: Pad): p is LoopPad => p.type === 'loop';
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
  /** IDs of pads currently in one-shot playback */
  playingPads: ReadonlySet<string>;
  /** IDs of pads currently looping */
  loopingPads: ReadonlySet<string>;
  masterVolume: number; // 0–100
}
