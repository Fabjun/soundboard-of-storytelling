/**
 * @fileoverview backupImport — the two passes over a V1 / V3 backup (D2, D5, import rules; ADR-0061)
 * Real IndexedDB semantics (fake-indexeddb) and a fake AudioContext (decode fails for files whose
 * first byte is 0xff). Synthetic files only — the owner's real backup is never committed.
 * Import rules checked: nothing existing changes, audio already present is skipped, boards are
 * always new (new ids, name suffix), audio first and boards last (an abort adds no board).
 */

import { IDBFactory } from 'fake-indexeddb';
import type { Board, ComboPad, LoopPad, SinglePad } from '../../src/types';
import { _resetDB, boardGetAll, libGet, libGetAllMeta } from '../../src/db/idb';
import { boards, libraryItems } from '../../src/state/store';
import { entryTags, planImport, runImport } from '../../src/lib/backupImport';
import { V3_BACKUP_FORMAT } from '../../src/lib/backupReader';
import { computeHash } from '../../src/lib/upload';
import { boardProblems } from '../../src/lib/boardModel';

class FakeOfflineAudioContext {
  decodeAudioData(buf: ArrayBuffer): Promise<AudioBuffer> {
    if (new Uint8Array(buf)[0] === 0xff) return Promise.reject(new Error('corrupt'));
    const data = new Float32Array(100).fill(0.5);
    return Promise.resolve({ duration: 1, getChannelData: () => data } as unknown as AudioBuffer);
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  libraryItems.value = [];
  boards.value = [];
  vi.stubGlobal('OfflineAudioContext', FakeOfflineAudioContext);
});
afterEach(() => vi.unstubAllGlobals());

const A = new Uint8Array([1, 2, 3]);
const B = new Uint8Array([4, 5, 6, 7]);
const BAD = new Uint8Array([0xff, 1]);
const hash = (b: Uint8Array) => computeHash(b.slice().buffer);
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const file = (doc: unknown) => new Blob([JSON.stringify(doc)]);

const v1Entry = (bytes: Uint8Array, name: string) => ({
  hash: hash(bytes),
  name,
  type: 'audio/wav',
  data: b64(bytes),
});

const v1Backup = () => ({
  version: 179,
  settings: { theme: 'x' },
  boards: [
    {
      id: 'board_1',
      name: 'Night',
      pads: [
        { name: 'Owl', mode: 'once', files: [hash(A)], key: 'Numpad1' },
        { name: 'Rain', mode: 'loop', files: [hash(B)] },
        { name: 'Day', mode: 'combo', steps: [{ pads: [0, 1], dur: 2 }] },
      ],
    },
  ],
  library: [v1Entry(A, 'owl.wav'), v1Entry(B, 'rain.wav'), { hash: 'tpl', type: 'pad', name: 'T' }],
});

describe('planImport', () => {
  it('summarizes a V1 file: boards, pads, audio (new / present), other entries', async () => {
    await runImport(file({ ...v1Backup(), boards: [] }), await planImport(file(v1Backup())));
    // A is now in the library — a second plan sees it as present
    const plan = await planImport(file(v1Backup()));
    expect(plan).toMatchObject({ kind: 'v1', pads: 3, audio: 2, audioPresent: 2, otherEntries: 1 });
    expect(plan.boards).toHaveLength(1);
  });
});

