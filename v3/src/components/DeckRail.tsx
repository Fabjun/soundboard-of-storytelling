// ─────────────────────────────────────────────────────────────────────────────
// DeckRail — left deck list panel for BoardScreen
//
// Source: design-sources/2026-05-25/v21-deck-crud.jsx
//
// Features:
//   - Deck tabs sorted by order
//   - Active tab highlight
//   - Inline rename (double-click)
//   - Hover action chips (RENAME · COPY · ×) — desktop
//   - Delete with confirmation + UndoToast
//   - Duplicate (copy pads + gridConfig)
//   - Reorder: NOT built yet (decided: drag & drop, mouse + touch — BACKLOG "Deck reorder")
//   - + NEW DECK button at bottom
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { Deck, Board } from '../types';
import { PixelIcon } from './PixelIcon';
import { UndoToast } from './UndoToast';
import { updateBoard } from '../state/boardWrites';
import {
  DEFAULT_GRID,
  addDeck as addDeckTo,
  deleteDeck,
  duplicateDeck as duplicateDeckIn,
  nextDeckName,
  renameDeck,
  restoreDeck,
} from '../lib/boardModel';
import { nanoid } from '../lib/nanoid';
import { findConflictingDeck } from '../lib/deckConflict';

interface DeckRailProps {
  board: Board;
  activeDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  /** The All pads entry is the active view (no deck active). */
  allPadsActive: boolean;
  onAllPadsSelect: () => void;
  conflictIds?: ReadonlySet<string>; // reserved for external conflict override; live detection is internal
}

export function DeckRail({
  board,
  activeDeckId,
  onDeckSelect,
  allPadsActive,
  onAllPadsSelect,
  conflictIds,
}: DeckRailProps): JSX.Element {
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
      const updatedBoard = await updateBoard(board.id, (b) => deleteDeck(b, deck.id));
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
    const saved = await updateBoard(board.id, (b) =>
      addDeckTo(b, { id, name: nextDeckName(b), gridConfig: { ...DEFAULT_GRID } }),
    );
    if (saved) onDeckSelect(id);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div class="sb-deck-rail" data-testid="deck-rail">
      {/* All pads — the whole pool, always the first entry (ADR-0048) */}
      <div
        class={'sb-deck-tab' + (allPadsActive ? ' is-active' : '')}
        data-testid="deck-rail-all-pads-tab"
        onClick={() => {
          onAllPadsSelect();
          setPendingDeleteId(null);
        }}
      >
        <span class="sb-deck-num-badge">≡</span>
        <span class="sb-flex-trunc">All pads</span>
        <span class="sb-count-text">{board.pads.length}</span>
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
            <div key={deck.id} class="sb-col">
              <div
                class={
                  'sb-deck-tab' +
                  (activeDeckId === deck.id ? ' is-active' : '') +
                  (editingId === deck.id ? ' is-editing' : '') +
                  (pendingDeleteId === deck.id ? ' is-danger' : '') +
                  (isConflict ? ' is-conflict' : '')
                }
                data-testid={`deck-rail-deck-tab-${deck.id}`}
                onClick={() => {
                  if (editingId !== deck.id) {
                    onDeckSelect(deck.id);
                    setPendingDeleteId(null);
                  }
                }}
                onDblClick={() => startRename(deck)}
              >
                {/* Deck number badge: its position in the rail, 1, 2, 3 … without gaps
                    (owner decision 2026-10-02), not the stored order number */}
                <span class="sb-deck-num-badge">{position + 1}</span>

                {/* Name or inline edit input */}
                {editingId === deck.id ? (
                  <>
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
                      onClick={(e) => e.stopPropagation()}
                      class="sb-deck-rename-input"
                      autoFocus
                    />
                    {isConflict && <span class="sb-deck-tab-conflict-glyph">!</span>}
                  </>
                ) : (
                  <span class="sb-flex-trunc">{deck.name}</span>
                )}

                {/* Pad count */}
                {editingId !== deck.id && (
                  <span class="sb-count-text">{deck.placements.length}</span>
                )}

                {/* Action chips (visible on hover / active) */}
                {editingId !== deck.id && (
                  <div class="sb-deck-tab-actions">
                    <button
                      class="sb-btn sb-btn-sm sb-btn-ghost sb-btn-icon"
                      data-testid={`deck-rail-rename-button-${deck.id}`}
                      title="Rename deck"
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

      {/* Undo toast */}
      {deletedDeck && (
        <UndoToast
          message={deletedDeck.message}
          durationMs={6000}
          onUndo={undoDelete}
          onDismiss={() => setDeletedDeck(null)}
        />
      )}
    </div>
  );
}
