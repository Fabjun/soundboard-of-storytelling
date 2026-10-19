/**
 * @fileoverview PadEditorPanel — the PAD editor (SETUP mode), a full-screen dialog
 *
 * Covers the whole window on every screen size, the board's top bar included (owner decision
 * 2026-10-05); the fields scroll, centered and limited in width on a wide window. A modal dialog
 * after the WAI-ARIA APG pattern: focus moves into it, the board behind is inert
 * (src/lib/modalDialog.ts), Escape closes it — unless the icon list or the type confirmation
 * on top of it is open, which close first — and focus returns to the pad that opened it.
 * Closing stays with the ✕ button and Escape (design-notes B7: no swipe-away).
 *
 * Used for:
 *   Path C (ADD PAD): full editor from scratch
 *   Pad tap in SETUP mode: edit existing pad
 *   "More options" handoff from Path A Popover
 *
 * Save strategy (owner decision 2026-10-11, ADR-0084): the pad's fields are a draft until SAVE;
 * ↶ / ↷ (and Cmd / Ctrl + Z) undo and redo every step (src/lib/editHistory.ts); ✕ or Escape with
 * unsaved changes asks "Discard changes?" — KEEP EDITING or DISCARD CHANGES (the Material
 * full-screen dialog pattern). The board relations — decks, keys, quick access, remove, delete —
 * act at once, as before. Was: auto-save after 500 ms (src/lib/debouncedSave.ts).
 *
 * Fields:
 *   - Name (required)
 *   - Icons: up to 4 slots — tap one to change it in the IconPicker, ✕ twice to remove, + adds
 *     (Slice 15d, ADR-0070)
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
 *   - Hotkey: tap the field, press a key (K1, Slice 12a, ADR-0077); a key another pad of the deck
 *     holds moves here on MOVE KEY HERE — deck view only, keys belong to a placement
 *   - Decks checklist: place the pad in other decks or remove it (Slice 9e, ADR-0048)
 *   - Remove from deck (2-tap confirm, deck view only) — the pad stays in the pool
 *   - Delete button (2-tap confirm) — shows in how many decks the pad is used
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { Board, ComboStep, Deck, FileOrder, Pad, PadBase, PadFile, PadType } from '../types';
import { isComboPad, REPEAT_MAX } from '../types';
import { UiIcon } from './UiIcon';
import { Waveform } from './Waveform';
import { WaveformEditor } from './WaveformEditor';
import { PadFileList } from './PadFileList';
import { addFiles, moveFile, removeFile, setFileTrim } from '../lib/padFiles';
import { PadTypeConfirmDialog } from './PadTypeConfirmDialog';
import { SliderRow } from './SliderRow';
import { ComboStepsEditor } from './ComboStepsEditor';
import { IconGlyph, useIconDrawings } from './PadIcons';
import { IconPicker } from './IconPicker';
import { PAD_ICONS_MAX } from '../lib/iconSet';
import {
  padBaseOf,
  padTypeColor,
  padTypeLabel,
  applyTypeChange,
  padMigrationMatrix,
  samePadContent,
} from '../lib/padUtils';
import { libraryItems, previewPlaying } from '../state/store';
import { updateBoard } from '../state/boardWrites';
import {
  QUICK_ACCESS_MAX,
  addToQuickAccess,
  placeInDeck,
  removeFromDeck,
  removeFromQuickAccess,
  setPlacementHotkey,
  setQuickAccessHotkey,
  updatePad,
} from '../lib/boardModel';
import {
  deckKeyUse,
  keyHolder,
  keyLabel,
  quickAccessKeyHolder,
  reservedKeys,
} from '../lib/padKeys';
import { KeyField, type KeyCheck } from './KeyField';
import { record, redo, seal, startHistory, undo, type History } from '../lib/editHistory';
import { debouncedSave } from '../lib/debouncedSave';
import { clearPadDraft, getControlKeys, getPadDraft, setPadDraft } from '../state/prefs';
import { fromPad, moveHandle, toPad, type Handle, type TrimValues } from '../lib/trimRange';
import { previewPosition, startPreview, stopPreview } from '../lib/preview';
import { ensureFinePeaks } from '../lib/upload';
import { useModalDialog } from '../lib/modalDialog';
import { useEscapeKey, useKeydown } from '../lib/escapeKey';

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
 * Edits one pad in SETUP mode as a draft that SAVE writes, with undo and redo; closing with
 * unsaved changes asks first. Also places the pad in decks, removes it from the current deck, or
 * deletes it — at once.
 */
