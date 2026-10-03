// ─────────────────────────────────────────────────────────────────────────────
// Backup export — everything in one file (D1; format in
// docs/architecture/0061-backup-file-format-and-streaming-import.md#3-v3s-own-backup-file-d1d2--provisional-choice)
//
// iPhone memory rule 4: never the whole library as one JSON string. Each library entry is read
// from IndexedDB on its own, turned into its JSON text and wrapped in a Blob part right away, so
// its strings can be freed before the next entry is read. The file is gzip-compressed where the
// browser can (CompressionStream: iOS Safari 16.4+), as a stream.
// ─────────────────────────────────────────────────────────────────────────────

import { boardGetAll, libGet, libGetAllMeta } from '../db/idb';
import { APP_VERSION } from './changelog';
import { V3_BACKUP_FORMAT } from './backupReader';

/** bytes → base64, in slices (String.fromCharCode over millions of arguments would overflow). */
export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const SLICE = 0x8000;
  for (let i = 0; i < bytes.length; i += SLICE) {
    bin += String.fromCharCode(...bytes.subarray(i, i + SLICE));
  }
  return btoa(bin);
}

/** The backup's file name: soundboard-backup-YYYY-MM-DD.json[.gz] (local date). */
export function backupFileName(now: Date, gzip: boolean): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `soundboard-backup-${day}.json${gzip ? '.gz' : ''}`;
}

/**
 * Builds the backup of all boards and all library audio as one Blob (D1). `onProgress` gets the
 * number of audio files written so far and the total.
 */
export async function buildBackup(
  onProgress?: (done: number, total: number) => void,
): Promise<{ blob: Blob; gzip: boolean }> {
  const header = {
    format: V3_BACKUP_FORMAT,
    formatVersion: 1,
    appVersion: APP_VERSION,
    exported: new Date().toISOString(),
    boards: await boardGetAll(),
  };
  // Everything up to the library array; the entries follow one Blob part at a time
  const parts: BlobPart[] = [JSON.stringify(header).slice(0, -1) + ',"library":['];
  const metas = await libGetAllMeta();
  let first = true;
  let done = 0;
  for (const meta of metas) {
    const item = await libGet(meta.id);
    if (item) {
      const entry = {
        id: item.id,
        name: item.name,
        type: item.blob.type, // the audio's MIME type ('' when unknown)
        tags: item.tags,
        addedAt: item.addedAt,
        data: bytesToBase64(new Uint8Array(await item.blob.arrayBuffer())),
      };
      parts.push(new Blob([(first ? '' : ',') + JSON.stringify(entry)]));
      first = false;
    }
    onProgress?.(++done, metas.length);
  }
  parts.push(']}');
  const json = new Blob(parts, { type: 'application/json' });

  if (typeof CompressionStream === 'undefined') return { blob: json, gzip: false };
  const gz = await new Response(json.stream().pipeThrough(new CompressionStream('gzip'))).blob();
  return { blob: new Blob([gz], { type: 'application/gzip' }), gzip: true };
}

/**
 * After how many days without a backup the app reminds (D3). Provisional (2026-10-02, review
 * pending): V1 reminded after 3 hours; a week fits "last backup N days ago".
 */
export const BACKUP_REMINDER_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Last backup: today / 1 day ago / N days ago", or "No backup yet"; stale → remind (D3). */
export function describeBackupAge(
  last: number | null,
  now: number,
): { text: string; stale: boolean } {
  if (last === null) return { text: 'No backup yet', stale: true };
  const days = Math.max(0, Math.floor((now - last) / DAY_MS));
  const text =
    days === 0 ? 'Last backup: today' : `Last backup: ${days} day${days === 1 ? '' : 's'} ago`;
  return { text, stale: days > BACKUP_REMINDER_DAYS };
}

/**
 * Hands the backup to the user: the share sheet where the browser can share files (iPhone: save to
 * Files), otherwise a download. Must run in a tap handler (share needs a user gesture). Resolves
 * true when the file was handed over, false when the user cancelled the share sheet.
 */
export async function saveBackupFile(blob: Blob, name: string): Promise<boolean> {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Soundboard backup' });
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return false;
      // Sharing failed for another reason — fall back to a download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
