/**
 * @fileoverview Backup export — everything in one file (D1; format in
 * docs/architecture/0061-backup-file-format-and-streaming-import.md#3-v3s-own-backup-file-d1d2)
 *
 * A ZIP archive (owner decision B1): every audio file as it is, under audio/, and the manifest
 * backup.json — boards and the library list — as the last entry. iPhone memory rule 4: one audio
 * file is read from IndexedDB at a time and copied into the archive's Blob parts before the next.
 */

import { boardGetAll, libGet, libGetAllMeta } from '../db/idb';
import { APP_VERSION } from './changelog';
import { BACKUP_MANIFEST, V3_BACKUP_FORMAT } from './backupReader';
import { createZipWriter } from './zipArchive';

/** The backup's file name: soundboard-backup-YYYY-MM-DD.zip (local date). */
export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `soundboard-backup-${day}.zip`;
}

/** File name extensions for the audio types browsers report, so the archive's files open anywhere. */
const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/flac': '.flac',
  'audio/webm': '.webm',
};

/** Where an audio file sits in the archive: `audio/<content hash><extension of its type>`. */
export function audioPath(id: string, type: string): string {
  return `audio/${id}${AUDIO_EXTENSIONS[type] ?? ''}`;
}

/**
 * Builds the backup of all boards and all library audio as one ZIP Blob (D1). `onProgress` gets
 * the number of audio files written so far and the total.
 */
export async function buildBackup(
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const zip = createZipWriter();
  const library: Record<string, unknown>[] = [];
  const metas = await libGetAllMeta();
  let done = 0;
  for (const meta of metas) {
    const item = await libGet(meta.id);
    if (item) {
      const type = item.blob.type; // the audio's MIME type ('' when unknown)
      const file = audioPath(item.id, type);
      zip.add(file, new Uint8Array(await item.blob.arrayBuffer()));
      library.push({
        id: item.id,
        name: item.name,
        type,
        tags: item.tags,
        addedAt: item.addedAt,
        file,
      });
    }
    onProgress?.(++done, metas.length);
  }
  const manifest = {
    format: V3_BACKUP_FORMAT,
    formatVersion: 2,
    appVersion: APP_VERSION,
    exported: new Date().toISOString(),
    boards: await boardGetAll(),
    library,
  };
  zip.add(BACKUP_MANIFEST, new TextEncoder().encode(JSON.stringify(manifest)));
  return zip.finish('application/zip');
}

/**
 * After how many days without a backup the app reminds (D3) — owner decision B5 (2026-10-02):
 * seven days; it becomes a setting with the Settings screen (Slice 14).
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
 * true when the file was handed over, false when the user canceled the share sheet.
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
