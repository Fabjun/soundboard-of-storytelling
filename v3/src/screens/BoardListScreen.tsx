/**
 * @fileoverview BoardListScreen — list all boards, create / rename / delete
 *
 * Pattern mirrors LibraryScreen: TopBar + list rows + StatusBar.
 * Each board row follows the AudioRow pattern (inline rename, 2-tap delete).
 */

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
import { PAD_SIZE } from '../lib/padSize';

/**
 * Lists the boards — create, open, rename, delete with two taps — with EXPORT, IMPORT and the
 * time of the last backup.
 */
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
      padSize: PAD_SIZE.default,
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
        accept=".zip,.json,.gz,application/zip,application/json,application/gzip"
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
    <div class="sb-menu-row sb-board-row" data-testid={`board-list-screen-row-${board.id}`}>
      {/* Opening the board is a real button — reached with Tab (owner rule 2026-10-02); the
          rename and delete buttons stay its siblings */}
      {!editing && (
        <button
          type="button"
          class="sb-row-button"
          data-testid={`board-list-screen-open-button-${board.id}`}
          onClick={onOpen}
        >
          <span class="sb-icon">
            <PixelIcon name="scroll" size={18} />
          </span>
          <span class="sb-flex-min sb-col">
            <span class="sb-row-title" data-testid={`board-list-screen-name-text-${board.id}`}>
              {board.name}
            </span>
            <span class="sb-row-sub">
              {decksCount} deck{decksCount !== 1 ? 's' : ''} · {totalPads} pad
              {totalPads !== 1 ? 's' : ''}
            </span>
          </span>
        </button>
      )}

      {/* While renaming: icon + name field */}
      {editing && (
        <>
          <div class="sb-icon">
            <PixelIcon name="scroll" size={18} />
          </div>
          <div class="sb-flex-min">
            <input
              type="text"
              class="sb-row-rename-input"
              aria-label="Board name"
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
              autoFocus
            />
          </div>
        </>
      )}

      {/* Actions */}
      {!editing && (
        <div class="sb-row-actions">
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost sb-btn-icon-sm"
            data-testid={`board-list-screen-edit-button-${board.id}`}
            title="Rename board"
            aria-label={`Rename board ${board.name}`}
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
            aria-label={
              deleteConfirm
                ? `Delete board ${board.name} — press again to confirm`
                : `Delete board ${board.name}`
            }
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
