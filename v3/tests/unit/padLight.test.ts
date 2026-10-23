/**
 * @fileoverview padLight — a pad's light next to its sound (light.md C1–C6, ADR-0091)
 *
 * The lamps and the sender are stand-ins. Cases: no light sends nothing; a preset to all lamps or
 * to the one named; off; a lamp named but gone sends nothing; a failed lamp marks the trouble and a
 * good round clears it; the call returns before any lamp answers (fire and forget).
 */

import type { Lamp } from '../../src/state/prefs';
import type { Pad, PadLight } from '../../src/types';
import { lampsFor, lightCommand, lightTrouble, startPadLight } from '../../src/light/padLight';
import type { LightCommand, LightResult } from '../../src/light/wled';
import { newPad } from '../../src/lib/padUtils';

const lamps: Lamp[] = [
  { id: 'a', name: 'Floor', address: '192.168.1.50' },
  { id: 'b', name: 'Strip', address: '192.168.1.51' },
];

const withLight = (light?: PadLight): Pad => ({
  ...newPad('p', 'single', 'Thunder', ['h']),
  ...(light ? { light } : {}),
});

/** A sender that records each call and answers `result`. */
function sender(result: LightResult = { kind: 'ok' }) {
  const calls: [string, LightCommand][] = [];
  return {
    calls,
    send: (address: string, command: LightCommand) => {
      calls.push([address, command]);
      return Promise.resolve(result);
    },
  };
}

beforeEach(() => {
  lightTrouble.value = false;
});

describe('lightCommand / lampsFor', () => {
  it('a preset is {preset}, off is {off}; all lamps or the one named, none when it is gone', () => {
    expect(lightCommand({ lamp: 'all', preset: 4 })).toEqual({ preset: 4 });
    expect(lightCommand({ lamp: 'a', off: true })).toEqual({ off: true });
    expect(lampsFor({ lamp: 'all', preset: 1 }, lamps).map((l) => l.id)).toEqual(['a', 'b']);
    expect(lampsFor({ lamp: 'b', preset: 1 }, lamps).map((l) => l.id)).toEqual(['b']);
    expect(lampsFor({ lamp: 'gone', preset: 1 }, lamps)).toEqual([]);
  });
});

describe('startPadLight', () => {
  it('a pad without light, or no pad, sends nothing', async () => {
    const s = sender();
    expect(await startPadLight(withLight(), lamps, s.send)).toEqual([]);
    expect(await startPadLight(null, lamps, s.send)).toEqual([]);
    expect(s.calls).toEqual([]);
  });

  it('sends the preset to every lamp named, and off to one', async () => {
    const s = sender();
    await startPadLight(withLight({ lamp: 'all', preset: 7 }), lamps, s.send);
    await startPadLight(withLight({ lamp: 'b', off: true }), lamps, s.send);
    expect(s.calls).toEqual([
      ['192.168.1.50', { preset: 7 }],
      ['192.168.1.51', { preset: 7 }],
      ['192.168.1.51', { off: true }],
    ]);
  });

  it('a lamp that fails marks the trouble; a round that reaches every lamp clears it', async () => {
    await startPadLight(
      withLight({ lamp: 'all', preset: 1 }),
      lamps,
      sender({ kind: 'blocked' }).send,
    );
    expect(lightTrouble.value).toBe(true);
    await startPadLight(withLight({ lamp: 'all', preset: 1 }), lamps, sender().send);
    expect(lightTrouble.value).toBe(false);
  });

  it('returns before a lamp answers — the sound never waits', async () => {
    let answer: (r: LightResult) => void = () => {};
    const slow = (): Promise<LightResult> => new Promise((resolve) => (answer = resolve));
    let settled = false;
    const done = startPadLight(withLight({ lamp: 'a', preset: 2 }), lamps, slow).then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    answer({ kind: 'ok' });
    await done;
    expect(settled).toBe(true);
  });
});
