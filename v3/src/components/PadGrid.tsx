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
import { PadGridCell } from './PadGridCell';
import { PadCreationPopover, type CreationResult } from './PadCreationPopover';
import {
  startDrag,
  setPadsRef,
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

  // Build lookup map: "col,row" → Pad
  const padMap = new Map<string, Pad>();
  for (const pad of deck.pads) {
    if (pad.position) {
      padMap.set(`${pad.position.col},${pad.position.row}`, pad);
    }
  }

  // ── DnD setup (pad-to-pad, Pointer Events) ────────────────────────────────

  useEffect(() => {
    configureDnd(cols, rows);
  }, [cols, rows]);

  useEffect(() => {
    setPadsRef(deck.pads);
  });

  async function handleDrop(result: DndDropResult) {
    if (result.kind === 'cancel') return;

    let updatedPads: Pad[];
    if (result.kind === 'swap') {
      updatedPads = applySwap(deck.pads, result.srcId, result.tgtPos);
    } else {
      updatedPads = applyInsert(deck.pads, result.srcId, result.toIndex, cols, rows);
    }

    const updatedDeck: Deck = { ...deck, pads: updatedPads };
    const updatedBoard: Board = {
      ...board,
      decks: board.decks.map((s) => (s.id === deck.id ? updatedDeck : s)),
    };
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

  async function savePadToDeck(newPad: Pad) {
    const updatedDeck: Deck = { ...deck, pads: [...deck.pads, newPad] };
    const updatedBoard: Board = {
      ...board,
      decks: board.decks.map((s) => (s.id === deck.id ? updatedDeck : s)),
    };
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
    } catch (e) {
      console.error('Pad create failed:', e);
    }
  }

  async function handleCreationResult(result: CreationResult) {
    setPopoverPos(null);
    setPopoverCellRect(null);

    if (result.action === 'cancel') return;

    if (result.action === 'create') {
      await savePadToDeck(result.pad);
    } else if (result.action === 'open-editor') {
      // Build a partial pad and open the editor (sets selectedPad)
      const partial = result.partialPad;
      await savePadToDeck(partial);
      onRequestNewPad(partial);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        class={'sb-pad-grid' + (isSetup ? ' sb-grid-bg' : '')}
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
            const pad = padMap.get(key) ?? null;
            return (
              <PadGridCell
                key={key}
                pad={pad}
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
