/**
 * @fileoverview Preferences — small UI state kept in IndexedDB (ADR-0062, owner decision 2026-10-02)
 *
 * IndexedDB, not the synchronous Web Storage API, which web.dev "Storage for the web" advises
 * against (it blocks the main thread). All entries are small and are read
 * once at app start (loadPrefs, before the first render), so reading stays synchronous and the
 * screen never flashes a default first. Writes update the cache at once and are saved in the
 * background, counted in pendingSaves like board saves.
 * Keys: `<name>[:<id>]` in the `keyval` store.
 */

import { signal } from '@preact/signals';
import { kvDelete, kvGetAll, kvPut } from '../db/idb';
import { DEFAULT_PAD_SORT, isPadSort, type PadSort } from '../lib/padSort';
import { parsePad } from '../lib/boardModel';
import { BACKUP_REMINDER_CHOICES, BACKUP_REMINDER_DAYS } from '../lib/backupExport';
import { DEFAULT_THEME, isThemeId, type ThemeId } from '../lib/theme';
import { PAD_SIZE, clampPadSize, padSizeFor, type PadSizeScope } from '../lib/padSize';
import { DEFAULT_CONTENT_WIDTH, isContentWidth, type ContentWidth } from '../lib/contentWidth';
import { motionAllowed, systemPrefersReducedMotion } from '../lib/motion';
import type { Pad } from '../types';
import { pendingSaves } from './store';

const cache = new Map<string, unknown>();

/** Counts changes to the preferences — read it in a component to re-render when one changes. */
export const prefsVersion = signal(0);

/** Reads every preference into memory — call once at app start, before the first render. */
export async function loadPrefs(): Promise<void> {
  try {
    cache.clear();
    for (const [key, value] of await kvGetAll()) cache.set(key, value);
    prefsVersion.value++;
  } catch (e) {
    console.error('Loading preferences failed — defaults are used:', e);
  }
}

function write(key: string, value: unknown | undefined): void {
  if (value === undefined) cache.delete(key);
  else cache.set(key, value);
  prefsVersion.value++;
  pendingSaves.value++;
  (value === undefined ? kvDelete(key) : kvPut(key, value))
    .catch((e: unknown) => console.error(`Saving the preference ${key} failed:`, e))
    .finally(() => pendingSaves.value--);
}

// ── Last view of a board (owner decision 2026-10-02) ─────────────────────────

/** The view a board showed last: a deck id, or the All pads view. */
export type BoardView = { kind: 'deck'; deckId: string } | { kind: 'all-pads' };

const lastViewKey = (boardId: string) => `last-view:${boardId}`;

/** The view this board showed last, or null when none is stored. */
export function getLastView(boardId: string): BoardView | null {
  const v = cache.get(lastViewKey(boardId));
  if (v === 'all-pads') return { kind: 'all-pads' };
  if (typeof v === 'string' && v.startsWith('deck:')) return { kind: 'deck', deckId: v.slice(5) };
  return null;
}

/** Remembers the view the board shows now; readable at once, stored in the background. */
export function setLastView(boardId: string, view: BoardView): void {
  write(lastViewKey(boardId), view.kind === 'all-pads' ? 'all-pads' : `deck:${view.deckId}`);
}

/** Forgets the stored view, e.g. when the board is deleted. */
export function clearLastView(boardId: string): void {
  write(lastViewKey(boardId), undefined);
}

// ── Last backup (D3) ─────────────────────────────────────────────────────────

const LAST_BACKUP_KEY = 'last-backup';

