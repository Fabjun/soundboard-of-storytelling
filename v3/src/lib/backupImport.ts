/**
 * @fileoverview Backup import — V1 and V3 backup files (D2, D5; ADR-0061)
 *
 * Two passes over the file (backupReader, one library entry in memory at a time):
 *   1. planImport — what the file holds, for the confirmation summary (import rules).
 *   2. runImport  — audio first (one file at a time through the upload pipeline), boards last;
 *      an abort leaves no board pointing at missing audio.
 * An import never changes or deletes existing data: audio already in the library is skipped,
 * boards are always added as new boards (new ids, a name suffix when the name is taken).
 */

import type { Board } from '../types';
import { boards as boardsSignal, libraryItems } from '../state/store';
import { createBoard } from '../state/boardWrites';
import { assignFolders } from '../state/libraryFolders';
import { readBackup } from './backupReader';
import { parseBoard, withNewIds } from './boardModel';
import { nanoid } from './nanoid';
import { addAudioFile } from './upload';
import { emptyNotes, mapV1Board, uniqueBoardName, type V1ImportNotes } from './v1Import';

/** What a backup file holds, measured against the current library. */
export type ImportPlan = {
  kind: 'v1' | 'v3';
  boards: unknown[];
  /** Pads over all boards in the file. */
  pads: number;
  audio: number;
  /** Audio entries already in the library — skipped. */
  audioPresent: number;
  /** V1 pad templates and other non-audio entries — not imported. */
  otherEntries: number;
};

/** What an import did: audio added, skipped or failed, boards added or skipped, and notes. */
export type ImportResult = {
  audioAdded: number;
  audioSkipped: number;
  /** One message per audio file that could not be decoded or stored. */
  audioFailed: string[];
  boardsAdded: number;
  /** Boards in the file that are not valid boards — skipped. */
  boardsSkipped: number;
  notes: V1ImportNotes;
};

type Entry = Record<string, unknown>;

/** The content hash an entry carries: `hash` in V1 files, `id` in V3 files. */
const entryHash = (e: Entry): string | undefined => {
  const h = e.hash ?? e.id;
  return typeof h === 'string' && h !== '' ? h : undefined;
};

/**
 * The library tags to restore (owner decision B9): `tags` in V3 files, V1's `folder` as one tag —
 * the library groups of Slice 16 build on them.
 */
export const entryTags = (e: Entry): string[] => {
  if (Array.isArray(e.tags)) return e.tags.filter((t): t is string => typeof t === 'string');
  return typeof e.folder === 'string' && e.folder !== '' ? [e.folder] : [];
};

/**
 * The date the file was added, to restore (D5): `addedAt` in V3 files, `added` in V1 files; none
 * when the file holds no valid time — the import then takes now.
 */
export const entryAddedAt = (e: Entry): number | undefined => {
  const t = e.addedAt ?? e.added;
  return typeof t === 'number' && Number.isFinite(t) && t > 0 ? t : undefined;
};

/**
 * The file name at upload, to restore (D5): `originalName` in V3 files, `origName` in V1 files;
 * none when empty — the import then takes the entry's name, as V1 did.
 */
export const entryOriginalName = (e: Entry): string | undefined => {
  const n = e.originalName ?? e.origName;
  return typeof n === 'string' && n !== '' ? n : undefined;
};

/**
 * The folder to restore (ADR-0088): `folder` in V3 and V1 files alike; none when empty.
 */
export const entryFolder = (e: Entry): string | undefined => {
  const f = e.folder;
  return typeof f === 'string' && f.trim() !== '' ? f : undefined;
};

