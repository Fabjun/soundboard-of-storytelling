/**
 * @fileoverview V1 → V3 mapping (D5, docs/product/features/data-backup.md; mapping table in
 * docs/architecture/0061-backup-file-format-and-streaming-import.md#2-v1--v3-mapping-d5)
 *
 * Pure functions: a V1 board (untrusted JSON from a backup file) becomes a new V3 board with one
 * deck holding all its pads. Nothing here touches storage; the import (backupImport.ts) saves.
 * Every field is checked — a malformed pad is mapped with defaults, never crashes the import.
 */

import type { Board, ComboStep, FileOrder, Pad, PadBase, PadFile, Placement } from '../types';
import { REPEAT_MAX } from '../types';
import { DEFAULT_GRID } from './boardModel';
import { DEFAULT_PAD_VOLUME, indexToPos } from './padUtils';
import { breakCycles } from './comboModel';
import { PAD_ICONS_MAX } from './iconSet';
import { v1IconKey } from './v1Icons';

/** V1 used a fade-out-all step's `dur` as the fade time, 2.5 s when not set. */
export const V1_FADE_OUT_ALL_DEFAULT = 2.5;

/** What the mapping dropped or could not resolve — shown in the import summary. */
export type V1ImportNotes = {
  /** Combo steps with per-pad volume / fade options (not in the V3 model yet). */
  comboPadOptions: number;
  /** Combo step references to pads that do not exist in the board. */
  missingStepPads: number;
  /** Pads with a mode V1 no longer knows — imported as Single. */
  unknownModes: number;
  /** Pad files whose audio is not in the backup or the library. */
  missingFiles: number;
  /** Combo step references removed because they would make a combo start itself. */
  cycleRefs: number;
  /** Pad icons the user had uploaded as SVG (`{h: hash}`) — V3 has no own icons yet. */
  customIcons: number;
  /** Pad icons that are not in V3's icon collection. */
  unknownIcons: number;
};

/** Returns import notes with every count at zero. */
export const emptyNotes = (): V1ImportNotes => ({
  comboPadOptions: 0,
  missingStepPads: 0,
  unknownModes: 0,
  missingFiles: 0,
  cycleRefs: 0,
  customIcons: 0,
  unknownIcons: 0,
});

type Json = Record<string, unknown>;
const isRecord = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);

/** "Name", or "Name (2)", "Name (3)" … — the first one not in `taken` (import rules). */
export function uniqueBoardName(name: string, taken: ReadonlySet<string>): string {
  if (!taken.has(name)) return name;
  let n = 2;
  while (taken.has(`${name} (${n})`)) n++;
  return `${name} (${n})`;
}

/** What mapping a V1 board needs from the import: new ids, stored files, taken names, notes. */
export interface V1MapContext {
  /** New ids for the board, its deck and its pads. */
  newId: () => string;
  /** The V3 library id for a V1 file hash, or undefined when that audio is not available. */
  fileId: (v1Hash: string) => string | undefined;
  /** Board names already used — the new board gets a suffix if its name is taken. */
  takenNames: ReadonlySet<string>;
  /** Counts what was dropped; updated in place. */
  notes: V1ImportNotes;
}

function mapFiles(v: unknown, ctx: V1MapContext): string[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((h) => {
    if (typeof h !== 'string') return [];
    const id = ctx.fileId(h);
    if (!id) ctx.notes.missingFiles++;
    return id ? [id] : [];
  });
}

/**
 * A V1 pad's icons as icon keys, up to `PAD_ICONS_MAX` in V1's order. V1 stored `icons: [{b: id}]`
 * (built-in) or `{h: hash}` (an uploaded SVG); older pads one `icon` in the same shape. A plain
 * string id is read too. Uploaded and unknown icons are counted, not imported.
 */
function mapIcons(p: Json, ctx: V1MapContext): string[] {
  const refs: unknown[] = Array.isArray(p.icons) ? p.icons : p.icon === undefined ? [] : [p.icon];
  const keys: string[] = [];
  for (const ref of refs) {
    if (isRecord(ref) && str(ref.h)) {
      ctx.notes.customIcons++;
      continue;
    }
    const id = isRecord(ref) ? str(ref.b) : str(ref);
    if (!id) continue;
    const key = v1IconKey(id);
    if (!key) ctx.notes.unknownIcons++;
    else if (!keys.includes(key)) keys.push(key);
  }
  return keys.slice(0, PAD_ICONS_MAX);
}

