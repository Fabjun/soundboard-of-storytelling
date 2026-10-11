/**
 * @fileoverview DeckRail — left deck list panel for BoardScreen
 *
 * Source: design-sources/2026-05-25/v21-deck-crud.jsx
 *
 * Features:
 *   - Deck tabs sorted by order
 *   - Active tab highlight
 *   - Inline rename (double-click)
 *   - Hover action chips (RENAME · COPY · ×) — desktop
 *   - Delete with confirmation + UndoToast
 *   - Duplicate: the copy places the same pads of the pool (shared, not copied) and appears
 *     directly after the original
 *   - Reorder (Slice 13g): in SETUP the active deck moves with ▲ / ▼ or its drag handle
 *   - + NEW DECK button at bottom
 *   - PAD SIZE slider of the board — all decks and All pads — in SETUP (ADR-0075; V1 had it in the
 *     side menu)
 *   - Folds to its toggle button (owner decision 2026-10-05): it starts folded, so the pads get the
 *     width, and the toggle opens it
 *
 * Two variants of one deck switcher (Slice 13b, docs/product/features/adaptive-layout.md L3, L4):
 * `rail` — the column on the left, in the wide frame; `tabs` — a row of tabs above the pad grid,
 * in the narrow frame: All pads first, then every deck, one tap switches, the row scrolls sideways.
 * With `manage` (SETUP) a DECKS button at the end of the row opens the rail's content — PAD SIZE,
 * the deck actions, NEW DECK — as a panel over the grid.
 */

