// ─────────────────────────────────────────────────────────────────────────────
// LibraryPanel — right-inspector slot showing library items (Path B)
//
// Allows dragging library items onto pad grid cells to create pads.
//
// Desktop + Mobile: Pointer-Events drag (via libDnd.ts).
//   Threshold 8px → ghost follows cursor → drop on [data-pos] cell.
//   HTML5 DnD ('draggable', ondragstart) is explicitly NOT used:
//   iOS Safari/Brave does not support it.
//
// Mobile extra: Long-Press (350ms without movement) → onEnterPlaceMode.
//   The place-mode flow (tap to place on a grid cell) is managed in BoardScreen.
//   When drag threshold is crossed, the long-press timer is cancelled.
//
// The pad creation on drop happens in BoardScreen (handleLibDrop).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { LibraryItemMeta } from '../types';
import { PixelIcon } from './PixelIcon';
import { Waveform } from './Waveform';
import { libraryItems } from '../state/store';
import { startLibDrag, type LibDndDropResult } from '../lib/libDnd';
import { useState } from 'preact/hooks';

interface LibraryPanelProps {
  onClose: () => void;
  /** Called when a library-item drag ends (drop or cancel). */
  onLibDrop: (result: LibDndDropResult) => void;
  /** Mobile: called to enter place-mode with chosen item. */
  onEnterPlaceMode?: (itemId: string) => void;
}

export function LibraryPanel({
  onClose,
  onLibDrop,
  onEnterPlaceMode,
}: LibraryPanelProps): JSX.Element {
  const [search, setSearch] = useState('');
  const items = libraryItems.value.filter((m) => m.type === 'audio');

  const filtered = search.trim()
    ? items.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  // Sort recent-first by default
  const sorted = [...filtered].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div class="sb-library-panel">
      {/* Header */}
      <div class="sb-panel-header is-active">
        <PixelIcon name="book" size={12} />
        <span class="sb-panel-title">Library</span>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost sb-btn-icon"
          onClick={onClose}
          title="Close library panel"
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div class="sb-lib-panel-search-bar">
        <div class="sb-search-field">
          <PixelIcon name="search" size={11} color="var(--text-mute)" />
          <input
            type="text"
            placeholder={`${items.length} files…`}
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            class="sb-flex-1 sb-search-input"
          />
          {search && (
            <button onClick={() => setSearch('')} class="sb-btn-clear">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Drag hint */}
      <div class="sb-lib-panel-drag-hint">Drag onto a grid slot to create a pad</div>

      {/* Item list */}
      <div class="sb-scroll-fill">
        {sorted.length === 0 ? (
          <div class="sb-panel-empty">
            {items.length === 0 ? 'No audio files in library.' : `No files matching "${search}"`}
          </div>
        ) : (
          sorted.map((item) => (
            <LibraryPanelRow
              key={item.id}
              item={item}
              onLibDrop={onLibDrop}
              onLongPress={onEnterPlaceMode ? () => onEnterPlaceMode(item.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── LibraryPanelRow ──────────────────────────────────────────────────────────

interface LibraryPanelRowProps {
  item: LibraryItemMeta;
  onLibDrop: (result: LibDndDropResult) => void;
  onLongPress?: () => void;
}

function LibraryPanelRow({ item, onLibDrop, onLongPress }: LibraryPanelRowProps): JSX.Element {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function formatDuration(s: number): string {
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function cancelLongPress(): void {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <div
      // Pointer Events drag (NOT HTML5 DnD — see file header)
      class="sb-lib-panel-row"
      data-testid={`library-panel-row-${item.id}`}
      onPointerDown={(e) => {
        const rowEl = e.currentTarget as HTMLElement;

        // Long-press timer — fires at 350ms if no movement threshold is crossed
        if (onLongPress) {
          longPressTimer.current = setTimeout(() => {
            longPressTimer.current = null;
            onLongPress();
          }, 350);
        }

        // Start lib drag. onDragActivated cancels the long-press timer so
        // both paths don't fire simultaneously.
        startLibDrag(e, item.id, rowEl, onLibDrop, cancelLongPress);
      }}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
    >
      <div class="sb-row">
        <PixelIcon name="play" size={10} color="var(--text-mute)" />
        <span class="sb-lib-browser-item-name sb-flex-1">{item.name}</span>
        {item.duration > 0 && <span class="sb-hint-text">{formatDuration(item.duration)}</span>}
      </div>
      {item.peaks && item.peaks.length > 0 && <Waveform peaks={item.peaks} height={20} />}
    </div>
  );
}