describe('runImport — V1', () => {
  it('imports the audio, then one board with one deck whose pads play the imported files', async () => {
    const f = file(v1Backup());
    const result = await runImport(f, await planImport(f));
    expect(result).toMatchObject({
      audioAdded: 2,
      audioSkipped: 0,
      audioFailed: [],
      boardsAdded: 1,
    });
    expect((await libGetAllMeta()).map((m) => m.name).sort()).toEqual(['owl.wav', 'rain.wav']);

    const [board] = await boardGetAll();
    expect(board.name).toBe('Night');
    expect(boardProblems(board)).toEqual([]);
    const [owl, rain, day] = board.pads as [SinglePad, LoopPad, ComboPad];
    expect(owl.files).toEqual([{ hash: hash(A) }]);
    expect(rain).toMatchObject({ type: 'loop', files: [{ hash: hash(B) }] });
    expect(day.steps).toEqual([{ padIds: [owl.id, rain.id], duration: 2 }]);
    expect(board.decks[0].placements[0]).toMatchObject({ padId: owl.id, hotkey: 'Numpad1' });
    expect(boards.value).toHaveLength(1); // shown, not only stored
  });

  it('importing the same file again skips the audio and adds a second board with new ids', async () => {
    const f = file(v1Backup());
    await runImport(f, await planImport(f));
    const again = await runImport(f, await planImport(f));
    expect(again).toMatchObject({ audioAdded: 0, audioSkipped: 2, boardsAdded: 1 });
    const all = await boardGetAll();
    expect(all.map((b) => b.name).sort()).toEqual(['Night', 'Night (2)']);
    const ids = all.flatMap((b: Board) => [b.id, ...b.pads.map((p) => p.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(await libGetAllMeta()).toHaveLength(2);
  });

  it('audio that cannot be decoded is reported; the pad keeps its other files', async () => {
    const doc = v1Backup();
    doc.library = [v1Entry(A, 'owl.wav'), v1Entry(BAD, 'broken.wav')];
    doc.boards[0].pads = [{ name: 'Owl', mode: 'once', files: [hash(A), hash(BAD)] }];
    const f = file(doc);
    const result = await runImport(f, await planImport(f));
    expect(result.audioFailed).toEqual([expect.stringContaining('broken.wav: decode failed')]);
    expect(result.notes.missingFiles).toBe(1);
    const [board] = await boardGetAll();
    expect((board.pads[0] as SinglePad).files).toEqual([{ hash: hash(A) }]);
  });

  it('an entry without audio data or with broken base64 is reported, not fatal', async () => {
    const doc = v1Backup();
    doc.library = [
      { hash: 'h1', name: 'empty.wav', type: 'audio/wav' } as ReturnType<typeof v1Entry>,
      { hash: 'h2', name: 'garbled.wav', type: 'audio/wav', data: '%%%' },
    ];
    const f = file(doc);
    const result = await runImport(f, await planImport(f));
    expect(result.audioFailed).toEqual([
      'empty.wav: the backup holds no audio for this file',
      'garbled.wav: the audio data in the backup is damaged',
    ]);
    expect(result.audioAdded).toBe(0); // nothing half-decoded slips in
    expect(result.boardsAdded).toBe(1);
  });

  it('a file that breaks off adds no board — the audio read so far stays in the library', async () => {
    const text = JSON.stringify(v1Backup());
    const cut = new Blob([text.slice(0, text.indexOf('"rain.wav"') + 5)]);
    const plan = await planImport(file(v1Backup()));
    await expect(runImport(cut, plan)).rejects.toMatchObject({ kind: 'damaged' });
    expect(await boardGetAll()).toEqual([]);
    expect((await libGetAllMeta()).map((m) => m.name)).toEqual(['owl.wav']);
  });
});

describe('runImport — V3', () => {
  const v3Board = (): Board => ({
    id: 'b',
    name: 'Night',
    themeId: 'hearth',
    pads: [
      {
        id: 'p',
        type: 'single',
        name: 'Owl',
        volume: 80,
        fadeIn: 0,
        fadeOut: 0,
        files: [{ hash: hash(A), trimStart: 0.5 }],
        order: 'sequential',
      },
      {
        id: 'c',
        type: 'combo',
        name: 'Day',
        volume: 80,
        fadeIn: 0,
        fadeOut: 0,
        steps: [{ padIds: ['p'] }],
      },
    ],
    decks: [
      {
        id: 'd',
        name: 'Deck 1',
        order: 0,
        gridConfig: { cols: 4, rows: 4, gap: 8, padSize: 88 },
        placements: [{ padId: 'p', position: { col: 0, row: 0 }, hotkey: 'K1' }],
      },
    ],
    quickAccess: [{ padId: 'c' }],
  });
  const v3Backup = (boardsInFile: unknown[]) => ({
    format: V3_BACKUP_FORMAT,
    formatVersion: 1,
    boards: boardsInFile,
    library: [{ id: hash(A), name: 'owl.wav', type: 'audio', data: b64(A) }],
  });

  it('adds the board with new ids and the same content; a taken name gets a suffix', async () => {
    boards.value = [{ ...v3Board(), id: 'existing' }]; // a board "Night" is already there
    const f = file(v3Backup([v3Board()]));
    const plan = await planImport(f);
    expect(plan).toMatchObject({ kind: 'v3', pads: 2, audio: 1 });
    const result = await runImport(f, plan);
    expect(result).toMatchObject({ audioAdded: 1, boardsAdded: 1, boardsSkipped: 0 });
    const [stored] = await boardGetAll();
    expect(stored.name).toBe('Night (2)');
    expect(stored.id).not.toBe('b');
    const [owl, day] = stored.pads as [SinglePad, ComboPad];
    expect(owl).toMatchObject({ name: 'Owl', files: [{ hash: hash(A), trimStart: 0.5 }] });
    expect(owl.id).not.toBe('p');
    expect(day.steps[0].padIds).toEqual([owl.id]);
    expect(stored.decks[0].placements[0]).toMatchObject({ padId: owl.id, hotkey: 'K1' });
    expect(stored.quickAccess).toEqual([{ padId: day.id }]);
  });

  it('skips what is not a valid board and counts it', async () => {
    const broken = {
      ...v3Board(),
      decks: [
        { ...v3Board().decks[0], placements: [{ padId: 'ghost', position: { col: 0, row: 0 } }] },
      ],
    };
    const f = file(v3Backup([broken, { name: 'no pads' }, 'x']));
    const result = await runImport(f, await planImport(f));
    expect(result).toMatchObject({ boardsAdded: 0, boardsSkipped: 3 });
    expect(await boardGetAll()).toEqual([]);
  });

  it('imports a backup made before ADR-0068 — the pad-wide trim moves to the file', async () => {
    const old = v3Board();
    const [owl] = old.pads;
    // The stored shape before ADR-0068: hashes, one trim for the whole pad
    const legacyOwl = { ...owl, files: [hash(A)], trimStart: 1.5, trimEnd: 3 };
    const f = file(v3Backup([{ ...old, pads: [legacyOwl, old.pads[1]] }]));
    const result = await runImport(f, await planImport(f));
    expect(result).toMatchObject({ boardsAdded: 1, boardsSkipped: 0 });
    const [stored] = await boardGetAll();
    expect(stored.pads[0]).toMatchObject({
      files: [{ hash: hash(A), trimStart: 1.5, trimEnd: 3 }],
    });
    expect(stored.pads[0]).not.toHaveProperty('trimStart');
  });
});

describe('library tags (owner decision B9)', () => {
  it('restores V3 tags and turns a V1 folder into a tag', async () => {
    const doc = {
      version: 1,
      boards: [],
      library: [
        { ...v1Entry(A, 'owl.wav'), folder: 'Forest' },
        { id: hash(B), name: 'rain.wav', tags: ['Weather', 'Night'], data: b64(B) },
      ],
    };
    await runImport(file(doc), await planImport(file(doc)));
    const tags = Object.fromEntries((await libGetAllMeta()).map((m) => [m.name, m.tags]));
    expect(tags).toEqual({ 'owl.wav': ['Forest'], 'rain.wav': ['Weather', 'Night'] });
  });

  it('audio already in the library keeps its own tags (the import changes nothing existing)', async () => {
    const first = { version: 1, library: [{ ...v1Entry(A, 'owl.wav'), folder: 'Forest' }] };
    await runImport(file(first), await planImport(file(first)));
    const again = { version: 1, library: [{ ...v1Entry(A, 'owl.wav'), folder: 'Elsewhere' }] };
    await runImport(file(again), await planImport(file(again)));
    expect((await libGetAllMeta()).map((m) => m.tags)).toEqual([['Forest']]);
  });

  it('entryTags: tags win over a folder, non-strings are dropped, nothing → no tags', () => {
    expect(entryTags({ tags: ['a', 3, null, 'b'], folder: 'f' })).toEqual(['a', 'b']);
    expect(entryTags({ tags: [], folder: 'f' })).toEqual([]);
    expect(entryTags({ folder: 'f' })).toEqual(['f']);
    expect(entryTags({ folder: '' })).toEqual([]);
    expect(entryTags({ folder: 7, tags: 'x' })).toEqual([]);
    expect(entryTags({})).toEqual([]);
  });
});

// Cases added for surviving mutants (local mutation run 2026-10-02, backupImport 64.5 %).
describe('backup import — entry types, hashes and progress', () => {
  it('counts entries by type: audio (incl. no type, "audio", audio/*), others not imported', async () => {
    const doc = {
      version: 1,
      boards: [{ name: 'B', pads: [{ mode: 'once' }, null, 'x'] }],
      library: [
        { hash: 'h1', type: 'audio/mpeg' },
        { hash: 'h2', type: '' },
        { hash: 'h3' },
        { hash: 'h4', type: 'audio' },
        { hash: 'h5', type: 'image/png' },
        { hash: 'h6', type: 'pad' },
        { hash: '', type: 'audio/wav' },
        { hash: 7, type: 'audio/wav' },
      ],
    };
    const plan = await planImport(file(doc));
    expect(plan).toMatchObject({ pads: 1, audio: 6, audioPresent: 0, otherEntries: 2 });
    // One entry per file — totals alone could hide two misclassifications that cancel out
    const kinds: [unknown, 'audio' | 'other'][] = [
      ['audio/mpeg', 'audio'],
      ['', 'audio'],
      [undefined, 'audio'],
      ['audio', 'audio'],
      ['image/png', 'other'],
      ['pad', 'other'],
    ];
    for (const [type, expected] of kinds) {
      const p = await planImport(file({ version: 1, library: [{ hash: 'h', type }] }));
      expect([type, p.audio === 1 ? 'audio' : 'other']).toEqual([type, expected]);
    }
    const noBoards = await planImport(file({ version: 1, library: [{ hash: 'h1' }] }));
    expect(noBoards.boards).toEqual([]);
  });

  it('a stated hash that does not match the bytes: pads still point at the stored audio', async () => {
    const doc = v1Backup();
    doc.library = [{ ...v1Entry(A, 'owl.wav'), hash: 'stale-hash' }];
    doc.boards[0].pads = [{ name: 'Owl', mode: 'once', files: ['stale-hash'] }];
    const f = file(doc);
    await runImport(f, await planImport(f));
    const [board] = await boardGetAll();
    expect((board.pads[0] as SinglePad).files).toEqual([{ hash: hash(A) }]);
  });

  it('the same bytes twice under two hashes: stored once, both references resolve', async () => {
    const doc = v1Backup();
    doc.library = [v1Entry(A, 'owl.wav'), { ...v1Entry(A, 'owl-copy.wav'), hash: 'other' }];
    doc.boards[0].pads = [{ name: 'Owl', mode: 'once', files: [hash(A), 'other'] }];
    const f = file(doc);
    const result = await runImport(f, await planImport(f));
    expect(result).toMatchObject({ audioAdded: 1, audioSkipped: 1 });
    const [board] = await boardGetAll();
    expect((board.pads[0] as SinglePad).files).toEqual([{ hash: hash(A) }, { hash: hash(A) }]);
  });

  it('a pad may point at audio that was in the library before (not in the file)', async () => {
    const first = v1Backup();
    first.boards = [];
    first.library = [v1Entry(B, 'rain.wav')];
    await runImport(file(first), await planImport(file(first)));
    const doc = v1Backup();
    doc.library = [];
    doc.boards[0].pads = [{ name: 'Rain', mode: 'loop', files: [hash(B)] }];
    const result = await runImport(file(doc), await planImport(file(doc)));
    const [board] = await boardGetAll();
    expect((board.pads[0] as LoopPad).files).toEqual([{ hash: hash(B) }]);
    expect(result.notes.missingFiles).toBe(0);
  });

  it('reports progress per audio entry, keeps the audio type, names nameless audio', async () => {
    const doc = v1Backup();
    doc.library = [{ ...v1Entry(A, ''), type: 'audio/ogg' }, v1Entry(B, 'rain.wav')];
    const progress: number[] = [];
    await runImport(file(doc), await planImport(file(doc)), (n) => progress.push(n));
    expect(progress).toEqual([1, 2]);
    const names = (await libGetAllMeta()).map((m) => m.name).sort();
    expect(names).toEqual(['imported audio', 'rain.wav']);
    expect((await libGet(hash(A)))!.blob.type).toBe('audio/ogg');
  });

  it('V3: files missing from the file and the library are left out and counted', async () => {
    const pad = {
      id: 'p',
      type: 'loop',
      name: 'Rain',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      files: [hash(A), 'nowhere', hash(A)],
      order: 'shuffle',
    };
    const combo = {
      id: 'c',
      type: 'combo',
      name: 'Day',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      steps: [],
    };
    const board = {
      id: 'b',
      name: 'N',
      themeId: 'hearth',
      pads: [pad, combo],
      decks: [],
      quickAccess: [],
    };
    const doc = {
      format: V3_BACKUP_FORMAT,
      formatVersion: 1,
      boards: [board],
      library: [{ id: hash(A), name: 'owl.wav', data: b64(A) }],
    };
    const result = await runImport(file(doc), await planImport(file(doc)));
    expect(result.notes.missingFiles).toBe(1);
    const [stored] = await boardGetAll();
    expect(stored.pads[0]).toMatchObject({
      type: 'loop',
      files: [{ hash: hash(A) }, { hash: hash(A) }],
      order: 'shuffle',
    });
    expect(stored.pads[1]).toMatchObject({ type: 'combo', steps: [] });
  });
});

describe('backup import — skipping and naming', () => {
  it('audio already in the library is skipped without decoding its data (even broken data)', async () => {
    const first = { version: 1, library: [v1Entry(A, 'owl.wav')] };
    await runImport(file(first), await planImport(file(first)));
    const doc = { version: 1, boards: [], library: [{ ...v1Entry(A, 'owl.wav'), data: '%%%' }] };
    const result = await runImport(file(doc), await planImport(file(doc)));
    expect(result).toMatchObject({ audioSkipped: 1, audioAdded: 0, audioFailed: [] });
  });

  it('a name that is not a string becomes "imported audio"; a type that is not audio/* is not kept', async () => {
    const doc = {
      format: V3_BACKUP_FORMAT,
      formatVersion: 1,
      boards: [],
      library: [{ id: hash(B), name: 42, type: 'audio', data: b64(B) }],
    };
    await runImport(file(doc), await planImport(file(doc)));
    const [meta] = await libGetAllMeta();
    expect(meta.name).toBe('imported audio');
    expect((await libGet(hash(B)))!.blob.type).toBe('');
  });
});
