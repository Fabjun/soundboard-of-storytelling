// ─────────────────────────────────────────────────────────────────────────────
// padSort — order of the All pads view (owner decision 2026-10-02, E1)
// Edge-case checklist: every key in its natural direction and reversed, values missing (always
// last), ties (by name, then id), case-insensitive names, durations per pad type, stored values.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComboPad, LoopPad, Pad, SinglePad } from '../../src/types';
import {
  DEFAULT_PAD_SORT,
  isPadSort,
  PAD_SORT_KEYS,
  PAD_SORT_LABELS,
  padDuration,
  sortPads,
  type PadSortContext,
  type PadSortKey,
} from '../../src/lib/padSort';

const base = (id: string) => ({ id, name: id, volume: 80, fadeIn: 0, fadeOut: 0 });
const pad = (id: string, extra: Partial<SinglePad> = {}): SinglePad => ({
  ...base(id),
  type: 'single',
  files: [],
  order: 'sequential',
  ...extra,
});
const loop = (id: string, extra: Partial<LoopPad> = {}): LoopPad => ({
  ...base(id),
  type: 'loop',
  files: [],
  order: 'sequential',
  ...extra,
});
const combo = (id: string, steps: ComboPad['steps']): ComboPad => ({
  ...base(id),
  type: 'combo',
  steps,
});

function ctx(over: Partial<PadSortContext> = {}): PadSortContext {
  return {
    deckCount: () => 1,
    fileDuration: () => undefined,
    lastPlayed: () => null,
    ...over,
  };
}

const ids = (pads: Pad[]) => pads.map((p) => p.id);
const sorted = (pads: Pad[], key: PadSortKey, reversed = false, c = ctx()) =>
  ids(sortPads(pads, { key, reversed }, c));

describe('sortPads', () => {
  it('name: A→Z ignoring case, reversed Z→A; equal names by id', () => {
    const pads = [
      pad('3', { name: 'beta' }),
      pad('1', { name: 'Alpha' }),
      pad('2', { name: 'alpha' }),
    ];
    expect(sorted(pads, 'name')).toEqual(['1', '2', '3']);
    expect(sorted(pads, 'name', true)).toEqual(['3', '2', '1']);
  });

  it('date added / modified: newest first, reversed oldest first; pads without a date last', () => {
    const pads = [
      pad('old', { addedAt: 1, modifiedAt: 30 }),
      pad('none'),
      pad('new', { addedAt: 9, modifiedAt: 10 }),
    ];
    expect(sorted(pads, 'added')).toEqual(['new', 'old', 'none']);
    expect(sorted(pads, 'added', true)).toEqual(['old', 'new', 'none']);
    expect(sorted(pads, 'modified')).toEqual(['old', 'new', 'none']);
  });

  it('kind: Single, Loop, Combo; within a kind by name', () => {
    const pads = [combo('c', []), pad('s2', { name: 'b' }), loop('l'), pad('s1', { name: 'a' })];
    expect(sorted(pads, 'kind')).toEqual(['s1', 's2', 'l', 'c']);
    expect(sorted(pads, 'kind', true)).toEqual(['c', 'l', 's1', 's2']);
  });

  it('not in a deck first; reversed: placed pads first', () => {
    const c = ctx({ deckCount: (id) => (id === 'loose' ? 0 : 2) });
    const pads = [pad('a'), pad('loose'), pad('b')];
    expect(sorted(pads, 'unplaced', false, c)).toEqual(['loose', 'a', 'b']);
    expect(sorted(pads, 'unplaced', true, c)).toEqual(['a', 'b', 'loose']);
  });

  it('duration: shortest first; unknown durations last', () => {
    const c = ctx({ fileDuration: (f) => ({ short: 2, long: 30 })[f] });
    const pads = [
      pad('l', { files: ['long'] }),
      pad('u', { files: ['unknown'] }),
      pad('s', { files: ['short'] }),
    ];
    expect(sorted(pads, 'duration', false, c)).toEqual(['s', 'l', 'u']);
    expect(sorted(pads, 'duration', true, c)).toEqual(['l', 's', 'u']);
  });

  it('last played: most recent first; never played last', () => {
    const c = ctx({ lastPlayed: (id) => ({ a: 100, b: 300 })[id] ?? null });
    const pads = [pad('a'), pad('never'), pad('b')];
    expect(sorted(pads, 'played', false, c)).toEqual(['b', 'a', 'never']);
    expect(sorted(pads, 'played', true, c)).toEqual(['a', 'b', 'never']);
  });

  it('name ignores every other value; pads without a value are ordered by name among themselves', () => {
    const pads = [pad('z', { addedAt: 1 }), pad('a', { addedAt: 9 }), pad('m')];
    expect(sorted(pads, 'name')).toEqual(['a', 'm', 'z']);
    // three without a date, given in reverse name order, and one with a date given last
    const loose = [pad('c'), pad('b'), pad('a'), pad('dated', { addedAt: 3 })];
    expect(sorted(loose, 'added')).toEqual(['dated', 'a', 'b', 'c']);
    expect(sorted(loose, 'added', true)).toEqual(['dated', 'a', 'b', 'c']);
  });

  it('returns a new array and leaves the input as it was', () => {
    const pads = [pad('b'), pad('a')];
    const out = sortPads(pads, DEFAULT_PAD_SORT, ctx());
    expect(out).not.toBe(pads);
    expect(ids(pads)).toEqual(['b', 'a']);
  });
});

describe('padDuration', () => {
  const c = ctx({ fileDuration: (f) => ({ a: 2, b: 5 })[f] });

  it('Single: its longest file; Loop: one pass through its files', () => {
    expect(padDuration(pad('s', { files: ['a', 'b'] }), c)).toBe(5);
    expect(padDuration(loop('l', { files: ['a', 'b'] }), c)).toBe(7);
  });

  it('Combo: the sum of waits and fade-outs; unknown when there are none', () => {
    expect(
      padDuration(
        combo('c', [
          { padIds: [], duration: 2 },
          { padIds: [], fadeOutAll: 1.5 },
        ]),
        c,
      ),
    ).toBe(3.5);
    expect(padDuration(combo('c', [{ padIds: ['x'] }]), c)).toBeUndefined();
  });

  it('unknown files are left out; no known file → unknown', () => {
    expect(padDuration(pad('s', { files: ['a', 'zzz'] }), c)).toBe(2);
    expect(padDuration(pad('s', { files: ['zzz'] }), c)).toBeUndefined();
    expect(padDuration(pad('s'), c)).toBeUndefined();
  });
});

describe('isPadSort / labels', () => {
  it('accepts every key with a direction; rejects anything else', () => {
    for (const key of PAD_SORT_KEYS) expect(isPadSort({ key, reversed: true })).toBe(true);
    for (const bad of [
      null,
      'name',
      {},
      { key: 'name' },
      { key: 'size', reversed: false },
      { key: 'name', reversed: 'no' },
    ])
      expect(isPadSort(bad)).toBe(false);
  });

  it('every key has a label and the default sorts by name A→Z', () => {
    expect(PAD_SORT_KEYS.every((k) => PAD_SORT_LABELS[k].length > 0)).toBe(true);
    expect(DEFAULT_PAD_SORT).toEqual({ key: 'name', reversed: false });
  });
});