function mapSteps(v: unknown, padIds: ReadonlyMap<number, string>, ctx: V1MapContext): ComboStep[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isRecord).map((s) => {
    const refs = Array.isArray(s.pads) ? s.pads : [];
    const ids = refs.flatMap((r) => {
      const id = typeof r === 'number' ? padIds.get(r) : undefined;
      if (!id) ctx.notes.missingStepPads++;
      return id ? [id] : [];
    });
    if (Array.isArray(s.chipOpts) && s.chipOpts.some((o) => isRecord(o) && Object.keys(o).length))
      ctx.notes.comboPadOptions++;
    const dur = num(s.dur);
    const step: ComboStep = { padIds: ids };
    if (s.stopAll === true) step.stopAll = true;
    if (s.fadeOutAll === true) step.fadeOutAll = dur && dur > 0 ? dur : V1_FADE_OUT_ALL_DEFAULT;
    else if (dur && dur > 0) step.duration = dur;
    return step;
  });
}

function mapPad(
  p: Json,
  index: number,
  id: string,
  padIds: ReadonlyMap<number, string>,
  ctx: V1MapContext,
): Pad {
  const volume = num(p.volume);
  const base: PadBase = {
    id,
    name: str(p.name) ?? `Pad ${index + 1}`,
    volume: volume === undefined ? DEFAULT_PAD_VOLUME : Math.min(100, Math.max(0, volume)),
    fadeIn: Math.max(0, num(p.fadeIn) ?? 0),
    fadeOut: Math.max(0, num(p.fadeOut) ?? 0),
  };
  const icons = mapIcons(p, ctx);
  if (icons.length) base.icons = icons;

  if (p.mode === 'combo') return { ...base, type: 'combo', steps: mapSteps(p.steps, padIds, ctx) };

  const trim = {
    ...(num(p.trimStart) ? { trimStart: num(p.trimStart) } : {}),
    ...(num(p.trimEnd) ? { trimEnd: num(p.trimEnd) } : {}),
  };
  const hashes = mapFiles(p.files, ctx);
  // Each file keeps the pad's trim where V1 applied it; V1 played playlist files whole (ADR-0068)
  const trimmed: PadFile[] = hashes.map((hash) => ({ hash, ...trim }));
  const whole: PadFile[] = hashes.map((hash) => ({ hash }));
  const shuffled: FileOrder = p.shuffle === true || p.mode === 'random' ? 'shuffle' : 'sequential';
  switch (p.mode) {
    case 'loop': {
      // V1's loop count (∞ = 0 or missing) becomes the repeat count, within 1–999 (ADR-0069)
      const count = Math.floor(num(p.loopCount) ?? 0);
      const repeat = count > 0 ? { repeat: Math.min(count, REPEAT_MAX) } : {};
      return { ...base, type: 'loop', files: trimmed, order: 'sequential', ...repeat };
    }
    case 'playlist':
    case 'chain':
    case 'random':
      return { ...base, type: 'loop', files: whole, order: shuffled };
    case 'once':
      return { ...base, type: 'single', files: trimmed, order: 'sequential' };
    default:
      ctx.notes.unknownModes++;
      return { ...base, type: 'single', files: trimmed, order: 'sequential' };
  }
}

/** A V1 board as a new V3 board with one deck holding all its pads (D5), or null if it is none. */
export function mapV1Board(v1: unknown, ctx: V1MapContext): Board | null {
  if (!isRecord(v1)) return null;
  const v1Pads = Array.isArray(v1.pads) ? v1.pads : [];

  // V1 pad ids are array indexes (also used by combo steps) — give each real pad a V3 id first
  const padIds = new Map<number, string>();
  v1Pads.forEach((p, i) => {
    if (isRecord(p)) padIds.set(i, ctx.newId());
  });

  const pads: Pad[] = [];
  const placements: Placement[] = [];
  const cols = DEFAULT_GRID.cols;
  v1Pads.forEach((p, i) => {
    const id = padIds.get(i);
    if (!id || !isRecord(p)) return;
    pads.push(mapPad(p, i, id, padIds, ctx));
    const hotkey = str(p.key);
    placements.push({
      padId: id,
      position: indexToPos(placements.length, cols),
      ...(hotkey ? { hotkey } : {}),
    });
  });

  const rows = Math.max(DEFAULT_GRID.rows, Math.ceil(placements.length / cols));
  const board: Board = {
    id: ctx.newId(),
    name: uniqueBoardName(str(v1.name) ?? 'Imported board', ctx.takenNames),
    themeId: 'hearth',
    pads,
    decks: [
      {
        id: ctx.newId(),
        name: 'Deck 1',
        order: 0,
        gridConfig: { ...DEFAULT_GRID, rows },
        placements,
      },
    ],
    quickAccess: [],
  };
  // A combo that starts itself would make the engine start it again and again — drop such steps
  const { board: safe, removed } = breakCycles(board);
  ctx.notes.cycleRefs += removed;
  return safe;
}
