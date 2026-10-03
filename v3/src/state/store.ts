/**
 * @fileoverview V3.0 Central State — Preact Signals
 *
 * All UI state lives here as signals. Components read via signal.value or
 * the auto-subscribing JSX binding. Mutations happen through the exported
 * setter signals — never mutate store internals directly.
 */

import { signal, computed } from '@preact/signals';
import type {
  AppMode,
  AudioContextState,
  Board,
  LibraryItemMeta,
  Deck,
  UploadResult,
} from '../types';

// ── Audio context ────────────────────────────────────────────────────────────

/** Lifecycle state of the Web Audio API context. */
export const audioContextState = signal<AudioContextState>('locked');

// ── Navigation / routing ─────────────────────────────────────────────────────

/** The app's top-level screens. */
export type AppScreen = 'start' | 'library' | 'board-list' | 'board';

/** Top-level screen routing. */
export const currentScreen = signal<AppScreen>('start');

/** The board the board screen shows; null outside a board. */
export const currentBoardId = signal<string | null>(null);
/** The deck the board screen shows; ignored while the All pads view is open. */
export const currentDeckId = signal<string | null>(null);
/** The All pads view (the whole pool, first entry of the deck rail, ADR-0048) instead of a deck. */
export const allPadsView = signal(false);

// ── Mode ─────────────────────────────────────────────────────────────────────

/** GAME (play) vs SETUP (edit) mode — the primary UI bifurcation. */
export const currentMode = signal<AppMode>('play');

// ── Theme ────────────────────────────────────────────────────────────────────

/**
 * Active theme ID — will map to a CSS class on the root element; nothing reads it yet.
 *
 * @reserved Slice 14 — themes
 */
export const activeTheme = signal<string>('hearth');

// ── Playback state ───────────────────────────────────────────────────────────
// globalThis.Set: explicit built-in Set (the code base used to have a PadSet type).
// ReadonlySet in the type signature prevents callers from mutating directly;
// mutations go through the helpers below.

/** Ids of every pad that is playing now — loops included (fed by the audio bridge). */
export const playingPads = signal<ReadonlySet<string>>(new globalThis.Set<string>());

/** Ids of the playing pads that loop — a subset of `playingPads` (they glow as loops). */
export const loopingPads = signal<ReadonlySet<string>>(new globalThis.Set<string>());

/** Marks a pad as playing. */
export function addPlayingPad(id: string): void {
  const next = new globalThis.Set(playingPads.value);
  next.add(id);
  playingPads.value = next;
}

/** Removes a pad from the playing set (playback ended). */
export function removePlayingPad(id: string): void {
  const next = new globalThis.Set(playingPads.value);
  next.delete(id);
  playingPads.value = next;
}

/** Marks a pad as looping. */
export function addLoopingPad(id: string): void {
  const next = new globalThis.Set(loopingPads.value);
  next.add(id);
  loopingPads.value = next;
}

/** Removes a pad from the looping set. */
export function removeLoopingPad(id: string): void {
  const next = new globalThis.Set(loopingPads.value);
  next.delete(id);
  loopingPads.value = next;
}

// ── Master volume ────────────────────────────────────────────────────────────

/**
 * Master volume 0–100 — meant to drive the engine's master gain; nothing reads or sets it yet.
 *
 * @reserved Parked — master volume (docs/product/README.md#pad-options)
 */
export const masterVolume = signal<number>(80);

// ── Library ──────────────────────────────────────────────────────────────────
// libraryItems holds LibraryItemMeta only — never a Blob.
// The blob lives exclusively in IndexedDB; use libGet(id) for playback.

/** All library entries, metadata only. Loaded before the first render (src/state/boot.ts). */
export const libraryItems = signal<LibraryItemMeta[]>([]);

/**
 * Upload batch result. Set after processFilesSerial() resolves.
 * Reset to null at the start of each new upload.
 */
export const uploadStatus = signal<UploadResult | null>(null);

/** Adds a newly uploaded entry to the in-memory list. */
export function addLibraryItemMeta(meta: LibraryItemMeta): void {
  libraryItems.value = [...libraryItems.value, meta];
}

/** Removes an entry from the in-memory list (after IDB delete). */
export function removeLibraryItemMeta(id: string): void {
  libraryItems.value = libraryItems.value.filter((m) => m.id !== id);
}

/** Patches the name of an in-memory entry (after IDB rename). */
export function renameLibraryItemMeta(id: string, newName: string): void {
  libraryItems.value = libraryItems.value.map((m) => (m.id === id ? { ...m, name: newName } : m));
}

// ── Boards ───────────────────────────────────────────────────────────────────
// boards[] is the source of truth for all Board, Deck, and Pad data in RAM.
// IDB is the persistence layer — boards change only through src/state/boardWrites.ts, which
// updates this signal and saves (codeGuards: "board writes go through boardWrites").
// currentBoard and currentDeck are derived signals (no extra state needed).

/** All boards, loaded from IDB at app boot. */
export const boards = signal<Board[]>([]);

/**
 * The currently open board (derived from currentBoardId).
 * Null when on start/library screen or no board selected.
 */
export const currentBoard = computed<Board | null>(
  () => boards.value.find((b) => b.id === currentBoardId.value) ?? null,
);

/**
 * The currently active deck (derived from currentDeckId within currentBoard).
 * Null when no deck is selected or no board is open.
 */
export const currentDeck = computed<Deck | null>(
  () => currentBoard.value?.decks.find((s) => s.id === currentDeckId.value) ?? null,
);

/** Replaces or inserts a board in the signal (after IDB boardPut). */
export function upsertBoard(board: Board): void {
  const existing = boards.value.findIndex((b) => b.id === board.id);
  if (existing >= 0) {
    const next = [...boards.value];
    next[existing] = board;
    boards.value = next;
  } else {
    boards.value = [...boards.value, board];
  }
}

/** Removes a board from the signal (after IDB boardDelete). */
export function removeBoardFromStore(id: string): void {
  boards.value = boards.value.filter((b) => b.id !== id);
}

// ── Saves in flight ──────────────────────────────────────────────────────────

/**
 * Writes to IndexedDB still running (boards, preferences). A change shows before it is stored, so
 * "visible" is not "saved": whatever must not lose a change (a future "Saving…" hint, E2E tests
 * before a reload) waits for 0. main.tsx mirrors it as the `data-saving` attribute on <html>.
 */
export const pendingSaves = signal(0);
