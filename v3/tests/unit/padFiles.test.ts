/**
 * @fileoverview padFiles — unit tests: the file list of a pad and the conversion of old pads (ADR-0068)
 *
 * Edge-case checklist: empty list, adding a file twice (also within one call), removing / moving
 * at both ends and outside the list, clearing one end of a trim, the three ways an old pad kept
 * its trim (Single, Loop with one file, Loop with several), an old pad without files, a pad that
 * is already converted (same object back), a Combo. Property: converting keeps every file in
 * order and is idempotent.
 */

import { fc, test as propTest } from '@fast-check/vitest';
import type { Board, Pad } from '../../src/types';
import {
  addFiles,
  hashesOf,
  migrateBoard,
  migratePad,
  moveFile,
  padFile,
  removeFile,
  setFileTrim,
  type StoredPad,
} from '../../src/lib/padFiles';

const base = { id: 'p', name: 'P', volume: 80, fadeIn: 0, fadeOut: 0 };
const files = ['a', 'b', 'c'].map(padFile);

describe('file list operations', () => {
  it('adds files at the end, never one the pad has, never one twice', () => {
    expect(hashesOf(addFiles(files, ['d', 'a', 'd']))).toEqual(['a', 'b', 'c', 'd']);
    expect(addFiles([], [])).toEqual([]);
  });

  it('removes a file; an index outside the list changes nothing', () => {
    expect(hashesOf(removeFile(files, 1))).toEqual(['a', 'c']);
    expect(hashesOf(removeFile(files, 5))).toEqual(['a', 'b', 'c']);
  });

  it('moves a file one place up or down; at the ends nothing changes', () => {
    expect(hashesOf(moveFile(files, 1, -1))).toEqual(['b', 'a', 'c']);
    expect(hashesOf(moveFile(files, 1, 1))).toEqual(['a', 'c', 'b']);
    expect(hashesOf(moveFile(files, 0, -1))).toEqual(['a', 'b', 'c']);
    expect(hashesOf(moveFile(files, 2, 1))).toEqual(['a', 'b', 'c']);
    expect(hashesOf(moveFile(files, 9, 1))).toEqual(['a', 'b', 'c']);
  });

  it('sets the trim of one file only; undefined clears that end', () => {
    const trimmed = setFileTrim(files, 1, { trimStart: 1, trimEnd: 4 });
    expect(trimmed[1]).toEqual({ hash: 'b', trimStart: 1, trimEnd: 4 });
    expect(trimmed[0]).toBe(files[0]);
    expect(setFileTrim(trimmed, 1, { trimStart: 1 })[1]).toEqual({ hash: 'b', trimStart: 1 });
  });
});

describe('migratePad (pads stored before ADR-0068)', () => {
  const legacy = (o: object) => ({ ...base, order: 'sequential', ...o }) as StoredPad;

  it('a Single gives its trim to every file — it trimmed whichever file it played', () => {
    const pad = migratePad(legacy({ type: 'single', files: ['a', 'b'], trimStart: 1, trimEnd: 3 }));
    expect(pad).toEqual({
      ...base,
      type: 'single',
      order: 'sequential',
      files: [
        { hash: 'a', trimStart: 1, trimEnd: 3 },
        { hash: 'b', trimStart: 1, trimEnd: 3 },
      ],
    });
  });

  it('a Loop with one file keeps its trim on that file', () => {
    const pad = migratePad(legacy({ type: 'loop', files: ['a'], trimStart: 2 }));
    expect(pad.type !== 'combo' && pad.files).toEqual([{ hash: 'a', trimStart: 2 }]);
  });

  it('a Loop with several files gets no trim — the engine played each file whole', () => {
    const pad = migratePad(legacy({ type: 'loop', files: ['a', 'b'], trimStart: 2, trimEnd: 5 }));
    expect(pad.type !== 'combo' && pad.files).toEqual([{ hash: 'a' }, { hash: 'b' }]);
  });

  it('drops the pad-wide trim, also from a pad without files', () => {
    const pad = migratePad(legacy({ type: 'single', files: [], trimStart: 1 }));
    expect(pad).not.toHaveProperty('trimStart');
    expect(pad).not.toHaveProperty('trimEnd');
  });

  it('returns a converted pad and a Combo unchanged — the same object', () => {
    const current: Pad = { ...base, type: 'loop', order: 'shuffle', files: [{ hash: 'a' }] };
    const combo: Pad = { ...base, type: 'combo', steps: [] };
    expect(migratePad(current)).toBe(current);
    expect(migratePad(combo)).toBe(combo);
  });

  it('migrateBoard converts every pad of a board', () => {
    const board = {
      id: 'b',
      name: 'B',
      themeId: 't',
      decks: [],
      quickAccess: [],
      pads: [legacy({ type: 'single', files: ['a'] })],
      padSize: 88,
    } as Omit<Board, 'pads'> & { pads: StoredPad[] };
    expect(migrateBoard(board).pads[0]).toMatchObject({ files: [{ hash: 'a' }] });
  });
});

describe('migratePad — property', () => {
  const hash = fc.string({ minLength: 1, maxLength: 4 });
  const trim = fc.option(fc.double({ min: 0, max: 60, noNaN: true }), { nil: undefined });
  propTest.prop([
    fc.constantFrom('single', 'loop'),
    fc.uniqueArray(hash, { maxLength: 6 }),
    trim,
    trim,
  ])('keeps every file in order and converts only once', (type, hashes, trimStart, trimEnd) => {
    const once = migratePad({
      ...base,
      type,
      order: 'sequential',
      files: hashes,
      trimStart,
      trimEnd,
    } as StoredPad);
    expect(once.type !== 'combo' && hashesOf(once.files)).toEqual(hashes);
    expect(migratePad(once)).toBe(once);
  });
});
