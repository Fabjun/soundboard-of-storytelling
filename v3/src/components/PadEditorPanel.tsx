// ─────────────────────────────────────────────────────────────────────────────
// PadEditorPanel — right-inspector panel for pad editing (SETUP mode)
//
// Used for:
//   Path C (ADD PAD): full editor from scratch
//   Pad tap in SETUP mode: edit existing pad
//   "More options" handoff from Path A Popover
//
// Save strategy: Auto-Save with 500ms debounce (no explicit Save button).
// Matches V1 workflow, prevents forgotten saves.
//
// Fields in Slice 3:
//   - Name (required)
//   - Type (with PadTypeConfirmDialog on change)
//   - Library source (search + pick from libraryItems)
//   - Waveform preview (if source set)
//   - Volume slider (0-100)
//   - Fade In / Fade Out sliders (0-10s)
//   - Hotkey display (read-only; Key-Capture = Slice 8)
//   - Delete button (2-tap confirm)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import type { Board, Pad, PadBase, PadType, Deck } from '../types';
import { isSinglePad, isLoopPad, isPlaylistPad, isComboPad } from '../types';
import { PixelIcon } from './PixelIcon';
import { Waveform } from './Waveform';
import { PadTypeConfirmDialog } from './PadTypeConfirmDialog';
import { padTypeColor, padTypeLabel, applyTypeChange, padMigrationMatrix } from '../lib/padUtils';
import { libraryItems } from '../state/store';
import { boardPut } from '../db/idb';
import { upsertBoard } from '../state/store';

interface PadEditorPanelProps {
  pad: Pad;
  deck: Deck;
  board: Board;
  onClose: () => void;
  onDelete: (padId: string) => void;
}

const PAD_TYPES: PadType[] = ['single', 'loop', 'playlist', 'combo'];