/** When the last backup was saved (ms since epoch), or null when there was none. */
export function getLastBackup(): number | null {
  const v = cache.get(LAST_BACKUP_KEY);
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/** Records when a backup was saved (ms since epoch). */
export function setLastBackup(when: number): void {
  write(LAST_BACKUP_KEY, when);
}

// ── Sort of the All pads view, per board (owner decision 2026-10-02, E1) ────

const padSortKey = (boardId: string) => `pad-sort:${boardId}`;

/** The sort chosen for this board's All pads view — by name until one is chosen. */
export function getPadSort(boardId: string): PadSort {
  const v = cache.get(padSortKey(boardId));
  return isPadSort(v) ? v : DEFAULT_PAD_SORT;
}

/** Remembers the sort chosen for this board's All pads view. */
export function setPadSort(boardId: string, sort: PadSort): void {
  write(padSortKey(boardId), { key: sort.key, reversed: sort.reversed });
}

// ── Last played, per pad (owner decision 2026-10-02, E1 "Last played") ──────

const lastPlayedKey = (padId: string) => `last-played:${padId}`;

/** When a pad was last played (ms since epoch), or null when never. */
export function getLastPlayed(padId: string): number | null {
  const v = cache.get(lastPlayedKey(padId));
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/** Records when a pad was played (ms since epoch) — for the "Last played" sort. */
export function setLastPlayed(padId: string, when: number): void {
  write(lastPlayedKey(padId), when);
}

// ── Bars that fold (owner decision 2026-10-11) ──────────────────────────────

/** A bar of the board screen that can be folded behind its toolbar icon. */
export type BarName = 'search' | 'quick-access' | 'decks';

const barKey = (bar: BarName) => `bar-open:${bar}`;

/**
 * Tells whether a bar is shown — open until it is folded: someone who never folds a bar sees the
 * board as before (hidden navigation is found less often, NN/g).
 */
export function isBarOpen(bar: BarName): boolean {
  return cache.get(barKey(bar)) !== false;
}

/** Shows or folds a bar; only a folded bar is stored. */
export function setBarOpen(bar: BarName, open: boolean): void {
  write(barKey(bar), open ? undefined : false);
}

// ── The PAD editor's draft, kept on the device (ADR-0084) ───────────────────

const padDraftKey = (padId: string) => `pad-draft:${padId}`;

/**
 * The unsaved draft of a pad the PAD editor left behind — the page was closed or the tab ended
 * (iOS ends background tabs) before SAVE — or null. A stored value that is no pad, or another
 * pad's, is ignored.
 */
export function getPadDraft(padId: string): Pad | null {
  const draft = parsePad(cache.get(padDraftKey(padId)));
  return draft && draft.id === padId ? draft : null;
}

/** Keeps the editor's unsaved draft of a pad on the device. */
export function setPadDraft(pad: Pad): void {
  write(padDraftKey(pad.id), pad);
}

/** Forgets a pad's draft — after SAVE, DISCARD CHANGES, or when the pad is deleted. */
export function clearPadDraft(padId: string): void {
  if (cache.has(padDraftKey(padId))) write(padDraftKey(padId), undefined);
}

// ── Backup reminder (Settings → DATA, docs/product/features/settings.md S7) ──

const BACKUP_REMINDER_KEY = 'backup-reminder-days';

/** After how many days without a backup the board list reminds — one of the choices, 7 until set. */
export function getBackupReminderDays(): number {
  const v = cache.get(BACKUP_REMINDER_KEY);
  return typeof v === 'number' && BACKUP_REMINDER_CHOICES.some((c) => c === v)
    ? v
    : BACKUP_REMINDER_DAYS;
}

/** Sets the backup reminder's days; the default (7) is not stored. */
export function setBackupReminderDays(days: number): void {
  write(BACKUP_REMINDER_KEY, days === BACKUP_REMINDER_DAYS ? undefined : days);
}

// ── Theme (Settings → APPEARANCE, docs/product/features/settings.md S5) ──────

const THEME_KEY = 'theme';

/** The app's theme — Hearth until another is chosen. */
export function getTheme(): ThemeId {
  const v = cache.get(THEME_KEY);
  return isThemeId(v) ? v : DEFAULT_THEME;
}

/** Sets the app's theme; the default (Hearth) is not stored. */
export function setTheme(theme: ThemeId): void {
  write(THEME_KEY, theme === DEFAULT_THEME ? undefined : theme);
}

// ── Content width (Settings → APPEARANCE, settings.md S3) ────────────────────

const CONTENT_WIDTH_KEY = 'content-width';

/** How wide the screens get on a large window — the whole window (AUTO) until chosen. */
export function getContentWidth(): ContentWidth {
  const v = cache.get(CONTENT_WIDTH_KEY);
  return isContentWidth(v) ? v : DEFAULT_CONTENT_WIDTH;
}

/** Sets the content width; the default (AUTO) is not stored. */
export function setContentWidth(width: ContentWidth): void {
  write(CONTENT_WIDTH_KEY, width === DEFAULT_CONTENT_WIDTH ? undefined : width);
}

// ── Pad size for every board (Settings → APPEARANCE, settings.md S4) ─────────

const PAD_SIZE_SCOPE_KEY = 'pad-size-scope';
const APP_PAD_SIZE_KEY = 'pad-size';

/** Whether PAD SIZE is set per board (the default) or once for every board. */
export function getPadSizeScope(): PadSizeScope {
  return cache.get(PAD_SIZE_SCOPE_KEY) === 'app' ? 'app' : 'board';
}

/** Sets where PAD SIZE lives; the default (per board) is not stored. */
export function setPadSizeScope(scope: PadSizeScope): void {
  write(PAD_SIZE_SCOPE_KEY, scope === 'board' ? undefined : scope);
}

/** The pad size of every board while the scope is `app` — on the slider's steps, 88 until set. */
export function getAppPadSize(): number {
  return clampPadSize(cache.get(APP_PAD_SIZE_KEY));
}

/** Sets the pad size of every board (kept inside the slider's limits); the default is not stored. */
export function setAppPadSize(px: number): void {
  const size = clampPadSize(px);
  write(APP_PAD_SIZE_KEY, size === PAD_SIZE.default ? undefined : size);
}

/** The pad size this board shows — its own, or the one for every board (S4). */
export function padSizeOf(board: { padSize: number }): number {
  return padSizeFor(board.padSize, getPadSizeScope(), getAppPadSize());
}

// ── Animations (Settings → VISUALS, settings.md S6) ──────────────────────────

const ANIMATIONS_KEY = 'animations';

/** The Animations switch — on until switched off. */
export function getAnimationsSwitch(): boolean {
  return cache.get(ANIMATIONS_KEY) !== false;
}

/** Sets the Animations switch; on (the default) is not stored. */
export function setAnimationsSwitch(on: boolean): void {
  write(ANIMATIONS_KEY, on ? undefined : false);
}

/** Whether the app animates: the switch is on and the system does not ask for reduced motion. */
export function animationsOn(): boolean {
  return motionAllowed(getAnimationsSwitch(), systemPrefersReducedMotion());
}