import { useEffect, useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { Deck, Board } from '../types';
import { PixelIcon } from './PixelIcon';
import { UndoToast } from './UndoToast';
import { applyBoardChange, updateBoard } from '../state/boardWrites';
import {
  DEFAULT_GRID,
  addDeck as addDeckTo,
  deleteDeck,
  duplicateDeck as duplicateDeckIn,
  moveDeck,
  nextDeckName,
  renameDeck,
  restoreDeck,
} from '../lib/boardModel';
import { nanoid } from '../lib/nanoid';
import { PAD_SIZE } from '../lib/padSize';
import { SliderRow } from './SliderRow';
import { findConflictingDeck } from '../lib/deckConflict';
import { DECK_DRAG_THRESHOLD, deckDropIndex } from '../lib/deckDnd';

interface DeckRailProps {
  board: Board;
  activeDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  /** The All pads entry is the active view (no deck active). */
  allPadsActive: boolean;
  onAllPadsSelect: () => void;
  conflictIds?: ReadonlySet<string>; // reserved for external conflict override; live detection is internal
  /**
   * The board's PAD SIZE slider (ADR-0075) — given in SETUP with a deck or All pads open, absent
   * otherwise. One size for every deck of the board (owner decision 2026-10-06).
   * `onChange` follows the slider live (preview), `onCommit` stores the size once the move ends.
   */
  padSize?: { value: number; onChange: (px: number) => void; onCommit: (px: number) => void };
  /** `rail` (wide frame, the default) or `tabs` above the pad grid (narrow frame). */
  variant?: 'rail' | 'tabs';
  /** SETUP: the tabs show the DECKS button that opens the deck actions; the active deck can move. */
  manage?: boolean;
}

/**
 * Shows the board's decks as tabs, with All pads first: select, rename, duplicate, delete with
 * undo, and add a deck.
 */
export function DeckRail({
  board,
  activeDeckId,
  onDeckSelect,
  allPadsActive,
  onAllPadsSelect,
  conflictIds,
  padSize,
  variant = 'rail',
  manage = false,
}: DeckRailProps): JSX.Element {
  // Starts folded, so the pads get the width (owner decision 2026-10-05); for the tabs: the
  // DECKS panel starts closed
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [conflictOwner, setConflictOwner] = useState<Deck | null>(null);
  const committingForRef = useRef<string | null>(null);
  const [deletedDeck, setDeletedDeck] = useState<{
    deck: Deck;
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const decks = [...board.decks].sort((a, b) => a.order - b.order);

  // ── Rename ────────────────────────────────────────────────────────────────

  function startRename(deck: Deck) {
    setEditingId(deck.id);
    setEditValue(deck.name);
    setConflictOwner(null);
    // Focus input on next tick
    requestAnimationFrame(() => inputRef.current?.select());
  }

  async function commitRename(deckId: string, source: 'enter' | 'blur' = 'enter') {
    // Conflict guard: Enter stays in edit mode; blur discards (revert + exit)
    if (conflictOwner !== null) {
      if (source === 'blur') cancelRename();
      return;
    }
    // Re-entrancy guard: blocks double-Enter, Enter+blur overlap, iOS keyboard quirks
    if (committingForRef.current !== null) return;
    const newName = editValue.trim();
    if (!newName) {
      setEditingId(null);
      setConflictOwner(null);
      return;
    }
    committingForRef.current = deckId;
    try {
      // Shown at once and saved; Escape during the save is too late to cancel — the rename commits.
      await updateBoard(board.id, (b) => renameDeck(b, deckId, newName));
    } finally {
      committingForRef.current = null;
      // Functional update: don't clobber a different deck's active edit
      setEditingId((prev) => (prev === deckId ? null : prev));
      setConflictOwner(null);
    }
  }

  function cancelRename() {
    setEditingId(null);
    setConflictOwner(null);
  }

  // ── Duplicate ─────────────────────────────────────────────────────────────

  async function duplicateDeck(deck: Deck) {
    const existing = board.decks.filter((s) => s.name.startsWith(deck.name));
    const suffix = existing.length > 1 ? ` · ${existing.length}` : ' · 2';
    // Same pads, new placements (docs/architecture/0048-pad-pool-decks.md#2-behavior-final-not-provisional) — no pad copies.
    const copyId = nanoid();
    await updateBoard(board.id, (b) => duplicateDeckIn(b, deck.id, copyId, deck.name + suffix));
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function requestDelete(deck: Deck) {
    if (pendingDeleteId === deck.id) {
      // Second tap: execute. Undo keeps only the deck — not a copy of the whole board, which
      // would undo every other change made while the toast is shown.
      const { board: updatedBoard } = applyBoardChange(board.id, (b) => deleteDeck(b, deck.id));
      if (updatedBoard) {
        setDeletedDeck({
          deck,
          message: `Deleted '${deck.name}' · ${deck.placements.length} pad${deck.placements.length !== 1 ? 's' : ''}`,
        });
        // If deleted deck was active, switch to first remaining
        if (activeDeckId === deck.id && updatedBoard.decks.length > 0) {
          onDeckSelect([...updatedBoard.decks].sort((a, b) => a.order - b.order)[0].id);
        }
      }
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(deck.id);
    }
  }

  async function undoDelete() {
    if (!deletedDeck) return;
    const { deck } = deletedDeck;
    await updateBoard(board.id, (b) => restoreDeck(b, deck));
    setDeletedDeck(null);
  }

  // ── New Deck ─────────────────────────────────────────────────────────────

  async function addDeck() {
    const id = nanoid();
    // Smallest unused "Deck N" (never the deck count — after a delete the count can repeat a
    // name still in use); addDeck appends it at the end.
    const { board: added } = applyBoardChange(board.id, (b) =>
      addDeckTo(b, { id, name: nextDeckName(b), gridConfig: { ...DEFAULT_GRID } }),
    );
    if (added) onDeckSelect(id);
  }

  // ── Reorder (Slice 13g, docs/product/features/adaptive-layout.md#decided L6) ────────────────
  // The active deck in SETUP moves with ▲ / ▼ or by its drag handle (Pointer Events, never HTML5
  // drag & drop). `to` is the index it would take now, shown as an insert line.

  const [drag, setDrag] = useState<{ deckId: string; from: number; to: number } | null>(null);
  const dragStartRef = useRef<{ y: number; from: number; moved: boolean } | null>(null);

  function moveTo(deckId: string, to: number) {
    void updateBoard(board.id, (b) => moveDeck(b, deckId, to));
  }

  function onHandleDown(e: PointerEvent, from: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { y: e.clientY, from, moved: false };
  }

  function onHandleMove(e: PointerEvent, deckId: string) {
    const start = dragStartRef.current;
    if (!start) return;
    if (!start.moved && Math.abs(e.clientY - start.y) < DECK_DRAG_THRESHOLD) return;
    start.moved = true;
    const rows = (e.currentTarget as HTMLElement)
      .closest('.sb-deck-rail')
      ?.querySelectorAll<HTMLElement>('[data-deck-row]');
    const centers = [...(rows ?? [])].map((r) => {
      const box = r.getBoundingClientRect();
      return box.top + box.height / 2;
    });
    setDrag({ deckId, from: start.from, to: deckDropIndex(e.clientY, centers, start.from) });
  }

  function onHandleUp(deckId: string) {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (start?.moved && drag && drag.to !== drag.from) moveTo(deckId, drag.to);
    setDrag(null);
  }

  function onHandleCancel() {
    dragStartRef.current = null;
    setDrag(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const toggle = (
    <button
      class="sb-deck-rail-toggle"
      aria-expanded={open}
      aria-label={open ? 'Hide the deck list' : 'Show the deck list'}
      onClick={() => setOpen(!open)}
      data-testid="deck-rail-toggle-button"
    >
      {open ? '◀' : '▶'}
    </button>
  );
  // Tabs: the current deck is always in view, also far along a long row (L3) — when it changes,
  // not on every render, so a row scrolled by hand stays where it was
  const tabRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabRowRef.current
      ?.querySelector('[aria-current]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [activeDeckId, allPadsActive, variant]);

  // The rail's content — shown in the rail, and in the tabs' DECKS panel
  const content = (
    <>
      {/* The board's pad size, for all decks — V1 had this slider in the side menu (ADR-0075) */}
      {padSize && (
        <div class="sb-inspector-section">
          <SliderRow
            label="PAD SIZE"
            value={padSize.value}
            min={PAD_SIZE.min}
            max={PAD_SIZE.max}
            step={PAD_SIZE.step}
            format={(v) => `${v}px`}
            onChange={padSize.onChange}
            onCommit={padSize.onCommit}
            testid="deck-rail-pad-size-slider"
          />
        </div>
      )}
      {/* All pads — the whole pool, always the first entry (ADR-0048) */}
      <div
        class={'sb-deck-tab' + (allPadsActive ? ' is-active' : '')}
        data-testid="deck-rail-all-pads-tab"
      >
        {/* A real button — reached with Tab (owner rule 2026-10-02) */}
        <button
          type="button"
          class="sb-row-button"
          aria-current={allPadsActive || undefined}
          data-testid="deck-rail-all-pads-button"
          onClick={() => {
            onAllPadsSelect();
            setPendingDeleteId(null);
          }}
        >
          <span class="sb-deck-num-badge">≡</span>
          <span class="sb-flex-trunc">All pads</span>
          <span class="sb-count-text">{board.pads.length}</span>
        </button>
      </div>
      {decks.length === 0 ? (
        <div class="sb-panel-empty">
          No decks yet.
          <br />
          Add one below.
        </div>
      ) : (
        decks.map((deck, position) => {
          const isConflict =
            editingId === deck.id ? conflictOwner !== null : (conflictIds?.has(deck.id) ?? false);
          return (
            <div key={deck.id} class="sb-col" data-deck-row>
              <div
                class={
                  'sb-deck-tab' +
                  (activeDeckId === deck.id ? ' is-active' : '') +
                  (editingId === deck.id ? ' is-editing' : '') +
                  (pendingDeleteId === deck.id ? ' is-danger' : '') +
                  (isConflict ? ' is-conflict' : '') +
                  (drag?.deckId === deck.id ? ' is-drag-source' : '') +
                  (drag && drag.to !== drag.from && drag.to === position
                    ? drag.to < drag.from
                      ? ' is-insert-before'
                      : ' is-insert-after'
                    : '')
                }
                data-testid={`deck-rail-deck-tab-${deck.id}`}
              >
                {/* Name or inline edit input */}
                {editingId === deck.id ? (
                  <>
                    {/* Deck number badge: its position in the rail, 1, 2, 3 … without gaps
                        (owner decision 2026-10-02), not the stored order number */}
                    <span class="sb-deck-num-badge">{position + 1}</span>
                    <input
                      ref={inputRef}
                      data-testid="deck-rail-name-input"
                      value={editValue}
                      onInput={(e) => {
                        const v = (e.target as HTMLInputElement).value;
                        setEditValue(v);
                        setConflictOwner(findConflictingDeck(board.decks, v, deck.id));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitRename(deck.id);
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelRename();
                        }
                      }}
                      onBlur={() => commitRename(deck.id, 'blur')}
                      class="sb-deck-rename-input"
                      aria-label="Deck name"
                      autoFocus
                    />
                    {isConflict && <span class="sb-deck-tab-conflict-glyph">!</span>}
                  </>
                ) : (
                  /* Choosing the deck is a real button — reached with Tab (owner rule
                     2026-10-02); a double click renames, as before */
                  <button
                    type="button"
                    class="sb-row-button"
                    aria-current={activeDeckId === deck.id || undefined}
                    data-testid={`deck-rail-select-button-${deck.id}`}
                    onClick={() => {
                      onDeckSelect(deck.id);
                      setPendingDeleteId(null);
                    }}
                    onDblClick={() => startRename(deck)}
                  >
                    {/* Deck number badge: its position in the rail, 1, 2, 3 … without gaps
                        (owner decision 2026-10-02), not the stored order number */}
                    <span class="sb-deck-num-badge">{position + 1}</span>
                    <span class="sb-flex-trunc">{deck.name}</span>
                    <span class="sb-count-text">{deck.placements.length}</span>
                  </button>
                )}

                {/* Action chips (visible on hover / active) */}
                {editingId !== deck.id && (
                  <div class="sb-deck-tab-actions">
                    <button
                      class="sb-btn sb-btn-sm sb-btn-ghost sb-btn-icon"
                      data-testid={`deck-rail-rename-button-${deck.id}`}
                      title="Rename deck"
                      aria-label={`Rename deck ${deck.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(deck);
                      }}
                    >
                      <PixelIcon name="edit" size={11} />
                    </button>
                    <button
                      class="sb-btn sb-btn-sm sb-btn-ghost sb-btn-icon"
                      data-testid={`deck-rail-copy-button-${deck.id}`}
                      title="Duplicate deck"
                      aria-label={`Duplicate deck ${deck.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateDeck(deck);
                      }}
                    >
                      <PixelIcon name="save" size={11} />
                    </button>
                    <button
                      class={`sb-btn sb-btn-sm sb-btn-icon ${pendingDeleteId === deck.id ? 'sb-btn-danger' : 'sb-btn-ghost'}`}
                      data-testid={`deck-rail-delete-button-${deck.id}`}
                      title={
                        pendingDeleteId === deck.id
                          ? 'Click again to confirm delete'
                          : 'Delete deck'
                      }
                      aria-label={
                        pendingDeleteId === deck.id
                          ? `Delete deck ${deck.name} — press again to confirm`
                          : `Delete deck ${deck.name}`
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDelete(deck);
                      }}
                    >
                      {pendingDeleteId === deck.id ? '!!' : '×'}
                    </button>
                  </div>
                )}
              </div>

              {/* Reorder (Slice 13g): a line of its own under the active deck in SETUP, so the
                  name keeps its room — the row has only 58 px left next to its action buttons.
                  The handle is the pointer way; ▲ / ▼ are the way without dragging (WCAG 2.2
                  SC 2.5.7) and the keyboard's, as in the PAD editor's file list. */}
              {manage && activeDeckId === deck.id && editingId !== deck.id && (
                <div class="sb-deck-tab-move" role="group" aria-label={`Move deck ${deck.name}`}>
                  <span
                    class="sb-deck-drag-handle"
                    aria-hidden="true"
                    data-testid={`deck-rail-drag-region-${deck.id}`}
                    onPointerDown={(e: PointerEvent) => onHandleDown(e, position)}
                    onPointerMove={(e: PointerEvent) => onHandleMove(e, deck.id)}
                    onPointerUp={() => onHandleUp(deck.id)}
                    onPointerCancel={onHandleCancel}
                  >
                    ⣿
                  </span>
                  <button
                    type="button"
                    class="sb-btn sb-btn-sm sb-btn-ghost"
                    data-testid={`deck-rail-move-up-button-${deck.id}`}
                    aria-label={`Move deck ${deck.name} up`}
                    disabled={position === 0}
                    onClick={() => moveTo(deck.id, position - 1)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    class="sb-btn sb-btn-sm sb-btn-ghost"
                    data-testid={`deck-rail-move-down-button-${deck.id}`}
                    aria-label={`Move deck ${deck.name} down`}
                    disabled={position === decks.length - 1}
                    onClick={() => moveTo(deck.id, position + 1)}
                  >
                    ▼
                  </button>
                </div>
              )}

              {isConflict && (
                <div class="sb-deck-conflict-hint">
                  Name already used by <em>{conflictOwner?.name ?? ''}</em>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add deck button */}
      <button
        class="sb-btn sb-btn-ghost sb-deck-add-btn"
        data-testid="deck-rail-new-button"
        onClick={addDeck}
      >
        <PixelIcon name="sparkle" size={12} />+ NEW DECK
      </button>
    </>
  );

  const undoToast = deletedDeck && (
    <UndoToast
      message={deletedDeck.message}
      durationMs={6000}
      onUndo={undoDelete}
      onDismiss={() => setDeletedDeck(null)}
    />
  );

  if (variant === 'tabs') {
    return (
      <div class="sb-tab-bar sb-deck-tabs" data-testid="deck-rail">
        <div class="sb-tabs sb-tabs-scroll" ref={tabRowRef}>
          <button
            type="button"
            class={'sb-tab' + (allPadsActive ? ' is-active' : '')}
            aria-current={allPadsActive || undefined}
            data-testid="deck-rail-all-pads-tab-button"
            onClick={onAllPadsSelect}
          >
            All pads
          </button>
          {decks.map((deck, position) => (
            <button
              key={deck.id}
              type="button"
              class={'sb-tab' + (activeDeckId === deck.id ? ' is-active' : '')}
              aria-current={activeDeckId === deck.id || undefined}
              data-testid={`deck-rail-tab-button-${deck.id}`}
              onClick={() => onDeckSelect(deck.id)}
            >
              {position + 1} {deck.name}
            </button>
          ))}
        </div>
        {/* Outside the scrolling row, so it stays in view however many decks there are */}
        {manage && (
          <button
            type="button"
            class={'sb-tab' + (open ? ' is-active' : '')}
            aria-expanded={open}
            data-testid="deck-rail-manage-button"
            onClick={() => setOpen(!open)}
          >
            DECKS
          </button>
        )}
        {manage && open && (
          <div class="sb-deck-rail sb-deck-rail-sheet" data-testid="deck-rail-sheet-region">
            {content}
          </div>
        )}
        {undoToast}
      </div>
    );
  }

  if (!open) {
    return (
      <div class="sb-deck-rail is-closed" data-testid="deck-rail">
        {toggle}
      </div>
    );
  }

  return (
    <div class="sb-deck-rail" data-testid="deck-rail">
      {toggle}
      {content}
      {undoToast}
    </div>
  );
}
