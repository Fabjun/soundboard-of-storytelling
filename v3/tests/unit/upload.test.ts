/**
 * @fileoverview upload — unit tests for the serial upload pipeline (iOS memory rules)
 *
 * CLAUDE.md#iphone--ios-safari--memory--stability-rules-critical: never decode in parallel; release decoded buffers;
 * never keep raw audio in working state. processFilesSerial is tested against a
 * fake OfflineAudioContext that records how many decodes run at the same time and in
 * which order they happen; a real AudioContext must never be created for decoding (it
 * touches iOS's audio session). IDB is fake-indexeddb.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB, libGet, libGetAllMeta, libPut } from '../../src/db/idb';
import { libraryItems, uploadStatus } from '../../src/state/store';
import { PEAK_COUNT } from '../../src/lib/peaks';
import {
  addAudioFile,
  computeHash,
  computePeaks,
  ensureFinePeaks,
  formatBytes,
  formatDuration,
  processFilesSerial,
  totalLibraryBytes,
} from '../../src/lib/upload';

// ── Fake OfflineAudioContext ──────────────────────────────────────────────────

type Event = string;

class FakeOfflineAudioContext {
  static active = 0;
  static maxActive = 0;
  static log: Event[] = [];
  static seq = 0;
  private readonly n: number;

  constructor() {
    this.n = ++FakeOfflineAudioContext.seq;
  }

  decodeAudioData(buf: ArrayBuffer): Promise<AudioBuffer> {
    const n = this.n;
    FakeOfflineAudioContext.active++;
    FakeOfflineAudioContext.maxActive = Math.max(
      FakeOfflineAudioContext.maxActive,
      FakeOfflineAudioContext.active,
    );
    FakeOfflineAudioContext.log.push(`decode-start:${n}`);
    const first = new Uint8Array(buf)[0];
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        FakeOfflineAudioContext.active--;
        FakeOfflineAudioContext.log.push(`decode-end:${n}`);
        if (first === 0xff) {
          reject(new Error('corrupt'));
          return;
        }
        const data = new Float32Array(300).map((_, i) => (i % 10 === 0 ? 0.5 : 0.1));
        resolve({ duration: 2.5, getChannelData: () => data } as unknown as AudioBuffer);
      }, 5);
    });
  }

  static reset(): void {
    FakeOfflineAudioContext.active = 0;
    FakeOfflineAudioContext.maxActive = 0;
    FakeOfflineAudioContext.log = [];
    FakeOfflineAudioContext.seq = 0;
  }
}

function audioFile(name: string, bytes: number[]): File {
  return new File([new Uint8Array(bytes)], name, { type: 'audio/wav' });
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  libraryItems.value = [];
  uploadStatus.value = null;
  FakeOfflineAudioContext.reset();
  vi.stubGlobal('OfflineAudioContext', FakeOfflineAudioContext);
  // Decoding must never open a real AudioContext (it touches iOS's audio session)
  vi.stubGlobal(
    'AudioContext',
    class {
      constructor() {
        throw new Error('decoding opened a real AudioContext');
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── One file (shared by uploads and backup imports) ──────────────────────────

describe('addAudioFile', () => {
  it('reports the id it stored, the id it skipped as a duplicate, and an unusable file', async () => {
    const bytes = [1, 2, 3];
    const id = computeHash(new Uint8Array(bytes).buffer);
    expect(await addAudioFile(audioFile('a.wav', bytes))).toEqual({ kind: 'imported', id });
    expect(libraryItems.value.map((m) => m.id)).toEqual([id]);
    expect(await addAudioFile(audioFile('copy.wav', bytes))).toEqual({ kind: 'skipped', id });
    const bad = await addAudioFile(audioFile('bad.wav', [0xff]));
    expect(bad).toMatchObject({ kind: 'error' });
    expect(bad.kind === 'error' && bad.error).toContain(
      'bad.wav: not an audio file this browser can play',
    );
    expect(libraryItems.value).toHaveLength(1);
  });

  it('stores every byte although the decode takes its buffer away (decodeAudioData detaches it)', async () => {
    // Browsers detach the ArrayBuffer handed to decodeAudioData (Web Audio API); the pipeline
    // decodes a copy, so the stored Blob still holds the whole file.
    class DetachingContext extends FakeOfflineAudioContext {
      override decodeAudioData(buf: ArrayBuffer): Promise<AudioBuffer> {
        return super.decodeAudioData(structuredClone(buf, { transfer: [buf] }));
      }
    }
    vi.stubGlobal('OfflineAudioContext', DetachingContext);
    const bytes = [1, 2, 3, 4];
    const id = computeHash(new Uint8Array(bytes).buffer);
    expect(await addAudioFile(audioFile('a.wav', bytes))).toEqual({ kind: 'imported', id });
    const stored = (await libGet(id))!;
    expect(Array.from(new Uint8Array(await stored.blob.arrayBuffer()))).toEqual(bytes);
    expect(stored).toMatchObject({ type: 'audio', name: 'a.wav', size: 4 });
  });

  it('says in plain words when a file cannot be read or stored — nothing is listed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const gone = audioFile('gone.wav', [1]);
    vi.spyOn(gone, 'arrayBuffer').mockRejectedValue(new Error('NotFoundError'));
    expect(await addAudioFile(gone)).toEqual({
      kind: 'error',
      error:
        'gone.wav: the file could not be read — check that it still exists, then import it again',
    });
    // Storage refuses the write (full, or blocked)
    (globalThis as Record<string, unknown>).indexedDB = {
      open: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };
    _resetDB();
    expect(await addAudioFile(audioFile('big.wav', [2]))).toEqual({
      kind: 'error',
      error: 'big.wav: could not be stored — free up storage space, then import it again',
    });
    expect(libraryItems.value).toEqual([]);
  });
});

// ── Serial decode (the core iPhone rule) ──────────────────────────────────────

describe('processFilesSerial — memory safety', () => {
  test('never decodes two files at the same time', async () => {
    const files = [1, 2, 3, 4, 5].map((i) => audioFile(`f${i}.wav`, [i, i, i]));
    await processFilesSerial(files);
    expect(FakeOfflineAudioContext.maxActive).toBe(1);
    expect(uploadStatus.value?.imported).toBe(5);
  });

  test('each decode ends before the next one starts, in an offline context of its own', async () => {
    const files = [1, 2, 3].map((i) => audioFile(`f${i}.wav`, [i]));
    await processFilesSerial(files);
    expect(FakeOfflineAudioContext.log).toEqual([
      'decode-start:1',
      'decode-end:1',
      'decode-start:2',
      'decode-end:2',
      'decode-start:3',
      'decode-end:3',
    ]);
    expect(uploadStatus.value?.imported).toBe(3); // no real AudioContext was needed
  });

  test('keeps only metadata in working state — never the audio blob', async () => {
    await processFilesSerial([audioFile('a.wav', [7, 7])]);
    expect(libraryItems.value).toHaveLength(1);
    const meta = libraryItems.value[0] as unknown as Record<string, unknown>;
    expect(Object.keys(meta).sort()).toEqual(
      ['addedAt', 'duration', 'id', 'name', 'peaks', 'size', 'tags', 'type'].sort(),
    );
    expect(meta).not.toHaveProperty('blob');
  });
});

// ── Behavior ─────────────────────────────────────────────────────────────────

describe('processFilesSerial — behavior', () => {
  test('persists entries to IndexedDB with peaks and duration', async () => {
    await processFilesSerial([audioFile('a.wav', [1]), audioFile('b.wav', [2])]);
    const stored = await libGetAllMeta();
    expect(stored.map((m) => m.name).sort()).toEqual(['a.wav', 'b.wav']);
    expect(stored[0].peaks).toHaveLength(PEAK_COUNT); // fine enough for the PAD editor (ADR-0065)
    expect(stored[0].duration).toBe(2.5);
  });

  test('skips duplicates by content, even under another name', async () => {
    await processFilesSerial([audioFile('a.wav', [9, 9]), audioFile('copy-of-a.wav', [9, 9])]);
    expect(uploadStatus.value).toEqual({ imported: 1, skipped: 1, errors: [] });
    expect(FakeOfflineAudioContext.maxActive).toBe(1);
  });

  test('reports a corrupt file and still imports the others', async () => {
    await processFilesSerial([
      audioFile('ok1.wav', [1]),
      audioFile('broken.wav', [0xff]),
      audioFile('ok2.wav', [2]),
    ]);
    const status = uploadStatus.value;
    expect(status?.imported).toBe(2);
    expect(status?.errors).toHaveLength(1);
    expect(status?.errors[0]).toMatch(/^broken\.wav: not an audio file/);
    expect(libraryItems.value.map((m) => m.name)).toEqual(['ok1.wav', 'ok2.wav']);
  });

  test('clears uploadStatus at the start of a run', async () => {
    uploadStatus.value = { imported: 99, skipped: 0, errors: [] };
    const run = processFilesSerial([audioFile('a.wav', [1])]);
    expect(uploadStatus.value).toBeNull();
    await run;
    expect(uploadStatus.value?.imported).toBe(1);
  });
});

// ── Fine peaks for entries stored before ADR-0065 ─────────────────────────────

describe('ensureFinePeaks', () => {
  /** Stores an entry the old way — 30 peaks — and lists it. */
  async function oldEntry(id: string, firstByte: number) {
    const meta = {
      id,
      type: 'audio' as const,
      name: `${id}.wav`,
      size: 2,
      tags: ['keep'],
      addedAt: 1,
      duration: 2.5,
      peaks: new Array(30).fill(0.2),
    };
    await libPut({ ...meta, blob: new Blob([new Uint8Array([firstByte, 1])]) });
    libraryItems.value = [...libraryItems.value, meta];
  }

  it('decodes an old entry once and stores its fine peaks with the entry and in the list', async () => {
    await oldEntry('old', 1);
    const peaks = await ensureFinePeaks('old');
    expect(peaks).toHaveLength(PEAK_COUNT);
    expect((await libGet('old'))!.peaks).toEqual(peaks);
    expect((await libGet('old'))!.tags).toEqual(['keep']); // the rest of the entry is unchanged
    expect(libraryItems.value[0].peaks).toEqual(peaks);
    expect(FakeOfflineAudioContext.log).toEqual(['decode-start:1', 'decode-end:1']);
  });

  it('leaves an entry with fine peaks alone — no decode', async () => {
    await oldEntry('old', 1);
    await ensureFinePeaks('old');
    FakeOfflineAudioContext.reset();
    expect(await ensureFinePeaks('old')).toHaveLength(PEAK_COUNT);
    expect(FakeOfflineAudioContext.log).toEqual([]);
  });

  it('decodes one entry at a time when asked for several at once', async () => {
    await oldEntry('a', 1);
    await oldEntry('b', 2);
    const both = await Promise.all([ensureFinePeaks('a'), ensureFinePeaks('b')]);
    expect(both.map((p) => p?.length)).toEqual([PEAK_COUNT, PEAK_COUNT]);
    expect(FakeOfflineAudioContext.maxActive).toBe(1);
  });

  it('resolves null for an unknown entry and for audio that cannot be decoded — nothing changes', async () => {
    expect(await ensureFinePeaks('missing')).toBeNull();
    await oldEntry('broken', 0xff);
    expect(await ensureFinePeaks('broken')).toBeNull();
    expect((await libGet('broken'))!.peaks).toHaveLength(30);
  });

  it('looks at the entry asked for, not at the first one in the list', async () => {
    await oldEntry('fine', 1);
    await ensureFinePeaks('fine'); // first in the list, with fine peaks now
    await oldEntry('old', 2);
    FakeOfflineAudioContext.reset();
    expect(await ensureFinePeaks('old')).toHaveLength(PEAK_COUNT);
    expect(FakeOfflineAudioContext.log).toEqual(['decode-start:1', 'decode-end:1']);
  });
});

