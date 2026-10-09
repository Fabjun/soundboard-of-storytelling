/**
 * @fileoverview modeControl — a mode switch stops every sound; the Lock keeps GAME (Slice 12c).
 * Cases: switching stops everything before the mode changes; the mode already shown does
 * nothing (and stops nothing); with the Lock on nothing switches and nothing stops; the Lock
 * toggles in GAME only; it starts off.
 */

import { currentMode, modeLocked } from '../../src/state/store';
import { switchMode, toggleModeLock } from '../../src/state/modeControl';

let log: string[];
const stopEverything = () => log.push(`stop in ${currentMode.value}`);

beforeEach(() => {
  log = [];
  currentMode.value = 'play';
  modeLocked.value = false;
});

describe('switching modes', () => {
  it('stops every sound, then switches', () => {
    expect(switchMode('edit', stopEverything)).toBe(true);
    expect(log).toEqual(['stop in play']);
    expect(currentMode.value).toBe('edit');
    expect(switchMode('play', stopEverything)).toBe(true);
    expect(log).toEqual(['stop in play', 'stop in edit']);
  });

  it('the mode already shown changes nothing and stops nothing', () => {
    expect(switchMode('play', stopEverything)).toBe(false);
    expect(log).toEqual([]);
  });
});

describe('the Lock', () => {
  it('starts off', async () => {
    vi.resetModules();
    const fresh = await import('../../src/state/store');
    expect(fresh.modeLocked.value).toBe(false);
  });

  it('while on, GAME stays and nothing stops; off again, the switch works', () => {
    toggleModeLock();
    expect(modeLocked.value).toBe(true);
    expect(switchMode('edit', stopEverything)).toBe(false);
    expect(currentMode.value).toBe('play');
    expect(log).toEqual([]);
    toggleModeLock();
    expect(switchMode('edit', stopEverything)).toBe(true);
  });

  it('toggles in GAME only', () => {
    currentMode.value = 'edit';
    toggleModeLock();
    expect(modeLocked.value).toBe(false);
  });
});
