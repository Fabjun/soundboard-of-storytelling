/**
 * @fileoverview zipArchive — the backup container, read after PKWARE APPNOTE 6.3.10
 * (docs/architecture/0061-backup-file-format-and-streaming-import.md#3-v3s-own-backup-file-d1d2)
 * Edge-case checklist: no / one / many entries, empty entry, data that contains the data
 * descriptor signature (the case a signature-scanning reader cuts short), an archive comment,
 * archives from another writer (fflate zipSync: no data descriptors), and every refusal —
 * not a ZIP, split, ZIP64, encrypted, compressed, cut off, broken headers.
 * Property: any set of entries written by createZipWriter reads back byte for byte.
 */

import { fc, test as propTest } from '@fast-check/vitest';
import { zipSync } from 'fflate';
import {
  createZipWriter,
  isZip,
  readZipDirectory,
  zipEntryBlob,
  ZipError,
} from '../../src/lib/zipArchive';

const bytesOf = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

function write(files: [string, Uint8Array][]): Blob {
  const zip = createZipWriter();
  for (const [name, bytes] of files) zip.add(name, bytes);
  return zip.finish('application/zip');
}

async function readAll(file: Blob): Promise<Record<string, number[]>> {
  const out: Record<string, number[]> = {};
  for (const [name, entry] of await readZipDirectory(file)) {
    out[name] = Array.from(await bytesOf(await zipEntryBlob(file, entry)));
  }
  return out;
}

/** The archive's bytes with `patch` applied; offsets of the end record and directory given. */
async function patched(
  file: Blob,
  patch: (b: Uint8Array, at: { end: number; cd: number }, v: DataView) => void,
): Promise<Blob> {
  const b = await bytesOf(file);
  const v = new DataView(b.buffer);
  const end = b.length - 22;
  patch(b, { end, cd: v.getUint32(end + 16, true) }, v);
  return new Blob([b]);
}

const kindOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 'resolved';
  } catch (e) {
    return e instanceof ZipError ? e.kind : String(e);
  }
};

// "PK\x07\x08" — the data descriptor signature, inside the data
const TRAP = new Uint8Array([1, 0x50, 0x4b, 0x07, 0x08, 2, 3, 0x50, 0x4b, 0x01, 0x02, 9]);

describe('zipArchive', () => {
  it('writes and reads back several entries byte for byte, also an empty one', async () => {
    const file = write([
      ['audio/a.mp3', new Uint8Array([1, 2, 3])],
      ['audio/empty', new Uint8Array()],
      ['backup.json', new TextEncoder().encode('{"x":1}')],
    ]);
    expect(file.type).toBe('application/zip');
    expect(await readAll(file)).toEqual({
      'audio/a.mp3': [1, 2, 3],
      'audio/empty': [],
      'backup.json': Array.from(new TextEncoder().encode('{"x":1}')),
    });
  });

  it('data that contains the descriptor signature is read whole (no signature search)', async () => {
    const file = write([
      ['trap', TRAP],
      ['next', new Uint8Array([7])],
    ]);
    expect(await readAll(file)).toEqual({ trap: Array.from(TRAP), next: [7] });
  });

  it('an archive with no entries reads as empty', async () => {
    expect((await readZipDirectory(write([]))).size).toBe(0);
  });

  it('reads archives from another writer — no data descriptors, extra fields — and with a comment', async () => {
    const other = new Blob([zipSync({ 'a.bin': [TRAP, { level: 0 }] })]);
    expect(await readAll(other)).toEqual({ 'a.bin': Array.from(TRAP) });
    // Zip tools add extra fields (e.g. timestamps, 0x5455): the data starts after them
    const extra = { 0x5455: new Uint8Array([1, 2, 3, 4, 5]) };
    const withExtra = new Blob([zipSync({ 'a.bin': [TRAP, { level: 0, extra }] })]);
    expect(await readAll(withExtra)).toEqual({ 'a.bin': Array.from(TRAP) });

    const comment = new TextEncoder().encode('made by hand; PK\x05\x06 inside the comment');
    const withComment = await patched(write([['a', new Uint8Array([5])]]), (_b, { end }, v) => {
      v.setUint16(end + 20, comment.length, true);
    });
    const file = new Blob([withComment, comment]);
    expect(await readAll(file)).toEqual({ a: [5] });
  });

  it('isZip looks at the first bytes only', async () => {
    expect(await isZip(write([['a', new Uint8Array([1])]]))).toBe(true);
    expect(await isZip(new Blob(['{"boards":[]}']))).toBe(false);
    expect(await isZip(new Blob(['PK']))).toBe(false);
    expect(await isZip(new Blob([]))).toBe(false);
  });

  it('refuses what it cannot read, each with its reason', async () => {
    const good = write([['a', new Uint8Array([1, 2])]]);
    const cases: [string, Blob | Promise<Blob>, string][] = [
      ['no end record', new Blob(['PK\x03\x04 not really a zip']), 'not-a-zip'],
      ['cut off', good.slice(0, good.size - 5), 'not-a-zip'],
      ['split', patched(good, (_b, { end }, v) => v.setUint16(end + 4, 1, true)), 'unsupported'],
      [
        'ZIP64',
        patched(good, (_b, { end }, v) => v.setUint32(end + 16, 0xffffffff, true)),
        'unsupported',
      ],
      [
        'directory beyond the end record',
        patched(good, (_b, { end }, v) => v.setUint32(end + 12, 1000, true)),
        'damaged',
      ],
      ['broken directory entry', patched(good, (b, { cd }) => (b[cd] = 0)), 'damaged'],
      [
        'encrypted entry',
        patched(good, (_b, { cd }, v) => v.setUint16(cd + 8, 1, true)),
        'unsupported',
      ],
    ];
    for (const [label, file, kind] of cases) {
      expect([label, await kindOf(readZipDirectory(await file))]).toEqual([label, kind]);
    }
  });

  it('refuses an entry it cannot slice: compressed, broken local header, data beyond the end', async () => {
    const compressed = new Blob([zipSync({ a: [new Uint8Array(100).fill(7), { level: 6 }] })]);
    const entryOf = async (f: Blob) => (await readZipDirectory(f)).get('a')!;
    expect(await kindOf(zipEntryBlob(compressed, await entryOf(compressed)))).toBe('unsupported');

    const good = write([['a', new Uint8Array([1, 2])]]);
    const brokenLocal = await patched(good, (b) => (b[0] = 0));
    expect(await kindOf(zipEntryBlob(brokenLocal, await entryOf(good)))).toBe('damaged');

    const entry = await entryOf(good);
    expect(await kindOf(zipEntryBlob(good, { ...entry, size: good.size }))).toBe('damaged');
  });
});

describe('zipArchive — property', () => {
  const entries = fc.uniqueArray(
    fc.tuple(
      fc.string({
        unit: fc.constantFrom(...'abcdefghij/._-0123456789'),
        minLength: 1,
        maxLength: 20,
      }),
      fc.uint8Array({ maxLength: 300 }),
    ),
    { selector: ([name]) => name, maxLength: 8 },
  );

  propTest.prop([entries])('any entries read back byte for byte', async (files) => {
    const read = await readAll(write(files));
    expect(read).toEqual(Object.fromEntries(files.map(([n, b]) => [n, Array.from(b)])));
  });
});
