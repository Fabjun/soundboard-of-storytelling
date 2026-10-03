/**
 * @fileoverview Backup reader — reads a V1 or V3 backup file piece by piece (D6, ADR-0061)
 *
 * Three kinds of file, told apart by their first bytes, never by their name:
 *   - a ZIP archive (V3's own backups): the manifest backup.json lists the boards and the library;
 *     each audio file is a slice of the archive, read only when the import asks for it;
 *   - gzip (V1 backups, early V3 backups): unpacked as a stream by fflate — on every browser, so
 *     iOS before 16.4 (no DecompressionStream) reads them too (owner decision B8);
 *   - plain JSON.
 * JSON is never held as one string (iPhone memory rules 4 and 6): it streams into a streaming JSON
 * parser that hands over the boards once and the library entries one at a time. The next chunk is
 * read only after the entries of the current chunk are handled, so at most one entry is in memory.
 */

import { Gunzip } from 'fflate';
import { isZip, readZipDirectory, zipEntryBlob, ZipError, type ZipEntry } from './zipArchive';

/** Why a file could not be read — each maps to a message for the user. */
export type BackupErrorKind = 'damaged' | 'not-a-backup' | 'unsupported-zip';

/** A backup file that cannot be read; `kind` selects the message the import panel shows. */
export class BackupError extends Error {
  readonly kind: BackupErrorKind;
  /** Creates the error for `kind`; the message is the kind itself. */
  constructor(kind: BackupErrorKind) {
    super(kind);
    this.name = 'BackupError';
    this.kind = kind;
  }
}

/** What the file says about itself: V3's own format, or a V1 backup. */
export type BackupHeader =
  { kind: 'v3'; formatVersion: number } | { kind: 'v1'; version: number | string | null };

/** One library entry of a backup. */
export interface BackupLibraryEntry {
  /** The entry's fields as the file stores them (V1: hash, folder …; V3: id, tags …). */
  fields: Record<string, unknown>;
  /**
   * The entry's audio, or null when the file holds none for it. In a JSON file this decodes the
   * base64 text and frees it; rejects with BackupError('damaged') when the data cannot be read.
   */
  audio(): Promise<Blob | null>;
}

/** What `readBackup` hands the file's content to; both handlers are optional. */
export interface BackupHandlers {
  /** The boards array — called once, before or after entries depending on the file. */
  onBoards?: (boards: unknown[]) => void;
  /** One library entry; awaited before the next one is handed over. */
  onLibraryEntry?: (entry: BackupLibraryEntry, index: number) => void | Promise<void>;
}

/** V3's own backups carry this marker (docs/architecture/0061-backup-file-format-and-streaming-import.md#3-v3s-own-backup-file-d1d2). */
export const V3_BACKUP_FORMAT = 'sos-v3-backup';

/** The manifest inside a V3 backup archive. */
export const BACKUP_MANIFEST = 'backup.json';

const GZIP_MAGIC = [0x1f, 0x8b];

