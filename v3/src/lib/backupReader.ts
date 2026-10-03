// ─────────────────────────────────────────────────────────────────────────────
// Backup reader — reads a V1 or V3 backup file piece by piece (D6, ADR-0061)
//
// Never holds the file as one string (iPhone memory rules 4 and 6): the file is streamed through
// gzip decompression (when it is gzipped) into a streaming JSON parser that hands over the boards
// once and the library entries one at a time. The next chunk of the file is read only after the
// entries of the current chunk are handled, so at most one audio entry is in memory.
// ─────────────────────────────────────────────────────────────────────────────

/** Why a file could not be read — each maps to a message for the user. */
export type BackupErrorKind = 'gzip-unsupported' | 'invalid-json' | 'not-a-backup';

export class BackupError extends Error {
  readonly kind: BackupErrorKind;
  constructor(kind: BackupErrorKind) {
    super(kind);
    this.name = 'BackupError';
    this.kind = kind;
  }
}

/** What the file says about itself: V3's own format, or a V1 backup. */
export type BackupHeader =
  { kind: 'v3'; formatVersion: number } | { kind: 'v1'; version: number | string | null };

export interface BackupHandlers {
  /** The boards array — called once, before or after entries depending on the file. */
  onBoards?: (boards: unknown[]) => void;
  /** One library entry; awaited before the next one is handed over. */
  onLibraryEntry?: (entry: Record<string, unknown>, index: number) => void | Promise<void>;
}

/** V3's own backup files start with this marker (docs/architecture/0061-backup-file-format-and-streaming-import.md#3-v3s-own-backup-file-d1d2--provisional-choice). */
export const V3_BACKUP_FORMAT = 'sos-v3-backup';

const GZIP_MAGIC = [0x1f, 0x8b];

async function isGzip(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  return head[0] === GZIP_MAGIC[0] && head[1] === GZIP_MAGIC[1];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Reads a backup file and hands its boards and library entries to `handlers`.
 * Resolves with the header once the whole file is read; rejects with a BackupError.
 */
export async function readBackup(file: Blob, handlers: BackupHandlers): Promise<BackupHeader> {
  let stream: ReadableStream<Uint8Array>;
  if (!(await isGzip(file))) {
    stream = file.stream();
  } else {
    if (typeof DecompressionStream === 'undefined') throw new BackupError('gzip-unsupported');
    const gunzip = new DecompressionStream('gzip');
    // A broken gzip stream surfaces as an error on gunzip.readable (read below)
    file
      .stream()
      .pipeTo(gunzip.writable)
      .catch(() => {});
    stream = gunzip.readable;
  }

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
      if (parseError) throw new BackupError('invalid-json');
      // Handle what this chunk completed before reading on (one entry in memory at a time)
      while (pending.length > 0) {
        const entry = pending.shift()!;
        await handlers.onLibraryEntry?.(entry, index++);
      }
    }
    if (!parser.isEnded) parser.end();
    if (parseError) throw new BackupError('invalid-json');
  } catch (e) {
    await reader.cancel().catch(() => {});
    if (e instanceof BackupError) throw e;
    // A broken gzip stream or a parser error thrown from write / end
    throw new BackupError('invalid-json');
  }

  if (!sawBoards && !sawLibrary) throw new BackupError('not-a-backup');
  if (top.format === V3_BACKUP_FORMAT) {
    return { kind: 'v3', formatVersion: Number(top.formatVersion) || 0 };
  }
  const v = top.version;
  return { kind: 'v1', version: typeof v === 'number' || typeof v === 'string' ? v : null };
}
