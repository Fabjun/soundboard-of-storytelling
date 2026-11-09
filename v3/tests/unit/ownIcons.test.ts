// @vitest-environment jsdom
/**
 * @fileoverview ownIcons — the user's own SVG pad icons (Slice 16e, ADR-0092)
 *
 * IDB is fake-indexeddb (fresh per test); jsdom parses the SVG; URL.createObjectURL is stubbed (jsdom
 * has none). Edge-case checklist: added by name with its own key, kept over a reload; the same file
 * twice is one icon; refused files say why and the others still come in; delete resolves with the
 * icon and its UNDO puts it back once; an unknown id; one URL per icon, revoked on delete; keys of
 * the collection are no own icons; every write counted as a running save.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB, iconGet, iconGetAllMeta } from '../../src/db/idb';
import { pendingSaves } from '../../src/state/store';
import {
  addIconsText,
  addOwnIconFiles,
  deleteOwnIcon,
  loadOwnIcons,
  ownIconId,
  ownIconKey,
  ownIcons,
  ownIconUrl,
  restoreOwnIcon,
} from '../../src/state/ownIcons';

const svg = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="${fill}"/></svg>`;
const svgFile = (name: string, fill = 'red') =>
  new File([svg(fill)], name, { type: 'image/svg+xml' });

let created: string[];
let revoked: string[];

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  ownIcons.value = [];
  pendingSaves.value = 0;
  created = [];
  revoked = [];
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:icon-${created.length}`;
    created.push(url);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => revoked.push(url));
});

describe('addOwnIconFiles / loadOwnIcons', () => {
  it('adds the files by name, each under the key of its content, kept over a reload', async () => {
    const result = await addOwnIconFiles([svgFile('Wolf.svg'), svgFile('owl.svg', 'blue')], 500);
    expect(result).toEqual({ added: 2, present: 0, refused: [] });
    expect(ownIcons.value.map((i) => [i.name, i.addedAt])).toEqual([
      ['owl', 500],
      ['Wolf', 500],
    ]);
    const [owl] = ownIcons.value;
    expect(owl.id).toMatch(/^[0-9a-f]{64}$/);
    expect(ownIconKey(owl.id)).toBe(`own:${owl.id}`);
    ownIcons.value = [];
    await loadOwnIcons();
    expect(ownIcons.value.map((i) => i.name)).toEqual(['owl', 'Wolf']);
    // The list never carries the SVG; the stored icon keeps the file's text
    expect(await iconGetAllMeta()).not.toContainEqual(
      expect.objectContaining({ svg: expect.anything() }),
    );
    expect((await iconGet(owl.id))?.svg).toBe(svg('blue'));
  });

  it('the same file twice is one icon; a refused file says why and the others still come in', async () => {
    await addOwnIconFiles([svgFile('owl.svg')]);
    const result = await addOwnIconFiles([
      svgFile('owl copy.svg'), // the same content
      new File(['not a drawing'], 'notes.svg'),
      new File([svg('red')], 'photo.png', { type: 'image/png' }),
      svgFile('wolf.svg', 'gray'),
    ]);
    expect(result).toEqual({
      added: 1,
      present: 1,
      refused: [
        'notes.svg: this file is no SVG drawing the app can read.',
        'photo.png: only SVG files can be icons.',
      ],
    });
    expect(ownIcons.value.map((i) => i.name)).toEqual(['owl', 'wolf']);
  });

  it('counts as a running save while it writes', async () => {
    const seen: number[] = [];
    const stop = pendingSaves.subscribe((n) => seen.push(n));
    await addOwnIconFiles([svgFile('owl.svg')]);
    stop();
    expect(seen).toEqual([0, 1, 0]); // the first value is the one at subscribe
  });

  it('adding and deleting count as a running save from the call, before the file or icon is read', async () => {
    const adding = addOwnIconFiles([svgFile('owl.svg')]);
    expect(pendingSaves.value).toBe(1); // a reload now waits — the file is still being read
    await adding;
    const deleting = deleteOwnIcon(ownIcons.value[0].id);
    expect(pendingSaves.value).toBe(1); // found 2026-11-09: the icon was read before it counted
    await deleting;
    expect(pendingSaves.value).toBe(0);
  });
});

describe('ownIconUrl / deleteOwnIcon / restoreOwnIcon', () => {
  it('one URL per icon; delete revokes it and resolves with the icon; UNDO puts it back once', async () => {
    await addOwnIconFiles([svgFile('owl.svg'), svgFile('wolf.svg', 'gray')]);
    const [owl] = ownIcons.value;
    const url = await ownIconUrl(owl.id);
    expect(await ownIconUrl(owl.id)).toBe(url);
    expect(created).toHaveLength(1);

    const deleted = await deleteOwnIcon(owl.id);
    expect(deleted).toMatchObject({ id: owl.id, name: 'owl' });
    expect(revoked).toEqual([url]);
    expect(ownIcons.value.map((i) => i.name)).toEqual(['wolf']);
    expect(await ownIconUrl(owl.id)).toBeNull(); // gone: nothing to draw

    await restoreOwnIcon(deleted!);
    await restoreOwnIcon(deleted!); // a second UNDO does not list it twice
    expect(ownIcons.value.map((i) => i.name)).toEqual(['owl', 'wolf']);
    expect(await ownIconUrl(owl.id)).toMatch(/^blob:/); // drawn again, not the null of the gap
    expect(await deleteOwnIcon('nope')).toBeNull();
  });
});

describe('addIconsText', () => {
  it('says what came in, what was there already, and each refusal with its reason', () => {
    expect(addIconsText({ added: 1, present: 0, refused: [] })).toBe('Added 1 icon.');
    expect(
      addIconsText({ added: 2, present: 1, refused: ['x.png: only SVG files can be icons.'] }),
    ).toBe('Added 2 icons · 1 already there. x.png: only SVG files can be icons.');
    expect(addIconsText({ added: 0, present: 3, refused: [] })).toBe(
      'Added 0 icons · 3 already there.',
    );
  });
});

describe('ownIconId', () => {
  it('reads the id of an own key; a key of the collection is no own icon', () => {
    expect(ownIconId('own:abc')).toBe('abc');
    expect(ownIconId('nikoichu:dragon')).toBeNull();
    expect(ownIconId('owned:abc')).toBeNull();
  });
});