// ── Pure helpers ──────────────────────────────────────────────────────────────

describe('computeHash', () => {
  test('matches the known SHA-256 of "abc"', () => {
    const buf = new TextEncoder().encode('abc').buffer as ArrayBuffer;
    expect(computeHash(buf)).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('computePeaks', () => {
  function buffer(samples: number[]): AudioBuffer {
    const data = Float32Array.from(samples);
    return { getChannelData: () => data } as unknown as AudioBuffer;
  }

  test('returns N peaks = max |sample| per window, rounded to 3 decimals', () => {
    const peaks = computePeaks(buffer([0.1, -0.9, 0.2, 0.33333, -0.5, 0.25]), 3);
    expect(peaks).toEqual([0.9, 0.333, 0.5]);
  });

  test('pads with 0 when the buffer is shorter than N', () => {
    expect(computePeaks(buffer([0.5]), 3)).toEqual([0.5, 0, 0]);
  });
});

describe('formatting helpers', () => {
  test('formatBytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  test('formatDuration', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65.9)).toBe('1:05');
  });

  test('totalLibraryBytes', () => {
    const items = [{ size: 100 }, { size: 250 }] as Parameters<typeof totalLibraryBytes>[0];
    expect(totalLibraryBytes(items)).toBe(350);
  });
});
