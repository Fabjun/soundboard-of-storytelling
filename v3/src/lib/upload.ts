/**
 * @fileoverview Upload pipeline — file processing, peak computation, IDB persistence
 *
 * MEMORY SAFETY RULES (see CLAUDE.md#iphone--ios-safari--memory--stability-rules-critical):
 *   - Files are processed SERIALLY. Never Promise.all over multiple files.
 *   - Each AudioBuffer is explicitly null'd after peak extraction. This ensures the GC can
 *     reclaim PCM memory before the next file's decode begins. Decoding uses an
 *     OfflineAudioContext, which never touches the audio hardware or iOS's audio session.
 *   - Raw audio (buf / Blob) is never stored in Signals or working arrays.
 *   - Peaks (`PEAK_COUNT` = 256 numbers, about 2 KB per file, ADR-0065) are the only
 *     audio-derived data kept in memory after upload.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { libGet, libPut } from '../db/idb';
import {
  addLibraryItemMeta,
  libraryItems,
  setLibraryItemPeaks,
  uploadStatus,
} from '../state/store';
import { needsFinePeaks, PEAK_COUNT } from './peaks';
import type { LibraryItemMeta, UploadResult } from '../types';

/**
 * Sample rate of the decoding context. decodeAudioData resamples to it; duration and peaks do not
 * depend on it, and 44.1 kHz is the CD / MP3 standard rate.
 */
const DECODE_SAMPLE_RATE = 44_100;

// ── Hash ─────────────────────────────────────────────────────────────────────

/**
 * Computes the SHA-256 hex digest of a raw file buffer.
 *
 * Uses `@noble/hashes` instead of Web Crypto API because Web Crypto requires a
 * Secure Context (HTTPS or localhost). The dev server accessed from an iPhone
 * on the local network (http://192.168.x.x:5173) is NOT a Secure Context.
 * `@noble/hashes` has no such requirement and produces identical output.
 */
export function computeHash(buf: ArrayBuffer): string {
  return bytesToHex(sha256(new Uint8Array(buf)));
}

// ── Peak extraction (ported from V1 _computePeaks) ───────────────────────────

/**
 * Extracts N amplitude peaks from a decoded AudioBuffer.
 *
 * Channel 0 only. Divides the buffer into N equal windows, records the
 * maximum absolute sample value per window. Returns an array of N values
 * in [0, 1]. Ported directly from V1's _computePeaks function.
 *
 * @param decoded - The decoded audio; the caller releases it right after this returns.
 * @param N - Number of peaks (default `PEAK_COUNT`, ADR-0065; V1 used 30).
 */
export function computePeaks(decoded: AudioBuffer, N = PEAK_COUNT): number[] {
  const data = decoded.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / N));
  const peaks: number[] = [];
  for (let i = 0; i < N; i++) {
    let max = 0;
    const start = i * step;
    for (let j = 0; j < step; j++) {
      const v = Math.abs(data[start + j] ?? 0);
      if (v > max) max = v;
    }
    peaks.push(+max.toFixed(3));
  }
  return peaks;
}

// ── Analysis (one decode path for uploads and for older entries) ──────────────

/**
 * Decodes one file and returns its duration and `PEAK_COUNT` peaks (ADR-0065). The decoded buffer
 * is released before this returns (iPhone memory rules); call it for one file at a time.
 *
 * @throws When the bytes are not audio the browser can decode.
 */
export async function analyseAudio(
  buf: ArrayBuffer,
): Promise<{ duration: number; peaks: number[] }> {
  // An OfflineAudioContext decodes without touching the audio hardware or iOS's audio session
  // (MDN: it "doesn't render the audio to the device hardware") — a real AudioContext per file
  // meant 99 contexts opened and closed next to the engine's during a V1 import.
  const ctx = new OfflineAudioContext(1, 1, DECODE_SAMPLE_RATE);
  // buf.slice() prevents detaching: decodeAudioData may transfer ownership of the ArrayBuffer,
  // but callers still need it (to store the Blob).
  let decoded: AudioBuffer | null = await ctx.decodeAudioData(buf.slice());
  const result = { duration: decoded.duration, peaks: computePeaks(decoded, PEAK_COUNT) };
  // Explicit null — releases PCM memory now, not at GC time (critical on iOS Safari, where heap
  // pressure kills the tab).
  decoded = null;
  return result;
}

/**
 * Gives a library entry stored before ADR-0065 (30 peaks) its fine peaks: decodes its audio once,
 * stores the peaks with the entry and in the library list. Entries that have them already are left
 * alone. Resolves with the entry's peaks, or null when it is missing or cannot be decoded. Calls
 * wait for each other, so two entries are never decoded at the same time (memory rule 2).
 */
