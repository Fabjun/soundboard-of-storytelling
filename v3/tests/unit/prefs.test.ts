/**
 * @fileoverview prefs — UI preferences in IndexedDB (ADR-0062; owner decision 2026-10-02)
 * Real IndexedDB semantics via fake-indexeddb. Cases: nothing stored, round trip incl. a reload
 * (loadPrefs), per-board keys, unknown values, clear, writes counted in pendingSaves, a failing
 * database never breaks the app, the backup reminder days, the theme.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB, kvGetAll, kvPut } from '../../src/db/idb';
import { pendingSaves } from '../../src/state/store';
import {
  clearLastView,
  getLastBackup,
  getLastPlayed,
  getPadSort,
  clearPadDraft,
  getPadDraft,
  isBarOpen,
  setPadDraft,
  prefsVersion,
  setBarOpen,
  setLastPlayed,
  setPadSort,
  getLastView,
  loadPrefs,
  setLastBackup,
  setLastView,
  getBackupReminderDays,
  setBackupReminderDays,
  getTheme,
  setTheme,
  getAppPadSize,
  getPadSizeScope,
  padSizeOf,
  setAppPadSize,
  setPadSizeScope,
  getContentWidth,
  setContentWidth,
  animationsOn,
  getAnimationsSwitch,
  setAnimationsSwitch,
  getEnterStop,
  setEnterStop,
  getDebugLogSwitch,
  setDebugLogSwitch,
} from '../../src/state/prefs';
import { BACKUP_REMINDER_DAYS } from '../../src/lib/backupExport';

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

describe('the PAD editor draft kept on the device (ADR-0084)', () => {
  const draft = {
    id: 'p1',
    type: 'single' as const,
    name: 'Rain',
    files: [{ hash: 'a' }],
    order: 'sequential' as const,
    volume: 80,
    fadeIn: 0,
    fadeOut: 0,
  };

  it('none until kept; kept after a reload; cleared', async () => {
    expect(getPadDraft('p1')).toBeNull();
    setPadDraft(draft);
    await settled();
    await loadPrefs();
    expect(getPadDraft('p1')).toEqual(draft);
    clearPadDraft('p1');
    await settled();
    await loadPrefs();
    expect(getPadDraft('p1')).toBeNull();
  });

  it("a stored value that is no pad, or another pad's, is ignored", async () => {
    await kvPut('pad-draft:p1', { id: 'p1', name: 'broken' });
    await kvPut('pad-draft:p2', draft);
    await loadPrefs();
    expect(getPadDraft('p1')).toBeNull();
    expect(getPadDraft('p2')).toBeNull();
  });
});

describe('bars that fold (2026-10-11)', () => {
  it('open until folded; folded kept after a reload; opened again stores nothing', async () => {
    expect(isBarOpen('search')).toBe(true);
    setBarOpen('search', false);
    expect(isBarOpen('search')).toBe(false);
    expect(isBarOpen('quick-access')).toBe(true); // each bar on its own
    await settled();
    await loadPrefs();
    expect(isBarOpen('search')).toBe(false);
    setBarOpen('search', true);
    await settled();
    expect(isBarOpen('search')).toBe(true);
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('bar-open:search');
  });

  it('an unexpected stored value counts as open', async () => {
    await kvPut('bar-open:decks', 'no');
    await loadPrefs();
    expect(isBarOpen('decks')).toBe(true);
  });
});

describe('backup reminder days (Settings → DATA, settings.md S7)', () => {
  it('7 until chosen; the choice is kept after a reload; 7 again stores nothing', async () => {
    expect(getBackupReminderDays()).toBe(BACKUP_REMINDER_DAYS);
    setBackupReminderDays(14);
    expect(getBackupReminderDays()).toBe(14);
    await settled();
    await loadPrefs();
    expect(getBackupReminderDays()).toBe(14);
    setBackupReminderDays(BACKUP_REMINDER_DAYS);
    await settled();
    expect(getBackupReminderDays()).toBe(BACKUP_REMINDER_DAYS);
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('backup-reminder-days');
  });

  it('a stored value that is not one of the choices counts as 7', async () => {
    await kvPut('backup-reminder-days', 5);
    await loadPrefs();
    expect(getBackupReminderDays()).toBe(BACKUP_REMINDER_DAYS);
    await kvPut('backup-reminder-days', '14');
    await loadPrefs();
    expect(getBackupReminderDays()).toBe(BACKUP_REMINDER_DAYS);
  });
});

describe('theme (Settings → APPEARANCE, settings.md S5)', () => {
  it('Hearth until chosen; the choice is kept after a reload; Hearth again stores nothing', async () => {
    expect(getTheme()).toBe('hearth');
    setTheme('neon');
    expect(getTheme()).toBe('neon');
    await settled();
    await loadPrefs();
    expect(getTheme()).toBe('neon');
    setTheme('hearth');
    await settled();
    expect(getTheme()).toBe('hearth');
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('theme');
  });

  it('a stored value that is no theme counts as Hearth', async () => {
    await kvPut('theme', 'modern');
    await loadPrefs();
    expect(getTheme()).toBe('hearth');
  });
});

describe('pad size for every board (Settings → APPEARANCE, settings.md S4)', () => {
  it('per board until chosen: a board shows its own size; the scope is kept after a reload', async () => {
    expect(getPadSizeScope()).toBe('board');
    expect(padSizeOf({ padSize: 120 })).toBe(120);
    setPadSizeScope('app');
    setAppPadSize(60);
    expect(padSizeOf({ padSize: 120 })).toBe(60);
    await settled();
    await loadPrefs();
    expect(getPadSizeScope()).toBe('app');
    expect(getAppPadSize()).toBe(60);
    setPadSizeScope('board');
    expect(padSizeOf({ padSize: 120 })).toBe(120);
  });

  it('the size for every board stays on the slider; 88 until set and not stored', async () => {
    expect(getAppPadSize()).toBe(88);
    setAppPadSize(999);
    expect(getAppPadSize()).toBe(160);
    setAppPadSize(88);
    await settled();
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('pad-size');
    await kvPut('pad-size-scope', 'everything');
    await kvPut('pad-size', 'big');
    await loadPrefs();
    expect(getPadSizeScope()).toBe('board');
    expect(getAppPadSize()).toBe(88);
  });
});

describe('content width (Settings → APPEARANCE, settings.md S3)', () => {
  it('AUTO until chosen; kept after a reload; AUTO again stores nothing; unknown counts as AUTO', async () => {
    expect(getContentWidth()).toBe('auto');
    setContentWidth('compact');
    await settled();
    await loadPrefs();
    expect(getContentWidth()).toBe('compact');
    setContentWidth('auto');
    await settled();
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('content-width');
    await kvPut('content-width', 'huge');
    await loadPrefs();
    expect(getContentWidth()).toBe('auto');
  });
});

describe('animations switch (Settings → VISUALS, settings.md S6)', () => {
  it('on until switched off; off is kept after a reload; on again stores nothing', async () => {
    expect(getAnimationsSwitch()).toBe(true);
    expect(animationsOn()).toBe(true); // no matchMedia in this environment: no reduced motion
    setAnimationsSwitch(false);
    expect(animationsOn()).toBe(false);
    await settled();
    await loadPrefs();
    expect(getAnimationsSwitch()).toBe(false);
    setAnimationsSwitch(true);
    await settled();
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('animations');
  });
});

describe('Enter key (Settings → CONTROLS, settings.md S2)', () => {
  it('stops the last sound until set to all; kept after a reload; the default is not stored', async () => {
    expect(getEnterStop()).toBe('last');
    setEnterStop('all');
    await settled();
    await loadPrefs();
    expect(getEnterStop()).toBe('all');
    setEnterStop('last');
    await settled();
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('enter-stop');
    await kvPut('enter-stop', 'some');
    await loadPrefs();
    expect(getEnterStop()).toBe('last');
  });
});

describe('debug log switch (Settings → DEVELOPER, settings.md S8)', () => {
  it('off until switched on; on is kept after a reload; off again stores nothing', async () => {
    expect(getDebugLogSwitch()).toBe(false);
    setDebugLogSwitch(true);
    await settled();
    await loadPrefs();
    expect(getDebugLogSwitch()).toBe(true);
    setDebugLogSwitch(false);
    await settled();
    expect((await kvGetAll()).map(([k]) => k)).not.toContain('debug-log');
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
