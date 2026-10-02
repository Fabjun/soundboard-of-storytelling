// ─────────────────────────────────────────────────────────────────────────────
// BoardScreen — main board canvas (Slice 3)
//
// Layout: BoardTopBar | 3-column main area | StatusBar
//
// 3-column main area:
//   Left  220px  DeckRail  (deck list + CRUD)
//   Center 1fr   PadGrid    (4×4 grid + Path A/B creation)
//   Right  280px Right panel (toggles: LibraryPanel ↔ PadEditorPanel)
//
// Modes:
//   SETUP (mode='edit'):  full CRUD, DnD, inspector visible
//   GAME  (mode='play'):  no editing, pad clicks → Slice 4 playback stub
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  currentScreen,
  currentDeckId,
  currentMode,
  currentBoard,
  currentDeck,
  upsertBoard,
  libraryItems,
} from '../state/store';
import { boardPut } from '../db/idb';
import { BoardTopBar } from '../components/BoardTopBar';
import { DeckRail } from '../components/DeckRail';
import { PadGrid } from '../components/PadGrid';
import { PadEditorPanel } from '../components/PadEditorPanel';
import { LibraryPanel } from '../components/LibraryPanel';
import { StatusBar } from '../components/StatusBar';
import { PixelIcon } from '../components/PixelIcon';
import type { AppMode, Board, Pad, PadPosition, Deck } from '../types';
import { nanoid } from '../lib/nanoid';
import { DEFAULT_PAD_TYPE, nextFreeSlot } from '../lib/padUtils';
import { addPadToDeck, deletePad } from '../lib/boardModel';
import { type LibDndDropResult } from '../lib/libDnd';

type RightPanelMode = 'library' | 'editor' | 'empty';

