// @vitest-environment jsdom
/**
 * @fileoverview backupImport — own icons in V3 and V1 backups (Slice 16e step 2, ADR-0092)
 *
 * In its own file: the SVG check needs a DOMParser (jsdom), the audio cases of
 * backupImport.test.ts run in Node. Synthetic files only, JSON backups without audio. Edge-case
 * checklist: a V3 manifest's icons are checked like uploads and come in under the id of their
 * text, also when the file names another (a pad's key follows); a broken entry and a refused SVG
 * say why; a key whose icon the file lacks stays; templates' icons follow too; importing again
 * adds none twice; V1 `type: 'icon'` entries become own icons and a pad's `{h: hash}` their key;
 * one without data says so; a V1 pad whose icon the backup lacks is counted.
 */

import { Blob as NodeBlob } from 'node:buffer';
import { IDBFactory } from 'fake-indexeddb';
import type { Board } from '../../src/types';
import { _resetDB, boardGetAll } from '../../src/db/idb';
import { boards, libraryItems } from '../../src/state/store';
import { padTemplates } from '../../src/state/padTemplates';
import { ownIcons } from '../../src/state/ownIcons';
import { planImport, runImport } from '../../src/lib/backupImport';
import { V3_BACKUP_FORMAT } from '../../src/lib/backupReader';
import { computeHash } from '../../src/lib/upload';

const svg = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="${fill}"/></svg>`;
const bytes = (text: string) => new TextEncoder().encode(text);
const idOf = (text: string) => computeHash(bytes(text).slice().buffer);
const b64 = (text: string) => btoa(String.fromCharCode(...bytes(text)));
// jsdom's Blob has no stream(), which the backup reader uses — Node's has, as browsers' do
const file = (doc: unknown) => new NodeBlob([JSON.stringify(doc)]) as unknown as Blob;
const OWL = svg('red');
const WOLF = svg('gray');

const board = (icons: string[]): Board => ({
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
      files: [],
      order: 'sequential',
      icons,
    },
  ],
  decks: [],
  padSize: 88,
  quickAccess: [],
});

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  libraryItems.value = [];
  boards.value = [];
  padTemplates.value = [];
  ownIcons.value = [];
});

describe('V3 backups', () => {
  const v3 = () => ({
    format: V3_BACKUP_FORMAT,
    formatVersion: 2,
    boards: [board([`own:${idOf(OWL)}`, 'own:named-otherwise', 'own:not-in-file'])],
    templates: [
      {
        id: 't',
        name: 'Wolf call',
        savedAt: 5,
        pad: { ...board([]).pads[0], name: 'Wolf call', icons: ['own:named-otherwise'] },
      },
    ],
    icons: [
      { id: idOf(OWL), name: 'Owl', addedAt: 9, svg: OWL },
      { id: 'named-otherwise', name: 'Wolf', addedAt: 9, svg: WOLF }, // a file's id is not trusted
      { id: 'x', name: 'Bad', addedAt: 9, svg: 'not a drawing' },
      'junk',
    ],
    library: [],
  });

  it('adds the icons through the checks, each under the id of its text; pads and templates follow', async () => {
    const plan = await planImport(file(v3()));
    expect([plan.icons.length, plan.v1Icons]).toEqual([4, 0]);
    const result = await runImport(file(v3()), plan);
    expect(result).toMatchObject({
      iconsAdded: 2,
      iconsPresent: 0,
      iconsRefused: [
        'An icon in the backup could not be read.',
        'Bad.svg: this file is no SVG drawing the app can read.',
      ],
    });
    expect(ownIcons.value.map((i) => [i.name, i.addedAt])).toEqual([
      ['Owl', 9],
      ['Wolf', 9],
    ]);
    const [stored] = await boardGetAll();
    expect(stored.pads[0].icons).toEqual([
      `own:${idOf(OWL)}`,
      `own:${idOf(WOLF)}`, // the file named it otherwise
      'own:not-in-file', // kept: the pad draws its other icons until such an icon is there
    ]);
    expect(padTemplates.value[0].pad.icons).toEqual([`own:${idOf(WOLF)}`]);
  });

  it('importing the same backup again adds no icon twice', async () => {
    await runImport(file(v3()), await planImport(file(v3())));
    const again = await runImport(file(v3()), await planImport(file(v3())));
    expect(again).toMatchObject({ iconsAdded: 0, iconsPresent: 2 });
    expect(ownIcons.value).toHaveLength(2);
  });
});

describe('V1 backups', () => {
  const v1Icon = (text: string, name: string) => ({
    hash: idOf(text), // V1 named a file by the SHA-256 of its bytes too
    name,
    type: 'icon',
    added: 5,
    data: b64(text),
  });
  const v1 = () => ({
    version: 1,
    boards: [
      {
        id: 'board_1',
        name: 'Night',
        pads: [{ name: 'Owl', mode: 'once', icons: [{ h: idOf(OWL) }, { h: 'not-in-backup' }] }],
      },
    ],
    library: [
      v1Icon(OWL, 'owl.svg'),
      { hash: 'empty', name: 'empty.svg', type: 'icon' }, // no data
    ],
  });

  it("V1's uploaded icons become own icons; a pad's {h: hash} becomes their key", async () => {
    const plan = await planImport(file(v1()));
    expect([plan.v1Icons, plan.otherEntries]).toEqual([2, 0]);
    const result = await runImport(file(v1()), plan);
    expect(result).toMatchObject({
      iconsAdded: 1,
      iconsRefused: ['empty.svg: the backup holds no data for this icon.'],
    });
    expect(result.notes.customIcons).toBe(1); // the pad's second icon was not in the backup
    expect(ownIcons.value.map((i) => [i.name, i.addedAt])).toEqual([['owl', 5]]);
    const [stored] = await boardGetAll();
    expect(stored.pads[0].icons).toEqual([`own:${idOf(OWL)}`]);
  });
});
