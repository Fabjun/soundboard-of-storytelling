/**
 * @fileoverview prefs — UI preferences in IndexedDB (ADR-0062; owner decision 2026-10-02)
 * Real IndexedDB semantics via fake-indexeddb. Cases: nothing stored, round trip incl. a reload
 * (loadPrefs), per-board keys, unknown values, clear, writes counted in pendingSaves, a failing
 * database never breaks the app.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB, kvGetAll, kvPut } from '../../src/db/idb';
import { pendingSaves } from '../../src/state/store';
import {
  clearLastView,
  getLastBackup,
  getLastPlayed,
  getPadSort,
  prefsVersion,
  setLastPlayed,
  setPadSort,
  getLastView,
  loadPrefs,
  setLastBackup,
  setLastView,
} from '../../src/state/prefs';

/** Lets the background writes finish. */
const settled = async () => {
  while (pendingSaves.value > 0) await new Promise((r) => setTimeout(r, 1));
};

beforeEach(async () => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  await loadPrefs(); // empty cache for each test
});
afterEach(() => vi.restoreAllMocks());

describe('last view of a board', () => {
  it('is null when nothing is stored', () => {
    expect(getLastView('b1')).toBeNull();
  });

  it('is there at once, stored in the background, and back after a reload', async () => {
    setLastView('b1', { kind: 'deck', deckId: 'd7' });
    setLastView('b2', { kind: 'all-pads' });
    expect(getLastView('b1')).toEqual({ kind: 'deck', deckId: 'd7' });
    expect(pendingSaves.value).toBe(2);
    await settled();
    expect((await kvGetAll()).sort()).toEqual([
      ['last-view:b1', 'deck:d7'],
      ['last-view:b2', 'all-pads'],
    ]);
    _resetDB();
    await loadPrefs(); // the app starting again
    expect(getLastView('b1')).toEqual({ kind: 'deck', deckId: 'd7' });
    expect(getLastView('b2')).toEqual({ kind: 'all-pads' });
  });

  it('ignores a value it does not know', async () => {
    await kvPut('last-view:b1', 'something-else');
    await kvPut('last-view:b2', 42);
    await loadPrefs();
    expect(getLastView('b1')).toBeNull();
    expect(getLastView('b2')).toBeNull();
  });

  it('clear forgets one board only — also after a reload', async () => {
    setLastView('b1', { kind: 'all-pads' });
    setLastView('b2', { kind: 'all-pads' });
    clearLastView('b1');
    expect(getLastView('b1')).toBeNull();
    await settled();
    expect((await kvGetAll()).map(([k]) => k)).toEqual(['last-view:b2']); // really deleted
    await loadPrefs();
    expect(getLastView('b1')).toBeNull();
    expect(getLastView('b2')).toEqual({ kind: 'all-pads' });
  });
});

describe('last backup (D3)', () => {
  it('is null before the first backup, then the stored time — also after a reload', async () => {
    expect(getLastBackup()).toBeNull();
    setLastBackup(1_700_000_000_000);
    expect(getLastBackup()).toBe(1_700_000_000_000);
    await settled();
    expect(await kvGetAll()).toEqual([['last-backup', 1_700_000_000_000]]);
    await loadPrefs();
    expect(getLastBackup()).toBe(1_700_000_000_000);
  });

  it('ignores a value that is not a time', async () => {
    for (const bad of ['soon', '5', 0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await kvPut('last-backup', bad);
      await loadPrefs();
      expect(getLastBackup()).toBeNull();
    }
  });
});

describe('a failing database', () => {
  it('loading falls back to defaults and a failed write is logged, never thrown', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('indexedDB', {
      open: () => {
        throw new Error('blocked');
      },
    });
    _resetDB();
    await expect(loadPrefs()).resolves.toBeUndefined();
    expect(getLastBackup()).toBeNull();
    expect(() => setLastBackup(1)).not.toThrow();
    expect(getLastBackup()).toBe(1); // the session still sees it
    await settled();
    expect(error).toHaveBeenCalledWith(
      'Saving the preference last-backup failed:',
      expect.anything(),
    );
    vi.unstubAllGlobals();
  });
});

describe('sort of the All pads view, per board (E1)', () => {
  it('is by name until chosen; the choice is kept per board and after a reload', async () => {
    expect(getPadSort('b1')).toEqual({ key: 'name', reversed: false });
    setPadSort('b1', { key: 'played', reversed: true });
    expect(getPadSort('b1')).toEqual({ key: 'played', reversed: true });
    expect(getPadSort('b2')).toEqual({ key: 'name', reversed: false });
    await settled();
    await loadPrefs();
    expect(getPadSort('b1')).toEqual({ key: 'played', reversed: true });
  });

  it('a stored value that is not a sort falls back to name', async () => {
    await kvPut('pad-sort:b1', { key: 'size', reversed: false });
    await loadPrefs();
    expect(getPadSort('b1')).toEqual({ key: 'name', reversed: false });
  });
});

describe('last played, per pad', () => {
  it('null until played; kept after a reload; bad values ignored', async () => {
    expect(getLastPlayed('p')).toBeNull();
    setLastPlayed('p', 123);
    expect(getLastPlayed('p')).toBe(123);
    await settled();
    await loadPrefs();
    expect(getLastPlayed('p')).toBe(123);
    for (const bad of ['yesterday', '5', 0, Number.POSITIVE_INFINITY]) {
      await kvPut('last-played:q', bad);
      await loadPrefs();
      expect(getLastPlayed('q')).toBeNull();
    }
  });
});

describe('prefsVersion', () => {
  it('changes on every write and on loading, so the screen re-reads', async () => {
    const v = prefsVersion.value;
    setLastBackup(5);
    expect(prefsVersion.value).toBe(v + 1);
    await settled();
    await loadPrefs();
    expect(prefsVersion.value).toBe(v + 2);
  });
});
