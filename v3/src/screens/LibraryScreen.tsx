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
 *   - Select mode (Slice 16c, L3): SELECT, a checkbox per row, SELECT ALL, MOVE and DELETE in a bar
 *   - Folders (Slice 16c, L2, ADR-0088): listed in the filter rail (on a phone a choice above the
 *     list); an open folder can be renamed or removed, and files uploaded meanwhile land in it
 *   - ICONS / PADS tabs: placeholder (empty state); the BOARDS tab is Rejected (library.md L4)
 *   - Tags: search words, not edited (L2) — the search finds a file by its name or a tag
 */

import { useLayoutEffect, useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { UiIcon } from '../components/UiIcon';
import { AudioRow } from '../components/AudioRow';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FolderMoveDialog } from '../components/FolderMoveDialog';
import { UndoNoticeRegion } from '../components/UndoNoticeRegion';
import { PadTemplatesTab } from '../components/PadTemplatesTab';
import { padTemplates } from '../state/padTemplates';
import {
  boards,
  currentScreen,
  libraryItems,
  previewPlaying,
  uploadStatus,
  renameLibraryItemMeta,
} from '../state/store';
import { startPreview, stopPreview } from '../lib/preview';
import { newPad } from '../lib/padUtils';
import type { LibraryItemMeta } from '../types';
import {
  daysLeft,
  deleteForGood,
  restoreFile,
  restoreFiles,
  TRASH_DAYS,
  trashFiles,
  trashItems,
} from '../state/libraryTrash';
import { announceUndo } from '../state/undoNotice';
import {
  assignFolders,
  cleanFolderName,
  FOLDER_NAME_MAX,
  folderList,
  folderMap,
  moveToFolder,
  removeFolder,
  renameFolder,
  restoreFolders,
} from '../state/libraryFolders';
import { getLibrarySort, prefsVersion, setLibrarySort } from '../state/prefs';
import { narrowWindow } from '../state/windowClass';
import { fileUses, padsUsing, soundLossText } from '../lib/fileUses';
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

