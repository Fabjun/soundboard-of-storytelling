// ─────────────────────────────────────────────────────────────────────────────
// backupReader — reads V1 and V3 backups piece by piece (D6, ADR-0061)
// Edge-case checklist: nothing / one / many entries, V1 vs V3 header, gzip, chunks split anywhere
// (also inside strings and escapes), invalid input, entries handled one at a time.
// Property: for random backups and random chunk boundaries the reader hands over exactly what
// JSON.parse would see.
// ─────────────────────────────────────────────────────────────────────────────

import { fc, test as propTest } from '@fast-check/vitest';
import { BackupError, readBackup, V3_BACKUP_FORMAT } from '../../src/lib/backupReader';

/** A Blob whose stream() delivers the bytes in the given chunk sizes (last chunk: the rest). */
class ChunkedBlob extends Blob {
  private readonly content: Uint8Array<ArrayBuffer>;
  private readonly sizes: number[];
  /** How many chunks stream() has delivered — to prove reading stops early. */
  readonly stats = { pulls: 0 };
  constructor(content: Uint8Array<ArrayBuffer>, sizes: number[]) {
    super([content]);
    this.content = content;
    this.sizes = sizes;
  }
  override stream(): ReadableStream<Uint8Array<ArrayBuffer>> {
    const { content: bytes, sizes, stats } = this;
    let pos = 0;
    let i = 0;
    return new ReadableStream({
      pull(controller) {
        if (pos >= bytes.length) return controller.close();
        const size = Math.max(1, sizes[i++] ?? bytes.length);
        stats.pulls++;
        controller.enqueue(bytes.slice(pos, pos + size));
        pos += size;
      },
    });
  }
}

const encode = (doc: unknown) => new TextEncoder().encode(JSON.stringify(doc));

async function gzip(bytes: Uint8Array<ArrayBuffer>): Promise<Blob> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).blob();
}

async function readAll(file: Blob) {
  const boards: unknown[][] = [];
  const entries: Record<string, unknown>[] = [];
  const header = await readBackup(file, {
    onBoards: (b) => boards.push(b),
    onLibraryEntry: (e) => {
      entries.push(e);
    },
  });
  return { header, boards, entries };
}

const v3Doc = {
  format: V3_BACKUP_FORMAT,
  formatVersion: 1,
  appVersion: '3.0.102',
  exported: '2026-10-02T00:00:00.000Z',
  boards: [{ id: 'b', name: 'Board' }],
  library: [
    { id: 'h1', name: 'one.mp3', data: 'AAAA' },
    { id: 'h2', name: 'two "quoted" \\ ü.mp3', data: 'BBBB' },
  ],
};

describe('readBackup', () => {
  it('reads a V3 file: header, boards once, entries in order', async () => {
    const { header, boards, entries } = await readAll(new Blob([encode(v3Doc)]));
    expect(header).toEqual({ kind: 'v3', formatVersion: 1 });
    expect(boards).toEqual([v3Doc.boards]);
    expect(entries).toEqual(v3Doc.library);
  });

  it('reads a V1 file (version number, settings ignored, boards before the library)', async () => {
    const v1 = {
      version: 179,
      exported: 'x',
      settings: { a: '1' },
      boards: [],
      library: [{ hash: 'h' }],
    };
    const { header, boards, entries } = await readAll(new Blob([encode(v1)]));
    expect(header).toEqual({ kind: 'v1', version: 179 });
    expect(boards).toEqual([[]]);
    expect(entries).toEqual([{ hash: 'h' }]);
  });

  it('reads a gzipped file the same way (detected by its bytes, not its name)', async () => {
    const { header, entries } = await readAll(await gzip(encode(v3Doc)));
    expect(header.kind).toBe('v3');
    expect(entries).toEqual(v3Doc.library);
  });

  it('a file with no library entries still yields its boards', async () => {
    const { entries, boards } = await readAll(new Blob([encode({ ...v3Doc, library: [] })]));
    expect(entries).toEqual([]);
    expect(boards).toHaveLength(1);
  });

  it('hands entries over one at a time and waits for each', async () => {
    let active = 0;
    let maxActive = 0;
    const seen: unknown[] = [];
    // One-byte chunks: several entries can never be pending together, but the await matters
    const file = new ChunkedBlob(encode(v3Doc), Array(10_000).fill(7));
    await readBackup(file, {
      onLibraryEntry: async (e) => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 1));
        seen.push(e.id);
        active--;
      },
    });
    expect(maxActive).toBe(1);
    expect(seen).toEqual(['h1', 'h2']);
  });

  it('rejects invalid JSON, a cut-off file and a broken gzip stream as invalid-json', async () => {
    const bytes = encode(v3Doc);
    for (const file of [
      new Blob(['{"boards": [}']),
      new Blob([bytes.slice(0, bytes.length - 5)]),
      new Blob([new Uint8Array([0x1f, 0x8b, 1, 2, 3, 4, 5])]),
    ]) {
      await expect(readBackup(file, {})).rejects.toEqual(new BackupError('invalid-json'));
    }
  });

  it('stops reading a broken file at the error instead of reading it to the end', async () => {
    const bytes = new TextEncoder().encode('{"boards": [}' + ' '.repeat(1000));
    const file = new ChunkedBlob(bytes, Array(2000).fill(1));
    await expect(readBackup(file, {})).rejects.toMatchObject({ kind: 'invalid-json' });
    expect(file.stats.pulls).toBeLessThan(50);
  });

  it('rejects JSON that is not a backup', async () => {
    await expect(readBackup(new Blob(['{"hello": 1}']), {})).rejects.toMatchObject({
      kind: 'not-a-backup',
    });
  });

  it('refuses a gzipped file where the browser cannot unpack it (iOS < 16.4)', async () => {
    vi.stubGlobal('DecompressionStream', undefined);
    try {
      await expect(readBackup(await gzip(encode(v3Doc)), {})).rejects.toMatchObject({
        kind: 'gzip-unsupported',
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('readBackup — property', () => {
  const entry = fc.record({
    id: fc.string({ unit: fc.constantFrom(...'0123456789abcdef'), minLength: 1, maxLength: 8 }),
    name: fc.string({ unit: 'binary', maxLength: 12 }), // escapes, quotes, non-ASCII
    data: fc.base64String({ maxLength: 40 }),
  });
  const doc = fc.record({
    boards: fc.array(fc.record({ id: fc.string(), name: fc.string({ unit: 'binary' }) }), {
      maxLength: 3,
    }),
    library: fc.array(entry, { maxLength: 6 }),
  });

  propTest.prop([doc, fc.array(fc.integer({ min: 1, max: 9 }), { maxLength: 400 })])(
    'any split of any backup yields exactly the parsed boards and entries',
    async (d, sizes) => {
      const { boards, entries } = await readAll(new ChunkedBlob(encode(d), sizes));
      const expected = JSON.parse(JSON.stringify(d));
      expect(boards).toEqual([expected.boards]);
      expect(entries).toEqual(expected.library);
    },
  );
});
