/**
 * @fileoverview V3.0 Shared TypeScript Types
 * This file is the source of truth for the schema (docs/architecture/concept-brief.md#41--data-model);
 * decisions: docs/architecture/0048-pad-pool-decks.md#1-data-model
 */

// ── Data model ───────────────────────────────────────────────────────────────

/** A board: the pads of one game setup, the decks that place them and the quick-access bar. */
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

/** A deck: one grid of a board that places some of the board's pads (ADR-0048). */
export type Deck = {
  id: string;
  name: string;
  /** Position among the board's decks, from 0; the deck rail shows decks in this order. */
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

/** A pad of the pool in the board's quick-access bar, with its optional key. */
export type QuickAccessEntry = {
  padId: string;
  hotkey?: string;
};

/** The pad types: `single`, `loop` and `combo` (the Playlist merged into Loop, ADR-0048). */
export type PadType = Pad['type'];

/** A cell of a deck's grid. */
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
  /** When the pad was created (ms since epoch) — "Date Added" sort; absent on older pads. */
  addedAt?: number;
  /** When the pad was last edited in the PAD editor (ms since epoch) — "Date Modified" sort. */
  modifiedAt?: number;
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
 * One audio file of a Single / Loop pad with its own trim (ADR-0068) — files differ in length, so
 * each keeps its own start and end, as clips in audio software do. Seconds of the file; no
 * `trimStart` = from the start, no `trimEnd` = to the end.
 */
export interface PadFile {
  /** The library item's id (SHA-256 of the audio). */
  hash: string;
  trimStart?: number;
  trimEnd?: number;
}

/**
 * Plays once. With several files each trigger plays one of them — the next in turn
 * (`sequential`) or a random one (`shuffle`), each with its own trim. `files` may be empty.
 */
export type SinglePad = PadBase & {
  type: 'single';
  files: PadFile[];
  order: FileOrder;
};

/**
 * Runs until stopped — or `repeat` times, then stops by itself (ADR-0069). One file repeats
 * seamlessly; several files play one after another, in order or shuffled (the former Playlist
 * type, ADR-0048), each with its own trim. `files` may be empty.
 */
export type LoopPad = PadBase & {
  type: 'loop';
  files: PadFile[];
  order: FileOrder;
  /** How often the loop plays (1–999, `REPEAT_MAX`); none = until stopped (∞). */
  repeat?: number;
};

/** Highest repeat count of a Loop (V1's limit). */
export const REPEAT_MAX = 999;

/** Combo sequence: a chain of steps, each triggering one or more pads. */
export type ComboPad = PadBase & {
  type: 'combo';
  steps: ComboStep[]; // may be empty
};

/** Discriminated union of all pad types. Use type guards to narrow. */
export type Pad = SinglePad | LoopPad | ComboPad;

/**
 * Tells whether a pad is a combo — for places that need a predicate function (`filter`, `some`);
 * elsewhere `pad.type === 'combo'` narrows the same way.
 */
export const isComboPad = (p: Pad): p is ComboPad => p.type === 'combo';

/** What a library item holds; only `audio` is created so far, icons and images are planned. */
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

// ── App state values — the runtime store itself lives in src/state/store.ts (Preact Signals) ───

/** The app mode: `play` is GAME (pads play), `edit` is SETUP (pads are arranged and edited). */
export type AppMode = 'play' | 'edit';

/** The audio context as the app tracks it: `locked` until the first tap unlocks audio (iOS). */
export type AudioContextState = 'locked' | 'running' | 'suspended';