export function BoardScreen(): JSX.Element {
  const board = currentBoard.value;
  const deck = currentDeck.value;
  const mode = currentMode.value;

  const [rightPanel, setRightPanel] = useState<RightPanelMode>('empty');
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null);
  /** Mobile Place-Mode: non-null while user is tapping a slot to place a library item. */
  const [placeMode, setPlaceMode] = useState<{ itemId: string } | null>(null);

  // Select first deck if none selected.
  // Dep is board?.id intentionally — we only auto-select on BOARD IDENTITY change,
  // not on every board mutation (which would re-override a user deck selection).
  useEffect(() => {
    if (board && !currentDeckId.value && board.decks.length > 0) {
      const first = [...board.decks].sort((a, b) => a.order - b.order)[0];
      currentDeckId.value = first.id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-select only on board identity change, never override the user's deck choice
  }, [board?.id]);

  // Close editor panel when mode switches to GAME
  useEffect(() => {
    if (mode === 'play') {
      setRightPanel('empty');
      setSelectedPadId(null);
    }
  }, [mode]);

  // Path C — ADD PAD. No keyboard shortcut: the app is operated by its buttons (owner decision
  // 2026-10-02 — keyboard control of the app is Parked; pad keys in GAME are Slice 12).
  async function handleAddPad() {
    if (!deck || !board) return;
    const pos = nextFreeSlot(deck.placements, deck.gridConfig.cols, deck.gridConfig.rows);
    if (!pos) return; // Grid full
    const newPad: Pad = {
      id: nanoid(),
      type: 'single',
      name: '',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      // libraryItemRef intentionally absent: editor opens to fill it in
    };
    const updatedBoard: Board = addPadToDeck(board, deck.id, newPad, pos);
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
      setSelectedPadId(newPad.id);
      setRightPanel('editor');
    } catch (e) {
      console.error('Add pad failed:', e);
    }
  }

  if (!board) {
    return (
      <div class="sb-screen">
        <div class="sb-center-placeholder">
          Board not found.
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost"
            onClick={() => {
              currentScreen.value = 'board-list';
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleModeSwitch(newMode: AppMode) {
    currentMode.value = newMode;
  }

  function handlePadSelect(pad: Pad) {
    if (mode !== 'edit') return;
    setSelectedPadId(pad.id);
    setRightPanel('editor');
  }

  function handleEditorClose() {
    setSelectedPadId(null);
    setRightPanel('empty');
  }

  function handleLibraryToggle() {
    setRightPanel((prev) => (prev === 'library' ? 'empty' : 'library'));
    setSelectedPadId(null);
    setPlaceMode(null); // cancel any pending place-mode
  }

  // ── Path B — Library drop (Pointer Events via libDnd.ts) ──────────────────

  async function handleLibDrop(result: LibDndDropResult) {
    if (result.kind === 'cancel' || !deck || !board) return;
    const { itemId, targetPos } = result;

    // If the target slot is occupied, fall back to the next free slot
    const occupied = deck.placements.find(
      (p) => p.position.col === targetPos.col && p.position.row === targetPos.row,
    );
    const finalPos = occupied
      ? nextFreeSlot(deck.placements, deck.gridConfig.cols, deck.gridConfig.rows)
      : targetPos;
    if (!finalPos) return; // grid full

    const item = libraryItems.value.find((m) => m.id === itemId);
    if (!item) return;

    const newPad: Pad = {
      id: nanoid(),
      type: DEFAULT_PAD_TYPE,
      name: item.name,
      libraryItemRef: itemId,
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
    };

    const updatedBoard: Board = addPadToDeck(board, deck.id, newPad, finalPos);
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
    } catch (e) {
      console.error('Lib drop pad create failed:', e);
    }
  }

  // ── Path B Mobile — Place-Mode ─────────────────────────────────────────────

  function handleEnterPlaceMode(itemId: string) {
    setPlaceMode({ itemId });
    setRightPanel('empty'); // close library panel so the grid is fully visible
  }

  async function handlePlaceModeTap(pos: PadPosition) {
    if (!placeMode || !deck || !board) return;
    const { itemId } = placeMode;
    setPlaceMode(null); // clear immediately so double-taps don't create two pads

    // Occupied slot → fall back to next free slot (consistent with handleLibDrop)
    const occupied = deck.placements.find(
      (p) => p.position.col === pos.col && p.position.row === pos.row,
    );
    const finalPos = occupied
      ? nextFreeSlot(deck.placements, deck.gridConfig.cols, deck.gridConfig.rows)
      : pos;

    await handleLibDrop({ kind: 'drop', itemId, targetPos: finalPos ?? pos });
  }

  async function handlePadDelete(padId: string) {
    if (!deck || !board) return;
    // Delete pad (ADR-0048): from the pool, every deck, quick access and combo steps.
    // "Remove from deck" (placement only) follows in Slice 9e.
    const updatedBoard: Board = deletePad(board, padId);
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
      setSelectedPadId(null);
      setRightPanel('empty');
    } catch (e) {
      console.error('Pad delete failed:', e);
    }
  }

  // ── Empty Board state ──────────────────────────────────────────────────────

  const hasDecks = board.decks.length > 0;

  // ── Pad for editor ─────────────────────────────────────────────────────────

  const selectedPad =
    deck && deck.placements.some((p) => p.padId === selectedPadId)
      ? (board.pads.find((p) => p.id === selectedPadId) ?? null)
      : null;

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div class="sb-screen">
      <BoardTopBar
        boardName={board.name}
        deckName={deck?.name}
        mode={mode}
        onModeSwitch={handleModeSwitch}
        libraryOpen={rightPanel === 'library'}
        onLibraryToggle={handleLibraryToggle}
        onBack={() => {
          currentScreen.value = 'board-list';
        }}
      />

      {/* Main content */}
      <div class="sb-board-body">
        {/* Left: Deck rail */}
        <DeckRail
          board={board}
          activeDeckId={currentDeckId.value}
          onDeckSelect={(id) => {
            currentDeckId.value = id;
            setSelectedPadId(null);
          }}
        />

        {/* Center: Pad grid or empty states */}
        <main class="sb-board-main">
          {!hasDecks ? (
            <EmptyBoardState
              onAddDeck={async () => {
                const newDeck: Deck = {
                  id: nanoid(),
                  name: 'Deck 1',
                  order: 0,
                  gridConfig: { cols: 4, rows: 4, gap: 8, padSize: 'md' },
                  placements: [],
                };
                const updatedBoard: Board = { ...board, decks: [newDeck] };
                try {
                  await boardPut(updatedBoard);
                  upsertBoard(updatedBoard);
                  currentDeckId.value = newDeck.id;
                } catch (e) {
                  console.error('Add deck failed:', e);
                }
              }}
            />
          ) : !deck ? (
            <div class="sb-center-placeholder">Select a deck</div>
          ) : (
            <>
              {/* Path B Mobile — Place-Mode banner */}
              {placeMode && (
                <div class="sb-place-banner">
                  <span class="sb-place-banner-label">
                    Tap a slot to place &quot;
                    {libraryItems.value.find((m) => m.id === placeMode.itemId)?.name ?? '…'}&quot;
                  </span>
                  <button
                    class="sb-btn sb-btn-sm sb-btn-ghost is-on-setup"
                    onClick={() => setPlaceMode(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <PadGrid
                deck={deck}
                board={board}
                mode={mode}
                selectedPadId={selectedPadId}
                onPadSelect={handlePadSelect}
                onRequestNewPad={(pad) => {
                  setSelectedPadId(pad.id);
                  setRightPanel('editor');
                }}
                placeMode={placeMode?.itemId ?? null}
                onPlaceModeTap={handlePlaceModeTap}
              />
            </>
          )}

          {/* SETUP toolbar — ADD PAD button */}
          {mode === 'edit' && deck && (
            <div class="sb-setup-toolbar">
              <button class="sb-btn sb-btn-sm sb-btn-primary" onClick={handleAddPad}>
                <PixelIcon name="sparkle" size={11} />
                ADD PAD
              </button>
            </div>
          )}
        </main>

        {/* Right: Inspector panel (SETUP only) */}
        {mode === 'edit' && (
          <>
            {rightPanel === 'library' && (
              <LibraryPanel
                onClose={() => setRightPanel('empty')}
                onLibDrop={handleLibDrop}
                onEnterPlaceMode={handleEnterPlaceMode}
              />
            )}
            {rightPanel === 'editor' && selectedPad && deck && (
              <PadEditorPanel
                pad={selectedPad}
                deck={deck}
                board={board}
                onClose={handleEditorClose}
                onDelete={handlePadDelete}
              />
            )}
            {/* No placeholder when rightPanel === 'empty': the pad grid fills
                the available width on all viewport sizes. On 390px, DeckRail
                (220px) + a 280px placeholder would squeeze the grid to 0px. */}
          </>
        )}
      </div>

      <StatusBar
        mode={mode}
        boardName={board.name}
        infoText={
          deck
            ? `${deck.name} · ${deck.placements.length} pad${deck.placements.length !== 1 ? 's' : ''}`
            : 'No deck selected'
        }
      />
    </div>
  );
}

// ── EmptyBoardState ────────────────────────────────────────────────────────────

function EmptyBoardState({ onAddDeck }: { onAddDeck: () => void }): JSX.Element {
  return (
    <div class="sb-screen-empty">
      <PixelIcon name="scroll" size={40} color="var(--border)" />
      <div class="sb-display-vt is-heading">Empty Board</div>
      <div class="sb-empty-body">
        Add a deck to start placing pads. A deck is your hand-picked selection of pads.
      </div>
      <button class="sb-btn sb-btn-primary sb-btn-cta" onClick={onAddDeck}>
        <PixelIcon name="sparkle" size={14} />+ NEW DECK
      </button>
    </div>
  );
}
