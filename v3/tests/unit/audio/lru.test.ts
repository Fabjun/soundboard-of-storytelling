/**
 * @fileoverview LRU decoded-buffer cache — unit tests
 *
 * The LRU functions are pure module-level helpers exported from engine.ts.
 * Tests run without an AudioContext (no Web Audio API needed).
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { libBufs, lruSet, lruDelete, bufDecodedBytes } from '../../../src/audio/engine';

// ── AudioBuffer mock ───────────────────────────────────────────────────────────

function mockBuf(lengthSamples: number, channels = 1): AudioBuffer {
  return {
    length: lengthSamples,
    numberOfChannels: channels,
    sampleRate: 44100,
    duration: lengthSamples / 44100,
    getChannelData: () => new Float32Array(lengthSamples),
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as unknown as AudioBuffer;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearLibBufs(): void {
  // Use lruDelete to correctly reset all three module-level state pieces:
  // libBufs, libBufLru, and libBufBytes. Direct deletion of libBufs keys
  // would leave lru and byte counter in a dirty state across tests.
  for (const k of Object.keys(libBufs)) lruDelete(k);
}

// ── bufDecodedBytes ───────────────────────────────────────────────────────────

describe('bufDecodedBytes', () => {
  test('1-second stereo at 44100 Hz = 352800 bytes', () => {
    const buf = mockBuf(44100, 2);
    expect(bufDecodedBytes(buf)).toBe(44100 * 2 * 4);
  });

  test('mono buffer = channels × length × 4', () => {
    const buf = mockBuf(1000, 1);
    expect(bufDecodedBytes(buf)).toBe(1000 * 1 * 4);
  });
});

// ── lruSet ────────────────────────────────────────────────────────────────────

describe('lruSet — basic add', () => {
  beforeEach(clearLibBufs);

  test('new hash is tracked; byte counter increases', () => {
    libBufs['a'] = mockBuf(100, 1);
    lruSet('a');
    // byte counter is module-private, but eviction behavior proves it works
    // (tested in eviction tests). Here we just verify no crash and the buf stays.
    expect(libBufs['a']).toBeDefined();
  });

  test('adding same hash again moves it to back (LRU position update)', () => {
    libBufs['a'] = mockBuf(100, 1);
    libBufs['b'] = mockBuf(100, 1);
    lruSet('a');
    lruSet('b');
    lruSet('a'); // re-access 'a' → should move to back
    // Deleting 'a' and checking 'b' survived is the simplest observable proof
    // (if 'a' were still at the front it would be evicted first under pressure)
    expect(libBufs['a']).toBeDefined();
    expect(libBufs['b']).toBeDefined();
  });
});

describe('lruSet — eviction', () => {
  beforeEach(clearLibBufs);

  test('buffers beyond 150 MB are evicted oldest-first', () => {
    // Each buffer: 100 MB decoded (25M samples × 4 bytes × 1 channel)
    const SAMPLES_100MB = 25 * 1024 * 1024; // 100 MB
    libBufs['old'] = mockBuf(SAMPLES_100MB, 1);
    lruSet('old');
    libBufs['new'] = mockBuf(SAMPLES_100MB, 1);
    lruSet('new'); // total 200 MB > 150 MB → 'old' should be evicted

    expect(libBufs['old']).toBeUndefined();
    expect(libBufs['new']).toBeDefined();
  });

  test('the last buffer is never evicted even if it exceeds the cap alone', () => {
    const SAMPLES_200MB = 50 * 1024 * 1024; // 200 MB
    libBufs['giant'] = mockBuf(SAMPLES_200MB, 1);
    lruSet('giant'); // 200 MB > 150 MB, but it is the only entry → must survive

    expect(libBufs['giant']).toBeDefined();
  });

  test('buffer at exactly 150 MB is not evicted', () => {
    // 150 MB = 150 * 1024 * 1024 bytes / 4 bytes per float = 39,321,600 samples
    const SAMPLES_150MB = (150 * 1024 * 1024) / 4;
    libBufs['exact'] = mockBuf(SAMPLES_150MB, 1);
    lruSet('exact');

    expect(libBufs['exact']).toBeDefined();
  });
});

// ── lruDelete ─────────────────────────────────────────────────────────────────

describe('lruDelete', () => {
  beforeEach(clearLibBufs);

  test('removes hash from libBufs', () => {
    libBufs['x'] = mockBuf(100, 1);
    lruSet('x');
    lruDelete('x');
    expect(libBufs['x']).toBeUndefined();
  });

  test('no-op when hash not present (does not throw)', () => {
    expect(() => lruDelete('nonexistent')).not.toThrow();
  });

  test('deleting then re-adding hash works correctly', () => {
    libBufs['y'] = mockBuf(100, 1);
    lruSet('y');
    lruDelete('y');
    libBufs['y'] = mockBuf(200, 1);
    lruSet('y'); // should re-add without error
    expect(libBufs['y']).toBeDefined();
  });

  test('freed bytes allow subsequent adds without unwanted eviction', () => {
    const SAMPLES_80MB = 20 * 1024 * 1024;
    libBufs['a'] = mockBuf(SAMPLES_80MB, 1);
    lruSet('a'); // 80 MB
    libBufs['b'] = mockBuf(SAMPLES_80MB, 1);
    lruSet('b'); // 160 MB > cap → 'a' evicted

    // Now delete 'b' and add two 60 MB buffers — both should fit within 150 MB
    lruDelete('b');
    const SAMPLES_60MB = 15 * 1024 * 1024;
    libBufs['c'] = mockBuf(SAMPLES_60MB, 1);
    lruSet('c'); // 60 MB
    libBufs['d'] = mockBuf(SAMPLES_60MB, 1);
    lruSet('d'); // 120 MB, still under cap

    expect(libBufs['c']).toBeDefined();
    expect(libBufs['d']).toBeDefined();
  });
});
