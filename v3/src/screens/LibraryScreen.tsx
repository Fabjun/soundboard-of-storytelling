/**
 * @fileoverview LibraryScreen — asset management
 *
 * Layout: 2-column CSS grid (220px filter rail | 1fr audio list)
 * Source reference: design-sources/2026-05-25/v2-screens.jsx LibraryV2
 *
 * Built so far (Slice 2; the V1 library at full scope is Slice 16):
 *   - AUDIO tab: fully functional (upload, rename, delete, waveform, search)
 *   - ICONS / PADS / BOARDS tabs: placeholder (empty state)
 *   - No inspector panel
 *   - Tags: shown in the filter rail when any file has one; not editable yet
 */

import { useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { StatusBar } from '../components/StatusBar';
import { PixelIcon } from '../components/PixelIcon';
import { AudioRow } from '../components/AudioRow';
import {
  currentScreen,
  libraryItems,
  uploadStatus,
  removeLibraryItemMeta,
  renameLibraryItemMeta,
} from '../state/store';
import { processFilesSerial, formatBytes, totalLibraryBytes } from '../lib/upload';
import { libDelete, libRename } from '../db/idb';

// ── Constants ────────────────────────────────────────────────────────────────

type LibTab = 'AUDIO' | 'ICONS' | 'PADS' | 'BOARDS';
const TABS: LibTab[] = ['AUDIO', 'ICONS', 'PADS', 'BOARDS'];

// ── EmptyState — generic empty placeholder ───────────────────────────────────

function EmptyState({ label }: { label: string }): JSX.Element {
  return (
    <div class="sb-screen-empty">
      <PixelIcon name="scroll" size={32} color="var(--border)" />
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
        <PixelIcon name={status.errors.length > 0 ? 'skull' : 'save'} size={11} />
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived: filtered list for current search
  const items = libraryItems.value;
  const filtered = search.trim()
    ? items.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : items;

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

  async function handleDelete(id: string) {
    try {
      await libDelete(id);
      removeLibraryItemMeta(id);
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      console.error('Library delete failed:', e);
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
              <PixelIcon name="download" size={11} />
              IMPORT
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              onClick={() => {
                currentScreen.value = 'start';
              }}
            >
              <PixelIcon name="play" size={11} />
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
            {/* Category: only "All" in Slice 2 */}
            <div class="sb-rail-section has-divider">
              <div class="sb-rail-label">CATEGORY</div>
              <div class="sb-category-item">
                <span>All</span>
                <span class="sb-count-text">{items.length}</span>
              </div>
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
            {/* Search bar */}
            <div class="sb-search-bar">
              <div class="sb-search-field">
                <PixelIcon name="search" size={12} color="var(--text-mute)" />
                <input
                  class="sb-search-input sb-flex-1"
                  type="text"
                  placeholder={`Search ${items.length} files…`}
                  value={search}
                  onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                />
                {search && (
                  <button class="sb-btn-clear" onClick={() => setSearch('')}>
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Audio list */}
            <div class="sb-item-list">
              {filtered.length === 0 ? (
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
