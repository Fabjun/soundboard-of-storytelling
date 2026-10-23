/**
 * @fileoverview TemplateAddDialog — where ADD TO BOARD puts a pad from a template (Slice 16d,
 * library.md L6)
 *
 * The library belongs to no board, so the question names one: a board (a choice of one among a
 * few — radio buttons, WAI-ARIA APG Radio Group) and, on it, a deck or none (the pad then sits in
 * the board's pool, All pads). Asked in the app's one dialog (ConfirmDialog, ADR-0074).
 */

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { ConfirmDialog } from './ConfirmDialog';
import type { Board } from '../types';

/** The deck value of "no deck — All pads only"; deck ids are never empty. */
const POOL = '';

/** Asks where a pad from the template `name` goes; `onAdd` gets the board and the deck (or null). */
export function TemplateAddDialog({
  name,
  boards,
  onAdd,
  onCancel,
}: {
  name: string;
  boards: readonly Board[];
  onAdd: (boardId: string, deckId: string | null) => void;
  onCancel: () => void;
}): JSX.Element {
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '');
  const board = boards.find((b) => b.id === boardId);
  const decks = board ? [...board.decks].sort((a, b) => a.order - b.order) : [];
  const [deckId, setDeckId] = useState<string>(decks[0]?.id ?? POOL);
  // A deck of another board is no choice: fall back to the first deck of the board chosen now
  const deck = decks.some((d) => d.id === deckId) ? deckId : (decks[0]?.id ?? POOL);

  return (
    <ConfirmDialog
      title={`Add '${name}' to which board?`}
      confirmLabel="ADD"
      onConfirm={() => board && onAdd(board.id, deck === POOL ? null : deck)}
      onCancel={onCancel}
    >
      {boards.length === 0 ? (
        <div class="sb-dialog-section">
          There is no board yet — make one in the board list first.
        </div>
      ) : (
        <>
          <div class="sb-dialog-section sb-col" role="radiogroup" aria-label="Board">
            {boards.map((b) => (
              <label key={b.id} class="sb-check-row">
                <input
                  type="radio"
                  name="template-board"
                  checked={b.id === boardId}
                  onChange={() => setBoardId(b.id)}
                />
                <span class="sb-flex-trunc">{b.name}</span>
              </label>
            ))}
          </div>
          <div class="sb-dialog-section">
            <select
              class="sb-text-input"
              aria-label="Deck"
              value={deck}
              onChange={(e) => setDeckId(e.currentTarget.value)}
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
              <option value={POOL}>No deck — All pads only</option>
            </select>
          </div>
        </>
      )}
    </ConfirmDialog>
  );
}
