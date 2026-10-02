// ─────────────────────────────────────────────────────────────────────────────
// PadCreationPopover — Path A pad creation (tap an empty slot)
//
// Source: design-sources/2026-05-25/v20-pad-creation-flow.jsx
//
// Slice 3 scope:
//   - Source modes: RECENT (last 5) + BROWSE (searchable) implemented
//   - DROP HERE: not built yet (placeholder shown; superseded May-plan Slice 8)
//   - "More options →" handoff to PadEditorPanel
//   - Type pills: SINGLE until the user picks another type (DEFAULT_PAD_TYPE)
//
// Desktop: fixed popover anchored to cell rect (flips above if < 200px below).
// Mobile (< 600px): bottom sheet via PadCreationSheet.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import type { LibraryItemMeta, Pad, PadPosition, PadType } from '../types';
import { PixelIcon } from './PixelIcon';
import { Waveform } from './Waveform';
import { libraryItems } from '../state/store';
import { DEFAULT_PAD_TYPE, newPad, padTypeColor, padTypeLabel } from '../lib/padUtils';
import { nanoid } from '../lib/nanoid';

export type CreationResult =
  | { action: 'create'; pad: Pad }
  | { action: 'open-editor'; partialPad: Pad }
  | { action: 'cancel' };

interface PadCreationPopoverProps {
  /** Grid slot this popover is anchored to. */
  position: PadPosition;
  /** Bounding rect of the cell DOM element (for positioning). */
  cellRect: DOMRect;
  onResult: (result: CreationResult) => void;
}

type SourceTab = 'RECENT' | 'BROWSE';

const PAD_TYPES: PadType[] = ['single', 'loop', 'combo'];

