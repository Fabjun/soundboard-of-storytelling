/**
 * @fileoverview Library Drag-and-Drop — pointer-events-based, SETUP mode only
 *
 * Used by LibraryPanel → drop onto PadGrid (Path B).
 * Isolated from padDnd.ts — separate state, no shared globals.
 * Two DnD operations (lib-drag + pad-drag) cannot run concurrently.
 *
 * Target-cell detection: document.elementFromPoint() → closest('[data-pos]')
 * Ghost has pointer-events: none so elementFromPoint sees through it.
 *
 * Platform note: HTML5 drag-and-drop is explicitly NOT used here.
 * iOS Safari/Brave does not support 'draggable'/'ondragstart'.
 * Pointer Events are supported on iOS 13+ (iPhone 6s and newer).
 */

import type { PadPosition } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

/** How a library drag ended: dropped on the cell `targetPos`, or cancelled. */
export type LibDndDropResult =
  { kind: 'cancel' } | { kind: 'drop'; itemId: string; targetPos: PadPosition };

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum pointer movement (px) before drag mode is entered. */
const DRAG_THRESHOLD = 8;

// ── Singleton state ──────────────────────────────────────────────────────────

interface LibDndState {
  active: boolean;
  itemId: string | null;
  ghost: HTMLElement | null;
  startX: number;
  startY: number;
  dragging: boolean;
  /** Currently highlighted [data-pos] cell element. */
  currentTarget: HTMLElement | null;
  onDrop: ((r: LibDndDropResult) => void) | null;
}

let _s: LibDndState = {
  active: false,
  itemId: null,
  ghost: null,
  startX: 0,
  startY: 0,
  dragging: false,
  currentTarget: null,
  onDrop: null,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Starts tracking a possible drag of a library item; call it from the row's pointerdown.
 *
 * @param e - The pointerdown event.
 * @param itemId - The library item that may be dragged.
 * @param rowEl - The row element, cloned as the drag ghost.
 * @param onDrop - Called when the drag ends, with the drop result or a cancel.
 * @param onDragActivated - Called the first time the pointer moves past the drag threshold
 *   (8 px) — use it to cancel a long-press timer in the row.
 */
export function startLibDrag(
  e: PointerEvent,
  itemId: string,
  rowEl: HTMLElement,
  onDrop: (r: LibDndDropResult) => void,
  onDragActivated?: () => void,
): void {
  // Prevent conflicts with pad-to-pad DnD (should never co-occur, but defensive)
  if (_s.active) return;

  e.preventDefault();
  rowEl.setPointerCapture(e.pointerId);

  _s.active = true;
  _s.itemId = itemId;
  _s.startX = e.clientX;
  _s.startY = e.clientY;
  _s.dragging = false;
  _s.onDrop = onDrop;

  function onMove(me: PointerEvent): void {
    const dx = me.clientX - _s.startX;
    const dy = me.clientY - _s.startY;

    if (!_s.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      // Threshold crossed — enter drag mode
      _s.dragging = true;
      _createGhost(rowEl);
      onDragActivated?.();
    }

    _moveGhost(me.clientX, me.clientY);
    _updateTarget(me.clientX, me.clientY);
  }

  function onUp(_ue: PointerEvent): void {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);

    const wasDragging = _s.dragging;
    const itemId = _s.itemId;
    const target = _s.currentTarget;

    _cleanup();

    if (!wasDragging || itemId === null) {
      onDrop({ kind: 'cancel' });
      return;
    }

    if (target) {
      const rawPos = target.dataset.pos ?? '';
      const [colStr, rowStr] = rawPos.split(',');
      const col = parseInt(colStr, 10);
      const row = parseInt(rowStr, 10);
      if (!isNaN(col) && !isNaN(row)) {
        onDrop({ kind: 'drop', itemId, targetPos: { col, row } });
        return;
      }
    }

    onDrop({ kind: 'cancel' });
  }

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _createGhost(rowEl: HTMLElement): void {
  const rect = rowEl.getBoundingClientRect();
  const ghost = rowEl.cloneNode(true) as HTMLElement;
  ghost.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    opacity: 0.7;
    pointer-events: none;
    z-index: 9999;
    background: var(--raised);
    border: 1px solid var(--border-gold);
    transform-origin: top left;
    user-select: none;
  `;
  document.body.appendChild(ghost);
  _s.ghost = ghost;
}

function _moveGhost(x: number, y: number): void {
  if (!_s.ghost) return;
  const w = parseFloat(_s.ghost.style.width);
  const h = parseFloat(_s.ghost.style.height);
  _s.ghost.style.left = `${x - w / 2}px`;
  _s.ghost.style.top = `${y - h / 2}px`;
}

function _updateTarget(x: number, y: number): void {
  // Ghost has pointer-events: none → elementFromPoint sees through it.
  const el = document.elementFromPoint(x, y);
  const cell = el?.closest('[data-pos]') as HTMLElement | null;

  if (cell === _s.currentTarget) return; // unchanged

  // Remove indicator from old target
  _s.currentTarget?.classList.remove('is-lib-drag-target');

  // Apply indicator to new target
  if (cell) {
    cell.classList.add('is-lib-drag-target');
  }
  _s.currentTarget = cell;
}

function _cleanup(): void {
  _s.ghost?.remove();
  _s.ghost = null;
  _s.currentTarget?.classList.remove('is-lib-drag-target');
  _s.currentTarget = null;
  _s.active = false;
  _s.itemId = null;
  _s.dragging = false;
  _s.onDrop = null;
}
