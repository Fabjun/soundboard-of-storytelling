// ─────────────────────────────────────────────────────────────────────────────
// upload — unit tests for the serial upload pipeline (iOS memory rules)
//
// CLAUDE.md §iPhone rules: never decode in parallel; release decoded buffers;
// never keep raw audio in working state. processFilesSerial is tested against a
// fake AudioContext that records how many decodes run at the same time and in
// which order decodes and context closes happen. IDB is fake-indexeddb.
// ─────────────────────────────────────────────────────────────────────────────

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB, libGetAllMeta } from '../../src/db/idb';
import { libraryItems, uploadStatus } from '../../src/state/store';
import {
  computeHash,
  computePeaks,
  formatBytes,
  formatDuration,
  processFilesSerial,
  totalLibraryBytes,
} from '../../src/lib/upload';

// ── Fake AudioContext ─────────────────────────────────────────────────────────

type Event = string;

class FakeAudioContext {
  static active = 0;
  static maxActive = 0;
  static log: Event[] = [];
  static seq = 0;
  private readonly n: number;

  constructor() {
    this.n = ++FakeAudioContext.seq;
  }

  decodeAudioData(buf: ArrayBuffer): Promise<AudioBuffer> {
    const n = this.n;
    FakeAudioContext.active++;
    FakeAudioContext.maxActive = Math.max(FakeAudioContext.maxActive, FakeAudioContext.active);
    FakeAudioContext.log.push(`decode-start:${n}`);
    const first = new Uint8Array(buf)[0];
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        FakeAudioContext.active--;
        FakeAudioContext.log.push(`decode-end:${n}`);
        if (first === 0xff) {
          reject(new Error('corrupt'));
          return;
        }
        const data = new Float32Array(300).map((_, i) => (i % 10 === 0 ? 0.5 : 0.1));
        resolve({ duration: 2.5, getChannelData: () => data } as unknown as AudioBuffer);
      }, 5);
    });
  }

  close(): Promise<void> {
    FakeAudioContext.log.push(`close:${this.n}`);
    return Promise.resolve();
  }

  static reset(): void {
    FakeAudioContext.active = 0;
    FakeAudioContext.maxActive = 0;
    FakeAudioContext.log = [];
    FakeAudioContext.seq = 0;
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
  FakeAudioContext.reset();
  vi.stubGlobal('AudioContext', FakeAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Serial decode (the core iPhone rule) ──────────────────────────────────────

describe('processFilesSerial — memory safety', () => {
  test('never decodes two files at the same time', async () => {
    const files = [1, 2, 3, 4, 5].map((i) => audioFile(`f${i}.wav`, [i, i, i]));
    await processFilesSerial(files);
    expect(FakeAudioContext.maxActive).toBe(1);
    expect(uploadStatus.value?.imported).toBe(5);
  });

  test('closes each AudioContext before the next decode starts', async () => {
    const files = [1, 2, 3].map((i) => audioFile(`f${i}.wav`, [i]));
    await processFilesSerial(files);
    expect(FakeAudioContext.log).toEqual([
      'decode-start:1',
      'decode-end:1',
      'close:1',
      'decode-start:2',
      'decode-end:2',
      'close:2',
      'decode-start:3',
      'decode-end:3',
      'close:3',
    ]);
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

// ── Behaviour ─────────────────────────────────────────────────────────────────

describe('processFilesSerial — behaviour', () => {
  test('persists entries to IndexedDB with peaks and duration', async () => {
    await processFilesSerial([audioFile('a.wav', [1]), audioFile('b.wav', [2])]);
    const stored = await libGetAllMeta();
    expect(stored.map((m) => m.name).sort()).toEqual(['a.wav', 'b.wav']);
    expect(stored[0].peaks).toHaveLength(30);
    expect(stored[0].duration).toBe(2.5);
  });

  test('skips duplicates by content, even under another name', async () => {
    await processFilesSerial([audioFile('a.wav', [9, 9]), audioFile('copy-of-a.wav', [9, 9])]);
    expect(uploadStatus.value).toEqual({ imported: 1, skipped: 1, errors: [] });
    expect(FakeAudioContext.maxActive).toBe(1);
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
    expect(status?.errors[0]).toMatch(/^broken\.wav: decode failed/);
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
