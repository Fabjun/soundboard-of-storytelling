// ─────────────────────────────────────────────────────────────────────────────
// backupExport — everything in one file (D1); the round trip export → import into an empty app
// restores boards and audio (D2). fake-indexeddb + a fake decoder; synthetic data.
// ─────────────────────────────────────────────────────────────────────────────

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB, boardGetAll, libGet, libGetAllMeta } from '../../src/db/idb';
import { boards, libraryItems } from '../../src/state/store';
import { createBoard } from '../../src/state/boardWrites';
import { addAudioFile, computeHash } from '../../src/lib/upload';
import {
  BACKUP_REMINDER_DAYS,
  backupFileName,
  buildBackup,
  bytesToBase64,
  describeBackupAge,
} from '../../src/lib/backupExport';
import { base64ToBytes, planImport, runImport } from '../../src/lib/backupImport';
import { readBackup } from '../../src/lib/backupReader';
import { newPad } from '../../src/lib/padUtils';
import type { Board } from '../../src/types';

class FakeAudioContext {
  decodeAudioData(): Promise<AudioBuffer> {
    const data = new Float32Array(100).fill(0.5);
    return Promise.resolve({ duration: 1, getChannelData: () => data } as unknown as AudioBuffer);
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

function freshApp() {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  libraryItems.value = [];
  boards.value = [];
}

beforeEach(() => {
  freshApp();
  vi.stubGlobal('AudioContext', FakeAudioContext);
});
afterEach(() => vi.unstubAllGlobals());

const A = new Uint8Array([1, 2, 3, 4]);
const B = new Uint8Array([9, 8, 7]);
const hash = (b: Uint8Array) => computeHash(b.slice().buffer);

/** One board with a deck, a Single on A, a Loop on A + B and a combo; both files in the library. */
async function seed(): Promise<Board> {
  await addAudioFile(new File([A], 'owl.mp3', { type: 'audio/mpeg' }));
  await addAudioFile(new File([B], 'rain.wav', { type: 'audio/wav' }));
  const owl = newPad('p1', 'single', 'Owl', [hash(A)]);
  const rain = { ...newPad('p2', 'loop', 'Rain', [hash(A), hash(B)]), order: 'shuffle' as const };
  const day = {
    ...newPad('p3', 'combo', 'Day'),
    type: 'combo' as const,
    steps: [{ padIds: ['p1', 'p2'] }],
  };
  const board: Board = {
    id: 'b1',
    name: 'Night',
    themeId: 'hearth',
    pads: [owl, rain, day],
    decks: [
      {
        id: 'd1',
        name: 'Deck 1',
        order: 0,
        gridConfig: { cols: 4, rows: 4, gap: 8, padSize: 'md' },
        placements: [{ padId: 'p1', position: { col: 0, row: 0 }, hotkey: 'K1' }],
      },
    ],
    quickAccess: [{ padId: 'p3' }],
  };
  await createBoard(board);
  return board;
}

describe('buildBackup', () => {
  it('round trip: export, then import into an empty app restores boards and audio', async () => {
    const original = await seed();
    const progress: string[] = [];
    const { blob, gzip } = await buildBackup((d, t) => progress.push(`${d}/${t}`));
    expect(gzip).toBe(true);
    expect(blob.type).toBe('application/gzip'); // the share sheet / download name the type
    expect(progress).toEqual(['1/2', '2/2']);

    freshApp();
    const plan = await planImport(blob);
    expect(plan).toMatchObject({ kind: 'v3', pads: 3, audio: 2, audioPresent: 0 });
    const result = await runImport(blob, plan);
    expect(result).toMatchObject({ audioAdded: 2, boardsAdded: 1, audioFailed: [] });

    // Audio: same content (ids are hashes), names and types kept
    const metas = await libGetAllMeta();
    expect(metas.map((m) => [m.id, m.name]).sort()).toEqual(
      [
        [hash(A), 'owl.mp3'],
        [hash(B), 'rain.wav'],
      ].sort(),
    );
    expect((await libGet(hash(A)))!.blob.type).toBe('audio/mpeg');
    expect(Array.from(new Uint8Array(await (await libGet(hash(B)))!.blob.arrayBuffer()))).toEqual([
      9, 8, 7,
    ]);

    // Board: same content, new ids
    const [restored] = await boardGetAll();
    const strip = (b: Board) => ({
      name: b.name,
      pads: b.pads.map(({ id: _id, ...p }) =>
        p.type === 'combo' ? { ...p, steps: p.steps.length } : p,
      ),
      decks: b.decks.map((d) => ({
        name: d.name,
        placements: d.placements.map(({ padId: _p, ...pl }) => pl),
      })),
      quickAccess: b.quickAccess.length,
    });
    expect(strip(restored)).toEqual(strip(original));
    expect(restored.id).not.toBe(original.id);
  });

  it('without CompressionStream the backup is plain JSON in the V3 format', async () => {
    await seed();
    vi.stubGlobal('CompressionStream', undefined);
    const { blob, gzip } = await buildBackup();
    expect(gzip).toBe(false);
    expect(blob.type).toBe('application/json');
    const text = await blob.text();
    expect(text.startsWith('{"format":"sos-v3-backup","formatVersion":1,')).toBe(true);
    const entries: Record<string, unknown>[] = [];
    await readBackup(blob, { onLibraryEntry: (e) => void entries.push(e) });
    expect(entries.map((e) => e.name).sort()).toEqual(['owl.mp3', 'rain.wav']);
    expect(Object.keys(entries[0]).sort()).toEqual([
      'addedAt',
      'data',
      'id',
      'name',
      'tags',
      'type',
    ]);
  });

  it('an empty app exports a valid backup with no boards and no audio', async () => {
    const { blob } = await buildBackup();
    const plan = await planImport(blob);
    expect(plan).toMatchObject({ kind: 'v3', boards: [], audio: 0 });
  });
});

describe('bytesToBase64', () => {
  it('round-trips with base64ToBytes, also across its 32 KiB slices and for nothing', () => {
    const big = new Uint8Array(100_000).map((_, i) => (i * 7) % 256);
    expect(Array.from(base64ToBytes(bytesToBase64(big)))).toEqual(Array.from(big));
    expect(bytesToBase64(new Uint8Array())).toBe('');
    expect(bytesToBase64(new Uint8Array([104, 105]))).toBe(btoa('hi'));
  });
});

describe('backupFileName', () => {
  it('uses the local date, padded, and .gz only when compressed', () => {
    expect(backupFileName(new Date(2026, 0, 5), true)).toBe('soundboard-backup-2026-01-05.json.gz');
    expect(backupFileName(new Date(2026, 10, 25), false)).toBe('soundboard-backup-2026-11-25.json');
  });
});

describe('describeBackupAge (D3)', () => {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.UTC(2026, 9, 2, 12);

  it('no backup yet → remind', () => {
    expect(describeBackupAge(null, now)).toEqual({ text: 'No backup yet', stale: true });
  });

  it('counts whole days; today, 1 day, N days', () => {
    expect(describeBackupAge(now - 1000, now).text).toBe('Last backup: today');
    expect(describeBackupAge(now - day, now).text).toBe('Last backup: 1 day ago');
    expect(describeBackupAge(now - 3 * day - 5, now).text).toBe('Last backup: 3 days ago');
    expect(describeBackupAge(now + day, now).text).toBe('Last backup: today'); // clock moved back
  });

  it(`reminds only after more than ${BACKUP_REMINDER_DAYS} days`, () => {
    expect(describeBackupAge(now - BACKUP_REMINDER_DAYS * day, now).stale).toBe(false);
    expect(describeBackupAge(now - (BACKUP_REMINDER_DAYS + 1) * day, now).stale).toBe(true);
  });
});
