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
import { boardPut } from '../db/idb';
import { upsertBoard } from '../state/store';
import { nanoid } from '../lib/nanoid';
import { findConflictingDeck } from '../lib/deckConflict';

interface DeckRailProps {
  board: Board;
  activeDeckId: string | null;
  onDeckSelect: (deckId: string) => void;
  conflictIds?: ReadonlySet<string>; // reserved for external conflict override; live detection is internal
}

export function DeckRail({
  board,
  activeDeckId,
  onDeckSelect,
  conflictIds,
}: DeckRailProps): JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [conflictOwner, setConflictOwner] = useState<Deck | null>(null);
  const committingForRef = useRef<string | null>(null);
  const [deletedDeck, setDeletedDeck] = useState<{
    deck: Deck;
    boardSnapshot: Board;
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
    const updatedBoard: Board = {
      ...board,
      decks: board.decks.map((s) => (s.id === deckId ? { ...s, name: newName } : s)),
    };
    try {
      await boardPut(updatedBoard);
      // boardPut has committed to IDB — upsertBoard must always follow to keep
      // in-memory state consistent with the DB. Escape-during-await is "too late"
      // to cancel an in-flight IDB transaction; the rename commits.
      upsertBoard(updatedBoard);
    } catch (e) {
      console.error('Deck rename failed:', e);
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
    const newDeck: Deck = {
      ...deck,
      id: nanoid(),
      name: deck.name + suffix,
      order: Math.max(...board.decks.map((s) => s.order)) + 1,
      pads: deck.pads.map((p) => ({ ...p, id: nanoid() })),
    };
    const updatedBoard: Board = {
      ...board,
      decks: [...board.decks, newDeck],
    };
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
    } catch (e) {
      console.error('Deck duplicate failed:', e);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function requestDelete(deck: Deck) {
    if (pendingDeleteId === deck.id) {
      // Second tap: execute
      const boardSnapshot = { ...board };
      const updatedBoard: Board = {
        ...board,
        decks: board.decks.filter((s) => s.id !== deck.id),
      };
      try {
        await boardPut(updatedBoard);
        upsertBoard(updatedBoard);
        setDeletedDeck({
          deck,
          boardSnapshot,
          message: `Deleted '${deck.name}' · ${deck.pads.length} pad${deck.pads.length !== 1 ? 's' : ''}`,
        });
        // If deleted deck was active, switch to first remaining
        if (activeDeckId === deck.id && updatedBoard.decks.length > 0) {
          onDeckSelect(updatedBoard.decks.sort((a, b) => a.order - b.order)[0].id);
        }
      } catch (e) {
        console.error('Deck delete failed:', e);
      }
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(deck.id);
    }
  }

  async function undoDelete() {
    if (!deletedDeck) return;
    try {
      await boardPut(deletedDeck.boardSnapshot);
      upsertBoard(deletedDeck.boardSnapshot);
    } catch (e) {
      console.error('Deck undo failed:', e);
    }
    setDeletedDeck(null);
  }

  // ── New Deck ─────────────────────────────────────────────────────────────

  async function addDeck() {
    const newDeck: Deck = {
      id: nanoid(),
      name: `Deck ${board.decks.length + 1}`,
      order: board.decks.length,
      gridConfig: { cols: 4, rows: 4, gap: 8, padSize: 'md' },
      pads: [],
    };
    const updatedBoard: Board = {
      ...board,
      decks: [...board.decks, newDeck],
    };
    try {
      await boardPut(updatedBoard);
      upsertBoard(updatedBoard);
      onDeckSelect(newDeck.id);
    } catch (e) {
      console.error('Add deck failed:', e);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div class="sb-deck-rail" data-testid="deck-rail">
      {decks.length === 0 ? (
        <div class="sb-panel-empty">
          No decks yet.
          <br />
          Add one below.
        </div>
      ) : (
        decks.map((deck) => {
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
                {/* Deck number badge */}
                <span class="sb-deck-num-badge">{deck.order + 1}</span>

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
                {editingId !== deck.id && <span class="sb-count-text">{deck.pads.length}</span>}

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
