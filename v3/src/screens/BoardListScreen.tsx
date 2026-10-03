// ─────────────────────────────────────────────────────────────────────────────
// BoardListScreen — list all boards, create / rename / delete
//
// Pattern mirrors LibraryScreen: TopBar + list rows + StatusBar.
// Each board row follows the AudioRow pattern (inline rename, 2-tap delete).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { PixelIcon } from '../components/PixelIcon';
import {
  currentScreen,
  currentBoardId,
  currentDeckId,
  boards,
  removeBoardFromStore,
} from '../state/store';
import { boardDelete } from '../db/idb';
import { clearLastView } from '../db/prefs';
import { createBoard, updateBoard } from '../state/boardWrites';
import type { Board } from '../types';
import { nanoid } from '../lib/nanoid';

export function BoardListScreen(): JSX.Element {
  const allBoards = boards.value;

  async function handleCreate() {
    const name = `Board ${allBoards.length + 1}`;
    const newBoard: Board = {
      id: nanoid(),
      name,
      themeId: 'hearth',
      pads: [],
      decks: [],
      quickAccess: [],
    };
    await createBoard(newBoard);
  }

  function openBoard(board: Board) {
    currentBoardId.value = board.id;
    currentDeckId.value =
      board.decks.length > 0 ? [...board.decks].sort((a, b) => a.order - b.order)[0].id : null;
    currentScreen.value = 'board';
  }

  return (
    <div class="sb-screen">
      <TopBar
        title="Boards"
        breadcrumb={`${allBoards.length} board${allBoards.length !== 1 ? 's' : ''}`}
        right={
          <div class="sb-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-primary"
              data-testid="board-list-screen-new-button"
              onClick={handleCreate}
            >
              <PixelIcon name="sparkle" size={11} />
              NEW BOARD
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              onClick={() => {
                currentScreen.value = 'start';
              }}
            >
              <PixelIcon name="flame" size={11} />
              BACK
            </button>
          </div>
        }
      />

      {/* Board list */}
      <div class="sb-board-list-area">
        {allBoards.length === 0 ? (
          <EmptyBoardsState onCreate={handleCreate} />
        ) : (
          allBoards.map((board) => (
            <BoardRow key={board.id} board={board} onOpen={() => openBoard(board)} />
          ))
        )}
      </div>

      <StatusBar
        mode="edit"
        boardName="Board List"
        infoText={`${allBoards.length} board${allBoards.length !== 1 ? 's' : ''}`}
      />
    </div>
  );
}

// ── BoardRow ──────────────────────────────────────────────────────────────────

function BoardRow({ board, onOpen }: { board: Board; onOpen: () => void }): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(board.name);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const totalPads = board.pads.length; // the pool: each pad counts once, however many decks show it
  const decksCount = board.decks.length;

  async function commitRename() {
    const newName = editValue.trim();
    if (!newName) {
      setEditing(false);
      return;
    }
    await updateBoard(board.id, (b) => ({ ...b, name: newName }));
    setEditing(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    try {
      await boardDelete(board.id);
      removeBoardFromStore(board.id);
      clearLastView(board.id);
    } catch (e) {
      console.error('Board delete failed:', e);
    }
  }

  return (
    <div
      class="sb-menu-row sb-board-row"
      data-testid={`board-list-screen-row-${board.id}`}
      onClick={() => {
        if (!editing) onOpen();
      }}
    >
      {/* Icon */}
      <div class="sb-icon">
        <PixelIcon name="scroll" size={18} />
      </div>

      {/* Name + meta */}
      <div class="sb-flex-min">
        {editing ? (
          <input
            type="text"
            class="sb-row-rename-input"
            value={editValue}
            onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitRename();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(false);
              }
            }}
            onBlur={commitRename}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div class="sb-row-title" data-testid={`board-list-screen-name-text-${board.id}`}>
            {board.name}
          </div>
        )}
        {!editing && (
          <div class="sb-row-sub">
            {decksCount} deck{decksCount !== 1 ? 's' : ''} · {totalPads} pad
            {totalPads !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div class="sb-row-actions" onClick={(e) => e.stopPropagation()}>
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost sb-btn-icon-sm"
            data-testid={`board-list-screen-edit-button-${board.id}`}
            title="Rename board"
            onClick={() => {
              setEditValue(board.name);
              setEditing(true);
            }}
          >
            <PixelIcon name="edit" size={11} />
          </button>
          <button
            class={`sb-btn sb-btn-sm sb-btn-icon-sm ${deleteConfirm ? 'sb-btn-danger' : 'sb-btn-ghost'}`}
            data-testid={`board-list-screen-delete-button-${board.id}`}
            title={deleteConfirm ? 'Click again to confirm' : 'Delete board'}
            onClick={handleDelete}
            onBlur={() => setDeleteConfirm(false)}
          >
            {deleteConfirm ? '!!' : '×'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── EmptyBoardsState ──────────────────────────────────────────────────────────

function EmptyBoardsState({ onCreate }: { onCreate: () => void }): JSX.Element {
  return (
    <div class="sb-screen-empty is-loose">
      <PixelIcon name="scroll" size={48} color="var(--border)" />
      <div class="sb-display-vt is-heading">No Boards Yet</div>
      <div class="sb-empty-body">
        A Board holds your pads and decks for one game session or campaign.
      </div>
      <button
        class="sb-btn sb-btn-primary sb-btn-cta"
        data-testid="board-list-screen-create-first-button"
        onClick={onCreate}
      >
        <PixelIcon name="sparkle" size={14} />+ CREATE FIRST BOARD
      </button>
    </div>
  );
}