export function PadCreationPopover({
  position,
  cellRect,
  onResult,
}: PadCreationPopoverProps): JSX.Element {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  const allAudio = libraryItems.value.filter((m) => m.type === 'audio');
  const recentAudio = [...allAudio].sort((a, b) => b.addedAt - a.addedAt).slice(0, 5);

  const [sourceTab, setSourceTab] = useState<SourceTab>('RECENT');
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [padName, setPadName] = useState('');
  const [padType, setPadType] = useState<PadType>(DEFAULT_PAD_TYPE);

  const selectedItem = selectedItemId
    ? (allAudio.find((m) => m.id === selectedItemId) ?? null)
    : null;

  // The name suggested by the selected file is derived (placeholder), never stored as if typed —
  // so it follows a later file choice and never overwrites a typed name.
  function selectItem(item: LibraryItemMeta) {
    setSelectedItemId(item.id);
  }

  const filteredBrowse = search.trim()
    ? allAudio.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : allAudio;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onResult({ action: 'cancel' });
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onResult]);

  function buildPad(id: string): Pad {
    const name = padName.trim() || (selectedItem?.name ?? 'New Pad');
    return newPad(id, padType, name, selectedItemId ? [selectedItemId] : []);
  }

  function handleCreate() {
    onResult({ action: 'create', pad: buildPad(nanoid()) });
  }

  function handleMoreOptions() {
    onResult({ action: 'open-editor', partialPad: buildPad(nanoid()) });
  }

  const content = (
    <>
      {/* Source tabs */}
      <div class="sb-source-tabs">
        {(['RECENT', 'BROWSE'] as SourceTab[]).map((tab) => (
          <button
            key={tab}
            data-testid={`pad-creation-popover-source-tab-${tab.toLowerCase()}`}
            onClick={() => setSourceTab(tab)}
            class={`sb-tab sb-tab-sm${sourceTab === tab ? ' is-active' : ''}`}
          >
            {tab}
          </button>
        ))}
        <button disabled class="sb-tab sb-tab-sm" title="Drop a file here — not available yet">
          DROP
        </button>
      </div>

      {/* Source list */}
      <div class="sb-scroll-fill">
        {sourceTab === 'RECENT' && (
          <>
            {recentAudio.length === 0 ? (
              <EmptyHint text="No audio in library yet." />
            ) : (
              recentAudio.map((item) => (
                <SourceItem
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id}
                  onSelect={() => selectItem(item)}
                />
              ))
            )}
          </>
        )}

        {sourceTab === 'BROWSE' && (
          <>
            <div class="sb-lib-browser-search">
              <input
                type="text"
                placeholder={`Search ${allAudio.length} files…`}
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                class="sb-search-input"
                autoFocus
              />
            </div>
            {filteredBrowse.length === 0 ? (
              <EmptyHint text="No matches." />
            ) : (
              filteredBrowse
                .slice(0, 30)
                .map((item) => (
                  <SourceItem
                    key={item.id}
                    item={item}
                    selected={selectedItemId === item.id}
                    onSelect={() => selectItem(item)}
                  />
                ))
            )}
          </>
        )}
      </div>

      {/* Name + type row */}
      <div class="sb-creation-popover-section">
        <input
          type="text"
          data-testid="pad-creation-popover-name-input"
          value={padName}
          placeholder={selectedItem?.name ?? 'Pad name…'}
          onInput={(e) => setPadName((e.target as HTMLInputElement).value)}
          class="sb-text-input"
        />
        <div class="sb-row-sm">
          {PAD_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setPadType(t)}
              class="sb-type-btn"
              style={{
                background:
                  padType === t
                    ? `color-mix(in srgb, ${padTypeColor(t)}, transparent 80%)`
                    : 'var(--sunk)',
                border: `1px solid ${padType === t ? padTypeColor(t) : 'var(--border-soft)'}`,
                color: padType === t ? padTypeColor(t) : 'var(--text-mute)',
              }}
            >
              {padTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div class="sb-creation-popover-actions">
        <button class="sb-btn sb-btn-sm sb-btn-ghost sb-btn-muted" onClick={handleMoreOptions}>
          More options →
        </button>
        <div class="sb-flex-1" />
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          data-testid="pad-creation-popover-cancel-button"
          onClick={() => onResult({ action: 'cancel' })}
        >
          CANCEL
        </button>
        <button
          class="sb-btn sb-btn-sm sb-btn-primary"
          data-testid="pad-creation-popover-add-button"
          onClick={handleCreate}
          disabled={!selectedItemId}
        >
          ADD PAD
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div class="sb-creation-sheet-backdrop" onClick={() => onResult({ action: 'cancel' })} />
        <div class="sb-creation-sheet is-creation" data-testid="pad-creation-popover">
          <div class="sb-sheet-header">
            Add Pad — {String.fromCharCode(64 + (position.row * 4 + position.col + 1))}
            {position.row * 4 + position.col + 1}
          </div>
          {content}
        </div>
      </>
    );
  }

  // Desktop positioning — flip above if < 240px below
  const spaceBelow = window.innerHeight - cellRect.bottom;
  const popoverHeight = 380;
  const top = spaceBelow >= popoverHeight ? cellRect.bottom + 4 : cellRect.top - popoverHeight - 4;
  const left = Math.min(Math.max(4, cellRect.left), window.innerWidth - 304);

  return (
    <>
      <div
        class="sb-creation-popover-backdrop"
        onClick={() => onResult({ action: 'cancel' })}
        aria-hidden="true"
      />
      <div
        class="sb-creation-popover"
        data-testid="pad-creation-popover"
        style={{ top: `${top}px`, left: `${left}px`, height: `${popoverHeight}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </>
  );
}

// ── SourceItem ────────────────────────────────────────────────────────────────

function SourceItem({
  item,
  selected,
  onSelect,
}: {
  item: LibraryItemMeta;
  selected: boolean;
  onSelect: () => void;
}): JSX.Element {
  function fmt(s: number): string {
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  return (
    <div
      data-testid={`pad-creation-popover-source-item-${item.id}`}
      onClick={onSelect}
      class="sb-source-item"
      style={{ background: selected ? 'var(--raised)' : 'none' }}
    >
      <div class="sb-row">
        {selected ? (
          <PixelIcon name="play" size={10} color="var(--gold)" />
        ) : (
          <PixelIcon name="play" size={10} color="var(--text-mute)" />
        )}
        <span
          class="sb-lib-browser-item-name sb-flex-1"
          style={{ color: selected ? 'var(--gold)' : 'var(--text)' }}
        >
          {item.name}
        </span>
        <span class="sb-hint-text">{item.duration > 0 ? fmt(item.duration) : ''}</span>
      </div>
      {selected && item.peaks.length > 0 && <Waveform peaks={item.peaks} height={18} />}
    </div>
  );
}

function EmptyHint({ text }: { text: string }): JSX.Element {
  return <div class="sb-lib-browser-no-results">{text}</div>;
}
