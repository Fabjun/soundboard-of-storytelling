// ─────────────────────────────────────────────────────────────────────────────
// Pad Drag-and-Drop — pointer-events-based, SETUP mode only
//
// Ported from V1 (index.html onPadPointerDown / onDragMove / onDragEnd) and
// adapted for V3's coordinate model: a deck's placements (padId + position, ADR-0048).
//
// V1 algorithm:         Array-index-based INSERT/SWAP
// V3 algorithm:         Row-major index for position arithmetic, then
//                       convert back to {col, row} coordinates.
//
// DROP MODES (per docs/design/design-notes.md user decision):
//   SWAP   — cursor in center (~50%) of target cell → swap positions
//   INSERT — cursor in edge zone (~25% each side) → shift row-major range
//
// EDGE ZONE: Math.min(cellWidth * 0.25, 22) px on left and right edge.
//
// Assumptions:
//   - Grid is always 4 columns wide (Slice 3; Slice 8 may generalise).
//   - All pad positions are non-null in Slice 3.
//   - No combo-step remapping needed (Slice 4+).
// ─────────────────────────────────────────────────────────────────────────────

import type { PadPosition, Placement } from '../types';
import { posToIndex, indexToPos } from './padUtils';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DndState {
  /** Grid COLS — always 4 in Slice 3. */
  cols: number;
  /** Grid ROWS — always 4 in Slice 3. */
  rows: number;
  /** ID of the pad being dragged. */
  srcId: string | null;
  /** The DOM ghost clone following the pointer. */
  ghost: HTMLElement | null;
  /** INSERT: row-major index where the dragged pad will land. */
  insertAt: number | null;
  /** SWAP: position of the pad to swap with. */
  swapWith: PadPosition | null;
  /** DOM cell elements by key "col,row" — updated by PadGrid each render. */
  cellRefs: Map<string, HTMLElement>;
  /** Start pointer position (for drag-threshold check). */
  startX: number;
  startY: number;
  /** Whether we've entered actual drag mode (moved ≥ DRAG_THRESHOLD). */
  dragging: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Minimum pointer movement (px) to enter drag mode. */
const DRAG_THRESHOLD = 8;
/** Maximum edge zone width. */
const EDGE_MAX_PX = 22;

// ── Singleton state ──────────────────────────────────────────────────────────

let _state: DndState = {
  cols: 4,
  rows: 4,
  srcId: null,
  ghost: null,
  insertAt: null,
  swapWith: null,
  cellRefs: new Map(),
  startX: 0,
  startY: 0,
  dragging: false,
};

// ── External API ─────────────────────────────────────────────────────────────

/** Called by PadGrid to keep cell DOM references current after each render. */
export function registerCellRef(key: string, el: HTMLElement | null): void {
  if (el) {
    _state.cellRefs.set(key, el);
  } else {
    _state.cellRefs.delete(key);
  }
}

/** Called by PadGrid to configure grid dimensions. */
export function configureDnd(cols: number, rows: number): void {
  _state.cols = cols;
  _state.rows = rows;
}

/**
 * Start tracking a potential drag from a pad cell.
 * Call from `onPointerDown` on the pad cell.
 * Returns a cleanup function; call it when the component unmounts.
 */
export function startDrag(
  e: PointerEvent,
  padId: string,
  cellEl: HTMLElement,
  onDrop: (result: DndDropResult) => void,
): void {
  e.preventDefault();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

  _state.srcId = padId;
  _state.startX = e.clientX;
  _state.startY = e.clientY;
  _state.dragging = false;
  _state.insertAt = null;
  _state.swapWith = null;

  const onMove = (me: PointerEvent) => _onPointerMove(me, cellEl);
  const onUp = (ue: PointerEvent) => {
    _onPointerUp(ue, onDrop);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

// ── Result types ─────────────────────────────────────────────────────────────

export type DndDropResult =
  | { kind: 'swap'; srcId: string; tgtPos: PadPosition }
  | { kind: 'insert'; srcId: string; toIndex: number }
  | { kind: 'cancel' };

// ── Private — pointer move ────────────────────────────────────────────────────

function _onPointerMove(e: PointerEvent, _srcEl: HTMLElement): void {
  const dx = e.clientX - _state.startX;
  const dy = e.clientY - _state.startY;

  if (!_state.dragging) {
    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    _state.dragging = true;
    _createGhost(_srcEl);
    _applySourceClass(true);
  }

  _moveGhost(e.clientX, e.clientY);
  _clearDropIndicators();
  _state.insertAt = null;
  _state.swapWith = null;

  // Find which cell is under the pointer
  const tgtEntry = _cellAtPoint(e.clientX, e.clientY);
  if (!tgtEntry) return;

  const { key: tgtKey, el: tgtEl } = tgtEntry;
  const [colStr, rowStr] = tgtKey.split(',');
  const tgtPos: PadPosition = { col: parseInt(colStr, 10), row: parseInt(rowStr, 10) };

  // Ignore self
  if (_state.srcId !== null) {
    const srcCellKey = _srcCellKey(_state.srcId, _currentPlacements());
    if (srcCellKey === tgtKey) return;
  }

  // Determine mode from pointer position within cell
  const rect = tgtEl.getBoundingClientRect();
  const EDGE = Math.min(rect.width * 0.25, EDGE_MAX_PX);

  if (e.clientX < rect.left + EDGE) {
    // LEFT EDGE → INSERT BEFORE (tgt's row-major index)
    const idx = posToIndex(tgtPos, _state.cols);
    _state.insertAt = idx;
    tgtEl.classList.add('is-insert-before');
  } else if (e.clientX > rect.right - EDGE) {
    // RIGHT EDGE → INSERT AFTER (tgt's row-major index + 1)
    const idx = posToIndex(tgtPos, _state.cols) + 1;
    _state.insertAt = idx;
    tgtEl.classList.add('is-insert-after');
  } else {
    // CENTER → SWAP
    _state.swapWith = tgtPos;
    tgtEl.classList.add('is-drag-swap');
  }
}

// ── Private — pointer up ──────────────────────────────────────────────────────

function _onPointerUp(_e: PointerEvent, onDrop: (r: DndDropResult) => void): void {
  _clearDropIndicators();
  _destroyGhost();
  _applySourceClass(false);

  if (!_state.dragging || _state.srcId === null) {
    onDrop({ kind: 'cancel' });
    _reset();
    return;
  }

  const srcId = _state.srcId;
  const sw = _state.swapWith;
  const ins = _state.insertAt;

  _reset();

  if (sw !== null) {
    onDrop({ kind: 'swap', srcId, tgtPos: sw });
  } else if (ins !== null) {
    onDrop({ kind: 'insert', srcId, toIndex: ins });
  } else {
    onDrop({ kind: 'cancel' });
  }
}

// ── Ghost management ─────────────────────────────────────────────────────────

function _createGhost(srcEl: HTMLElement): void {
  const rect = srcEl.getBoundingClientRect();
  const ghost = srcEl.cloneNode(true) as HTMLElement;
  ghost.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    opacity: 0.7;
    pointer-events: none;
    z-index: 9999;
    transform-origin: top left;
  `;
  document.body.appendChild(ghost);
  _state.ghost = ghost;
}

function _moveGhost(x: number, y: number): void {
  if (!_state.ghost) return;
  const ghost = _state.ghost;
  const w = parseFloat(ghost.style.width);
  const h = parseFloat(ghost.style.height);
  ghost.style.left = `${x - w / 2}px`;
  ghost.style.top = `${y - h / 2}px`;
}

function _destroyGhost(): void {
  _state.ghost?.remove();
  _state.ghost = null;
}

// ── Indicator management ──────────────────────────────────────────────────────

function _clearDropIndicators(): void {
  _state.cellRefs.forEach((el) => {
    el.classList.remove('is-insert-before', 'is-insert-after', 'is-drag-swap');
  });
}

function _applySourceClass(on: boolean): void {
  if (_state.srcId === null) return;
  const srcKey = _srcCellKey(_state.srcId, _currentPlacements());
  if (!srcKey) return;
  const el = _state.cellRefs.get(srcKey);
  if (on) {
    el?.classList.add('is-drag-source');
  } else {
    el?.classList.remove('is-drag-source');
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** The deck's placements, injected by PadGrid on every render; read per move. */
let _placementsRef: Placement[] = [];
export function setPlacementsRef(placements: Placement[]): void {
  _placementsRef = placements;
}
function _currentPlacements(): Placement[] {
  return _placementsRef;
}

function _srcCellKey(srcId: string, placements: Placement[]): string | null {
  const pad = placements.find((p) => p.padId === srcId);
  if (!pad?.position) return null;
  return `${pad.position.col},${pad.position.row}`;
}

function _cellAtPoint(x: number, y: number): { key: string; el: HTMLElement } | null {
  for (const [key, el] of _state.cellRefs) {
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return { key, el };
    }
  }
  return null;
}

function _reset(): void {
  _state.srcId = null;
  _state.insertAt = null;
  _state.swapWith = null;
  _state.dragging = false;
}

// ── Mutation helpers ──────────────────────────────────────────────────────────

/**
 * Apply a SWAP: exchange the positions of two pads.
 * Returns a new pads array (immutable).
 */
export function applySwap(pads: Placement[], srcId: string, tgtPos: PadPosition): Placement[] {
  const srcIdx = pads.findIndex((p) => p.padId === srcId);
  if (srcIdx < 0) return pads;

  const tgtIdx = pads.findIndex(
    (p) => p.position?.col === tgtPos.col && p.position?.row === tgtPos.row,
  );

  const next = pads.map((p) => ({ ...p }));
  const srcPos = next[srcIdx].position;

  if (tgtIdx >= 0) {
    // Both slots occupied — swap positions
    next[srcIdx] = { ...next[srcIdx], position: next[tgtIdx].position };
    next[tgtIdx] = { ...next[tgtIdx], position: srcPos };
  } else {
    // Target slot is empty — just move
    next[srcIdx] = { ...next[srcIdx], position: tgtPos };
  }

  return next;
}

/**
 * Apply an INSERT: move the source pad to a row-major index, shifting
 * the pads between the old and new positions by one slot (coordinate-based).
 *
 * Adapts V1's array-index shift to V3's {col, row} coordinate model:
 *   - Convert all positions to row-major indices
 *   - Perform the same shift logic V1 used (shift ±1 on intermediate pads)
 *   - Convert indices back to {col, row}
 *
 * Returns a new pads array (immutable).
 */
export function applyInsert(
  pads: Placement[],
  srcId: string,
  toIndex: number,
  cols: number,
  rows: number,
): Placement[] {
  const total = cols * rows;
  const clampedTo = Math.max(0, Math.min(toIndex, total - 1));

  const srcPad = pads.find((p) => p.padId === srcId);
  if (!srcPad?.position) return pads;

  const fromIndex = posToIndex(srcPad.position, cols);
  if (fromIndex === clampedTo) return pads;

  // Normalise to element (not gap-after): same logic as V1
  const insertIdx = fromIndex < clampedTo ? clampedTo - 1 : clampedTo;
  if (insertIdx === fromIndex) return pads;

  // Build a mutable copy
  const next = pads.map((p) => ({ ...p }));

  // Reassign row-major indices for the shifted range
  if (fromIndex < insertIdx) {
    // Dragged forward: everything between from+1..insertIdx moves -1
    for (const pad of next) {
      if (!pad.position) continue;
      const idx = posToIndex(pad.position, cols);
      if (idx > fromIndex && idx <= insertIdx) {
        pad.position = indexToPos(idx - 1, cols);
      }
    }
  } else {
    // Dragged backward: everything between insertIdx..from-1 moves +1
    for (const pad of next) {
      if (!pad.position) continue;
      const idx = posToIndex(pad.position, cols);
      if (idx >= insertIdx && idx < fromIndex) {
        pad.position = indexToPos(idx + 1, cols);
      }
    }
  }

  // Move source to target
  const srcInNext = next.find((p) => p.padId === srcId);
  if (srcInNext) {
    srcInNext.position = indexToPos(insertIdx, cols);
  }

  return next;
}