async function isGzip(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  return head[0] === GZIP_MAGIC[0] && head[1] === GZIP_MAGIC[1];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** base64 → bytes, without building anything bigger than the result (iPhone memory rule 6). */
export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** A stream that unpacks gzip piece by piece (fflate; a broken stream errors the stream). */
export function gunzipStream(): TransformStream<Uint8Array, Uint8Array> {
  let gunzip: Gunzip;
  return new TransformStream({
    start(controller) {
      gunzip = new Gunzip((chunk) => controller.enqueue(chunk));
    },
    transform(chunk) {
      gunzip.push(chunk);
    },
    flush() {
      gunzip.push(new Uint8Array(0), true);
    },
  });
}

/** The audio of a JSON entry: its base64 `data`, decoded on demand and then freed. */
function base64Audio(fields: Record<string, unknown>): () => Promise<Blob | null> {
  return async () => {
    const data = fields.data;
    fields.data = null; // free the base64 text now, not at GC time (memory rule 6)
    if (typeof data !== 'string') return null;
    try {
      return new Blob([base64ToBytes(data)]);
    } catch {
      throw new BackupError('damaged');
    }
  };
}

/** The audio of a ZIP entry: the archive entry its `file` field names, as a slice. */
function zipAudio(
  file: Blob,
  entries: Map<string, ZipEntry>,
  fields: Record<string, unknown>,
): () => Promise<Blob | null> {
  return async () => {
    const entry = typeof fields.file === 'string' ? entries.get(fields.file) : undefined;
    if (!entry) return null;
    try {
      return await zipEntryBlob(file, entry);
    } catch (e) {
      throw toBackupError(e);
    }
  };
}

function toBackupError(e: unknown): BackupError {
  if (e instanceof BackupError) return e;
  if (e instanceof ZipError && e.kind === 'unsupported') return new BackupError('unsupported-zip');
  return new BackupError('damaged');
}

/**
 * Reads a backup file and hands its boards and library entries to `handlers`.
 * Resolves with the header once the whole file is read; rejects with a BackupError.
 */
export async function readBackup(file: Blob, handlers: BackupHandlers): Promise<BackupHeader> {
  if (await isZip(file)) {
    let entries: Map<string, ZipEntry>;
    let manifest: Blob;
    try {
      entries = await readZipDirectory(file);
      const entry = entries.get(BACKUP_MANIFEST);
      if (!entry) throw new BackupError('not-a-backup');
      manifest = await zipEntryBlob(file, entry);
    } catch (e) {
      throw toBackupError(e);
    }
    return readJson(manifest.stream(), handlers, (fields) => zipAudio(file, entries, fields));
  }
  const stream = (await isGzip(file)) ? file.stream().pipeThrough(gunzipStream()) : file.stream();
  return readJson(stream, handlers, base64Audio);
}

/** Streams one JSON backup document into the handlers. */
async function readJson(
  stream: ReadableStream<Uint8Array>,
  handlers: BackupHandlers,
  audioOf: (fields: Record<string, unknown>) => () => Promise<Blob | null>,
): Promise<BackupHeader> {
  // Loaded only when a backup is read — keeps the parser out of the start-up bundle.
  const { JSONParser } = await import('@streamparser/json');
  const parser = new JSONParser({
    paths: ['$.format', '$.formatVersion', '$.version', '$.boards', '$.library.*'],
    keepStack: false,
  });

  const top: Record<string, unknown> = {};
  let sawBoards = false;
  let sawLibrary = false;
  let parseError: Error | null = null;
  const pending: Record<string, unknown>[] = [];
  let index = 0;

  parser.onError = (err) => {
    parseError = err;
  };
  parser.onValue = ({ value, key, stack }) => {
    if (stack.length === 1) {
      // A top-level member of the document's root object
      if (key === 'boards') {
        sawBoards = true;
        handlers.onBoards?.(Array.isArray(value) ? value : []);
      } else if (typeof key === 'string') {
        top[key] = value;
      }
      return;
    }
    // $.library.* — one entry of the library array
    sawLibrary = true;
    if (isRecord(value)) pending.push(value);
  };

  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.write(value);
      if (parseError) throw new BackupError('damaged');
      // Handle what this chunk completed before reading on (one entry in memory at a time)
      while (pending.length > 0) {
        const fields = pending.shift()!;
        await handlers.onLibraryEntry?.({ fields, audio: audioOf(fields) }, index++);
      }
    }
    if (!parser.isEnded) parser.end();
    if (parseError) throw new BackupError('damaged');
  } catch (e) {
    await reader.cancel().catch(() => {});
    // A broken gzip stream or a parser error thrown from write / end
    throw toBackupError(e);
  }

  if (!sawBoards && !sawLibrary) throw new BackupError('not-a-backup');
  if (top.format === V3_BACKUP_FORMAT) {
    return { kind: 'v3', formatVersion: Number(top.formatVersion) || 0 };
  }
  const v = top.version;
  return { kind: 'v1', version: typeof v === 'number' || typeof v === 'string' ? v : null };
}
