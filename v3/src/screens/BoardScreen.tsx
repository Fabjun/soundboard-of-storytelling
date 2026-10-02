// ─────────────────────────────────────────────────────────────────────────────
// BoardScreen — main board canvas (Slice 3)
//
// Layout: BoardTopBar | 3-column main area | StatusBar
//
// 3-column main area:
//   Left  220px  DeckRail  (All pads + deck list + CRUD)
//   Center 1fr   PadGrid    (4×4 grid + Path A/B creation, or the All pads pool view)
//   Right  280px Right panel (toggles: LibraryPanel ↔ PadEditorPanel)
//
// Modes:
//   SETUP (mode='edit'):  full CRUD, DnD, inspector visible
//   GAME  (mode='play'):  no editing, pad clicks → Slice 4 playback stub
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  currentScreen,
  currentDeckId,
  currentMode,
  currentBoard,
  currentDeck,
  allPadsView,
  libraryItems,
} from '../state/store';
import { applyBoardChange, updateBoard } from '../state/boardWrites';
import {
  getLastPlayed,
  getLastView,
  getPadSort,
  prefsVersion,
  setLastView,
  setPadSort,
} from '../state/prefs';
import { PAD_SORT_KEYS, PAD_SORT_LABELS, sortPads } from '../lib/padSort';
import { BoardTopBar } from '../components/BoardTopBar';
import { DeckRail } from '../components/DeckRail';
import { PadGrid } from '../components/PadGrid';
import { PadEditorPanel } from '../components/PadEditorPanel';
import { LibraryPanel } from '../components/LibraryPanel';
import { StatusBar } from '../components/StatusBar';
import { PixelIcon } from '../components/PixelIcon';
import type { AppMode, Pad, PadPosition } from '../types';
import { nanoid } from '../lib/nanoid';
import { DEFAULT_PAD_TYPE, newPad } from '../lib/padUtils';
import {
  DEFAULT_GRID,
  addDeck,
  addPadToFreeCell,
  addPadToPool,
  deckCount,
  deletePad,
  nextDeckName,
  removeFromDeck,
} from '../lib/boardModel';
import { type LibDndDropResult } from '../lib/libDnd';

type RightPanelMode = 'library' | 'editor' | 'empty';

