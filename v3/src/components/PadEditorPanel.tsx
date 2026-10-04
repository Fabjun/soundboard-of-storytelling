/**
 * @fileoverview PadEditorPanel — right-inspector panel for pad editing (SETUP mode)
 *
 * Used for:
 *   Path C (ADD PAD): full editor from scratch
 *   Pad tap in SETUP mode: edit existing pad
 *   "More options" handoff from Path A Popover
 *
 * Save strategy: Auto-Save with 500ms debounce (no explicit Save button).
 * Matches V1 workflow, prevents forgotten saves. A pending edit is written at once — never
 * dropped — when the editor switches pad, closes or the page is hidden (src/lib/debouncedSave.ts).
 *
 * Fields:
 *   - Name (required)
 *   - Type (with PadTypeConfirmDialog on change)
 *   - Single / Loop: the file list (PadFileList — select, ▲ / ▼, 2-tap remove, in order /
 *     shuffled) and the library picker that adds several ticked files at once (Slice 15b)
 *   - Single / Loop with a file: the waveform editor of the selected file (its own trim handles,
 *     the pad's fade handles — ADR-0068), trim start / end number fields and the preview
 *     ▶ / ⏸ / ⏹ of that file (Slice 15a, src/lib/preview.ts); the trim and fades always fit the
 *     file (src/lib/trimRange.ts)
 *   - Combo: the steps (ComboStepsEditor)
 *   - Loop: REPEAT — ∞ (until stopped) or a count 1–999 (Slice 15c, ADR-0069)
 *   - Volume slider (0-100)
 *   - Fade In / Fade Out sliders (0-10s, shorter when the trimmed region is)
 *   - Hotkey display (read-only; assigning keys comes with Slice 12) — deck view only, keys belong to a placement
 *   - Decks checklist: place the pad in other decks or remove it (Slice 9e, ADR-0048)
 *   - Remove from deck (2-tap confirm, deck view only) — the pad stays in the pool
 *   - Delete button (2-tap confirm) — shows in how many decks the pad is used
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { Board, ComboStep, Deck, FileOrder, Pad, PadBase, PadFile, PadType } from '../types';
import { isComboPad, REPEAT_MAX } from '../types';
import { PixelIcon } from './PixelIcon';
import { Waveform } from './Waveform';
import { WaveformEditor } from './WaveformEditor';
import { PadFileList } from './PadFileList';
import { addFiles, moveFile, removeFile, setFileTrim } from '../lib/padFiles';
import { PadTypeConfirmDialog } from './PadTypeConfirmDialog';
import { ComboStepsEditor } from './ComboStepsEditor';
import {
  padBaseOf,
  padTypeColor,
  padTypeLabel,
  applyTypeChange,
  padMigrationMatrix,
} from '../lib/padUtils';
import { libraryItems, previewPlaying } from '../state/store';
import { updateBoard } from '../state/boardWrites';
import { deckCount, placeInDeck, removeFromDeck, updatePad } from '../lib/boardModel';
import { nextFreeSlot } from '../lib/padUtils';
import { debouncedSave } from '../lib/debouncedSave';
import { fromPad, moveHandle, toPad, type Handle, type TrimValues } from '../lib/trimRange';
import { previewPosition, startPreview, stopPreview } from '../lib/preview';
import { ensureFinePeaks } from '../lib/upload';

interface PadEditorPanelProps {
  pad: Pad;
  /** The deck the pad was opened from; null = opened from the All pads view. */
  deck: Deck | null;
  board: Board;
  onClose: () => void;
  onDelete: (padId: string) => void;
  /** Removes the pad from `deck` only (deck view). */
  onRemoveFromDeck: (padId: string) => void;
}

const PAD_TYPES: PadType[] = ['single', 'loop', 'combo'];

/**
 * Edits one pad in SETUP mode and saves each change on its own after a short pause; a pending
 * change is written at once when the editor closes or switches pad. Also places the pad in decks,
 * removes it from the current deck, or deletes it.
 */