export function PadEditorPanel({
  pad,
  deck,
  board,
  onClose,
  onDelete,
  onRemoveFromDeck,
}: PadEditorPanelProps): JSX.Element {
  // A draft this editor left behind — the page closed or the tab ended before SAVE — comes back
  // (ADR-0084); the fields start from it
  const [restored] = useState(() => {
    const d = getPadDraft(pad.id);
    return d && !samePadContent(d, pad) ? d : null;
  });
  const start = restored ?? pad;
  // Local state mirrors the draft
  const [name, setName] = useState(start.name);
  const [type, setType] = useState<PadType>(start.type);
  /** Audio files of a Single / Loop pad, each with its own trim (ADR-0068); empty for a Combo. */
  const [files, setFiles] = useState<PadFile[]>(isComboPad(start) ? [] : start.files);
  const [order, setOrder] = useState<FileOrder>(isComboPad(start) ? 'sequential' : start.order);
  /** How often a Loop plays (ADR-0069); undefined = until stopped (∞). */
  const [repeat, setRepeat] = useState<number | undefined>(
    start.type === 'loop' ? start.repeat : undefined,
  );
  /** The file the waveform editor and the preview work on (index into `files`). */
  const [selectedIndex, setSelectedIndex] = useState(0);
  /** Library files ticked in the picker, added together with ADD. */
  const [picked, setPicked] = useState<string[]>([]);
  /** Steps of a Combo pad (Slice 11); empty for Single / Loop. Saved with the rest of the pad. */
  const [steps, setSteps] = useState<ComboStep[]>(isComboPad(start) ? start.steps : []);
  const [volume, setVolume] = useState(start.volume);
  const [fadeIn, setFadeIn] = useState(start.fadeIn);
  const [fadeOut, setFadeOut] = useState(start.fadeOut);
  /** Where the next preview starts, in seconds; null = at the trim start. */
  const [cursor, setCursor] = useState<number | null>(null);
  /** The preview was started and not yet stopped or ended. */
  const [previewOn, setPreviewOn] = useState(false);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [pendingType, setPendingType] = useState<PadType | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [libPickerOpen, setLibPickerOpen] = useState(false);
  /** The pad's icons, up to 4 keys in the order the pad shows them (ADR-0070). */
  const [icons, setIcons] = useState<string[]>(start.icons ?? []);
  /** The icon slot the picker fills (an index into `icons`, or its length to add); null = closed. */
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  /** The icon whose remove button was tapped once and now asks to confirm. */
  const [iconConfirm, setIconConfirm] = useState<number | null>(null);
  const iconDrawings = useIconDrawings(icons);

  // A draft until SAVE, with undo and redo (owner decision 2026-10-11, ADR-0084): every change
  // records the whole pad as a step; `saved` is the content last stored, to tell whether there are
  // unsaved changes
  const [history, setHistory] = useState<History<Pad>>(() =>
    restored ? record(startHistory(pad), restored) : startHistory(pad),
  );
  const [saved, setSaved] = useState<Pad>(pad);
  const unsaved = !samePadContent(history.present, saved);
  /** Closing with unsaved changes asks first: discard them, or keep editing. */
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  /** The pad's key in this deck — keys belong to the placement (ADR-0048). */
  const hotkey = deck?.placements.find((p) => p.padId === pad.id)?.hotkey;
  /** The pad's board-wide key in the quick-access bar (K13). */
  const quickKey = board.quickAccess.find((q) => q.padId === pad.id)?.hotkey;

  // One editor per pad: BoardScreen keys it by pad id, so another pad gets a fresh editor with
  // fresh state (react.dev, "You Might Not Need an Effect" — resetting state with a key).

  // The undo / redo keys on the document while the editor is open: a SAVE button turned off after
  // an undo hands the focus to the body (WebKit), outside the dialog
  useKeydown(handleShortcut);

  // Leaving the page with unsaved changes asks the browser's question first (MDN beforeunload);
  // iOS does not ask — BACKLOG "PAD editor draft kept on the device"
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  // The draft kept on the device while it is unsaved (iOS ends background tabs and asks nothing):
  // written once the edits pause, at once when the page is hidden or the editor goes; null clears
  // it (src/lib/debouncedSave.ts)
  const [keeper] = useState(() =>
    debouncedSave<Pad | null>((d) => (d ? setPadDraft(d) : clearPadDraft(pad.id)), 500),
  );
  useLayoutEffect(() => () => keeper.flush(), [keeper]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') keeper.flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [keeper]);

  /** Forgets the kept draft at once (SAVE, DISCARD CHANGES, delete). */
  function dropDraft() {
    keeper.schedule(null);
    keeper.flush();
  }

  // The preview belongs to this editor: it stops when the editor closes or switches pad
  useLayoutEffect(() => () => stopPreview(), []);

  // A modal dialog: focus moves in, the board behind is inert, and on close focus goes back to
  // the element that opened it (the pad) while that is still on the page
  const dialog = useRef<HTMLDivElement>(null);
  useModalDialog(dialog, {
    root: (el) => el.closest('.sb-screen') ?? document.body,
    initialFocus: (el) => el,
  });

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

  // ── Draft, SAVE, undo and redo (ADR-0084) ────────────────────────────────

  /**
   * Records a change of the draft. Changes of the same `kind` in quick succession (typing, a
   * slider) are one undo step (src/lib/editHistory.ts).
   */
  function edit(updatedPad: Pad, kind?: string) {
    applyHistory(record(historyRef.current, updatedPad, kind));
  }

  // The latest history and stored content, for changes that follow each other within one event
  const historyRef = useRef(history);
  const savedRef = useRef(saved);

  /**
   * Shows a new history and keeps its draft on the device — scheduled here, in the event, not in
   * an effect: a page hidden right after a change must find it (an effect runs after the paint).
   */
  function applyHistory(h: History<Pad>) {
    historyRef.current = h;
    setHistory(h);
    keeper.schedule(samePadContent(h.present, savedRef.current) ? null : h.present);
  }

  /** Shows a draft from the history in every field (undo / redo). */
  function loadDraft(p: Pad) {
    endPreview(null);
    setName(p.name);
    setType(p.type);
    setFiles(isComboPad(p) ? [] : p.files);
    setOrder(isComboPad(p) ? 'sequential' : p.order);
    setRepeat(p.type === 'loop' ? p.repeat : undefined);
    setSteps(isComboPad(p) ? p.steps : []);
    setVolume(p.volume);
    setFadeIn(p.fadeIn);
    setFadeOut(p.fadeOut);
    setIcons(p.icons ?? []);
  }

  function handleUndo() {
    const h = undo(historyRef.current);
    if (h === historyRef.current) return;
    applyHistory(h);
    loadDraft(h.present);
  }

  function handleRedo() {
    const h = redo(historyRef.current);
    if (h === historyRef.current) return;
    applyHistory(h);
    loadDraft(h.present);
  }

  /**
   * SAVE — writes the draft. updateBoard applies it to the board as it is then, so a change made
   * meanwhile (deck checkbox, drag and drop, deck rename) is kept.
   */
  function handleSave() {
    const draft = historyRef.current.present;
    void updateBoard(board.id, `edit pad '${draft.name || 'without a name'}'`, (b) =>
      updatePad(b, { ...draft, modifiedAt: Date.now() }),
    );
    savedRef.current = draft;
    setSaved(draft);
    // SAVE is a step boundary: typing on right after it does not merge into the saved step
    historyRef.current = seal(historyRef.current);
    setHistory(historyRef.current);
    dropDraft();
  }

  /** Close or Escape: closes — after asking, when there are unsaved changes. */
  function requestClose() {
    if (unsaved) setConfirmDiscard(true);
    else onClose();
  }

  /** Cmd / Ctrl + Z undoes, with Shift (or Ctrl + Y) redoes — not in a text field, which keeps its own. */
  function handleShortcut(e: KeyboardEvent) {
    if (confirmDiscard || pickerSlot !== null || pendingType !== null) return;
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if ((key === 'z' && e.shiftKey) || key === 'y') {
      e.preventDefault();
      handleRedo();
    }
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
    const { icons: _stored, ...shared } = padBaseOf(pad);
    const base: PadBase = {
      ...shared,
      name,
      volume,
      fadeIn,
      fadeOut,
      modifiedAt: Date.now(),
      ...(icons.length ? { icons } : {}),
    };
    if (type === 'combo') return { ...base, type, steps: stepsOverride ?? steps };
    const fileFields = {
      files: (filesOverride ?? files).map(fitFile),
      order: orderOverride ?? order,
    };
    if (type === 'single') return { ...base, type, ...fileFields };
    return { ...base, type, ...fileFields, ...(repeat === undefined ? {} : { repeat }) };
  }

  /** ICONS — the new list, saved at once like every field (each icon once, at most 4). */
  function handleIconsChange(next: string[]) {
    const unique = [...new Set(next)].slice(0, PAD_ICONS_MAX);
    setIcons(unique);
    const { icons: _old, ...rest } = buildCurrentPad();
    edit(unique.length ? { ...rest, icons: unique } : rest);
  }

  /** Puts the picked icon into the slot the picker was opened for. */
  function handleIconPick(key: string) {
    if (pickerSlot === null) return;
    const next = [...icons];
    next[pickerSlot] = key;
    handleIconsChange(next);
    setPickerSlot(null);
  }

  /** REPEAT — ∞ (undefined) or a count; a typed count lands within 1–`REPEAT_MAX`. */
  function handleRepeatChange(next: number | undefined) {
    setRepeat(next);
    const current = buildCurrentPad();
    if (current.type !== 'loop') return;
    const { repeat: _old, ...rest } = current;
    edit(next === undefined ? rest : { ...rest, repeat: next });
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
    edit({ ...buildCurrentPad(nextFiles), fadeIn: t.fadeIn, fadeOut: t.fadeOut }, `trim-${handle}`);
    return moved;
  }

  function handleNameChange(newName: string) {
    setName(newName);
    edit({ ...buildCurrentPad(), name: newName }, 'name');
  }

  function handleVolumeChange(v: number) {
    setVolume(v);
    edit({ ...buildCurrentPad(), volume: v }, 'volume');
  }

  /** A fade slider: with a file, a fade handle move (the fades fit the trimmed region). */
  function handleFadeInChange(v: number) {
    const trim = currentTrim();
    if (trim) {
      handleTrimMove('fadeIn', trim.values.trimStart + v);
      return;
    }
    setFadeIn(v);
    edit({ ...buildCurrentPad(), fadeIn: v }, 'fadeIn');
  }

  /** A fade slider: with a file, a fade handle move (the fades fit the trimmed region). */
  function handleFadeOutChange(v: number) {
    const trim = currentTrim();
    if (trim) {
      handleTrimMove('fadeOut', trim.values.trimEnd - v);
      return;
    }
    setFadeOut(v);
    edit({ ...buildCurrentPad(), fadeOut: v }, 'fadeOut');
  }

  // ── File list (Slice 15b, ADR-0068) ──────────────────────────────────────

  /** Saves a changed file list (and order) and selects the file at `select`. */
  function changeFiles(next: PadFile[], select: number, nextOrder = order) {
    setFiles(next);
    setSelectedIndex(Math.max(0, Math.min(select, next.length - 1)));
    edit(buildCurrentPad(next, undefined, nextOrder));
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

  /** Up / down — the selection moves with the file it is on. */
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

  /** Play — plays the file as the pad would, from the cursor (default: the trim start). */
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

  /** Pause — stops the preview; the next Play goes on where it stopped. */
  function handlePreviewPause() {
    endPreview(previewPosition() ?? cursor);
  }

  /** Stops the preview; the next Play starts at `nextCursor` (null = the trim start). */
  function endPreview(nextCursor: number | null) {
    previewRun.current++;
    // A frame may still run before the playhead loop is canceled: it must not take this stop
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
    edit(migrated);
    setPendingType(null);
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  // One tap deletes (owner decision 2026-10-19): the undo toast that follows brings the pad back,
  // and says in how many decks it was (ADR-0086 amendment)
  function handleDelete() {
    dropDraft();
    onDelete(pad.id);
  }

  // ── Keys (K1, K2, K13; ADR-0077) ─────────────────────────────────────────

  const padName = (id: string | null) => board.pads.find((p) => p.id === id)?.name ?? '';

  /**
   * A deck key: another pad of the deck can give it up (K1); a quick-access key never doubles as a
   * deck key (K2) — it would play two pads.
   */
  function checkDeckKey(code: string): KeyCheck {
    const bar = quickAccessKeyHolder(board, code, '');
    if (bar !== null) {
      return {
        kind: 'refused',
        reason: `${keyLabel(code)} is the quick-access key of ${padName(bar)} — pick another key`,
      };
    }
    const holder = deck ? keyHolder(deck, code, pad.id) : null;
    return holder ? { kind: 'move', holder: padName(holder) } : { kind: 'free' };
  }

  /**
   * A quick-access key: another pad of the bar can give it up; a key some deck uses is refused
   * (K2), named with its pad and deck.
   */
  function checkQuickKey(code: string): KeyCheck {
    const used = deckKeyUse(board, code);
    if (used) {
      return {
        kind: 'refused',
        reason: `${keyLabel(code)} plays ${padName(used.padId)} in ${used.deck.name} — pick another key`,
      };
    }
    const holder = quickAccessKeyHolder(board, code, pad.id);
    return holder ? { kind: 'move', holder: padName(holder) } : { kind: 'free' };
  }

  // ── Decks checklist / remove from deck ───────────────────────────────────

  function handleDeckToggle(deckId: string, checked: boolean) {
    void updateBoard(board.id, checked ? 'put pad in deck' : 'take pad out of deck', (b) =>
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

  // ── Library picker ───────────────────────────────────────────────────────

  const allAudio = libraryItems.value.filter((m) => m.type === 'audio');
  const filteredAudio = libSearch.trim()
    ? allAudio.filter((m) => m.name.toLowerCase().includes(libSearch.toLowerCase()))
    : allAudio;
  const selectedItem = allAudio.find((m) => m.id === selectedHash);
  const trim = currentTrim();
  /** Seconds shown next to the preview buttons: the playhead, else where Play starts. */
  const previewAt = playhead ?? cursor ?? trim?.values.trimStart ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────

  const typeColor = padTypeColor(type);

  // Quick access (Slice 13d): ★ pins the pad to the board's bar, as V1's PAD editor did
  const inQuickAccess = board.quickAccess.some((q) => q.padId === pad.id);
  const quickAccessFull = !inQuickAccess && board.quickAccess.length >= QUICK_ACCESS_MAX;

  // Escape closes the editor — not while the icon list or the type confirmation is open on top:
  // those close first (src/lib/escapeKey.ts decides at the moment the key is pressed)
  useEscapeKey(requestClose, pickerSlot === null && pendingType === null && !confirmDiscard);
  // The question on top closes first: Escape keeps editing
  useEscapeKey(() => setConfirmDiscard(false), confirmDiscard);

  // The question is a modal alert dialog (W3C APG): the editor behind is inert, the focus starts
  // on the safe answer — KEEP EDITING — and goes back to ✕ when the question closes
  const discardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModalDialog(discardRef, {
    active: confirmDiscard,
    root: () => dialog.current ?? document.body,
    returnFocus: () => closeRef.current,
  });

  return (
    <div
      ref={dialog}
      class="sb-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Pad editor"
      tabIndex={-1}
      data-testid="pad-editor-panel"
    >
      {/* Header */}
      <div class="sb-overlay-header" style={{ borderBottom: `2px solid ${typeColor}` }}>
        <span class="sb-type-indicator" style={{ background: typeColor }} />
        <span class="sb-overlay-title sb-flex-1">PAD EDITOR</span>
        {/* The draft (ADR-0084): undo and redo every step, SAVE writes it */}
        <button
          type="button"
          class="sb-btn sb-btn-ghost sb-topbar-icon-btn"
          data-testid="pad-editor-panel-undo-button"
          aria-label="Undo"
          title="Undo (Ctrl / Cmd + Z)"
          disabled={history.past.length === 0}
          onClick={handleUndo}
        >
          <UiIcon name="undo" class="sb-toolbar-icon" />
        </button>
        <button
          type="button"
          class="sb-btn sb-btn-ghost sb-topbar-icon-btn"
          data-testid="pad-editor-panel-redo-button"
          aria-label="Redo"
          title="Redo (Shift + Ctrl / Cmd + Z)"
          disabled={history.future.length === 0}
          onClick={handleRedo}
        >
          <UiIcon name="redo" class="sb-toolbar-icon" />
        </button>
        <button
          type="button"
          class={`sb-btn ${unsaved ? 'sb-btn-primary' : 'sb-btn-ghost'}`}
          data-testid="pad-editor-panel-save-button"
          disabled={!unsaved}
          onClick={handleSave}
        >
          SAVE
        </button>
        <button
          type="button"
          class={`sb-btn sb-btn-icon ${inQuickAccess ? 'sb-btn-primary' : 'sb-btn-ghost'}`}
          data-testid="pad-editor-panel-quick-access-button"
          aria-label="In quick access"
          aria-pressed={inQuickAccess}
          disabled={quickAccessFull}
          title={
            quickAccessFull
              ? `The quick-access bar is full (${QUICK_ACCESS_MAX} pads) — take one out first`
              : inQuickAccess
                ? 'Take the pad out of the quick-access bar'
                : 'Put the pad in the quick-access bar'
          }
          onClick={() =>
            void updateBoard(
              board.id,
              inQuickAccess ? 'take pad out of quick access' : 'put pad in quick access',
              (b) =>
                inQuickAccess ? removeFromQuickAccess(b, pad.id) : addToQuickAccess(b, pad.id),
            )
          }
        >
          <UiIcon name="quickAccess" />
        </button>
        <button
          ref={closeRef}
          class="sb-btn sb-btn-icon sb-btn-ghost"
          data-testid="pad-editor-panel-close-button"
          aria-label="Close the pad editor"
          onClick={requestClose}
        >
          <UiIcon name="close" />
        </button>
      </div>

      {/* A draft the editor left behind came back: said once, politely (role status) */}
      {restored && unsaved && (
        <div class="sb-dialog-section" role="status" data-testid="pad-editor-panel-restored-text">
          Unsaved changes restored — SAVE keeps them, closing the editor discards them.
        </div>
      )}

      {confirmDiscard && (
        <>
          <div
            class="sb-type-confirm-backdrop"
            aria-hidden="true"
            onClick={() => setConfirmDiscard(false)}
          />
          <div
            ref={discardRef}
            class="sb-type-confirm sb-type-confirm-centered"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pad-editor-panel-discard-title"
            aria-describedby="pad-editor-panel-discard-text"
            data-testid="pad-editor-panel-discard-region"
          >
            <div class="sb-dialog-header">
              <div class="sb-dialog-title" id="pad-editor-panel-discard-title">
                Discard changes?
              </div>
            </div>
            <div class="sb-dialog-section" id="pad-editor-panel-discard-text">
              The changes to this pad are not saved. Discarding them keeps the pad as it was saved.
            </div>
            <div class="sb-dialog-actions">
              <button
                class="sb-btn sb-btn-sm sb-btn-primary sb-dialog-action-btn"
                data-testid="pad-editor-panel-keep-editing-button"
                data-autofocus
                onClick={() => setConfirmDiscard(false)}
              >
                KEEP EDITING
              </button>
              <button
                class="sb-btn sb-btn-sm sb-btn-danger sb-dialog-action-btn"
                data-testid="pad-editor-panel-discard-button"
                onClick={() => {
                  dropDraft();
                  onClose();
                }}
              >
                DISCARD CHANGES
              </button>
            </div>
          </div>
        </>
      )}

      <div class="sb-pad-editor">
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

        {/* Icons — up to 4, shown on the pad in this order (ADR-0070; V1's four slots) */}
        <div class="sb-inspector-section">
          <label class="sb-field-label">ICONS</label>
          <div class="sb-row-wrap">
            {icons.map((key, i) => {
              const drawing = iconDrawings?.[i];
              const iconName = key.slice(key.indexOf(':') + 1);
              return (
                <div key={key} class="sb-icon-slot">
                  <button
                    class="sb-icon-cell"
                    aria-label={`Icon ${i + 1}: ${iconName} — change`}
                    title={key}
                    data-testid={`pad-editor-panel-icon-button-${i}`}
                    onClick={() => setPickerSlot(i)}
                  >
                    {drawing && <IconGlyph drawing={drawing} />}
                  </button>
                  <button
                    class="sb-btn sb-btn-xs sb-btn-danger"
                    aria-label={
                      iconConfirm === i ? `Confirm: remove ${iconName}` : `Remove ${iconName}`
                    }
                    data-testid={`pad-editor-panel-icon-remove-button-${i}`}
                    onClick={() => {
                      if (iconConfirm === i) {
                        setIconConfirm(null);
                        handleIconsChange(icons.filter((_, k) => k !== i));
                      } else setIconConfirm(i);
                    }}
                    onBlur={() => setIconConfirm(null)}
                  >
                    {iconConfirm === i ? 'CONFIRM' : <UiIcon name="delete" />}
                  </button>
                </div>
              );
            })}
            {icons.length < PAD_ICONS_MAX && (
              <button
                class="sb-icon-cell is-empty"
                aria-label="Add an icon"
                data-testid="pad-editor-panel-add-icon-button"
                onClick={() => setPickerSlot(icons.length)}
              >
                +
              </button>
            )}
          </div>
        </div>
        {pickerSlot !== null && (
          <IconPicker chosen={icons} onPick={handleIconPick} onClose={() => setPickerSlot(null)} />
        )}

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
              edit(buildCurrentPad(undefined, next));
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
                    <UiIcon name={previewOn ? 'pause' : 'play'} />
                  </button>
                  <button
                    class="sb-btn sb-btn-ghost"
                    data-testid="pad-editor-panel-preview-stop-button"
                    aria-label="Stop the preview"
                    onClick={() => endPreview(null)}
                  >
                    <UiIcon name="stop" />
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

        {/* Hotkey: tap, then press a key (K1) — keys belong to a deck's placement */}
        {deck && (
          <div data-testid="pad-editor-panel-deck-key-region">
            <KeyField
              id="pad-editor-key-field"
              label="HOTKEY"
              hotkey={hotkey}
              reserved={reservedKeys(getControlKeys())}
              check={checkDeckKey}
              onAssign={(code) => {
                const deckId = deck.id;
                void updateBoard(board.id, 'set pad key', (b) =>
                  setPlacementHotkey(b, deckId, pad.id, code),
                );
              }}
            />
          </div>
        )}

        {/* Quick-access key: board-wide, in every deck (K13, Slice 13d) */}
        {inQuickAccess && (
          <div data-testid="pad-editor-panel-quick-key-region">
            <KeyField
              id="pad-editor-quick-key-field"
              label="QUICK ACCESS KEY"
              hotkey={quickKey}
              reserved={reservedKeys(getControlKeys())}
              check={checkQuickKey}
              onAssign={(code) =>
                void updateBoard(board.id, 'set quick-access key', (b) =>
                  setQuickAccessHotkey(b, pad.id, code),
                )
              }
            />
          </div>
        )}

        {/* Decks — place the pad in other decks or take it out (ADR-0048) */}
        <div class="sb-inspector-section">
          <label class="sb-field-label">DECKS</label>
          {decksByOrder.length === 0 && <div class="sb-hint-text">No decks yet</div>}
          {decksByOrder.map((d) => {
            // A full deck grows a row (ADR-0075), so every deck can take the pad
            const placed = d.placements.some((p) => p.padId === pad.id);
            return (
              <label key={d.id} class="sb-check-row">
                <input
                  type="checkbox"
                  data-testid={`pad-editor-panel-deck-input-${d.id}`}
                  checked={placed}
                  onChange={(e) => handleDeckToggle(d.id, (e.target as HTMLInputElement).checked)}
                />
                <span class="sb-flex-trunc">{d.name}</span>
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
          >
            <UiIcon name="delete" size={12} />
            DELETE PAD
          </button>
        </div>
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