export function BoardScreen(): JSX.Element {
  const board = currentBoard.value;
  /** All pads view: the whole pool instead of a deck (ADR-0048) — no deck is active then. */
  const poolView = allPadsView.value;
  const deck = poolView ? null : currentDeck.value;
  const mode = currentMode.value;

  const [rightPanel, setRightPanel] = useState<RightPanelMode>('empty');
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null);
  /** Mobile Place-Mode: non-null while user is tapping a slot to place a library item. */
  const [placeMode, setPlaceMode] = useState<{ itemId: string } | null>(null);

  // Open the board in the view it showed last (owner decision 2026-10-02): a deck that still
  // exists, or All pads; otherwise the first deck.
  // Dep is board?.id intentionally — we only auto-select on BOARD IDENTITY change,
  // not on every board mutation (which would re-override a user deck selection).
  useEffect(() => {
    const last = board ? getLastView(board.id) : null;
    allPadsView.value = last?.kind === 'all-pads';
    if (last?.kind === 'deck' && board?.decks.some((d) => d.id === last.deckId)) {
      currentDeckId.value = last.deckId;
    } else if (board && !currentDeckId.value && board.decks.length > 0) {
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

  // Path C — ADD PAD keyboard shortcut (key 'A' in SETUP mode)
  // Defined here (before early return) to satisfy Rules of Hooks — hooks must
  // always be called unconditionally. handleAddPad guards for !board/!deck.
  async function handleAddPad() {
    if (!board || (!deck && !poolView)) return;
    const deckId = deck?.id;
    // No file yet: the editor opens to choose one
    const pad = newPad(nanoid(), DEFAULT_PAD_TYPE, '', [], Date.now());
    // All pads: the pad goes to the pool only (owner decision 2026-10-02). In a deck the cell is
    // chosen on the latest board: a held or double-pressed A key adds pads to different cells.
    // Null = grid full (or save failed) — nothing to open.
    const { board: added } = applyBoardChange(board.id, (b) =>
      deckId ? addPadToFreeCell(b, deckId, pad) : addPadToPool(b, pad),
    );
    // Open the new pad at once, not after the save — a name typed meanwhile belongs to it
    if (added) {
      setSelectedPadId(pad.id);
      setRightPanel('editor');
    }
  }

  // One listener for the whole screen; it reads the state at key time — the mode signal and the
  // handler of the latest render. A listener re-registered in an effect lagged one paint behind:
  // an A pressed right after switching to SETUP still saw GAME and was ignored.
  const addPadRef = useRef(handleAddPad);
  addPadRef.current = handleAddPad;
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (currentMode.value !== 'edit') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'a' || e.key === 'A') void addPadRef.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

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
    if (result.kind === 'cancel' || !board || (!deck && !poolView)) return;
    const { itemId, targetPos } = result;
    const deckId = deck?.id;

    const item = libraryItems.value.find((m) => m.id === itemId);
    if (!item) return;

    const pad = newPad(nanoid(), DEFAULT_PAD_TYPE, item.name, [itemId], Date.now());

    // Deck: on the target cell; when it is taken, on the next free one (nothing when the grid is
    // full). All pads: into the pool, the drop position does not matter there.
    await updateBoard(board.id, (b) =>
      deckId ? addPadToFreeCell(b, deckId, pad, targetPos) : addPadToPool(b, pad),
    );
  }

  // ── Path B Mobile — Place-Mode ─────────────────────────────────────────────

  function handleEnterPlaceMode(itemId: string) {
    if (poolView) {
      // All pads has no cells to choose — the pad goes straight into the pool.
      void handleLibDrop({ kind: 'drop', itemId, targetPos: { col: 0, row: 0 } });
      return;
    }
    setPlaceMode({ itemId });
    setRightPanel('empty'); // close library panel so the grid is fully visible
  }

  async function handlePlaceModeTap(pos: PadPosition) {
    if (!placeMode || !deck || !board) return;
    const { itemId } = placeMode;
    setPlaceMode(null); // clear immediately so double-taps don't create two pads

    // A taken cell falls back to the next free one inside handleLibDrop.
    await handleLibDrop({ kind: 'drop', itemId, targetPos: pos });
  }

  async function handlePadDelete(padId: string) {
    if (!board) return;
    // Delete pad (ADR-0048): from the pool, every deck, quick access and combo steps.
    if (applyBoardChange(board.id, (b) => deletePad(b, padId)).board) {
      setSelectedPadId(null);
      setRightPanel('empty');
    }
  }

  async function handleRemoveFromDeck(padId: string) {
    if (!deck || !board) return;
    // Remove from deck (ADR-0048): only this placement; the pad stays in the pool and other decks.
    const deckId = deck.id;
    if (applyBoardChange(board.id, (b) => removeFromDeck(b, deckId, padId)).board) {
      setSelectedPadId(null);
      setRightPanel('empty');
    }
  }

  // ── All pads order (E1) ────────────────────────────────────────────────────

  void prefsVersion.value; // re-render when a preference changes (sort choice, last played)
  const padSort = getPadSort(board.id);
  const durations = new Map(libraryItems.value.map((m) => [m.id, m.duration]));
  const sortedPool = poolView
    ? sortPads(board.pads, padSort, {
        deckCount: (id) => deckCount(board, id),
        fileDuration: (id) => durations.get(id),
        lastPlayed: getLastPlayed,
      })
    : [];

  // ── Empty Board state ──────────────────────────────────────────────────────

  const hasDecks = board.decks.length > 0;

  // ── Pad for editor ─────────────────────────────────────────────────────────

  // Deck view: the pad must be placed in this deck. All pads: any pad of the pool.
  const selectedPad =
    poolView || (deck && deck.placements.some((p) => p.padId === selectedPadId))
      ? (board.pads.find((p) => p.id === selectedPadId) ?? null)
      : null;

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div class="sb-screen">
      <BoardTopBar
        boardName={board.name}
        deckName={poolView ? 'All pads' : deck?.name}
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
          activeDeckId={poolView ? null : currentDeckId.value}
          onDeckSelect={(id) => {
            allPadsView.value = false;
            currentDeckId.value = id;
            setLastView(board.id, { kind: 'deck', deckId: id });
            setSelectedPadId(null);
          }}
          allPadsActive={poolView}
          onAllPadsSelect={() => {
            allPadsView.value = true;
            setLastView(board.id, { kind: 'all-pads' });
            setSelectedPadId(null);
            setPlaceMode(null);
            if (rightPanel === 'editor') setRightPanel('empty');
          }}
        />

        {/* Center: Pad grid or empty states */}
        <main class="sb-board-main">
          {poolView ? (
            board.pads.length === 0 ? (
              // data-pos: a library drop lands here too (libDnd targets the closest [data-pos])
              <div class="sb-center-placeholder" data-pos="0,0">
                No pads yet. Add one with ADD PAD or drop a file from the library.
              </div>
            ) : (
              <>
                {/* Sort, Finder-style: a key with its natural direction, reversible; per board */}
                <div class="sb-pool-toolbar">
                  <select
                    class="sb-text-input"
                    data-testid="board-screen-sort-input"
                    aria-label="Sort pads by"
                    value={padSort.key}
                    onChange={(e) => {
                      const key = PAD_SORT_KEYS.find((k) => k === e.currentTarget.value);
                      if (key) setPadSort(board.id, { key, reversed: false });
                    }}
                  >
                    {PAD_SORT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {PAD_SORT_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <button
                    class="sb-btn sb-btn-sm sb-btn-ghost"
                    data-testid="board-screen-reverse-button"
                    aria-label="Reverse the order"
                    aria-pressed={padSort.reversed}
                    onClick={() =>
                      setPadSort(board.id, { ...padSort, reversed: !padSort.reversed })
                    }
                  >
                    {padSort.reversed ? '↑' : '↓'}
                  </button>
                </div>
                <PadGrid
                  deck={null}
                  poolOrder={sortedPool}
                  board={board}
                  mode={mode}
                  selectedPadId={selectedPadId}
                  onPadSelect={handlePadSelect}
                  placeMode={null}
                />
              </>
            )
          ) : !hasDecks ? (
            <EmptyBoardState
              onAddDeck={async () => {
                const id = nanoid();
                const { board: added } = applyBoardChange(board.id, (b) =>
                  addDeck(b, { id, name: nextDeckName(b), gridConfig: { ...DEFAULT_GRID } }),
                );
                if (added) currentDeckId.value = id;
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
          {mode === 'edit' && (deck || poolView) && (
            <div class="sb-setup-toolbar">
              <button class="sb-btn sb-btn-sm sb-btn-primary" onClick={handleAddPad}>
                <PixelIcon name="sparkle" size={11} />
                ADD PAD
              </button>
              <span class="sb-hint-text">
                or press <kbd class="sb-kbd">A</kbd>
              </span>
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
            {rightPanel === 'editor' && selectedPad && (
              <PadEditorPanel
                pad={selectedPad}
                deck={deck}
                board={board}
                onClose={handleEditorClose}
                onDelete={handlePadDelete}
                onRemoveFromDeck={handleRemoveFromDeck}
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
          poolView
            ? `All pads · ${board.pads.length} pad${board.pads.length !== 1 ? 's' : ''}`
            : deck
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
