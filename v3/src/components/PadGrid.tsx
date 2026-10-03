/**
 * @fileoverview PadGrid — the grid of PadGridCells for a deck or the All pads view
 *
 * Orchestrates:
 *   - Rendering the deck's cells, occupied and empty (columns and rows from its gridConfig)
 *   - SETUP mode: DnD via padDnd.ts (pointer events)
 *   - SETUP mode: Cell-tap → Path A (PadCreationPopover) or Place-Mode drop
 *   - SETUP mode: Pad-tap → PadEditorPanel
 *   - Path B: library drag handled by libDnd.ts (BoardScreen receives onLibDrop)
 *             No HTML5 DnD handlers here — iOS Brave compatibility.
 *   - All pads view (deck = null, Slice 9e): the whole pool by name, rows grow and scroll;
 *     no empty cells, no DnD, no creation popover. New pads come from ADD PAD or a library
 *     drop onto the grid (BoardScreen, owner decision 2026-10-02).
 */

import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { AppMode, Board, Pad, PadPosition, Deck } from '../types';
import {
  DEFAULT_GRID,
  addPadToDeck,
  deckPads,
  poolByName,
  poolLayout,
  setPlacements,
  type PlacedPad,
} from '../lib/boardModel';
import { PadGridCell } from './PadGridCell';
import { PadCreationPopover, type CreationResult } from './PadCreationPopover';
import {
  startDrag,
  setPlacementsRef,
  registerCellRef,
  configureDnd,
  applySwap,
  applyInsert,
  type DndDropResult,
} from '../lib/padDnd';
import { updateBoard } from '../state/boardWrites';

interface PadGridProps {
  /** The deck to show; null = the All pads view of the whole pool (ADR-0048). */
  deck: Deck | null;
  /** All pads view: the pool in the order chosen (padSort.ts); by name when not given. */
  poolOrder?: readonly Pad[];
  board: Board;
  mode: AppMode;
  selectedPadId: string | null;
  onPadSelect: (pad: Pad) => void;
  onRequestNewPad?: (pad: Pad) => void; // Path C / "More options" → opens PadEditorPanel
  /** Path B mobile: non-null when a library item is pending placement. */
  placeMode: string | null;
  /** Called when the user taps an empty cell while placeMode is active. */
  onPlaceModeTap?: (pos: PadPosition) => void;
}

/**
 * Shows a deck's grid — or, with `deck` null, the whole pool as All pads. In SETUP, pads can be
 * dragged, tapped to edit, and empty cells tapped to create a pad.
 */
export function PadGrid({
  deck,
  poolOrder,
  board,
  mode,
  selectedPadId,
  onPadSelect,
  onRequestNewPad,
  placeMode,
  onPlaceModeTap,
}: PadGridProps): JSX.Element {
  const isPool = deck === null;
  const entries = deck
    ? deckPads(board, deck)
    : poolLayout(poolOrder ?? poolByName(board), DEFAULT_GRID.cols);
  const cols = deck ? deck.gridConfig.cols : DEFAULT_GRID.cols;
  const rows = deck ? deck.gridConfig.rows : Math.ceil(entries.length / cols);
  const gap = deck ? deck.gridConfig.gap : DEFAULT_GRID.gap;
  const isSetup = mode === 'edit';
  // Moving and creating pads happens in a deck; the pool view only selects and plays.
  const canArrange = isSetup && !isPool;

  // Path A popover state
  const [popoverPos, setPopoverPos] = useState<PadPosition | null>(null);
  const [popoverCellRect, setPopoverCellRect] = useState<DOMRect | null>(null);

  // Lookup "col,row" → pad of the pool + its placement in this deck (or in the pool layout)
  const padMap = new Map<string, PlacedPad>();
  for (const entry of entries) {
    padMap.set(`${entry.placement.position.col},${entry.placement.position.row}`, entry);
  }

  // ── DnD setup (pad-to-pad, Pointer Events) ────────────────────────────────

  useEffect(() => {
    configureDnd(cols, rows);
  }, [cols, rows]);

  useEffect(() => {
    if (deck) setPlacementsRef(deck.placements);
  });

  async function handleDrop(result: DndDropResult) {
    if (result.kind === 'cancel' || !deck) return;

    const deckId = deck.id;
    await updateBoard(board.id, (b) => {
      const latest = b.decks.find((d) => d.id === deckId);
      if (!latest) return b;
      const placements =
        result.kind === 'swap'
          ? applySwap(latest.placements, result.srcId, result.tgtPos)
          : applyInsert(latest.placements, result.srcId, result.toIndex, cols, rows);
      return setPlacements(b, deckId, placements);
    });
  }

  function handlePadPointerDown(e: PointerEvent, pad: Pad) {
    if (!canArrange) return;
    const cellEl = (e.currentTarget as HTMLElement).closest('.sb-pad-grid-cell') as HTMLElement;
    if (!cellEl) return;
    startDrag(e, pad.id, cellEl, handleDrop);
  }

  // ── Pad CRUD ───────────────────────────────────────────────────────────────

  async function savePadToDeck(newPad: Pad, position: PadPosition) {
    if (!deck) return;
    const deckId = deck.id;
    await updateBoard(board.id, (b) => addPadToDeck(b, deckId, newPad, position));
  }

  async function handleCreationResult(result: CreationResult) {
    const position = popoverPos;
    setPopoverPos(null);
    setPopoverCellRect(null);

    if (result.action === 'cancel' || !position) return;

    if (result.action === 'create') {
      await savePadToDeck(result.pad, position);
    } else if (result.action === 'open-editor') {
      // Build a partial pad and open the editor (sets selectedPad)
      const partial = result.partialPad;
      await savePadToDeck(partial, position);
      onRequestNewPad?.(partial);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        class={
          'sb-pad-grid' + (isPool ? ' sb-pad-grid-pool' : '') + (canArrange ? ' sb-grid-bg' : '')
        }
        data-testid="pad-grid"
        // All pads: the whole grid is one library drop target (position ignored; libDnd looks
        // for the closest [data-pos]) — a drop between pads lands here too.
        data-pos={isPool ? '0,0' : undefined}
        style={
          {
            '--grid-cols': String(cols),
            '--grid-rows': String(rows),
            '--grid-gap': `${gap}px`,
          } as Record<string, string>
        }
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const key = `${col},${row}`;
            const entry = padMap.get(key);
            const pad = entry?.pad ?? null;
            // The pool has no empty cells: the last row simply ends.
            if (isPool && !pad) return null;
            return (
              <PadGridCell
                key={key}
                pad={pad}
                hotkey={entry?.placement.hotkey}
                mode={mode}
                col={col}
                row={row}
                selected={!!pad && pad.id === selectedPadId}
                cellRef={isPool ? undefined : (el) => registerCellRef(key, el)}
                onEmpty={(rect) => {
                  // Place-Mode (Path B mobile): tap → place library item
                  if (placeMode && onPlaceModeTap) {
                    onPlaceModeTap({ col, row });
                    return;
                  }
                  // Path A: open creation popover
                  if (!canArrange) return;
                  setPopoverPos({ col, row });
                  setPopoverCellRect(rect);
                }}
                onPadSelect={onPadSelect}
                onPadPointerDown={canArrange ? handlePadPointerDown : undefined}
              />
            );
          }),
        )}
      </div>

      {/* Path A Popover */}
      {popoverPos && popoverCellRect && (
        <PadCreationPopover
          position={popoverPos}
          cellRect={popoverCellRect}
          onResult={handleCreationResult}
        />
      )}
    </>
  );
}
