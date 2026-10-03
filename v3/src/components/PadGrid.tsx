// ─────────────────────────────────────────────────────────────────────────────
// PadGrid — 4×4 CSS grid of PadGridCells
//
// Orchestrates:
//   - Rendering 16 cells (occupied + empty)
//   - SETUP mode: DnD via padDnd.ts (pointer events)
//   - SETUP mode: Cell-tap → Path A (PadCreationPopover) or Place-Mode drop
//   - SETUP mode: Pad-tap → PadEditorPanel
//   - Path B: library drag handled by libDnd.ts (BoardScreen receives onLibDrop)
//             No HTML5 DnD handlers here — iOS Brave compatibility.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { AppMode, Board, Pad, PadPosition, Deck } from '../types';
import { addPadToDeck, deckPads, setPlacements, type PlacedPad } from '../lib/boardModel';
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
import { upsertBoard } from '../state/store';
import { boardPut } from '../db/idb';

interface PadGridProps {
  deck: Deck;
  board: Board;
  mode: AppMode;
  selectedPadId: string | null;
  onPadSelect: (pad: Pad) => void;
  onRequestNewPad: (pad: Pad) => void; // Path C / "More options" → opens PadEditorPanel
  /** Path B mobile: non-null when a library item is pending placement. */
  placeMode: string | null;
  /** Called when the user taps an empty cell while placeMode is active. */
  onPlaceModeTap?: (pos: PadPosition) => void;
}

export function PadGrid({
  deck,
  board,
  mode,
  selectedPadId,
  onPadSelect,
  onRequestNewPad,
  placeMode,
  onPlaceModeTap,
}: PadGridProps): JSX.Element {
  const cols = deck.gridConfig.cols;
  const rows = deck.gridConfig.rows;
  const isSetup = mode === 'edit';

  // Path A popover state
  const [popoverPos, setPopoverPos] = useState<PadPosition | null>(null);
  const [popoverCellRect, setPopoverCellRect] = useState<DOMRect | null>(null);

  // Lookup "col,row" → pad of the pool + its placement in this deck
  const padMap = new Map<string, PlacedPad>();
  for (const entry of deckPads(board, deck)) {
    padMap.set(`${entry.placement.position.col},${entry.placement.position.row}`, entry);
  }

  // ── DnD setup (pad-to-pad, Pointer Events) ────────────────────────────────

  useEffect(() => {
    configureDnd(cols, rows);
  }, [cols, rows]);

  useEffect(() => {
    setPlacementsRef(deck.placements);
  });

  async function handleDrop(result: DndDropResult) {
    if (result.kind === 'cancel') return;

    const placements =
      result.kind === 'swap'
        ? applySwap(deck.placements, result.srcId, result.tgtPos)
        : applyInsert(deck.placements, result.srcId, result.toIndex, cols, rows);
    const updatedBoard: Board = setPlacements(board, deck.id, placements);
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
    } catch (e) {
      console.error('Pad DnD save failed:', e);
    }
  }

  function handlePadPointerDown(e: PointerEvent, pad: Pad) {
    if (!isSetup) return;
    const cellEl = (e.currentTarget as HTMLElement).closest('.sb-pad-grid-cell') as HTMLElement;
    if (!cellEl) return;
    startDrag(e, pad.id, cellEl, handleDrop);
  }

  // ── Pad CRUD ───────────────────────────────────────────────────────────────

  async function savePadToDeck(newPad: Pad, position: PadPosition) {
    const updatedBoard: Board = addPadToDeck(board, deck.id, newPad, position);
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
    } catch (e) {
      console.error('Pad create failed:', e);
    }
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
      onRequestNewPad(partial);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        class={'sb-pad-grid' + (isSetup ? ' sb-grid-bg' : '')}
        data-testid="pad-grid"
        style={
          {
            '--grid-cols': String(cols),
            '--grid-rows': String(rows),
            '--grid-gap': `${deck.gridConfig.gap}px`,
          } as Record<string, string>
        }
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const key = `${col},${row}`;
            const entry = padMap.get(key);
            const pad = entry?.pad ?? null;
            return (
              <PadGridCell
                key={key}
                pad={pad}
                hotkey={entry?.placement.hotkey}
                mode={mode}
                col={col}
                row={row}
                selected={!!pad && pad.id === selectedPadId}
                cellRef={(el) => registerCellRef(key, el)}
                onEmpty={(rect) => {
                  // Place-Mode (Path B mobile): tap → place library item
                  if (placeMode && onPlaceModeTap) {
                    onPlaceModeTap({ col, row });
                    return;
                  }
                  // Path A: open creation popover
                  if (!isSetup) return;
                  setPopoverPos({ col, row });
                  setPopoverCellRect(rect);
                }}
                onPadSelect={onPadSelect}
                onPadPointerDown={isSetup ? handlePadPointerDown : undefined}
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
