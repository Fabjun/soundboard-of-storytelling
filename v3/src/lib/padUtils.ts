// ─────────────────────────────────────────────────────────────────────────────
// Pad Utilities — pure functions, no side effects, no IDB/signal access
// ─────────────────────────────────────────────────────────────────────────────

import type { Pad, PadBase, PadPosition, PadType } from '../types';
import { isSinglePad, isLoopPad, isPlaylistPad, isComboPad } from '../types';

// ── Slot scanning ────────────────────────────────────────────────────────────

/**
 * Find the first free {col, row} slot in row-major order (top-left).
 * Returns null if the grid is completely full.
 *
 * Pre-disposition (docs/design/design-notes.md A2): row-major top-left scan.
 * Rationale: predictable beats smart; one-in-twenty workflows break
 * with near-focused heuristics.
 */
export function nextFreeSlot(
  placements: readonly { position: PadPosition }[],
  cols: number,
  rows: number,
): PadPosition | null {
  const occupied = new globalThis.Set(placements.map((p) => `${p.position.col},${p.position.row}`));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!occupied.has(`${col},${row}`)) return { col, row };
    }
  }
  return null;
}

/**
 * Convert a {col, row} position to a row-major linear index.
 * Used by the INSERT DnD algorithm.
 */
export function posToIndex(pos: PadPosition, cols: number): number {
  return pos.row * cols + pos.col;
}

/**
 * Convert a row-major linear index back to {col, row}.
 * Inverse of posToIndex.
 */
export function indexToPos(index: number, cols: number): PadPosition {
  return { col: index % cols, row: Math.floor(index / cols) };
}

// ── New pad type ─────────────────────────────────────────────────────────────

/**
 * Type of a new pad when the user picks none — on every creation path. No type is guessed from
 * the file (owner decision 2026-10-02, docs/product/README.md#pad-types--decided).
 */
export const DEFAULT_PAD_TYPE = 'single' satisfies PadType;

// ── Pad type-change migration ────────────────────────────────────────────────

export type MigrationVerdict = 'add' | 'migrate' | 'drop' | 'lossy' | 'reset';

export interface MigrationResult {
  verdict: MigrationVerdict;
  keeps: string[];
  migrates: string[];
  drops: string[];
}

/**
 * Compute the migration verdict and field summary for a type change.
 *
 * Universal fields (always preserved): name, hotkey, volume, fadeIn, fadeOut,
 * color, iconRef.
 *
 * Type-specific source field:
 *   SINGLE/LOOP: libraryItemRef = the track
 *   PLAYLIST:    libraryItemRef = items[0] (conceptually; full playlist in Slice 4)
 *   COMBO:       libraryItemRef = undefined (chain-based, Slice 4)
 *
 * v23 verdict matrix:
 *   SINGLE → LOOP:     ADD     (loop point defaults added, source preserved)
 *   SINGLE → PLAYLIST: MIGRATE (items[0] = source)
 *   SINGLE → COMBO:    RESET   (chain starts empty)
 *   LOOP   → SINGLE:   DROP    (loop point dropped, source preserved)
 *   LOOP   → PLAYLIST: MIGRATE (items[0] = source)
 *   LOOP   → COMBO:    RESET
 *   PLAYLIST → SINGLE: LOSSY   (items[0] → source, rest dropped)
 *   PLAYLIST → LOOP:   LOSSY   (items[0] → source, rest dropped, loop point added)
 *   PLAYLIST → COMBO:  RESET
 *   COMBO  → any:      RESET   (source/chain resets, reconfigure needed)
 *   any    → COMBO:    RESET
 *
 * Dialog is shown only when the verdict is not trivially safe.
 * For brand-new pads (no data yet): call with an empty/default pad → verdict will
 * be ADD or trivial → caller should skip dialog.
 */