export function ensureFinePeaks(id: string): Promise<number[] | null> {
  const next = finePeaksQueue.then(() => backfillPeaks(id));
  finePeaksQueue = next.catch(() => null); // a failed run must not stop the ones after it
  return next;
}

/** The last fine-peaks run; the next one starts after it. */
let finePeaksQueue: Promise<unknown> = Promise.resolve();

/** One fine-peaks run of `ensureFinePeaks`. */
async function backfillPeaks(id: string): Promise<number[] | null> {
  const known = libraryItems.value.find((m) => m.id === id);
  if (known && !needsFinePeaks(known.peaks)) return known.peaks;
  let item = await libGet(id);
  if (!item) return null;
  try {
    const { peaks } = await analyseAudio(await item.blob.arrayBuffer());
    // IDB has no partial update: the entry is written back whole, as libRename does
    await libPut({ ...item, peaks });
    setLibraryItemPeaks(id, peaks);
    return peaks;
  } catch {
    return null;
  } finally {
    item = null; // release the Blob reference now (memory rule 6)
  }
}

// ── Serial upload pipeline ───────────────────────────────────────────────────

/** What happened to one audio file: added, already in the library, or not usable. */
export type AddAudioResult =
  | { kind: 'imported'; id: string }
  | { kind: 'skipped'; id: string }
  | { kind: 'error'; error: string };

/**
 * Adds ONE audio file to the library — the single path for uploads and backup imports.
 * Hash → duplicate check → serial decode (duration, peaks) → IDB → signal. The decoded buffer is
 * released before the function returns (iPhone memory rules); call it for one file at a time.
 * `tags` are stored with a new entry (a backup import restores them); an entry already in the
 * library keeps its own.
 */
export async function addAudioFile(
  file: File,
  { tags = [] }: { tags?: string[] } = {},
): Promise<AddAudioResult> {
  // Step 1 — read raw bytes
  let buf: ArrayBuffer;
  try {
    buf = await file.arrayBuffer();
  } catch (e) {
    return { kind: 'error', error: `${file.name}: could not read file (${String(e)})` };
  }

  // Step 2 — hash (synchronous, @noble/hashes)
  const id = computeHash(buf);

  // Step 3 — duplicate check
  if (libraryItems.value.some((m) => m.id === id)) return { kind: 'skipped', id };

  // Steps 4–5 — serial decode + peaks
  let peaks: number[];
  let duration: number;
  try {
    ({ duration, peaks } = await analyseAudio(buf));
  } catch (e) {
    return { kind: 'error', error: `${file.name}: decode failed (${String(e)})` };
  }

  // Step 6 — persist to IDB
  const meta: LibraryItemMeta = {
    id,
    type: 'audio',
    name: file.name,
    size: buf.byteLength,
    tags,
    addedAt: Date.now(),
    duration,
    peaks,
  };

  try {
    await libPut({ ...meta, blob: new Blob([buf], { type: file.type }) });
  } catch (e) {
    return { kind: 'error', error: `${file.name}: could not save to library (${String(e)})` };
  }

  // Step 7 — update signal immediately (live progress)
  addLibraryItemMeta(meta);
  return { kind: 'imported', id };
}

/**
 * Processes an array of audio files one at a time.
 *
 * For each file:
 *   1. Read raw bytes
 *   2. Compute SHA-256 hash (= id)
 *   3. Skip if already in library (duplicate by content)
 *   4. Decode audio SERIALLY — await each decode before starting the next
 *   5. Extract peaks; null the AudioBuffer (decoded in an OfflineAudioContext)
 *   6. Persist full entry (with Blob) to IndexedDB
 *   7. Immediately update the libraryItems Signal — live progress in UI
 *
 * Sets uploadStatus signal to null at start, then to the result when done.
 * Errors are collected per-file; the pipeline continues on individual failures.
 */
export async function processFilesSerial(files: File[]): Promise<void> {
  uploadStatus.value = null;

  const result: UploadResult = { imported: 0, skipped: 0, errors: [] };

  for (const file of files) {
    const r = await addAudioFile(file); // serial: one file at a time, never Promise.all
    if (r.kind === 'imported') result.imported++;
    else if (r.kind === 'skipped') result.skipped++;
    else result.errors.push(r.error);
  }

  uploadStatus.value = result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format bytes as human-readable string (e.g. "1.4 MB", "240 KB"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  // Switch to MB where the KB value would round up to 1024 (boundary found by T11b).
  if (Math.round(bytes / 1024) < 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format seconds as MM:SS string. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Total byte size of all library items combined. */
export function totalLibraryBytes(items: LibraryItemMeta[]): number {
  return items.reduce((sum, m) => sum + m.size, 0);
}
