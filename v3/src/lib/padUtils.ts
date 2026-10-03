/**
 * @fileoverview Pad Utilities — pure functions, no side effects, no IDB/signal access
 */

import type { Pad, PadBase, PadPosition, PadType } from '../types';
import { isComboPad } from '../types';

// ── Slot scanning ────────────────────────────────────────────────────────────

/**
 * Finds the first free `{col, row}` slot in row-major order (top-left).
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
 * Converts a `{col, row}` position to a row-major linear index.
 * Used by the INSERT DnD algorithm.
 */
export function posToIndex(pos: PadPosition, cols: number): number {
  return pos.row * cols + pos.col;
}

/**
 * Converts a row-major linear index back to `{col, row}`.
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

// ── New pads ─────────────────────────────────────────────────────────────────

/** Volume of a new pad (0–100). */
export const DEFAULT_PAD_VOLUME = 80;

/**
 * A new pad with the default settings — the one place that knows them (ADD PAD, library drop,
 * creation popover). `files` are library item hashes; a Combo starts with no steps.
 */
export function newPad(
  id: string,
  type: PadType,
  name: string,
  files: string[] = [],
  addedAt?: number,
): Pad {
  const base: PadBase = {
    id,
    name,
    volume: DEFAULT_PAD_VOLUME,
    fadeIn: 0,
    fadeOut: 0,
    ...(addedAt === undefined ? {} : { addedAt }),
  };
  return type === 'combo'
    ? { ...base, type, steps: [] }
    : { ...base, type, files, order: 'sequential' };
}

/**
 * The fields every pad type shares — everything except the type and its own fields. Built by
 * taking those away, never by listing the shared fields, so a field added to PadBase later
 * (e.g. addedAt) can never be lost on a type change or an edit.
 */
export function padBaseOf(pad: Pad): PadBase {
  if (pad.type === 'combo') {
    const { type: _t, steps: _s, ...base } = pad;
    return base;
  }
  const { type: _t, files: _f, order: _o, trimStart: _ts, trimEnd: _te, ...base } = pad;
  return base;
}

// ── Pad type-change migration ────────────────────────────────────────────────

/**
 * What a type change does to the pad's content. `add`: nothing is lost (no dialog needed);
 * `reset`: the source is cleared — files when changing to Combo, steps when leaving it.
 */
export type MigrationVerdict = 'add' | 'reset';

/** What a type change does, for the confirmation dialog: the verdict and the fields per group. */
export interface MigrationResult {
  verdict: MigrationVerdict;
  /** Fields that stay as they are. */
  keeps: string[];
  /** Fields that carry over in a changed form. */
  migrates: string[];
  /** Fields that are lost. */
  drops: string[];
}

/**
 * Computes the migration verdict and field summary for a type change (ADR-0048: three types).
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
 * Applies a type change to a pad, following the migration policy.
 * Returns a new Pad (immutable). Single ↔ Loop keep files, order and trim; a change to or from
 * Combo starts the new content empty.
 *
 * Caller is responsible for showing PadTypeConfirmDialog before calling this.
 */
export function applyTypeChange(pad: Pad, newType: PadType): Pad {
  const base = padBaseOf(pad);

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

/**
 * Returns the CSS glow token for a pad type.
 *
 * @reserved Slice 13 — a playing pad glows in its type colour (docs/design/components/pad.md)
 */
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
