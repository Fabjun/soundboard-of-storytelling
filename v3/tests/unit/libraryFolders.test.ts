/**
 * @fileoverview libraryFolders — the library's folders (Slice 16c, ADR-0088)
 *
 * The map lives in the preferences (fake-indexeddb, fresh per test). Cases: derived from single
 * tags while never written, the first change stores it, move / UNDO, rename (also onto an existing
 * folder), remove / UNDO, names cleaned and matched without case, files that are gone dropped,
 * a folder kept while its file is in the trash.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB } from '../../src/db/idb';
import type { LibraryItemMeta, TrashItemMeta } from '../../src/types';
import { getLibraryFolderMap, loadPrefs } from '../../src/state/prefs';
import { libraryItems, pendingSaves } from '../../src/state/store';
import { trashItems } from '../../src/state/libraryTrash';
import {
  cleanFolderName,
  FOLDER_NAME_MAX,
  folderList,
  folderMap,
  foldersFromTags,
  moveToFolder,
  removeFolder,
  renameFolder,
  restoreFolders,
} from '../../src/state/libraryFolders';

function meta(id: string, tags: string[] = []): LibraryItemMeta {
  return {
    id,
    type: 'audio',
    name: `${id}.mp3`,
    size: 1,
    tags,
    addedAt: 1,
    duration: 1,
    peaks: [],
  };
}

beforeEach(async () => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  await loadPrefs(); // an empty store: no map yet
  libraryItems.value = [];
  trashItems.value = [];
  pendingSaves.value = 0;
});

describe('foldersFromTags / folderMap before the first change', () => {
  test('a file with exactly one tag is in that folder; none or several tags: no folder', () => {
    expect(
      foldersFromTags([
        meta('a', ['Ambience']),
        meta('b'),
        meta('c', ['x', 'y']),
        meta('d', ['  Rain  ']),
      ]),
    ).toEqual({ a: 'Ambience', d: 'Rain' });
  });

  test('derives from the library and the trash while nothing is stored, and stores nothing', () => {
    libraryItems.value = [meta('a', ['Ambience'])];
    trashItems.value = [{ ...meta('t', ['Voices']), deletedAt: 5 } satisfies TrashItemMeta];
    expect(folderMap()).toEqual({ a: 'Ambience', t: 'Voices' });
    expect(getLibraryFolderMap()).toBeNull();
    expect(pendingSaves.value).toBe(0);
  });
});

describe('moveToFolder / restoreFolders', () => {
  test('the first move stores the derived map with the change; UNDO gives the old folders back', () => {
    libraryItems.value = [meta('a', ['Ambience']), meta('b'), meta('c', ['Voices'])];
    const before = moveToFolder(['a', 'b'], 'Storm');
    expect(getLibraryFolderMap()).toEqual({ a: 'Storm', b: 'Storm', c: 'Voices' });
    expect(before).toEqual({ a: 'Ambience' });
    restoreFolders(['a', 'b'], before);
    expect(folderMap()).toEqual({ a: 'Ambience', c: 'Voices' });
  });

  test('null takes the files out of every folder', () => {
    libraryItems.value = [meta('a'), meta('b')];
    moveToFolder(['a', 'b'], 'Storm');
    moveToFolder(['a'], null);
    expect(folderMap()).toEqual({ b: 'Storm' });
  });

  test('a write drops files that are neither in the library nor in the trash, keeps trashed ones', () => {
    libraryItems.value = [meta('a'), meta('gone')];
    trashItems.value = [{ ...meta('t'), deletedAt: 5 }];
    moveToFolder(['a', 'gone', 't'], 'Storm');
    libraryItems.value = [meta('a')]; // 'gone' deleted for good
    moveToFolder(['a'], 'Rain');
    expect(getLibraryFolderMap()).toEqual({ a: 'Rain', t: 'Storm' });
  });

  test('counts as a running save until it is written', async () => {
    libraryItems.value = [meta('a')];
    moveToFolder(['a'], 'Storm');
    expect(pendingSaves.value).toBe(1);
    await expect.poll(() => pendingSaves.value).toBe(0);
    await loadPrefs(); // read back from the database
    expect(getLibraryFolderMap()).toEqual({ a: 'Storm' });
  });
});

describe('renameFolder / removeFolder', () => {
  test('a rename moves every file of the folder; onto an existing name the two join', () => {
    libraryItems.value = [meta('a'), meta('b'), meta('c')];
    moveToFolder(['a', 'b'], 'Strom');
    moveToFolder(['c'], 'Storm');
    renameFolder('Strom', 'Storm');
    expect(folderMap()).toEqual({ a: 'Storm', b: 'Storm', c: 'Storm' });
  });

  test('a remove leaves its files in no folder and returns them for an UNDO', () => {
    libraryItems.value = [meta('a'), meta('b'), meta('c')];
    moveToFolder(['a', 'b'], 'Storm');
    moveToFolder(['c'], 'Rain');
    const ids = removeFolder('Storm');
    expect(ids.sort()).toEqual(['a', 'b']);
    expect(folderMap()).toEqual({ c: 'Rain' });
    moveToFolder(ids, 'Storm'); // the UNDO
    expect(folderMap()).toEqual({ a: 'Storm', b: 'Storm', c: 'Rain' });
  });
});

describe('folderList / cleanFolderName', () => {
  test('lists the folders of the given files by name, case ignored, with their counts', () => {
    const map = { a: 'storm', b: 'Ambience', c: 'storm', x: 'Hidden' };
    expect(folderList([meta('a'), meta('b'), meta('c'), meta('d')], map)).toEqual([
      { name: 'Ambience', count: 1 },
      { name: 'storm', count: 2 },
    ]);
    expect(folderList([], map)).toEqual([]);
  });

  test('trims, joins inner spaces, cuts at the limit, and matches an existing folder without case', () => {
    expect(cleanFolderName('  Big   Storm ', [])).toBe('Big Storm');
    expect(cleanFolderName('x'.repeat(FOLDER_NAME_MAX + 5), [])).toHaveLength(FOLDER_NAME_MAX);
    expect(cleanFolderName('STORM', ['Rain', 'Storm'])).toBe('Storm');
    expect(cleanFolderName('   ', ['Storm'])).toBe('');
  });
});
