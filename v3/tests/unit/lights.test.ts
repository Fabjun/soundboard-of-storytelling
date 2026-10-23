/**
 * @fileoverview lights — the lamps of Settings → LIGHT (light.md C2, ADR-0091)
 *
 * The lamps live in the preferences (fake-indexeddb, fresh per test). Cases: added with a trimmed
 * name and the address as typed, kept over a reload, refused without a name, with no address or
 * with an address another lamp has (also typed differently), removed; a damaged stored list.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB, kvPut } from '../../src/db/idb';
import { getLamps, loadPrefs } from '../../src/state/prefs';
import { pendingSaves } from '../../src/state/store';
import { addLamp, describeProblem, LAMP_NAME_MAX, removeLamp } from '../../src/state/lights';

beforeEach(async () => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  await loadPrefs();
  pendingSaves.value = 0;
});

describe('addLamp / removeLamp', () => {
  test('adds a lamp with a trimmed name and the address as typed; kept over a reload', async () => {
    const lamp = addLamp('  Floor lamp ', ' 192.168.1.50 ');
    expect(lamp).toMatchObject({ name: 'Floor lamp', address: '192.168.1.50' });
    await expect.poll(() => pendingSaves.value).toBe(0);
    await loadPrefs();
    expect(getLamps().map((l) => l.name)).toEqual(['Floor lamp']);
  });

  test('refuses no name, no address, and an address the list has — also typed otherwise', () => {
    expect(addLamp('  ', '192.168.1.50')).toBe('no-name');
    expect(addLamp('Lamp', 'not an address')).toBe('bad-address');
    addLamp('Floor lamp', '192.168.1.50');
    expect(addLamp('Same lamp', 'http://192.168.1.50/')).toBe('known-address');
    expect(getLamps()).toHaveLength(1);
  });

  test('cuts a long name at the limit; removes a lamp by id', () => {
    const lamp = addLamp('x'.repeat(LAMP_NAME_MAX + 9), 'wled.local');
    if (typeof lamp === 'string') throw new Error(lamp);
    expect(lamp.name).toHaveLength(LAMP_NAME_MAX);
    addLamp('Strip', '192.168.1.51');
    removeLamp(lamp.id);
    expect(getLamps().map((l) => l.name)).toEqual(['Strip']);
  });

  test('a stored list that is damaged gives the lamps that are whole', async () => {
    await kvPut('light-lamps', [{ id: 'a', name: 'Ok', address: '10.0.0.2' }, { id: 7 }, 'x']);
    await loadPrefs();
    expect(getLamps()).toEqual([{ id: 'a', name: 'Ok', address: '10.0.0.2' }]);
  });

  test('says what to do for every problem', () => {
    expect(describeProblem('no-name')).toMatch(/name/);
    expect(describeProblem('bad-address')).toMatch(/192\.168\.1\.50/);
    expect(describeProblem('known-address')).toMatch(/already/);
  });
});