/** Audio — not a V1 pad template (`type: 'pad'`) or an image, which are not imported. */
const isAudioEntry = (e: Entry): boolean => {
  return (
    typeof e.type !== 'string' || e.type === '' || e.type === 'audio' || e.type.startsWith('audio/')
  );
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const countPads = (b: unknown): number =>
  isRecord(b) && Array.isArray(b.pads) ? b.pads.filter(isRecord).length : 0;

/** Pass 1: what the file holds (D2 summary). Holds the boards (small), never the audio. */
export async function planImport(file: Blob): Promise<ImportPlan> {
  const present = new Set(libraryItems.value.map((m) => m.id));
  let fileBoards: unknown[] = [];
  let audio = 0;
  let audioPresent = 0;
  let otherEntries = 0;
  const header = await readBackup(file, {
    onBoards: (b) => {
      fileBoards = b;
    },
    onLibraryEntry: ({ fields: e }) => {
      if (!isAudioEntry(e)) {
        otherEntries++;
        return;
      }
      audio++;
      const h = entryHash(e);
      if (h && present.has(h)) audioPresent++;
    },
  });
  return {
    kind: header.kind,
    boards: fileBoards,
    pads: fileBoards.reduce<number>((n, b) => n + countPads(b), 0),
    audio,
    audioPresent,
    otherEntries,
  };
}

/**
 * Adds one entry's audio to the library through the upload pipeline, with its tags, its date added
 * and its original name (D5). Records the stored id under the backup's hash, and the folder of a
 * newly added file in `folders` (a file already in the library keeps its own). Returns a message
 * when the audio could not be added.
 */
async function importAudio(
  e: Entry,
  name: string,
  audio: () => Promise<Blob | null>,
  hash: string | undefined,
  stored: Map<string, string>,
  folders: Record<string, string>,
  result: ImportResult,
): Promise<string | null> {
  let data: Blob | null;
  try {
    data = await audio();
  } catch {
    return `${name}: the audio data in the backup is damaged`;
  }
  if (!data) return `${name}: the backup holds no audio for this file`;
  const type = typeof e.type === 'string' && e.type.startsWith('audio/') ? e.type : '';
  const r = await addAudioFile(new File([data], name, { type }), {
    tags: entryTags(e),
    addedAt: entryAddedAt(e),
    originalName: entryOriginalName(e),
  });
  if (r.kind === 'error') return r.error;
  if (hash) stored.set(hash, r.id);
  const folder = entryFolder(e);
  if (r.kind === 'imported' && folder) folders[r.id] = folder;
  if (r.kind === 'imported') result.audioAdded++;
  else result.audioSkipped++;
  return null;
}

/**
 * A V3 pad's files mapped to the ids the import stored (missing ones counted, left out); each file
 * keeps its trim.
 */
function remapFiles(
  board: Board,
  fileId: (h: string) => string | undefined,
  notes: V1ImportNotes,
): Board {
  return {
    ...board,
    pads: board.pads.map((p) => {
      if (p.type === 'combo') return p;
      const files = p.files.flatMap((f) => {
        const id = fileId(f.hash);
        if (!id) notes.missingFiles++;
        return id ? [{ ...f, hash: id }] : [];
      });
      return { ...p, files };
    }),
  };
}

/**
 * Pass 2: imports the file — audio first, boards last (import rules). `onProgress` gets the
 * number of audio entries handled so far.
 */
export async function runImport(
  file: Blob,
  plan: ImportPlan,
  onProgress?: (audioDone: number) => void,
): Promise<ImportResult> {
  const result: ImportResult = {
    audioAdded: 0,
    audioSkipped: 0,
    audioFailed: [],
    boardsAdded: 0,
    boardsSkipped: 0,
    notes: emptyNotes(),
  };
  /** File hash in the backup → library id the bytes were stored under. */
  const stored = new Map<string, string>();
  /** Library id of a newly added file → the folder the backup names for it. */
  const folders: Record<string, string> = {};
  let done = 0;

  await readBackup(file, {
    onLibraryEntry: async ({ fields: e, audio }) => {
      if (!isAudioEntry(e)) return;
      const h = entryHash(e);
      const name = typeof e.name === 'string' && e.name !== '' ? e.name : 'imported audio';
      if (h && libraryItems.value.some((m) => m.id === h)) {
        stored.set(h, h);
        result.audioSkipped++;
      } else {
        const failure = await importAudio(e, name, audio, h, stored, folders, result);
        if (failure) result.audioFailed.push(failure);
      }
      onProgress?.(++done);
    },
  });
  assignFolders(folders); // one write for all files (ADR-0088)

  // Boards last — every file they can point at is in the library by now
  const inLibrary = new Set(libraryItems.value.map((m) => m.id));
  const fileId = (h: string) => stored.get(h) ?? (inLibrary.has(h) ? h : undefined);
  const taken = new Set(boardsSignal.value.map((b) => b.name));
  for (const raw of plan.boards) {
    let board: Board | null;
    if (plan.kind === 'v1') {
      board = mapV1Board(raw, { newId: nanoid, fileId, takenNames: taken, notes: result.notes });
    } else {
      const parsed = parseBoard(raw);
      board = parsed
        ? remapFiles(
            { ...withNewIds(parsed, nanoid), name: uniqueBoardName(parsed.name, taken) },
            fileId,
            result.notes,
          )
        : null;
    }
    if (!board) {
      result.boardsSkipped++;
      continue;
    }
    if (await createBoard(board)) {
      taken.add(board.name);
      result.boardsAdded++;
    } else {
      result.boardsSkipped++;
    }
  }
  return result;
}
