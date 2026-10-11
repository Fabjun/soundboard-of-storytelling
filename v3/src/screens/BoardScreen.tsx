/**
 * @fileoverview BoardScreen — main board canvas
 *
 * Layout: BoardTopBar | 3-column main area | StatusBar
 *
 * Two frames (Slice 13a, docs/product/features/adaptive-layout.md): in the narrow frame (below
 * 600 px, src/state/windowClass.ts) the StatusBar is the dock and holds PAUSED and STOP ALL —
 * the thumb zone —, without the board and deck name the top bar already shows; in the wide frame
 * they stay in the top bar. The deck switcher (Slice 13b) is the rail on the left in the wide
 * frame and tabs above the grid in the narrow one (DeckRail `variant`).
 *
 * 3-column main area (wide frame):
 *   Left  220px  DeckRail  (All pads + deck list + CRUD)
 *   Center 1fr   PadGrid    (the deck's grid + Path A/B creation, or the All pads pool view)
 *   Right  280px LibraryPanel (toggles with the LIBRARY button)
 *
 * PadEditorPanel opens over all of it, full screen (ADR-0074, owner decision 2026-10-05).
 *
 * Modes:
 *   SETUP (mode='edit'):  full CRUD, DnD, inspector visible
 *   GAME  (mode='play'):  no editing; a tap plays or stops a pad
 */

import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  currentScreen,
  currentDeckId,
  currentMode,
  currentBoard,
  currentDeck,
  allPadsView,
  libraryItems,
  playingPads,
} from '../state/store';
import { applyBoardChange, updateBoard } from '../state/boardWrites';
import { switchMode } from '../state/modeControl';
import {
  getLastPlayed,
  getLastView,
  getPadSort,
  prefsVersion,
  setLastView,
  setPadSort,
} from '../state/prefs';
import { PAD_SORT_KEYS, PAD_SORT_LABELS, sortPads, type PadSort } from '../lib/padSort';
import { searchPads } from '../lib/padSearch';
import { nowPlayingText } from '../lib/nowPlaying';
import { BoardTopBar } from '../components/BoardTopBar';
import { DeckRail } from '../components/DeckRail';
import { QuickAccessBar } from '../components/QuickAccessBar';
import { PadGrid } from '../components/PadGrid';
import { PadEditorPanel } from '../components/PadEditorPanel';
import { LibraryPanel } from '../components/LibraryPanel';
import { StatusBar } from '../components/StatusBar';
import { LiveControls } from '../components/LiveControls';
import { PixelIcon } from '../components/PixelIcon';
import { narrowWindow } from '../state/windowClass';
import type { AppMode, Pad, PadPosition } from '../types';
import { nanoid } from '../lib/nanoid';
import { DEFAULT_PAD_TYPE, newPad } from '../lib/padUtils';
import {
  DEFAULT_GRID,
  addDeck,
  addPadToFreeCell,
  addPadToPool,
  deckCount,
  deckPadsInOrder,
  deletePad,
  nextDeckName,
  removeFromDeck,
  setBoardPadSize,
} from '../lib/boardModel';
import { type LibDndDropResult } from '../lib/libDnd';

type RightPanelMode = 'library' | 'editor' | 'empty';

/**
 * Shows the current board: deck rail, the grid of the current deck (or All pads) and the
 * library / pad editor panel; reopens the board in the view it was left in.
 */