export function PadEditorPanel({
  pad,
  deck,
  board,
  onClose,
  onDelete,
}: PadEditorPanelProps): JSX.Element {
  // Local state mirrors the pad; auto-saved on change
  const [name, setName] = useState(pad.name);
  const [type, setType] = useState<PadType>(pad.type);
  const [libraryRef, setLibraryRef] = useState<string | undefined>(
    isSinglePad(pad) || isLoopPad(pad) ? pad.libraryItemRef : undefined,
  );
  const [volume, setVolume] = useState(pad.volume);
  const [fadeIn, setFadeIn] = useState(pad.fadeIn);
  const [fadeOut, setFadeOut] = useState(pad.fadeOut);
  const [pendingType, setPendingType] = useState<PadType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [libPickerOpen, setLibPickerOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from prop changes (when pad changes externally).
  // Dep is pad.id intentionally — we only reset local state on PAD IDENTITY change,
  // not on every field mutation. Reacting to all pad.* fields would reset the
  // in-progress edit state on each auto-save (cursor jumps in inputs).
  useEffect(() => {
    setName(pad.name);
    setType(pad.type);
    setLibraryRef(isSinglePad(pad) || isLoopPad(pad) ? pad.libraryItemRef : undefined);
    setVolume(pad.volume);
    setFadeIn(pad.fadeIn);
    setFadeOut(pad.fadeOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when a different pad is opened (pad.id), not on every auto-save
  }, [pad.id]);

  // ── Auto-save with 500ms debounce ────────────────────────────────────────

  function scheduleAutoSave(updatedPad: Pad) {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const updatedDeck: Deck = {
        ...deck,
        pads: deck.pads.map((p) => (p.id === updatedPad.id ? updatedPad : p)),
      };
      const updatedBoard: Board = {
        ...board,
        decks: board.decks.map((s) => (s.id === updatedDeck.id ? updatedDeck : s)),
      };
      try {
        await boardPut(updatedBoard);
        upsertBoard(updatedBoard);
      } catch (e) {
        console.error('Pad auto-save failed:', e);
      }
    }, 500);
  }

  // libraryRefOverride: when the libraryRef state hasn't committed yet (handleLibrarySelect)
  function buildCurrentPad(libraryRefOverride?: string): Pad {
    const effectiveRef = libraryRefOverride !== undefined ? libraryRefOverride : libraryRef;
    const base: PadBase = {
      id: pad.id,
      name,
      position: pad.position,
      hotkey: pad.hotkey,
      iconRef: pad.iconRef,
      color: pad.color,
      volume,
      fadeIn,
      fadeOut,
    };
    switch (type) {
      case 'single':
        return { ...base, type: 'single', libraryItemRef: effectiveRef };
      case 'loop':
        return { ...base, type: 'loop', libraryItemRef: effectiveRef };
      case 'playlist': {
        const files = isPlaylistPad(pad) ? pad.files : effectiveRef ? [effectiveRef] : [];
        return { ...base, type: 'playlist', files };
      }
      case 'combo': {
        const steps = isComboPad(pad) ? pad.steps : [];
        return { ...base, type: 'combo', steps };
      }
    }
  }

  function handleNameChange(newName: string) {
    setName(newName);
    scheduleAutoSave({ ...buildCurrentPad(), name: newName });
  }

  function handleVolumeChange(v: number) {
    setVolume(v);
    scheduleAutoSave({ ...buildCurrentPad(), volume: v });
  }

  function handleFadeInChange(v: number) {
    setFadeIn(v);
    scheduleAutoSave({ ...buildCurrentPad(), fadeIn: v });
  }

  function handleFadeOutChange(v: number) {
    setFadeOut(v);
    scheduleAutoSave({ ...buildCurrentPad(), fadeOut: v });
  }

  function handleLibrarySelect(id: string) {
    setLibraryRef(id);
    setLibPickerOpen(false);
    scheduleAutoSave(buildCurrentPad(id));
  }

  // ── Type change ──────────────────────────────────────────────────────────

  function requestTypeChange(newType: PadType) {
    if (newType === type) return;
    // No dialog for brand-new pad (no name or library ref = fresh)
    const ref = isSinglePad(pad) || isLoopPad(pad) ? pad.libraryItemRef : undefined;
    const isFresh = !ref && pad.name === '';
    const { verdict } = padMigrationMatrix(type, newType);
    if (isFresh || verdict === 'add') {
      applyTypeSwitch(newType);
    } else {
      setPendingType(newType);
    }
  }

  function applyTypeSwitch(newType: PadType) {
    const migrated = applyTypeChange(buildCurrentPad(), newType);
    setType(migrated.type);
    setLibraryRef(
      isSinglePad(migrated) || isLoopPad(migrated) ? migrated.libraryItemRef : undefined,
    );
    scheduleAutoSave(migrated);
    setPendingType(null);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  function handleDelete() {
    if (deleteConfirm) {
      onDelete(pad.id);
    } else {
      setDeleteConfirm(true);
    }
  }

  // ── Library picker ───────────────────────────────────────────────────────

  const allAudio = libraryItems.value.filter((m) => m.type === 'audio');
  const filteredAudio = libSearch.trim()
    ? allAudio.filter((m) => m.name.toLowerCase().includes(libSearch.toLowerCase()))
    : allAudio;
  const selectedItem = allAudio.find((m) => m.id === libraryRef);

  // ── Render ───────────────────────────────────────────────────────────────

  const typeColor = padTypeColor(type);

  return (
    <div class="sb-pad-editor" data-testid="pad-editor-panel">
      {/* Header */}
      <div class="sb-panel-header is-active" style={{ borderBottom: `2px solid ${typeColor}` }}>
        <span class="sb-type-indicator" style={{ background: typeColor }} />
        <span class="sb-panel-title">Pad Editor</span>
        <button class="sb-btn sb-btn-icon sb-btn-ghost" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Name */}
      <div class="sb-inspector-section">
        <label class="sb-field-label">NAME</label>
        <input
          class="sb-text-input"
          type="text"
          data-testid="pad-editor-panel-name-input"
          value={name}
          placeholder="Pad name…"
          onInput={(e) => handleNameChange((e.target as HTMLInputElement).value)}
        />
      </div>

      {/* Type selector */}
      <div class="sb-inspector-section">
        <label class="sb-field-label">TYPE</label>
        <div class="sb-row-sm">
          {PAD_TYPES.map((t) => (
            <button
              key={t}
              class={`sb-btn sb-type-btn ${type === t ? 'sb-btn-primary' : 'sb-btn-ghost'}`}
              data-testid={`pad-editor-panel-type-button-${t}`}
              aria-pressed={type === t}
              style={{
                color: type === t ? padTypeColor(t) : 'var(--text-mute)',
                borderColor: type === t ? padTypeColor(t) : undefined,
              }}
              onClick={() => requestTypeChange(t)}
            >
              {padTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Library source */}
      <div class="sb-inspector-section">
        <div class="sb-section-header-row">
          <label class="sb-field-label">AUDIO SOURCE</label>
          <button class="sb-btn sb-btn-xs sb-btn-ghost" onClick={() => setLibPickerOpen((o) => !o)}>
            {libPickerOpen ? 'CLOSE' : 'BROWSE'}
          </button>
        </div>

        {/* Current source */}
        {selectedItem ? (
          <div class="sb-lib-browser">
            <div class="sb-lib-browser-item-name">{selectedItem.name}</div>
            {selectedItem.peaks.length > 0 && <Waveform peaks={selectedItem.peaks} height={24} />}
          </div>
        ) : (
          <div class="sb-lib-browser-empty">No source selected</div>
        )}

        {/* Inline library picker */}
        {libPickerOpen && (
          <div class="sb-lib-browser-list">
            <div class="sb-lib-browser-search">
              <input
                class="sb-search-input"
                type="text"
                placeholder="Search…"
                value={libSearch}
                onInput={(e) => setLibSearch((e.target as HTMLInputElement).value)}
                autoFocus
              />
            </div>
            {filteredAudio.slice(0, 50).map((item) => (
              <div
                key={item.id}
                class="sb-lib-browser-item"
                onClick={() => handleLibrarySelect(item.id)}
                style={{
                  color: libraryRef === item.id ? 'var(--gold)' : 'var(--text-dim)',
                  background: libraryRef === item.id ? 'var(--raised)' : 'none',
                }}
              >
                {item.name}
              </div>
            ))}
            {filteredAudio.length === 0 && (
              <div class="sb-lib-browser-no-results">No files found</div>
            )}
          </div>
        )}
      </div>

      {/* Volume */}
      <div class="sb-inspector-section">
        <SliderRow
          label="VOLUME"
          value={volume}
          min={0}
          max={100}
          step={1}
          format={(v) => `${v}%`}
          onChange={handleVolumeChange}
          testid="pad-editor-panel-volume-slider"
        />
      </div>

      {/* Fade In */}
      <div class="sb-inspector-section">
        <SliderRow
          label="FADE IN"
          value={fadeIn}
          min={0}
          max={10}
          step={0.1}
          format={(v) => `${v.toFixed(1)}s`}
          onChange={handleFadeInChange}
          testid="pad-editor-panel-fade-in-slider"
        />
      </div>

      {/* Fade Out */}
      <div class="sb-inspector-section">
        <SliderRow
          label="FADE OUT"
          value={fadeOut}
          min={0}
          max={10}
          step={0.1}
          format={(v) => `${v.toFixed(1)}s`}
          onChange={handleFadeOutChange}
          testid="pad-editor-panel-fade-out-slider"
        />
      </div>

      {/* Hotkey (read-only; Key-Capture = Slice 8) */}
      <div class="sb-inspector-section">
        <label class="sb-field-label">HOTKEY</label>
        <div class="sb-readonly-field">
          <PixelIcon name="keyboard" size={11} color="var(--text-mute)" />
          <span
            class="sb-hotkey-value sb-flex-1"
            style={{ color: pad.hotkey ? 'var(--text)' : 'var(--text-mute)' }}
          >
            {pad.hotkey ?? '— not assigned —'}
          </span>
          <span class="sb-hint-text">Slice 8</span>
        </div>
      </div>

      {/* Spacer */}
      <div class="sb-flex-1" />

      {/* Delete */}
      <div class="sb-inspector-section">
        <button
          class="sb-btn sb-btn-danger sb-btn-block"
          data-testid="pad-editor-panel-delete-button"
          onClick={handleDelete}
          onBlur={() => setDeleteConfirm(false)}
        >
          <PixelIcon name="skull" size={12} />
          {deleteConfirm ? 'CONFIRM DELETE' : 'DELETE PAD'}
        </button>
      </div>

      {/* Type change confirm dialog */}
      {pendingType !== null && (
        <PadTypeConfirmDialog
          fromType={type}
          toType={pendingType}
          onConfirm={() => applyTypeSwitch(pendingType)}
          onCancel={() => setPendingType(null)}
        />
      )}
    </div>
  );
}

// ── SliderRow ────────────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  testid,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  testid?: string;
}): JSX.Element {
  return (
    <div>
      <div class="sb-section-header-row">
        <label class="sb-field-label">{label}</label>
        <span class="sb-value-text">{format(value)}</span>
      </div>
      <input
        class="sb-range-input"
        type="range"
        data-testid={testid}
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onChange(parseFloat((e.target as HTMLInputElement).value))}
      />
    </div>
  );
}
