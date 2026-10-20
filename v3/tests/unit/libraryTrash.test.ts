/**
 * @fileoverview libraryTrash — "Recently deleted" of the library (Slice 16a, ADR-0087)
 *
 * IDB is fake-indexeddb (fresh per test); the signals are reset before each test.
 */

import { IDBFactory } from 'fake-indexeddb';
import type { LibraryItem } from '../../src/types';
import { _resetDB, libGet, libPut, trashGetAllMeta } from '../../src/db/idb';
import {
  daysLeft,
  deleteForGood,
  loadTrash,
  restoreFile,
  TRASH_DAYS,
  trashFile,
  trashItems,
} from '../../src/state/libraryTrash';
import { libraryItems, pendingSaves } from '../../src/state/store';

const DAY = 86_400_000;

function item(id: string, name = `${id}.mp3`): LibraryItem {
  return {
    id,
    type: 'audio',
    name,
    size: 16,
    tags: [],
    addedAt: 1_000,
    duration: 2,
    peaks: [0.5],
    blob: new Blob(['fake audio bytes'], { type: 'audio/mpeg' }),
  };
}

async function inLibrary(...ids: string[]): Promise<void> {
  for (const id of ids) await libPut(item(id));
  libraryItems.value = ids.map((id) => {
    const { blob: _blob, ...meta } = item(id);
    return meta;
  });
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  libraryItems.value = [];
  trashItems.value = [];
  pendingSaves.value = 0;
});

describe('trashFile', () => {
  test('moves the file out of the library list into the trash list, stamped now', async () => {
    await inLibrary('a', 'b');
    const moved = await trashFile('a', 7_000);
    expect(moved).toMatchObject({ id: 'a', deletedAt: 7_000 });
    expect(libraryItems.value.map((m) => m.id)).toEqual(['b']);
    expect(trashItems.value.map((t) => t.id)).toEqual(['a']);
    expect(await libGet('a')).toBeNull();
  });

  test('counts as a running save while it writes, and is done after', async () => {
    await inLibrary('a');
    const running = trashFile('a', 7_000);
    expect(pendingSaves.value).toBe(1);
    await running;
    expect(pendingSaves.value).toBe(0);
  });

  test('a file deleted again (uploaded since) is in the trash once, with the later date', async () => {
    await inLibrary('a', 'b');
    await trashFile('b', 6_000);
    await trashFile('a', 7_000);
    await inLibrary('a');
    await trashFile('a', 9_000);
    expect(trashItems.value.map((t) => [t.id, t.deletedAt])).toEqual([
      ['b', 6_000],
      ['a', 9_000],
    ]);
  });

  test('a file that is not in the library leaves the list and adds nothing to the trash', async () => {
    const { blob: _blob, ...ghost } = item('ghost'); // listed, but not stored
    libraryItems.value = [ghost];
    expect(await trashFile('ghost', 7_000)).toBeNull();
    expect(libraryItems.value).toEqual([]);
    expect(trashItems.value).toEqual([]);
  });
});

describe('restoreFile', () => {
  test('puts the file back into the library list and takes only it out of the trash', async () => {
    await inLibrary('a', 'b', 'c');
    await trashFile('a', 7_000);
    await trashFile('b', 8_000);
    expect(await restoreFile('a')).toBe(true);
    expect(libraryItems.value.map((m) => m.id)).toEqual(['c', 'a']);
    expect(trashItems.value.map((t) => t.id)).toEqual(['b']);
    expect((await libGet('a'))?.name).toBe('a.mp3');
  });

  test('a file the library holds again is not listed twice', async () => {
    await inLibrary('a');
    await trashFile('a', 7_000);
    await inLibrary('a', 'b'); // uploaded again meanwhile, next to another file
    expect(await restoreFile('a')).toBe(true);
    expect(libraryItems.value.map((m) => m.id)).toEqual(['a', 'b']);
  });

  test('a file that is not in the trash resolves false and changes nothing', async () => {
    await inLibrary('a');
    expect(await restoreFile('nope')).toBe(false);
    expect(libraryItems.value.map((m) => m.id)).toEqual(['a']);
    expect(pendingSaves.value).toBe(0);
  });
});

describe('deleteForGood', () => {
  test('removes the given files from the trash, or all of them (EMPTY)', async () => {
    await inLibrary('a', 'b', 'c');
    for (const id of ['a', 'b', 'c']) await trashFile(id, 7_000);
    await deleteForGood(['b']);
    expect(trashItems.value.map((t) => t.id)).toEqual(['a', 'c']);
    expect((await trashGetAllMeta()).map((t) => t.id)).toEqual(['a', 'c']);
    await deleteForGood();
    expect(trashItems.value).toEqual([]);
    expect(await trashGetAllMeta()).toEqual([]);
  });
});

describe('loadTrash', () => {
  test(`keeps what waited less than ${TRASH_DAYS} days, removes the rest for good, oldest first`, async () => {
    const now = 100 * DAY;
    // ids in the other order than the dates: the store lists by id, the trash by date
    await inLibrary('a-young', 'due', 'z-old');
    await trashFile('a-young', now - DAY);
    await trashFile('due', now - TRASH_DAYS * DAY); // exactly 30 days: goes
    await trashFile('z-old', now - TRASH_DAYS * DAY + 1); // a moment less than 30: stays
    trashItems.value = [];
    await loadTrash(now);
    expect(trashItems.value.map((t) => t.id)).toEqual(['z-old', 'a-young']);
    expect((await trashGetAllMeta()).map((t) => t.id)).toEqual(['a-young', 'z-old']);
  });
});

describe('daysLeft', () => {
  test('counts whole days up to 30, rounded up, never below 0', () => {
    const t = { ...item('a'), deletedAt: 0 };
    expect(daysLeft(t, 0)).toBe(TRASH_DAYS);
    expect(daysLeft(t, 1)).toBe(TRASH_DAYS); // the first moment still shows 30
    expect(daysLeft(t, DAY)).toBe(TRASH_DAYS - 1);
    expect(daysLeft(t, TRASH_DAYS * DAY - 1)).toBe(1);
    expect(daysLeft(t, TRASH_DAYS * DAY)).toBe(0);
    expect(daysLeft(t, 40 * DAY)).toBe(0);
  });
});