export function BoardScreen(): JSX.Element {
  const board = currentBoard.value;
  /** All pads view: the whole pool instead of a deck (ADR-0048) — no deck is active then. */
  const poolView = allPadsView.value;
  const deck = poolView ? null : currentDeck.value;
  const mode = currentMode.value;

  const [rightPanel, setRightPanel] = useState<RightPanelMode>('empty');
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null);
  /** The PAD SIZE slider's value while it is dragged — the grid shows it live, nothing is saved yet. */
  const [padSizePreview, setPadSizePreview] = useState<number | null>(null);
  /** Mobile Place-Mode: non-null while user is tapping a slot to place a library item. */
  const [placeMode, setPlaceMode] = useState<{ itemId: string } | null>(null);
  // Search and a deck's sort belong to the view they were made in: another view starts without
  // them, so a deck shows its saved arrangement again (docs/product/README.md#board-decks--quick-access).
  // They are cleared while rendering the new view, not in an effect: an effect runs after the
  // frame and wiped what was typed right after a switch (found by a repeated E2E run) — react.dev,
  // "You Might Not Need an Effect", "Adjusting some state when a prop changes".
  const viewKey = poolView ? 'all-pads' : (deck?.id ?? '');
  /** The search in the current view (Slice 13c) — empty: every pad. */
  const [search, setSearch] = useState('');
  /** A deck's sort while it is chosen — null: the deck's own arrangement (temporary). */
  const [deckSort, setDeckSort] = useState<PadSort | null>(null);
  const [shownView, setShownView] = useState(viewKey);
  if (shownView !== viewKey) {
    setShownView(viewKey);
    setSearch('');
    setDeckSort(null);
  }

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

  // Path C — ADD PAD. No keyboard shortcut: the app is operated by its buttons (owner decision
  // 2026-10-02 — keyboard control of the app is Parked; pad keys in GAME are Slice 12).
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

  // Every playing pad of the board, also one in another deck (Slice 13f, docs/product/features/adaptive-layout.md#decided L9)
  const playing = nowPlayingText(playingPads.value, board.pads);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleModeSwitch(newMode: AppMode) {
    // Stops every sound first; the Lock keeps GAME (Slice 12c)
    switchMode(newMode);
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
  const sortContext = {
    deckCount: (id: string) => deckCount(board, id),
    fileDuration: (id: string) => durations.get(id),
    lastPlayed: getLastPlayed,
  };
  const sortedPool = poolView ? searchPads(sortPads(board.pads, padSort, sortContext), search) : [];
  // A deck while a search or a sort is active: its pads in that order (Slice 13c); otherwise
  // undefined — the deck shows its arrangement and its pads can be moved
  const deckOrder =
    deck && (search.trim() !== '' || deckSort)
      ? searchPads(
          deckSort
            ? sortPads(deckPadsInOrder(board, deck), deckSort, sortContext)
            : deckPadsInOrder(board, deck),
          search,
        )
      : undefined;

  // ── Empty Board state ──────────────────────────────────────────────────────

  const hasDecks = board.decks.length > 0;

  // ── Pad for editor ─────────────────────────────────────────────────────────

  // The open editor stays with its pad while the pad is in the board's pool — also when ★ takes a
  // pad out of the quick-access bar that the shown deck does not hold (owner report 2026-10-11:
  // the editor vanished). A deck or view switch clears the selection itself.
  const selectedPad = board.pads.find((p) => p.id === selectedPadId) ?? null;

  // ── Layout ─────────────────────────────────────────────────────────────────

  // A search that finds nothing says so, in plain words (Nielsen 9) — the grid alone would just
  // be empty
  const shownCount = poolView ? sortedPool.length : (deckOrder?.length ?? null);
  const noMatch = search.trim() !== '' && shownCount === 0 && (
    <div class="sb-center-placeholder" data-testid="board-screen-no-match-text">
      No pad here has &quot;{search.trim()}&quot; in its name.
    </div>
  );

  /**
   * Search and sort above the grid (Slice 13c, docs/product/README.md#board-decks--quick-access) —
   * one bar for All pads and the decks.
   * All pads: the sort is stored per board (Finder-style, E1). A deck: its arrangement unless a
   * sort is chosen, which lasts until the view changes; "Not in a deck first" means nothing there.
   */
  const padToolbar = () => {
    const sort = poolView ? padSort : deckSort;
    const keys = poolView ? PAD_SORT_KEYS : PAD_SORT_KEYS.filter((k) => k !== 'unplaced');
    const choose = (next: PadSort | null) =>
      poolView ? next && setPadSort(board.id, next) : setDeckSort(next);
    return (
      <div class="sb-pool-toolbar">
        <input
          type="search"
          class="sb-text-input sb-flex-1"
          data-testid="board-screen-search-input"
          aria-label="Search pads by name"
          placeholder="Search"
          value={search}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
        {/* Sort, Finder-style: a key with its natural direction, reversible */}
        <select
          class="sb-text-input"
          data-testid="board-screen-sort-input"
          aria-label="Sort pads by"
          value={sort?.key ?? ''}
          onChange={(e) => {
            const key = keys.find((k) => k === e.currentTarget.value);
            choose(key ? { key, reversed: false } : null);
          }}
        >
          {!poolView && <option value="">Arrangement</option>}
          {keys.map((k) => (
            <option key={k} value={k}>
              {PAD_SORT_LABELS[k]}
            </option>
          ))}
        </select>
        {sort && (
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost"
            data-testid="board-screen-reverse-button"
            aria-label="Reverse the order"
            aria-pressed={sort.reversed}
            onClick={() => choose({ ...sort, reversed: !sort.reversed })}
          >
            {sort.reversed ? '↑' : '↓'}
          </button>
        )}
      </div>
    );
  };

  /** The deck switcher — the rail on the left (wide frame) or tabs above the grid (narrow). */
  const deckSwitcher = (variant: 'rail' | 'tabs') => (
    <DeckRail
      variant={variant}
      manage={mode === 'edit'}
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
      padSize={
        mode === 'edit' && (deck || poolView)
          ? {
              value: padSizePreview ?? board.padSize,
              onChange: setPadSizePreview,
              onCommit: (px) => {
                // Stored once, when the move ends; shown at once, so the preview can go
                applyBoardChange(board.id, (b) => setBoardPadSize(b, px));
                setPadSizePreview(null);
              },
            }
          : undefined
      }
    />
  );

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
        {/* Left: Deck rail (wide frame) */}
        {!narrowWindow.value && deckSwitcher('rail')}

        {/* Center: Pad grid or empty states */}
        <main class="sb-board-main">
          {/* Top: deck tabs (narrow frame, Slice 13b) */}
          {narrowWindow.value && deckSwitcher('tabs')}
          {/* Board-wide, the same in every view (Slice 13d) — shown while it holds a pad */}
          <QuickAccessBar board={board} mode={mode} onPadSelect={handlePadSelect} />

          {poolView ? (
            board.pads.length === 0 ? (
              // data-pos: a library drop lands here too (libDnd targets the closest [data-pos])
              <div class="sb-center-placeholder" data-pos="0,0">
                No pads yet. Add one with ADD PAD or drop a file from the library.
              </div>
            ) : (
              <>
                {padToolbar()}
                {noMatch}
                <PadGrid
                  deck={null}
                  poolOrder={sortedPool}
                  board={board}
                  mode={mode}
                  selectedPadId={selectedPadId}
                  onPadSelect={handlePadSelect}
                  placeMode={null}
                  padSizePreview={padSizePreview}
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
              {deck.placements.length > 0 && padToolbar()}
              {noMatch}
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
                deckOrder={deckOrder}
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
                padSizePreview={padSizePreview}
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
                key={selectedPad.id}
                pad={selectedPad}
                // A quick-access pad that is not in this deck opens as from All pads: no deck key,
                // no "remove from deck" for a deck it is not in
                deck={deck?.placements.some((p) => p.padId === selectedPad.id) ? deck : null}
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

      {narrowWindow.value ? (
        <StatusBar
          mode={mode}
          dock
          playing={playing}
          right={mode === 'play' ? <LiveControls place="dock" /> : undefined}
        />
      ) : (
        <StatusBar
          mode={mode}
          boardName={board.name}
          playing={playing}
          infoText={
            poolView
              ? `All pads · ${board.pads.length} pad${board.pads.length !== 1 ? 's' : ''}`
              : deck
                ? `${deck.name} · ${deck.placements.length} pad${deck.placements.length !== 1 ? 's' : ''}`
                : 'No deck selected'
          }
        />
      )}
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
