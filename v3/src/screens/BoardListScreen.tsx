// ─────────────────────────────────────────────────────────────────────────────
// BoardListScreen — list all boards, create / rename / delete
//
// Pattern mirrors LibraryScreen: TopBar + list rows + StatusBar.
// Each board row follows the AudioRow pattern (inline rename, 2-tap delete).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { BackupImportPanel } from '../components/BackupImportPanel';
import { BackupExportPanel } from '../components/BackupExportPanel';
import { describeBackupAge } from '../lib/backupExport';
import { PixelIcon } from '../components/PixelIcon';
import {
  currentScreen,
  currentBoardId,
  currentDeckId,
  boards,
  removeBoardFromStore,
} from '../state/store';
import { boardDelete } from '../db/idb';
import { clearLastView, getLastBackup } from '../state/prefs';
import { createBoard, updateBoard } from '../state/boardWrites';
import type { Board } from '../types';
import { nanoid } from '../lib/nanoid';

export function BoardListScreen(): JSX.Element {
  const allBoards = boards.value;
  /** A backup file chosen for import (D2) — shows the import panel. */
  const [importFile, setImportFile] = useState<File | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  /** When the last backup was saved (D3) — re-read after a save. */
  const [lastBackup, setLastBackupShown] = useState(getLastBackup);
  const backupAge = describeBackupAge(lastBackup, Date.now());

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
      {/* Hidden file input — triggered by the IMPORT button (same pattern as the library) */}
      <input
        ref={importInputRef}
        type="file"
        data-testid="board-list-screen-import-input"
        accept=".json,.gz,application/json,application/gzip"
        class="sb-hidden"
        onChange={(e) => {
          const input = e.currentTarget;
          setImportFile(input.files?.[0] ?? null);
          input.value = ''; // the same file can be chosen again
        }}
      />
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
              data-testid="board-list-screen-export-button"
              onClick={() => setExporting(true)}
            >
              EXPORT
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              data-testid="board-list-screen-import-button"
              onClick={() => importInputRef.current?.click()}
            >
              IMPORT
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
        {/* D3: when the last backup was made; a reminder when there is none or it is old */}
        <div class="sb-caption" data-testid="board-list-screen-backup-text">
          {backupAge.text}
          {backupAge.stale && ' — EXPORT saves your boards and audio in one file.'}
        </div>
        {exporting && (
          <BackupExportPanel
            onClose={() => setExporting(false)}
            onSaved={() => setLastBackupShown(getLastBackup())}
          />
        )}
        {importFile && <BackupImportPanel file={importFile} onClose={() => setImportFile(null)} />}
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