export function padMigrationMatrix(from: PadType, to: PadType): MigrationResult {
  if (from === to) {
    return { verdict: 'add', keeps: universalFields(), migrates: [], drops: [] };
  }

  // COMBO source always resets
  if (from === 'combo' || to === 'combo') {
    return {
      verdict: 'reset',
      keeps: universalFields(),
      migrates: [],
      drops: from === 'combo' ? [] : ['audio source'],
    };
  }

  if (from === 'single' && to === 'loop') {
    return {
      verdict: 'add',
      keeps: [...universalFields(), 'audio source'],
      migrates: [],
      drops: [],
    };
  }

  if (from === 'single' && to === 'playlist') {
    return {
      verdict: 'migrate',
      keeps: universalFields(),
      migrates: ['audio source → playlist item 1'],
      drops: [],
    };
  }

  if (from === 'loop' && to === 'single') {
    return {
      verdict: 'drop',
      keeps: [...universalFields(), 'audio source'],
      migrates: [],
      drops: ['loop point'],
    };
  }

  if (from === 'loop' && to === 'playlist') {
    return {
      verdict: 'migrate',
      keeps: universalFields(),
      migrates: ['audio source → playlist item 1'],
      drops: ['loop point'],
    };
  }

  if (from === 'playlist' && to === 'single') {
    return {
      verdict: 'lossy',
      keeps: [...universalFields(), 'playlist item 1 → audio source'],
      migrates: [],
      drops: ['playlist items 2+'],
    };
  }

  if (from === 'playlist' && to === 'loop') {
    return {
      verdict: 'lossy',
      keeps: [...universalFields(), 'playlist item 1 → audio source'],
      migrates: [],
      drops: ['playlist items 2+'],
    };
  }

  // Fallback — should not be reached with current 4 types
  return { verdict: 'reset', keeps: universalFields(), migrates: [], drops: ['audio source'] };
}

function universalFields(): string[] {
  return ['name', 'volume', 'fade in', 'fade out', 'hotkey', 'color', 'icon'];
}

/**
 * Apply a type change to a pad, following the migration policy.
 * Returns a new Pad (immutable). Constructs the correct union variant.
 *
 * - RESET:  type-specific source data cleared (combo steps → [], playlist files → [])
 * - LOSSY:  first playlist item promoted to libraryItemRef; rest dropped
 * - Others: source preserved where semantically compatible
 *
 * Caller is responsible for showing PadTypeConfirmDialog before calling this.
 */
export function applyTypeChange(pad: Pad, newType: PadType): Pad {
  const { verdict } = padMigrationMatrix(pad.type, newType);

  const base: PadBase = {
    id: pad.id,
    name: pad.name,
    iconRef: pad.iconRef,
    color: pad.color,
    volume: pad.volume,
    fadeIn: pad.fadeIn,
    fadeOut: pad.fadeOut,
  };

  // Extract the "primary" library reference from the current pad.
  const sourceRef: string | undefined =
    isSinglePad(pad) || isLoopPad(pad)
      ? pad.libraryItemRef
      : isPlaylistPad(pad)
        ? (pad.files[0] ?? undefined)
        : undefined;

  const ref = verdict === 'reset' ? undefined : sourceRef;

  switch (newType) {
    case 'single':
      return { ...base, type: 'single', libraryItemRef: ref };
    case 'loop':
      return { ...base, type: 'loop', libraryItemRef: ref };
    case 'playlist': {
      const files = isPlaylistPad(pad) && verdict !== 'reset' ? pad.files : ref ? [ref] : [];
      return { ...base, type: 'playlist', files };
    }
    case 'combo': {
      const steps = isComboPad(pad) && verdict !== 'reset' ? pad.steps : [];
      return { ...base, type: 'combo', steps };
    }
  }
}

// ── Pad type tokens ──────────────────────────────────────────────────────────

/** CSS custom-property value (e.g. `var(--pad-loop)`) for a pad type. */
export function padTypeColor(type: PadType): string {
  switch (type) {
    case 'single':
      return 'var(--pad-single)';
    case 'loop':
      return 'var(--pad-loop)';
    case 'playlist':
      return 'var(--pad-playlist)';
    case 'combo':
      return 'var(--pad-combo)';
  }
}

/** CSS glow token for a pad type. */
export function padTypeGlow(type: PadType): string {
  switch (type) {
    case 'single':
      return 'var(--pad-single-glow)';
    case 'loop':
      return 'var(--pad-loop-glow)';
    case 'playlist':
      return 'var(--pad-playlist-glow)';
    case 'combo':
      return 'var(--pad-combo-glow)';
  }
}

/** Short label for a pad type (used in badges, indicators). */
export function padTypeLabel(type: PadType): string {
  switch (type) {
    case 'single':
      return 'SGL';
    case 'loop':
      return 'LOOP';
    case 'playlist':
      return 'LIST';
    case 'combo':
      return 'COMBO';
  }
}
