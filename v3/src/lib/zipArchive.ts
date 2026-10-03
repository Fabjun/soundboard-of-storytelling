/**
 * @fileoverview ZIP archive — the container of V3 backups
 * (docs/architecture/0061-backup-file-format-and-streaming-import.md#3-v3s-own-backup-file-d1d2)
 *
 * Writing goes through fflate's streaming Zip with stored (uncompressed) entries: audio is
 * compressed already, and each entry becomes Blob parts right away, so the archive is never one
 * big buffer.
 *
 * Reading is our own, after the ZIP specification (PKWARE APPNOTE 6.3.10): the end of central
 * directory record (4.3.16) leads to the central directory (4.3.12), the authoritative list of
 * entries; each local header (4.3.7) gives where the entry's bytes start. An entry is then a
 * `Blob.slice` of the file — nothing is copied or read before it is needed (iPhone memory rules).
 * fflate's streaming reader is not used: for entries written with a data descriptor (fflate's
 * writer always writes one) it finds an entry's end by searching the data for the descriptor
 * signature, which audio bytes can contain by chance, and APPNOTE 4.3.9 makes that signature
 * optional anyway.
 */

import { Zip, ZipPassThrough } from 'fflate';

/** One file in the archive, as the central directory describes it. */
export interface ZipEntry {
  name: string;
  /** Compression method: 0 = stored (APPNOTE 4.4.5). */
  method: number;
  /** Size of the entry's data in the file (compressed size). */
  size: number;
  /** Where the entry's local header starts. */
  localHeaderOffset: number;
}

/** Why an archive cannot be read. */
export type ZipErrorKind = 'not-a-zip' | 'damaged' | 'unsupported';

/** An archive that cannot be read; `kind` says why, the message adds where. */
export class ZipError extends Error {
  readonly kind: ZipErrorKind;
  /** Creates the error; the message is `"<kind>: <detail>"`. */
  constructor(kind: ZipErrorKind, detail: string) {
    super(`${kind}: ${detail}`);
    this.name = 'ZipError';
    this.kind = kind;
  }
}

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_END = 0x06054b50;
const END_RECORD_SIZE = 22;
const MAX_COMMENT = 0xffff;
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
/** General purpose flag bit 0: the entry is encrypted (APPNOTE 4.4.4). */
const FLAG_ENCRYPTED = 1;

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04", a local file header

/** Whether the file starts like a ZIP archive (its first local file header). */
export async function isZip(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  return ZIP_MAGIC.every((b, i) => head[i] === b);
}

async function readBytes(file: Blob, start: number, end: number): Promise<DataView> {
  return new DataView(await file.slice(start, end).arrayBuffer());
}

/**
 * Reads the archive's table of contents: entry name → entry. Reads only the end of the file and
 * the central directory. Rejects with a ZipError for split, ZIP64 or damaged archives.
 */