export function PadEditorPanel({
  pad,
  deck,
  board,
  onClose,
  onDelete,
  onRemoveFromDeck,
}: PadEditorPanelProps): JSX.Element {
  // Local state mirrors the pad; auto-saved on change
  const [name, setName] = useState(pad.name);
  const [type, setType] = useState<PadType>(pad.type);
  /** Audio files of a Single / Loop pad, each with its own trim (ADR-0068); empty for a Combo. */
  const [files, setFiles] = useState<PadFile[]>(isComboPad(pad) ? [] : pad.files);
  const [order, setOrder] = useState<FileOrder>(isComboPad(pad) ? 'sequential' : pad.order);
  /** How often a Loop plays (ADR-0069); undefined = until stopped (∞). */
  const [repeat, setRepeat] = useState<number | undefined>(
    pad.type === 'loop' ? pad.repeat : undefined,
  );
  /** The file the waveform editor and the preview work on (index into `files`). */
  const [selectedIndex, setSelectedIndex] = useState(0);
  /** Library files ticked in the picker, added together with ADD. */
  const [picked, setPicked] = useState<string[]>([]);
  /** Steps of a Combo pad (Slice 11); empty for Single / Loop. Saved with the rest of the pad. */
  const [steps, setSteps] = useState<ComboStep[]>(isComboPad(pad) ? pad.steps : []);
  const [volume, setVolume] = useState(pad.volume);
  const [fadeIn, setFadeIn] = useState(pad.fadeIn);
  const [fadeOut, setFadeOut] = useState(pad.fadeOut);
  /** Where the next preview starts, in seconds; null = at the trim start. */
  const [cursor, setCursor] = useState<number | null>(null);
  /** The preview was started and not yet stopped or ended. */
  const [previewOn, setPreviewOn] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [pendingType, setPendingType] = useState<PadType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [libPickerOpen, setLibPickerOpen] = useState(false);

  // The pad lives once in the pool: the edit shows in every deck that places it (ADR-0048).
  // updateBoard applies it to the board as it is when the save runs, so a change made in the
  // meantime (deck checkbox, drag and drop, deck rename) is kept.
  const [autoSave] = useState(() =>
    debouncedSave<{ boardId: string; pad: Pad }>((edit) => {
      void updateBoard(edit.boardId, (b) => updatePad(b, edit.pad));
    }, 500),
  );
  /** The pad's key in this deck — keys belong to the placement (ADR-0048). */
  const hotkey = deck?.placements.find((p) => p.padId === pad.id)?.hotkey;

  // One editor per pad: BoardScreen keys it by pad id, so another pad gets a fresh editor with
  // fresh state (react.dev, "You Might Not Need an Effect" — resetting state with a key). The
  // pending edit belongs to this pad and is written when the editor goes — a layout cleanup, as
  // Preact runs passive cleanups only after the next paint.
  useLayoutEffect(() => () => autoSave.flush(), [autoSave]);

  // The page being hidden is the last reliable moment to save (app switch, tab close)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') autoSave.flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [autoSave]);

  // The preview belongs to this editor: it stops when the editor closes or switches pad
  useLayoutEffect(() => () => stopPreview(), []);

  /** Index of the selected file, kept inside the list (files can be removed). */
  const selected = Math.min(selectedIndex, Math.max(0, files.length - 1));
  const selectedHash = files[selected]?.hash;

  // An entry stored before ADR-0065 gets its fine peaks once, for the waveform editor
  useEffect(() => {
    if (selectedHash) void ensureFinePeaks(selectedHash);
  }, [selectedHash]);

  // While the preview runs, the playhead follows it; when it ends, the next one starts at the
  // trim start again
  const seenPlaying = useRef(false);
  /** Counts preview starts and stops, so a late answer of an old start changes nothing. */
  const previewRun = useRef(0);
  useEffect(() => {
    if (!previewOn) return;
    let frame = 0;
    const tick = () => {
      if (previewPlaying.value) seenPlaying.current = true;
      else if (seenPlaying.current) {
        endPreview(null);
        return;
      }
      setPlayhead(previewPosition());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [previewOn]);

  // ── Auto-save with 500ms debounce ────────────────────────────────────────

  function scheduleAutoSave(updatedPad: Pad) {
    autoSave.schedule({ boardId: board.id, pad: updatedPad });
  }

  /**
   * The pad as edited: everything it has, with the edited fields on top (an edit is a
   * modification). The overrides carry values whose state has not committed yet.
   */
  function buildCurrentPad(
    filesOverride?: PadFile[],
    stepsOverride?: ComboStep[],
    orderOverride?: FileOrder,
  ): Pad {
    const base: PadBase = {
      ...padBaseOf(pad),
      name,
      volume,
      fadeIn,
      fadeOut,
      modifiedAt: Date.now(),
    };
    if (type === 'combo') return { ...base, type, steps: stepsOverride ?? steps };
    const fileFields = {
      files: (filesOverride ?? files).map(fitFile),
      order: orderOverride ?? order,
    };
    if (type === 'single') return { ...base, type, ...fileFields };
    return { ...base, type, ...fileFields, ...(repeat === undefined ? {} : { repeat }) };
  }

  /** REPEAT — ∞ (undefined) or a count; a typed count lands within 1–`REPEAT_MAX`. */
  function handleRepeatChange(next: number | undefined) {
    setRepeat(next);
    const current = buildCurrentPad();
    if (current.type !== 'loop') return;
    const { repeat: _old, ...rest } = current;
    scheduleAutoSave(next === undefined ? rest : { ...rest, repeat: next });
  }

  /** A file with its trim pulled into the file's length (no change while the length is unknown). */
  function fitFile(file: PadFile): PadFile {
    const duration = durationOf(file.hash);
    if (duration <= 0) return file;
    const t = toPad(fromPad({ ...file, fadeIn: 0, fadeOut: 0 }, duration), duration);
    return setFileTrim([file], 0, t)[0];
  }

  /** Length of a library file in seconds; 0 when unknown. */
  function durationOf(id: string | undefined): number {
    return libraryItems.value.find((m) => m.id === id)?.duration ?? 0;
  }

  /** The trim values of the selected file of a Single / Loop when its length is known; else null. */
  function currentTrim(): { values: TrimValues; duration: number } | null {
    const file = files[selected];
    const duration = durationOf(file?.hash);
    if (type === 'combo' || !file || duration <= 0) return null;
    return { values: fromPad({ ...file, fadeIn, fadeOut }, duration), duration };
  }

  /**
   * Moves a trim handle of the selected file or a fade handle of the pad; the rules of
   * src/lib/trimRange.ts decide where it lands. Returns the new values (null without a file of
   * known length).
   */
  function handleTrimMove(handle: Handle, position: number): TrimValues | null {
    const trim = currentTrim();
    if (!trim || !Number.isFinite(position)) return null;
    const moved = moveHandle(trim.values, handle, position, trim.duration);
    const t = toPad(moved, trim.duration);
    const nextFiles = setFileTrim(files, selected, t);
    setFiles(nextFiles);
    setFadeIn(t.fadeIn);
    setFadeOut(t.fadeOut);
    scheduleAutoSave({ ...buildCurrentPad(nextFiles), fadeIn: t.fadeIn, fadeOut: t.fadeOut });
    return moved;
  }

  function handleNameChange(newName: string) {
    setName(newName);
    scheduleAutoSave({ ...buildCurrentPad(), name: newName });
  }

  function handleVolumeChange(v: number) {
    setVolume(v);
    scheduleAutoSave({ ...buildCurrentPad(), volume: v });
  }

  /** A fade slider: with a file, a fade handle move (the fades fit the trimmed region). */
  function handleFadeInChange(v: number) {
    const trim = currentTrim();
    if (trim) {
      handleTrimMove('fadeIn', trim.values.trimStart + v);
      return;
    }
    setFadeIn(v);
    scheduleAutoSave({ ...buildCurrentPad(), fadeIn: v });
  }

  /** A fade slider: with a file, a fade handle move (the fades fit the trimmed region). */
  function handleFadeOutChange(v: number) {
    const trim = currentTrim();
    if (trim) {
      handleTrimMove('fadeOut', trim.values.trimEnd - v);
      return;
    }
    setFadeOut(v);
    scheduleAutoSave({ ...buildCurrentPad(), fadeOut: v });
  }

  // ── File list (Slice 15b, ADR-0068) ──────────────────────────────────────

  /** Saves a changed file list (and order) and selects the file at `select`. */
  function changeFiles(next: PadFile[], select: number, nextOrder = order) {
    setFiles(next);
    setSelectedIndex(Math.max(0, Math.min(select, next.length - 1)));
    scheduleAutoSave(buildCurrentPad(next, undefined, nextOrder));
  }

  /** ADD — the files ticked in the picker go to the end of the list; the first new one is selected. */
  function handleAddPicked() {
    const next = addFiles(files, picked);
    setPicked([]);
    setLibPickerOpen(false);
    if (next.length !== files.length) changeFiles(next, files.length);
  }

  function handleSelectFile(index: number) {
    if (index === selected) return;
    endPreview(null);
    setSelectedIndex(index);
  }

  /** ▲ / ▼ — the selection moves with the file it is on. */
  function handleMoveFile(index: number, step: -1 | 1) {
    const next = moveFile(files, index, step);
    const follow = selected === index ? index + step : selected === index + step ? index : selected;
    changeFiles(next, follow);
  }

  function handleRemoveFile(index: number) {
    if (index === selected) endPreview(null);
    changeFiles(removeFile(files, index), index < selected ? selected - 1 : selected);
  }

  function handleOrderChange(next: FileOrder) {
    setOrder(next);
    changeFiles(files, selected, next);
  }

  // ── Preview ──────────────────────────────────────────────────────────────

  /** ▶ — plays the file as the pad would, from the cursor (default: the trim start). */
  function handlePreviewPlay() {
    const trim = currentTrim();
    const current = buildCurrentPad();
    if (!trim || isComboPad(current)) return;
    seenPlaying.current = false;
    setPreviewOn(true);
    const run = ++previewRun.current;
    const from = cursor ?? trim.values.trimStart;
    void startPreview(current, current.files[selected], from, trim.values.trimEnd).then(() => {
      // Could not start (file missing or undecodable): nothing plays, ▶ shows again
      if (run === previewRun.current && !previewPlaying.value) endPreview(cursor);
    });
  }

  /** ⏸ — stops the preview; the next ▶ goes on where it stopped. */
  function handlePreviewPause() {
    endPreview(previewPosition() ?? cursor);
  }

  /** Stops the preview; the next ▶ starts at `nextCursor` (null = the trim start). */
  function endPreview(nextCursor: number | null) {
    previewRun.current++;
    // A frame may still run before the playhead loop is cancelled: it must not take this stop
    // for the end of the file (and move the cursor back to the trim start)
    seenPlaying.current = false;
    stopPreview();
    setPreviewOn(false);
    setPlayhead(null);
    setCursor(nextCursor);
  }

  /**
   * The playback position moved (tap or key): the next preview starts there, a running preview
   * jumps there. Kept within the trimmed region, in hundredths of a second.
   */
  function handleSeek(position: number) {
    const trim = currentTrim();
    if (!trim) return;
    const inRegion = Math.min(Math.max(position, trim.values.trimStart), trim.values.trimEnd);
    const at = Math.round(inRegion * 100) / 100;
    setCursor(at);
    if (previewOn) {
      const current = buildCurrentPad();
      if (isComboPad(current)) return;
      seenPlaying.current = false;
      void startPreview(current, current.files[selected], at, trim.values.trimEnd);
    }
  }

  // ── Type change ──────────────────────────────────────────────────────────

  function requestTypeChange(newType: PadType) {
    if (newType === type) return;
    // No dialog for a brand-new pad (no name and no file = fresh)
    const isFresh = files.length === 0 && pad.name === '';
    const { verdict } = padMigrationMatrix(type, newType);
    if (isFresh || verdict === 'add') {
      applyTypeSwitch(newType);
    } else {
      setPendingType(newType);
    }
  }

  function applyTypeSwitch(newType: PadType) {
    endPreview(null);
    const migrated = applyTypeChange(buildCurrentPad(), newType);
    setType(migrated.type);
    setFiles(isComboPad(migrated) ? [] : migrated.files);
    setOrder(isComboPad(migrated) ? 'sequential' : migrated.order);
    setRepeat(migrated.type === 'loop' ? migrated.repeat : undefined);
    setSteps(isComboPad(migrated) ? migrated.steps : []);
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

  // ── Decks checklist / remove from deck ───────────────────────────────────

  function handleDeckToggle(deckId: string, checked: boolean) {
    void updateBoard(board.id, (b) =>
      checked ? placeInDeck(b, deckId, pad.id) : removeFromDeck(b, deckId, pad.id),
    );
  }

  function handleRemove() {
    if (removeConfirm) {
      onRemoveFromDeck(pad.id);
    } else {
      setRemoveConfirm(true);
    }
  }

  const decksByOrder = [...board.decks].sort((a, b) => a.order - b.order);
  const usedIn = deckCount(board, pad.id);

  // ── Library picker ───────────────────────────────────────────────────────

  const allAudio = libraryItems.value.filter((m) => m.type === 'audio');
  const filteredAudio = libSearch.trim()
    ? allAudio.filter((m) => m.name.toLowerCase().includes(libSearch.toLowerCase()))
    : allAudio;
  const selectedItem = allAudio.find((m) => m.id === selectedHash);
  const trim = currentTrim();
  /** Seconds shown next to the preview buttons: the playhead, else where ▶ starts. */
  const previewAt = playhead ?? cursor ?? trim?.values.trimStart ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────

  const typeColor = padTypeColor(type);

  return (
    <div class="sb-pad-editor" data-testid="pad-editor-panel">
      {/* Header */}
      <div class="sb-panel-header is-active" style={{ borderBottom: `2px solid ${typeColor}` }}>
        <span class="sb-type-indicator" style={{ background: typeColor }} />
        <span class="sb-panel-title">Pad Editor</span>
        <button
          class="sb-btn sb-btn-icon sb-btn-ghost"
          data-testid="pad-editor-panel-close-button"
          aria-label="Close the pad editor"
          onClick={onClose}
        >
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

      {/* Combo: its steps (Slice 11) */}
      {type === 'combo' && (
        <ComboStepsEditor
          comboId={pad.id}
          steps={steps}
          board={board}
          onChange={(next) => {
            setSteps(next);
            scheduleAutoSave(buildCurrentPad(undefined, next));
          }}
        />
      )}

      {/* Audio source — Single and Loop only; a Combo plays other pads */}
      {type !== 'combo' && (
        <div class="sb-inspector-section">
          <div class="sb-section-header-row">
            <label class="sb-field-label">AUDIO FILES</label>
            <button
              class="sb-btn sb-btn-xs sb-btn-ghost"
              data-testid="pad-editor-panel-browse-button"
              onClick={() => {
                setPicked([]);
                setLibPickerOpen((o) => !o);
              }}
            >
              {libPickerOpen ? 'CLOSE' : 'BROWSE'}
            </button>
          </div>

          {/* The pad's files: select, reorder, remove; how several of them play */}
          <PadFileList
            files={files}
            names={(hash) => allAudio.find((m) => m.id === hash)?.name}
            selected={selected}
            order={order}
            onSelect={handleSelectFile}
            onMove={handleMoveFile}
            onRemove={handleRemoveFile}
            onOrderChange={handleOrderChange}
          />
          {selectedItem && !trim && selectedItem.peaks.length > 0 && (
            <Waveform peaks={selectedItem.peaks} height={24} />
          )}

          {/* Waveform editor, preview and trim fields — a file of known length is needed */}
          {selectedItem && trim && (
            <div class="sb-col">
              <WaveformEditor
                peaks={selectedItem.peaks}
                duration={trim.duration}
                values={trim.values}
                onMove={handleTrimMove}
                playhead={playhead}
                cursor={cursor ?? trim.values.trimStart}
                onSeek={handleSeek}
              />
              <div class="sb-row-sm">
                <button
                  class="sb-btn sb-btn-ghost"
                  data-testid={`pad-editor-panel-preview-${previewOn ? 'pause' : 'play'}-button`}
                  aria-label={previewOn ? 'Pause the preview' : 'Play a preview'}
                  onClick={previewOn ? handlePreviewPause : handlePreviewPlay}
                >
                  {previewOn ? '⏸' : '▶'}
                </button>
                <button
                  class="sb-btn sb-btn-ghost"
                  data-testid="pad-editor-panel-preview-stop-button"
                  aria-label="Stop the preview"
                  onClick={() => endPreview(null)}
                >
                  ⏹
                </button>
                <span class="sb-value-text" data-testid="pad-editor-panel-preview-text">
                  {previewAt.toFixed(1)}s / {trim.duration.toFixed(1)}s
                </span>
              </div>
              <div class="sb-row-sm">
                <TrimField
                  label="Start (s)"
                  value={trim.values.trimStart}
                  testid="pad-editor-panel-trim-start-input"
                  onCommit={(v) => handleTrimMove('trimStart', v)?.trimStart}
                />
                <TrimField
                  label="End (s)"
                  value={trim.values.trimEnd}
                  testid="pad-editor-panel-trim-end-input"
                  onCommit={(v) => handleTrimMove('trimEnd', v)?.trimEnd}
                />
              </div>
            </div>
          )}

          {/* Library picker — tick several files, add them together (V1 v120 multi-select) */}
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
              {filteredAudio.slice(0, 50).map((item) => {
                const inPad = files.some((f) => f.hash === item.id);
                return (
                  <label key={item.id} class="sb-check-row sb-lib-browser-item">
                    <input
                      type="checkbox"
                      data-testid={`pad-editor-panel-pick-input-${item.id}`}
                      checked={inPad || picked.includes(item.id)}
                      disabled={inPad}
                      onChange={(e) => {
                        const on = (e.target as HTMLInputElement).checked;
                        setPicked((p) => (on ? [...p, item.id] : p.filter((h) => h !== item.id)));
                      }}
                    />
                    <span class="sb-flex-trunc">{item.name}</span>
                    {inPad && <span class="sb-hint-text">(in this pad)</span>}
                  </label>
                );
              })}
              {filteredAudio.length === 0 && (
                <div class="sb-lib-browser-no-results">No files found</div>
              )}
              <button
                class="sb-btn sb-btn-primary sb-btn-block"
                data-testid="pad-editor-panel-add-files-button"
                disabled={picked.length === 0}
                onClick={handleAddPicked}
              >
                {picked.length === 1 ? 'ADD 1 FILE' : `ADD ${picked.length} FILES`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* REPEAT — a Loop plays until stopped (∞) or a number of times, then stops (ADR-0069) */}
      {type === 'loop' && (
        <div class="sb-inspector-section">
          <label class="sb-field-label">REPEAT</label>
          <div class="sb-row-sm">
            <button
              class={`sb-btn sb-btn-xs ${repeat === undefined ? 'sb-btn-primary' : 'sb-btn-ghost'}`}
              aria-pressed={repeat === undefined}
              aria-label="Repeat until stopped"
              data-testid="pad-editor-panel-repeat-forever-button"
              onClick={() => handleRepeatChange(undefined)}
            >
              ∞
            </button>
            <input
              class="sb-text-input"
              type="number"
              min="1"
              max={REPEAT_MAX}
              step="1"
              placeholder="Count…"
              aria-label="Repeat count"
              data-testid="pad-editor-panel-repeat-input"
              value={repeat ?? ''}
              onChange={(e) => {
                const typed = Math.floor(parseFloat(e.currentTarget.value));
                const next = Number.isFinite(typed)
                  ? Math.min(Math.max(typed, 1), REPEAT_MAX)
                  : undefined;
                handleRepeatChange(next);
                e.currentTarget.value = next === undefined ? '' : String(next);
              }}
            />
          </div>
        </div>
      )}

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

      {/* Hotkey (read-only; assigning keys comes with Slice 12) — keys belong to a deck's placement */}
      {deck && (
        <div class="sb-inspector-section">
          <label class="sb-field-label">HOTKEY</label>
          <div class="sb-readonly-field">
            <PixelIcon name="keyboard" size={11} color="var(--text-mute)" />
            <span
              class="sb-hotkey-value sb-flex-1"
              style={{ color: hotkey ? 'var(--text)' : 'var(--text-mute)' }}
            >
              {hotkey ?? '— not assigned —'}
            </span>
            <span class="sb-hint-text">read-only</span>
          </div>
        </div>
      )}

      {/* Decks — place the pad in other decks or take it out (ADR-0048) */}
      <div class="sb-inspector-section">
        <label class="sb-field-label">DECKS</label>
        {decksByOrder.length === 0 && <div class="sb-hint-text">No decks yet</div>}
        {decksByOrder.map((d) => {
          const placed = d.placements.some((p) => p.padId === pad.id);
          const full =
            !placed && nextFreeSlot(d.placements, d.gridConfig.cols, d.gridConfig.rows) === null;
          return (
            <label key={d.id} class="sb-check-row">
              <input
                type="checkbox"
                data-testid={`pad-editor-panel-deck-input-${d.id}`}
                checked={placed}
                disabled={full}
                onChange={(e) => handleDeckToggle(d.id, (e.target as HTMLInputElement).checked)}
              />
              <span class="sb-flex-trunc">{d.name}</span>
              {full && <span class="sb-hint-text">(full)</span>}
            </label>
          );
        })}
      </div>

      {/* Spacer */}
      <div class="sb-flex-1" />

      {/* Remove from deck — deck view only; the pad stays in the pool */}
      {deck && (
        <div class="sb-inspector-section">
          <button
            class="sb-btn sb-btn-ghost sb-btn-block"
            data-testid="pad-editor-panel-remove-button"
            onClick={handleRemove}
            onBlur={() => setRemoveConfirm(false)}
          >
            {removeConfirm ? 'CONFIRM REMOVE' : 'REMOVE FROM DECK'}
          </button>
        </div>
      )}

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
        {deleteConfirm && (
          <div class="sb-hint-text" data-testid="pad-editor-panel-delete-text">
            Used in {usedIn} {usedIn === 1 ? 'deck' : 'decks'} — deleting removes it everywhere.
          </div>
        )}
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

// ── TrimField ────────────────────────────────────────────────────────────────

/**
 * A number field for a trim handle — the way to set it without dragging (WCAG 2.2 SC 2.5.7).
 * The value is taken when the field is left or Enter is pressed; the field then shows where the
 * handle landed, also when the rules moved it.
 */
function TrimField({
  label,
  value,
  testid,
  onCommit,
}: {
  label: string;
  value: number;
  testid: string;
  /** Applies a typed value; returns where the handle landed, undefined when nothing changed. */
  onCommit: (v: number) => number | undefined;
}): JSX.Element {
  return (
    <label class="sb-check-row">
      {label}
      <input
        class="sb-text-input"
        type="number"
        min="0"
        step="0.01"
        data-testid={testid}
        value={value}
        onChange={(e) => {
          const landed = onCommit(parseFloat(e.currentTarget.value));
          e.currentTarget.value = String(landed ?? value);
        }}
      />
    </label>
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
