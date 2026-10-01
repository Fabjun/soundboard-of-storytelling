// ─────────────────────────────────────────────────────────────────────────────
// Pad Utilities — pure functions, no side effects, no IDB/signal access
// ─────────────────────────────────────────────────────────────────────────────

import type { Pad, PadBase, PadPosition, PadType } from '../types';
import { isComboPad } from '../types';

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

// ── Pad type inference ───────────────────────────────────────────────────────

/**
 * Infer pad type from audio duration and file count.
 *
 * Thresholds (docs/design/design-notes.md A2 Pre-disposition):
 *   < 5 s     → SINGLE (short clip, fire-and-forget)
 *   5–9.99 s  → SINGLE (ambiguous zone; default SINGLE, flip allowed on pad)
 *   ≥ 10 s    → LOOP   (sustained ambient)
 *   fileCount > 1 → LOOP (several files play one after another — the former Playlist,
 *                   ADR-0048), regardless of duration
 */
export function typeInference(durationSeconds: number, fileCount: number): PadType {
  if (fileCount > 1) return 'loop';
  if (durationSeconds >= 10) return 'loop';
  return 'single';
}

// ── New pads ─────────────────────────────────────────────────────────────────

/** Volume of a new pad (0–100). */
export const DEFAULT_PAD_VOLUME = 80;

/**
 * A new pad with the default settings — the one place that knows them (ADD PAD, library drop,
 * creation popover). `files` are library item hashes; a Combo starts with no steps.
 */
export function newPad(id: string, type: PadType, name: string, files: string[] = []): Pad {
  const base: PadBase = { id, name, volume: DEFAULT_PAD_VOLUME, fadeIn: 0, fadeOut: 0 };
  return type === 'combo'
    ? { ...base, type, steps: [] }
    : { ...base, type, files, order: 'sequential' };
}

// ── Pad type-change migration ────────────────────────────────────────────────

/**
 * What a type change does to the pad's content. `add`: nothing is lost (no dialog needed);
 * `reset`: the source is cleared — files when changing to Combo, steps when leaving it.
 */
export type MigrationVerdict = 'add' | 'reset';

export interface MigrationResult {
  verdict: MigrationVerdict;
  keeps: string[];
  migrates: string[];
  drops: string[];
}

/**
 * Compute the migration verdict and field summary for a type change (ADR-0048: three types).
 *
 * Universal fields (always preserved): name, hotkey, volume, fadeIn, fadeOut, color, iconRef.
 *
 *   SINGLE ↔ LOOP:  ADD   (both keep files, order and trim — one building block, P5)
 *   SINGLE/LOOP → COMBO, COMBO → SINGLE/LOOP:  RESET (audio files ↔ combo steps)
 *
 * The dialog is shown only when the verdict is RESET.
 */
export function padMigrationMatrix(from: PadType, to: PadType): MigrationResult {
  if (from === to || (from !== 'combo' && to !== 'combo')) {
    return {
      verdict: 'add',
      keeps: from === to ? universalFields() : [...universalFields(), 'audio files'],
      migrates: [],
      drops: [],
    };
  }
  return {
    verdict: 'reset',
    keeps: universalFields(),
    migrates: [],
    drops: from === 'combo' ? ['combo steps'] : ['audio files'],
  };
}

function universalFields(): string[] {
  return ['name', 'volume', 'fade in', 'fade out', 'hotkey', 'color', 'icon'];
}

/**
 * Apply a type change to a pad, following the migration policy.
 * Returns a new Pad (immutable). Single ↔ Loop keep files, order and trim; a change to or from
 * Combo starts the new content empty.
 *
 * Caller is responsible for showing PadTypeConfirmDialog before calling this.
 */
export function applyTypeChange(pad: Pad, newType: PadType): Pad {
  const base: PadBase = {
    id: pad.id,
    name: pad.name,
    iconRef: pad.iconRef,
    color: pad.color,
    volume: pad.volume,
    fadeIn: pad.fadeIn,
    fadeOut: pad.fadeOut,
  };

  if (newType === 'combo') {
    return { ...base, type: 'combo', steps: isComboPad(pad) ? pad.steps : [] };
  }
  if (isComboPad(pad)) return { ...base, type: newType, files: [], order: 'sequential' };
  const { files, order, trimStart, trimEnd } = pad;
  return { ...base, type: newType, files, order, trimStart, trimEnd };
}

// ── Pad type tokens ──────────────────────────────────────────────────────────

/** CSS custom-property value (e.g. `var(--pad-loop)`) for a pad type. */
export function padTypeColor(type: PadType): string {
  switch (type) {
    case 'single':
      return 'var(--pad-single)';
    case 'loop':
      return 'var(--pad-loop)';
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
    case 'combo':
      return 'COMBO';
  }
}