export async function readZipDirectory(file: Blob): Promise<Map<string, ZipEntry>> {
  // The end record sits at the very end, followed only by an optional comment (≤ 64 KiB)
  const tailStart = Math.max(0, file.size - END_RECORD_SIZE - MAX_COMMENT);
  const tail = await readBytes(file, tailStart, file.size);
  let end = -1;
  for (let i = tail.byteLength - END_RECORD_SIZE; i >= 0; i--) {
    if (
      tail.getUint32(i, true) === SIG_END &&
      i + END_RECORD_SIZE + tail.getUint16(i + 20, true) === tail.byteLength
    ) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new ZipError('not-a-zip', 'no end of central directory record');

  const disk = tail.getUint16(end + 4, true);
  const cdDisk = tail.getUint16(end + 6, true);
  const count = tail.getUint16(end + 10, true);
  const cdSize = tail.getUint32(end + 12, true);
  const cdOffset = tail.getUint32(end + 16, true);
  if (disk !== 0 || cdDisk !== 0) throw new ZipError('unsupported', 'split archive');
  if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    throw new ZipError('unsupported', 'ZIP64 archive');
  }
  if (cdOffset + cdSize > tailStart + end) throw new ZipError('damaged', 'central directory');

  const cd = await readBytes(file, cdOffset, cdOffset + cdSize);
  const utf8 = new TextDecoder();
  const entries = new Map<string, ZipEntry>();
  let p = 0;
  for (let n = 0; n < count; n++) {
    if (p + CENTRAL_HEADER_SIZE > cd.byteLength || cd.getUint32(p, true) !== SIG_CENTRAL) {
      throw new ZipError('damaged', `central directory entry ${n}`);
    }
    const flags = cd.getUint16(p + 8, true);
    const nameLength = cd.getUint16(p + 28, true);
    const extraLength = cd.getUint16(p + 30, true);
    const commentLength = cd.getUint16(p + 32, true);
    const nameStart = p + CENTRAL_HEADER_SIZE;
    if (nameStart + nameLength > cd.byteLength) {
      throw new ZipError('damaged', `central directory entry ${n}`);
    }
    // Names are decoded as UTF-8 whatever bit 11 says: the names this app looks up are ASCII
    const name = utf8.decode(new Uint8Array(cd.buffer, cd.byteOffset + nameStart, nameLength));
    const entry: ZipEntry = {
      name,
      method: cd.getUint16(p + 10, true),
      size: cd.getUint32(p + 20, true),
      localHeaderOffset: cd.getUint32(p + 42, true),
    };
    if (flags & FLAG_ENCRYPTED) throw new ZipError('unsupported', `encrypted entry ${name}`);
    if (entry.size === 0xffffffff || entry.localHeaderOffset === 0xffffffff) {
      throw new ZipError('unsupported', 'ZIP64 entry');
    }
    entries.set(name, entry);
    p = nameStart + nameLength + extraLength + commentLength;
  }
  return entries;
}

/**
 * The data of one stored entry, as a slice of the file — no bytes are read except its local
 * header. Rejects for compressed entries (this app writes stored entries only).
 */
export async function zipEntryBlob(file: Blob, entry: ZipEntry): Promise<Blob> {
  if (entry.method !== 0) throw new ZipError('unsupported', `compressed entry ${entry.name}`);
  const header = await readBytes(
    file,
    entry.localHeaderOffset,
    entry.localHeaderOffset + LOCAL_HEADER_SIZE,
  );
  if (header.byteLength < LOCAL_HEADER_SIZE || header.getUint32(0, true) !== SIG_LOCAL) {
    throw new ZipError('damaged', `local header of ${entry.name}`);
  }
  const start =
    entry.localHeaderOffset +
    LOCAL_HEADER_SIZE +
    header.getUint16(26, true) +
    header.getUint16(28, true);
  if (start + entry.size > file.size) throw new ZipError('damaged', `data of ${entry.name}`);
  return file.slice(start, start + entry.size);
}

/** Builds an archive of stored entries, one entry at a time. */
export interface ZipWriter {
  /** Adds one file; its bytes are copied into the archive's Blob parts at once. */
  add(name: string, bytes: Uint8Array): void;
  /** Writes the central directory and returns the archive. */
  finish(type: string): Blob;
}

/**
 * Starts an archive of stored (uncompressed) entries. Each entry's bytes become Blob parts as
 * soon as it is added, so the archive is never one buffer in memory.
 *
 * @throws The fflate error when an entry cannot be written (on `add` or `finish`).
 */
export function createZipWriter(): ZipWriter {
  const parts: Blob[] = [];
  let failure: Error | null = null;
  // fflate calls back synchronously for stored entries: each chunk is wrapped in a Blob at once
  const zip = new Zip((err, chunk) => {
    if (err) failure = err;
    else parts.push(new Blob([chunk]));
  });
  const check = () => {
    if (failure) throw failure;
  };
  return {
    add(name, bytes) {
      const file = new ZipPassThrough(name);
      zip.add(file);
      file.push(bytes, true);
      check();
    },
    finish(type) {
      zip.end();
      check();
      return new Blob(parts, { type });
    },
  };
}
