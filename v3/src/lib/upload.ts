// ─────────────────────────────────────────────────────────────────────────────
// Upload pipeline — file processing, peak computation, IDB persistence
//
// MEMORY SAFETY RULES (see CLAUDE.md#iphone--ios-safari--memory--stability-rules-critical):
//   - Files are processed SERIALLY. Never Promise.all over multiple files.
//   - Each AudioBuffer is explicitly null'd after peak extraction, before
//     AudioContext.close(). This ensures the GC can reclaim PCM memory
//     before the next file's decode begins.
//   - Raw audio (buf / Blob) is never stored in Signals or working arrays.
//   - Peaks (30 numbers × 8 bytes = 240 bytes) are the only audio-derived
//     data kept in memory after upload.
// ─────────────────────────────────────────────────────────────────────────────

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { libPut } from '../db/idb';
import { addLibraryItemMeta, libraryItems, uploadStatus } from '../state/store';
import type { LibraryItemMeta, UploadResult } from '../types';

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------

/**
 * Compute the SHA-256 hex digest of a raw file buffer.
 *
 * Uses @noble/hashes instead of Web Crypto API because Web Crypto requires a
 * Secure Context (HTTPS or localhost). The dev server accessed from an iPhone
 * on the local network (http://192.168.x.x:5173) is NOT a Secure Context.
 * @noble/hashes has no such requirement and produces identical output.
 */
export function computeHash(buf: ArrayBuffer): string {
  return bytesToHex(sha256(new Uint8Array(buf)));
}

// ---------------------------------------------------------------------------
// Peak extraction (ported from V1 _computePeaks)
// ---------------------------------------------------------------------------

/**
 * Extract N amplitude peaks from a decoded AudioBuffer.
 *
 * Channel 0 only. Divides the buffer into N equal windows, records the
 * maximum absolute sample value per window. Returns an array of N values
 * in [0, 1]. Ported directly from V1's _computePeaks function.
 *
 * @param decoded AudioBuffer — will be null'd by the caller after this returns
 * @param N       number of peak samples (default 30, matching V1)
 */
export function computePeaks(decoded: AudioBuffer, N = 30): number[] {
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

// ---------------------------------------------------------------------------
// Serial upload pipeline
// ---------------------------------------------------------------------------

/**
 * Process an array of audio files one at a time.
 *
 * For each file:
 *   1. Read raw bytes
 *   2. Compute SHA-256 hash (= id)
 *   3. Skip if already in library (duplicate by content)
 *   4. Decode audio SERIALLY — await each decode before starting the next
 *   5. Extract peaks; null the AudioBuffer; close the AudioContext
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
    // Step 1 — read raw bytes
    let buf: ArrayBuffer;
    try {
      buf = await file.arrayBuffer();
    } catch (e) {
      result.errors.push(`${file.name}: could not read file (${String(e)})`);
      continue;
    }

    // Step 2 — hash (synchronous, @noble/hashes)
    const id = computeHash(buf);

    // Step 3 — duplicate check
    if (libraryItems.value.some((m) => m.id === id)) {
      result.skipped++;
      continue;
    }

    // Steps 4–5 — serial decode + peaks
    let decoded: AudioBuffer | null = null;
    let peaks: number[] = [];
    let duration = 0;

    try {
      const ctx = new AudioContext();
      // buf.slice() prevents detaching: decodeAudioData may transfer ownership of
      // the ArrayBuffer, but we still need buf below to create the Blob.
      decoded = await ctx.decodeAudioData(buf.slice());
      peaks = computePeaks(decoded, 30);
      duration = decoded.duration;

      // Explicit null BEFORE ctx.close() — releases PCM memory now, not at GC time.
      // This is critical on iOS Safari where heap pressure causes tab kills.
      decoded = null;
      await ctx.close();
    } catch (e) {
      decoded = null;
      result.errors.push(`${file.name}: decode failed (${String(e)})`);
      continue;
    }

    // Step 6 — persist to IDB
    const meta: LibraryItemMeta = {
      id,
      type: 'audio',
      name: file.name,
      size: buf.byteLength,
      tags: [],
      addedAt: Date.now(),
      duration,
      peaks,
    };

    try {
      await libPut({ ...meta, blob: new Blob([buf], { type: file.type }) });
    } catch (e) {
      result.errors.push(`${file.name}: could not save to library (${String(e)})`);
      continue;
    }

    // Step 7 — update signal immediately (live progress)
    addLibraryItemMeta(meta);
    result.imported++;
  }

  uploadStatus.value = result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format bytes as human-readable string (e.g. "1.4 MB", "240 KB"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
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