/** "1 file", "3 files" — `noun` in the singular. */
const filesText = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

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
  void prefsVersion.value; // re-render when the stored sort or the folders change
  // Folders (L2, ADR-0088): the open one narrows the list; a folder whose last file left it is gone
  const [folder, setFolder] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const folders = folderMap();
  const folderInfos = folderList(items, folders);
  const openFolder = folderInfos.some((f) => f.name === folder) ? folder : null;
  const inScope = openFolder === null ? items : items.filter((m) => folders[m.id] === openFolder);
  // The sort of All pads with the keys a file has (L9): newest first until another is chosen
  const librarySort = getLibrarySort();
  const filtered = sortLibrary(
    search.trim() ? inScope.filter((m) => matches(m.name) || m.tags.some(matches)) : inScope,
    librarySort,
  );
  const trashFiltered = search.trim() ? trash.filter((t) => matches(t.name)) : trash;
  const uses = fileUses(boards.value);
  const now = Date.now();
  const narrow = narrowWindow.value;

  // Preview (library.md L8): ▶ plays the file once through the PAD editor's preview path (the
  // engine unchanged, one file decoded at a time); ■, the next ▶ or leaving the library stops it
  const [previewId, setPreviewId] = useState<string | null>(null);
  const playingId = previewPlaying.value ? previewId : null;
  useLayoutEffect(() => () => stopPreview(), []);
  function togglePreview(meta: LibraryItemMeta) {
    if (playingId === meta.id) {
      stopPreview();
      return;
    }
    const pad = newPad('library-preview', 'single', meta.name, [meta.id]);
    if (pad.type === 'combo') return; // a Single always — this narrows the type
    setPreviewId(meta.id);
    void startPreview(pad, { hash: meta.id }, 0, meta.duration);
  }

  // Select mode (library.md L3): SELECT shows a checkbox on each row and a bar with its actions;
  // DONE ends it (Apple HIG: an edit mode before selecting list items). It acts on the files
  // shown — a file the search hides is not deleted unseen
  const [choosing, setChoosing] = useState(false);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const chosenShown = filtered.filter((m) => chosen.has(m.id));
  const allShownChosen = filtered.length > 0 && chosenShown.length === filtered.length;
  function startChoosing() {
    stopPreview();
    setChosen(new Set());
    setChoosing(true);
  }
  function endChoosing() {
    setChoosing(false);
    setChosen(new Set());
  }
  function toggleChosen(id: string) {
    const next = new Set(chosen);
    if (!next.delete(id)) next.add(id);
    setChosen(next);
  }

  const totalSize = totalLibraryBytes(items);

  // Breadcrumb: "124 audio files · 38.2 MB"
  const breadcrumb =
    items.length === 0
      ? 'Library'
      : `${items.length} audio file${items.length !== 1 ? 's' : ''} · ${formatBytes(totalSize)}`;

  // ── Upload handlers ────────────────────────────────────────────────────────

  // Files uploaded while a folder is open land in it, as in V1 (ADR-0088)
  function upload(files: File[]) {
    const into = openFolder;
    const onImported = into === null ? undefined : (id: string) => assignFolders({ [id]: into });
    processFilesSerial(files, onImported).catch(console.error);
  }

  function handleFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      upload(Array.from(input.files));
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
      if (audioFiles.length > 0) upload(audioFiles);
    }
  }

  // ── Row action handlers ────────────────────────────────────────────────────

  // One tap: the files go to the trash and the toast offers UNDO — it can be undone, so it is not
  // asked (CLAUDE.md delete rules); the toast says how many pads lose their sound (V1's warning).
  // One way for a single and a bulk delete (D4)
  async function handleDelete(ids: string[]) {
    const lost = soundLossText(padsUsing(boards.value, ids));
    try {
      const moved = await trashFiles(ids);
      if (selectedId !== null && ids.includes(selectedId)) setSelectedId(null);
      if (moved.length > 0) {
        const what = moved.length === 1 ? `'${moved[0].name}'` : `${moved.length} files`;
        announceUndo(
          `Deleted ${what}${lost ? ` · ${lost}` : ''}`,
          () => void restoreFiles(moved.map((t) => t.id)),
        );
      }
    } catch (e) {
      console.error('Library delete failed:', e);
    }
  }

  // ── Folder handlers (L2, ADR-0088) ─────────────────────────────────────────

  // Moving changes no audio and can be undone, so it is not asked; the toast offers UNDO
  function handleMove(ids: string[], into: string | null) {
    const before = moveToFolder(ids, into);
    setMoving(false);
    endChoosing();
    const what = ids.length === 1 ? '1 file' : `${ids.length} files`;
    announceUndo(
      into === null ? `Took ${what} out of their folder` : `Moved ${what} to '${into}'`,
      () => restoreFolders(ids, before),
    );
  }

  function commitRename(from: string) {
    const others = folderInfos.map((f) => f.name).filter((n) => n !== from);
    const to = cleanFolderName(renaming ?? '', others);
    setRenaming(null);
    if (!to || to === from) return;
    renameFolder(from, to);
    setFolder(to);
  }

  // Removing a folder keeps its files (they are in no folder then) — one tap, UNDO in the toast
  function handleRemoveFolder(name: string) {
    const ids = removeFolder(name);
    setFolder(null);
    const what = ids.length === 1 ? 'its file stays' : `its ${ids.length} files stay`;
    announceUndo(`Removed folder '${name}' · ${what} in the library`, () =>
      moveToFolder(ids, name),
    );
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
              <span class="sb-tab-badge">
                {tab === 'AUDIO' ? items.length : tab === 'PADS' ? padTemplates.value.length : 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      {activeTab === 'PADS' ? (
        <PadTemplatesTab />
      ) : activeTab !== 'AUDIO' ? (
        <div class="sb-row-fill">
          <EmptyState label="No items yet" />
        </div>
      ) : (
        <div class={'sb-screen-layout' + (narrow ? ' is-narrow' : '')}>
          {/* Left rail — filter; on a phone a row of categories above the list (ADR-0082: the
              frame decides what is rendered — the folders as one choice, no drop hint, as files
              are not dropped on a phone) */}
          <aside class={'sb-filter-rail' + (narrow ? ' is-narrow' : '')}>
            {/* Category: the library and its trash */}
            <div class="sb-rail-section has-divider">
              {!narrow && <div class="sb-rail-label">CATEGORY</div>}
              <button
                class={
                  'sb-category-item' + (view === 'all' && openFolder === null ? ' is-active' : '')
                }
                aria-pressed={view === 'all' && openFolder === null}
                onClick={() => {
                  setView('all');
                  setFolder(null);
                }}
              >
                <span>All</span>
                <span class="sb-count-text">{items.length}</span>
              </button>
              <button
                class={'sb-category-item' + (view === 'trash' ? ' is-active' : '')}
                aria-pressed={view === 'trash'}
                onClick={() => {
                  endChoosing();
                  setView('trash');
                }}
              >
                <span>Recently deleted</span>
                <span class="sb-count-text">{trash.length}</span>
              </button>
              {narrow && folderInfos.length > 0 && (
                <select
                  class="sb-text-input"
                  aria-label="Folder"
                  value={view === 'all' && openFolder !== null ? openFolder : ''}
                  onChange={(e) => {
                    const name = e.currentTarget.value;
                    setView('all');
                    setFolder(name === '' ? null : name);
                  }}
                >
                  <option value="">Folders…</option>
                  {folderInfos.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.count})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Folders (L2): a file is in one or in none; a folder lists what is in it */}
            {!narrow && folderInfos.length > 0 && (
              <div class="sb-rail-section">
                <div class="sb-rail-label">FOLDERS</div>
                {folderInfos.map((f) => (
                  <button
                    key={f.name}
                    class={
                      'sb-category-item' +
                      (view === 'all' && openFolder === f.name ? ' is-active' : '')
                    }
                    aria-pressed={view === 'all' && openFolder === f.name}
                    onClick={() => {
                      setView('all');
                      setFolder(f.name);
                    }}
                  >
                    <span class="sb-flex-trunc">{f.name}</span>
                    <span class="sb-count-text">{f.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Drop zone hint — shown when no files or when dragging */}
            {!narrow && (items.length === 0 || isDragOver) && (
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
              <div class="sb-search-field">
                <UiIcon name="search" size={12} color="var(--text-mute)" />
                <input
                  class="sb-search-input sb-flex-1"
                  type="text"
                  placeholder={
                    view === 'trash'
                      ? `Search ${filesText(trash.length, 'deleted file')}…`
                      : openFolder === null
                        ? `Search ${filesText(items.length, 'file')}…`
                        : `Search ${filesText(inScope.length, 'file')} in ${openFolder}…`
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
                  <button
                    class="sb-btn sb-btn-sm sb-btn-ghost"
                    disabled={!choosing && items.length === 0}
                    onClick={choosing ? endChoosing : startChoosing}
                  >
                    {choosing ? 'DONE' : 'SELECT'}
                  </button>
                </>
              )}
            </div>

            {/* Select mode: how many files are chosen, and what can be done with them (L3) */}
            {view === 'all' && choosing && (
              <div class="sb-list-bar" role="toolbar" aria-label="Selected files">
                <span class="sb-caption">
                  {chosenShown.length === 1
                    ? '1 file selected'
                    : `${chosenShown.length} files selected`}
                </span>
                <div class="sb-row">
                  <button
                    class="sb-btn sb-btn-sm sb-btn-ghost"
                    disabled={filtered.length === 0}
                    onClick={() =>
                      setChosen(allShownChosen ? new Set() : new Set(filtered.map((m) => m.id)))
                    }
                  >
                    {allShownChosen ? 'SELECT NONE' : 'SELECT ALL'}
                  </button>
                  <button
                    class="sb-btn sb-btn-sm sb-btn-ghost"
                    disabled={chosenShown.length === 0}
                    onClick={() => setMoving(true)}
                  >
                    MOVE
                  </button>
                  <button
                    class="sb-btn sb-btn-sm sb-btn-danger"
                    disabled={chosenShown.length === 0}
                    onClick={() => {
                      void handleDelete(chosenShown.map((m) => m.id));
                      endChoosing();
                    }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            )}

            {/* An open folder: its name, RENAME (in place) and REMOVE FOLDER (its files stay) */}
            {view === 'all' && openFolder !== null && !choosing && (
              <div class="sb-list-bar" role="toolbar" aria-label="Folder">
                {renaming === null ? (
                  <>
                    <span class="sb-caption">
                      Folder '{openFolder}' ·{' '}
                      {inScope.length === 1 ? '1 file' : `${inScope.length} files`}
                    </span>
                    <div class="sb-row">
                      <button
                        class="sb-btn sb-btn-sm sb-btn-ghost"
                        onClick={() => setRenaming(openFolder)}
                      >
                        RENAME
                      </button>
                      <button
                        class="sb-btn sb-btn-sm sb-btn-ghost"
                        onClick={() => handleRemoveFolder(openFolder)}
                      >
                        REMOVE FOLDER
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      class="sb-text-input sb-flex-1"
                      aria-label="Folder name"
                      maxLength={FOLDER_NAME_MAX}
                      value={renaming}
                      ref={(el) => el?.focus()}
                      onInput={(e) => setRenaming(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(openFolder);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                    />
                    <div class="sb-row">
                      <button
                        class="sb-btn sb-btn-sm sb-btn-primary"
                        onClick={() => commitRename(openFolder)}
                      >
                        SAVE
                      </button>
                      <button
                        class="sb-btn sb-btn-sm sb-btn-ghost"
                        onClick={() => setRenaming(null)}
                      >
                        CANCEL
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Recently deleted: how long files stay, and EMPTY (asked first, D7) */}
            {view === 'trash' && (
              <div class="sb-list-bar">
                {/* sb-caption wraps — the note is read whole, never cut off */}
                <span class="sb-caption">
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
                    {...(openFolder === null && folders[meta.id] !== undefined
                      ? { folder: folders[meta.id] }
                      : {})}
                    {...(choosing
                      ? {
                          choose: {
                            chosen: chosen.has(meta.id),
                            onToggle: () => toggleChosen(meta.id),
                          },
                        }
                      : {
                          preview: {
                            playing: playingId === meta.id,
                            onToggle: () => togglePreview(meta),
                          },
                        })}
                    onDelete={() => handleDelete([meta.id])}
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

      {/* MOVE: which folder the chosen files go to (L3) */}
      {moving && (
        <FolderMoveDialog
          count={chosenShown.length}
          folders={folderInfos.map((f) => f.name)}
          onMove={(into) =>
            handleMove(
              chosenShown.map((m) => m.id),
              into,
            )
          }
          onCancel={() => setMoving(false)}
        />
      )}

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
              (choosing ? ` · ${chosenShown.length} selected` : selectedId ? ' · 1 selected' : '')
        }
      />
    </div>
  );
}
