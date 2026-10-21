/**
 * @fileoverview LibraryScreen — asset management
 *
 * Layout: 2-column CSS grid (220px filter rail | 1fr audio list)
 * Source reference: design-sources/2026-05-25/v2-screens.jsx LibraryV2
 *
 * Built so far (Slice 2, Slice 16a; the V1 library at full scope is Slice 16 —
 * docs/product/features/library.md):
 *   - AUDIO tab: upload, rename, waveform, search; each row says in how many pads the file plays
 *   - Delete in one tap: the file goes to "Recently deleted" (ADR-0087) and the toast offers
 *     UNDO; there RESTORE, or delete for good and EMPTY after the confirmation dialog
 *   - ICONS / PADS tabs: placeholder (empty state); the BOARDS tab is Rejected (library.md L4)
 *   - Tags: shown in the filter rail when any file has one; search words, not edited (L2)
 */

import { useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { UiIcon } from '../components/UiIcon';
import { AudioRow } from '../components/AudioRow';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { UndoNoticeRegion } from '../components/UndoNoticeRegion';
import {
  boards,
  currentScreen,
  libraryItems,
  uploadStatus,
  renameLibraryItemMeta,
} from '../state/store';
import {
  daysLeft,
  deleteForGood,
  restoreFile,
  TRASH_DAYS,
  trashFile,
  trashItems,
} from '../state/libraryTrash';
import { announceUndo } from '../state/undoNotice';
import { getLibrarySort, prefsVersion, setLibrarySort } from '../state/prefs';
import { fileUses, soundLossText } from '../lib/fileUses';
import { LIBRARY_SORT_KEYS, PAD_SORT_LABELS, sortLibrary } from '../lib/padSort';
import { processFilesSerial, formatBytes, totalLibraryBytes } from '../lib/upload';
import { libRename } from '../db/idb';

// ── Constants ────────────────────────────────────────────────────────────────

type LibTab = 'AUDIO' | 'ICONS' | 'PADS';
const TABS: LibTab[] = ['AUDIO', 'ICONS', 'PADS'];

/** What the list shows: the library, or its trash ("Recently deleted", ADR-0087). */
type LibView = 'all' | 'trash';

/** The question asked before something is deleted for good (D7, ConfirmDialog). */
type ForGood = { kind: 'one'; id: string; name: string } | { kind: 'all'; count: number };

// ── EmptyState — generic empty placeholder ───────────────────────────────────

function EmptyState({ label }: { label: string }): JSX.Element {
  return (
    <div class="sb-screen-empty">
      <UiIcon name="board" size={32} color="var(--border)" />
      {label}
    </div>
  );
}

// ── UploadStatusBar — one-liner feedback after batch upload ──────────────────

function UploadStatusBar(): JSX.Element | null {
  const status = uploadStatus.value;
  if (!status) return null;

  const parts: string[] = [];
  if (status.imported > 0) parts.push(`${status.imported} imported`);
  if (status.skipped > 0) parts.push(`${status.skipped} already in library`);
  if (status.errors.length > 0) parts.push(`${status.errors.length} failed`);

  return (
    <>
      <div
        class="sb-upload-bar"
        role={status.errors.length > 0 ? 'alert' : 'status'}
        style={{ color: status.errors.length > 0 ? 'var(--blood-bright)' : 'var(--text-dim)' }}
      >
        <UiIcon name={status.errors.length > 0 ? 'error' : 'saved'} size={11} />
        {parts.join(' · ')}
      </div>
      {/* Why each file failed, in plain words — a native disclosure: a tap, Enter or Space opens
          it (it was a hover-only tooltip, out of reach on a phone and for the keyboard) */}
      {status.errors.length > 0 && (
        <details class="sb-upload-errors" data-testid="library-screen-upload-errors-region">
          <summary>Why {status.errors.length === 1 ? 'it' : 'they'} failed</summary>
          <ul>
            {status.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

// ── LibraryScreen ────────────────────────────────────────────────────────────

/** Shows the audio library: upload files (one at a time), search, rename and delete them. */
export function LibraryScreen(): JSX.Element {
  const [activeTab, setActiveTab] = useState<LibTab>('AUDIO');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [view, setView] = useState<LibView>('all');
  const [forGood, setForGood] = useState<ForGood | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived: filtered list for current search, and which pads play each file (L5)
  const items = libraryItems.value;
  const trash = trashItems.value;
  const matches = (name: string) => name.toLowerCase().includes(search.trim().toLowerCase());
  void prefsVersion.value; // re-render when the stored sort changes
  // The sort of All pads with the keys a file has (L9): newest first until another is chosen
  const librarySort = getLibrarySort();
  const filtered = sortLibrary(
    search.trim() ? items.filter((m) => matches(m.name)) : items,
    librarySort,
  );
  const trashFiltered = search.trim() ? trash.filter((t) => matches(t.name)) : trash;
  const uses = fileUses(boards.value);
  const now = Date.now();

  const totalSize = totalLibraryBytes(items);

  // Breadcrumb: "124 audio files · 38.2 MB"
  const breadcrumb =
    items.length === 0
      ? 'Library'
      : `${items.length} audio file${items.length !== 1 ? 's' : ''} · ${formatBytes(totalSize)}`;

  // ── Upload handlers ────────────────────────────────────────────────────────

  function handleFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      processFilesSerial(Array.from(input.files)).catch(console.error);
      input.value = ''; // allow re-upload of same file
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.stopPropagation();
    // Only clear if leaving the entire screen (not a child element)
    const target = e.relatedTarget as Node | null;
    const container = e.currentTarget as HTMLElement;
    if (!container.contains(target)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const audioFiles = Array.from(files).filter((f) => f.type.startsWith('audio/'));
      if (audioFiles.length > 0) {
        processFilesSerial(audioFiles).catch(console.error);
      }
    }
  }

  // ── Row action handlers ────────────────────────────────────────────────────

  // One tap: the file goes to the trash and the toast offers UNDO — it can be undone, so it is not
  // asked (CLAUDE.md delete rules); the toast says how many pads lose their sound (V1's warning)
  async function handleDelete(id: string) {
    const name = items.find((m) => m.id === id)?.name ?? 'the file';
    const lost = soundLossText(uses.get(id)?.length ?? 0);
    try {
      const moved = await trashFile(id);
      if (selectedId === id) setSelectedId(null);
      if (moved) {
        announceUndo(`Deleted '${name}'${lost ? ` · ${lost}` : ''}`, () => void restoreFile(id));
      }
    } catch (e) {
      console.error('Library delete failed:', e);
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreFile(id);
    } catch (e) {
      console.error('Restoring a library file failed:', e);
    }
  }

  async function handleDeleteForGood(question: ForGood) {
    setForGood(null);
    try {
      await deleteForGood(question.kind === 'one' ? [question.id] : undefined);
    } catch (e) {
      console.error('Deleting for good failed:', e);
    }
  }

  async function handleRename(id: string, newName: string) {
    try {
      await libRename(id, newName);
      renameLibraryItemMeta(id, newName);
    } catch (e) {
      console.error('Library rename failed:', e);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      class="sb-screen"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ outline: isDragOver ? '2px solid var(--gold)' : '2px solid transparent' }}
    >
      {/* Hidden file input — triggered by IMPORT button */}
      <input
        ref={fileInputRef}
        type="file"
        data-testid="library-screen-file-input"
        multiple
        accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/x-m4a,audio/flac,audio/ogg,audio/opus,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus"
        class="sb-hidden"
        onChange={handleFileInputChange}
      />

      {/* Top bar */}
      <TopBar
        title="Library"
        breadcrumb={breadcrumb}
        right={
          <div class="sb-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <UiIcon name="import" size={11} />
              IMPORT
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              onClick={() => {
                currentScreen.value = 'menu';
              }}
            >
              <UiIcon name="back" size={11} />
              BACK
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div class="sb-tab-bar">
        <div class="sb-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              class={'sb-tab' + (activeTab === tab ? ' is-active' : '')}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              <span class="sb-tab-badge">{tab === 'AUDIO' ? items.length : 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      {activeTab !== 'AUDIO' ? (
        <div class="sb-row-fill">
          <EmptyState label="No items yet" />
        </div>
      ) : (
        <div class="sb-screen-layout">
          {/* Left rail — filter */}
          <aside class="sb-filter-rail">
            {/* Category: the library and its trash (folders follow in Slice 16c) */}
            <div class="sb-rail-section has-divider">
              <div class="sb-rail-label">CATEGORY</div>
              <button
                class={'sb-category-item' + (view === 'all' ? ' is-active' : '')}
                aria-pressed={view === 'all'}
                onClick={() => setView('all')}
              >
                <span>All</span>
                <span class="sb-count-text">{items.length}</span>
              </button>
              <button
                class={'sb-category-item' + (view === 'trash' ? ' is-active' : '')}
                aria-pressed={view === 'trash'}
                onClick={() => setView('trash')}
              >
                <span>Recently deleted</span>
                <span class="sb-count-text">{trash.length}</span>
              </button>
            </div>

            {/* Tags — read-only, shown if any item has tags */}
            {items.some((m) => m.tags.length > 0) && (
              <div class="sb-rail-section">
                <div class="sb-rail-label">TAGS</div>
                <div class="sb-tag-list">
                  {[...new globalThis.Set(items.flatMap((m) => m.tags))].map((tag) => (
                    <span key={tag} class="sb-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Drop zone hint — shown when no files or when dragging */}
            {(items.length === 0 || isDragOver) && (
              <div
                class="sb-drop-hint"
                style={{
                  border: `2px dashed ${isDragOver ? 'var(--gold)' : 'var(--border)'}`,
                  color: isDragOver ? 'var(--gold)' : 'var(--text-mute)',
                }}
              >
                {isDragOver ? 'DROP FILES' : 'Drop audio files\nanywhere on screen'}
              </div>
            )}
          </aside>

          {/* Center — list */}
          <main class="sb-col">
            {/* Search bar — and in All the sort, as on the board: a key, reversible (L9) */}
            <div class="sb-search-bar sb-row">
              <div class="sb-search-field sb-flex-1">
                <UiIcon name="search" size={12} color="var(--text-mute)" />
                <input
                  class="sb-search-input sb-flex-1"
                  type="text"
                  placeholder={
                    view === 'trash'
                      ? `Search ${trash.length} deleted files…`
                      : `Search ${items.length} files…`
                  }
                  value={search}
                  onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                />
                {search && (
                  <button
                    class="sb-btn-clear"
                    onClick={() => setSearch('')}
                    aria-label="Clear the search"
                  >
                    <UiIcon name="close" />
                  </button>
                )}
              </div>
              {view === 'all' && (
                <>
                  <select
                    class="sb-text-input"
                    aria-label="Sort files by"
                    value={librarySort.key}
                    onChange={(e) => {
                      const key = LIBRARY_SORT_KEYS.find((k) => k === e.currentTarget.value);
                      if (key) setLibrarySort({ key, reversed: false });
                    }}
                  >
                    {LIBRARY_SORT_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {PAD_SORT_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <button
                    class="sb-btn sb-btn-sm sb-btn-ghost"
                    aria-label="Reverse the order"
                    aria-pressed={librarySort.reversed}
                    onClick={() =>
                      setLibrarySort({ ...librarySort, reversed: !librarySort.reversed })
                    }
                  >
                    {librarySort.reversed ? '↑' : '↓'}
                  </button>
                </>
              )}
            </div>

            {/* Recently deleted: how long files stay, and EMPTY (asked first, D7) */}
            {view === 'trash' && (
              <div class="sb-list-bar">
                <span class="sb-hint-text">
                  Deleted files stay here for {TRASH_DAYS} days. Pads that use them stay silent
                  until they are restored.
                </span>
                {trash.length > 0 && (
                  <button
                    class="sb-btn sb-btn-sm sb-btn-danger"
                    onClick={() => setForGood({ kind: 'all', count: trash.length })}
                  >
                    EMPTY
                  </button>
                )}
              </div>
            )}

            {/* Audio list — or the trash */}
            <div class="sb-item-list">
              {view === 'trash' ? (
                trashFiltered.length === 0 ? (
                  <EmptyState
                    label={
                      trash.length === 0
                        ? 'Nothing deleted recently.'
                        : `No deleted files matching "${search}"`
                    }
                  />
                ) : (
                  trashFiltered.map((t) => (
                    <AudioRow
                      key={t.id}
                      meta={t}
                      selected={selectedId === t.id}
                      onSelect={() => setSelectedId(t.id)}
                      trash={{
                        daysLeft: daysLeft(t, now),
                        onRestore: () => void handleRestore(t.id),
                        onDeleteForGood: () => setForGood({ kind: 'one', id: t.id, name: t.name }),
                      }}
                    />
                  ))
                )
              ) : filtered.length === 0 ? (
                items.length === 0 ? (
                  <EmptyState
                    label={
                      isDragOver
                        ? 'Drop files to import'
                        : 'No audio files yet.\nDrop files anywhere or click IMPORT.'
                    }
                  />
                ) : (
                  <EmptyState label={`No files matching "${search}"`} />
                )
              ) : (
                filtered.map((meta) => (
                  <AudioRow
                    key={meta.id}
                    meta={meta}
                    selected={selectedId === meta.id}
                    onSelect={() => setSelectedId(meta.id)}
                    uses={uses.get(meta.id)?.length ?? 0}
                    onDelete={() => handleDelete(meta.id)}
                    onRename={(newName) => handleRename(meta.id, newName)}
                  />
                ))
              )}
            </div>

            {/* Upload status bar */}
            <UploadStatusBar />
          </main>
        </div>
      )}

      <UndoNoticeRegion scope="library" />

      {/* Deleting for good cannot be undone: asked in a dialog, never by a second tap (D7) */}
      {forGood && (
        <ConfirmDialog
          title={
            forGood.kind === 'one'
              ? `Delete '${forGood.name}' for good?`
              : `Delete ${forGood.count === 1 ? '1 file' : `${forGood.count} files`} for good?`
          }
          confirmLabel="DELETE"
          danger
          onConfirm={() => void handleDeleteForGood(forGood)}
          onCancel={() => setForGood(null)}
        >
          <div class="sb-dialog-section">
            {forGood.kind === 'one' ? 'The file is' : 'The files are'} removed from this device and
            cannot be restored. Pads that use {forGood.kind === 'one' ? 'it' : 'them'} stay silent.
          </div>
        </ConfirmDialog>
      )}

      {/* Status bar */}
      <StatusBar
        mode="edit"
        boardName="Library"
        infoText={
          items.length === 0
            ? 'No files'
            : `${items.length} file${items.length !== 1 ? 's' : ''} · ${formatBytes(totalSize)}` +
              (selectedId ? ' · 1 selected' : '')
        }
      />
    </div>
  );
}
