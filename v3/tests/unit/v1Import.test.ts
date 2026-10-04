/**
 * @fileoverview v1Import — V1 board → V3 board (D5). Synthetic V1 data only — the owner's real backup is
 * never committed (public repo).
 * Edge-case checklist: every V1 mode incl. the legacy ones, missing / malformed fields, gaps in
 * V1's pad array, combo references (valid, missing), files not available, name collisions,
 * more pads than a 4×4 deck.
 */

import type { ComboPad, LoopPad, SinglePad } from '../../src/types';
import {
  emptyNotes,
  mapV1Board,
  uniqueBoardName,
  V1_FADE_OUT_ALL_DEFAULT,
  type V1MapContext,
} from '../../src/lib/v1Import';
import { boardProblems } from '../../src/lib/boardModel';

function context(over: Partial<V1MapContext> = {}): V1MapContext {
  let n = 0;
  return {
    newId: () => `n${n++}`,
    fileId: (h) => (h.startsWith('missing') ? undefined : `id-${h}`),
    takenNames: new Set(),
    notes: emptyNotes(),
    ...over,
  };
}

const v1Board = (pads: unknown[], name = 'Night') => ({ id: 'board_1', name, pads });

describe('mapV1Board', () => {
  it('makes one board with one deck holding every pad in V1 order, keys on the placements', () => {
    const ctx = context();
    const b = mapV1Board(
      v1Board([
        { name: 'Owl', mode: 'once', files: ['h1'], key: 'Numpad1', volume: 50 },
        null, // a gap in V1's pad array
        { name: 'Rain', mode: 'loop', files: ['h2'] },
      ]),
      ctx,
    )!;
    expect(b.name).toBe('Night');
    expect(b.decks).toHaveLength(1);
    expect(b.decks[0].name).toBe('Deck 1');
    expect(b.pads.map((p) => p.name)).toEqual(['Owl', 'Rain']);
    expect(b.decks[0].placements).toEqual([
      { padId: b.pads[0].id, position: { col: 0, row: 0 }, hotkey: 'Numpad1' },
      { padId: b.pads[1].id, position: { col: 1, row: 0 } },
    ]);
    expect(boardProblems(b)).toEqual([]);
  });

  it('maps the modes: once → Single, loop → Loop, playlist / chain / random → Loop', () => {
    const b = mapV1Board(
      v1Board([
        { mode: 'once', files: ['a', 'b'] },
        { mode: 'loop', files: ['a'], loopCount: 3 },
        { mode: 'playlist', files: ['a', 'b'], shuffle: true },
        { mode: 'chain', files: ['a', 'b'] },
        { mode: 'random', files: ['a', 'b'] },
      ]),
      context(),
    )!;
    const [once, loop, playlist, chain, random] = b.pads as (SinglePad | LoopPad)[];
    expect([once.type, once.files, once.order]).toEqual([
      'single',
      [{ hash: 'id-a' }, { hash: 'id-b' }],
      'sequential',
    ]);
    expect([loop.type, loop.order]).toEqual(['loop', 'sequential']);
    expect([playlist.type, playlist.order]).toEqual(['loop', 'shuffle']);
    expect([chain.type, chain.order]).toEqual(['loop', 'sequential']);
    expect([random.type, random.order]).toEqual(['loop', 'shuffle']);
  });

  it('keeps volume, fades, trim and the first icon; clamps volume; defaults what is missing', () => {
    const ctx = context();
    const b = mapV1Board(
      v1Board([
        {
          mode: 'once',
          files: ['a', 'b'],
          volume: 140,
          fadeIn: 1.5,
          fadeOut: 2,
          trimStart: 1,
          trimEnd: 4,
          icons: ['owl'],
        },
        { mode: 'once', volume: 'loud', fadeIn: -3 },
      ]),
      ctx,
    )!;
    // V1 trimmed whichever file a Single played: every file gets the trim (ADR-0068)
    expect(b.pads[0]).toMatchObject({
      volume: 100,
      fadeIn: 1.5,
      fadeOut: 2,
      files: [
        { hash: 'id-a', trimStart: 1, trimEnd: 4 },
        { hash: 'id-b', trimStart: 1, trimEnd: 4 },
      ],
      iconRef: 'owl',
    });
    expect(b.pads[0]).not.toHaveProperty('trimStart');
    expect(b.pads[1]).toMatchObject({
      name: 'Pad 2',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      files: [],
    });
  });

  it('a playlist keeps no trim — V1 played its files whole; a loop keeps it (ADR-0068)', () => {
    const trim = { trimStart: 1, trimEnd: 4 };
    const b = mapV1Board(
      v1Board([
        { mode: 'playlist', files: ['a', 'b'], ...trim },
        { mode: 'loop', files: ['a'], ...trim },
      ]),
      context(),
    )!;
    const [playlist, loop] = b.pads as LoopPad[];
    expect(playlist.files).toEqual([{ hash: 'id-a' }, { hash: 'id-b' }]);
    expect(loop.files).toEqual([{ hash: 'id-a', ...trim }]);
  });

  it('maps combo steps to the new pad ids, with duration, stop all and fade out all', () => {
    const ctx = context();
    const b = mapV1Board(
      v1Board([
        { mode: 'once', files: ['a'] },
        { mode: 'loop', files: ['b'] },
        {
          mode: 'combo',
          steps: [
            { pads: [0, 1], dur: 3 },
            { pads: [], stopAll: true },
            { pads: [], fadeOutAll: true, dur: 4 },
            { pads: [], fadeOutAll: true },
            { pads: [0, 7] }, // 7 does not exist
          ],
        },
      ]),
      ctx,
    )!;
    const [a, loop, combo] = b.pads as [SinglePad, LoopPad, ComboPad];
    expect(combo.steps).toEqual([
      { padIds: [a.id, loop.id], duration: 3 },
      { padIds: [], stopAll: true },
      { padIds: [], fadeOutAll: 4 }, // V1 uses dur as the fade time here
      { padIds: [], fadeOutAll: V1_FADE_OUT_ALL_DEFAULT },
      { padIds: [a.id] },
    ]);
    expect(ctx.notes.missingStepPads).toBe(1);
    expect(boardProblems(b)).toEqual([]);
  });

  it('counts what it drops: per-pad combo options, unknown modes, missing files', () => {
    const ctx = context();
    mapV1Board(
      v1Board([
        { mode: 'loop', files: ['a'], loopCount: 2 },
        {
          mode: 'combo',
          steps: [
            { pads: [0], chipOpts: [{ vol: 50 }] },
            { pads: [0], chipOpts: [null] },
          ],
        },
        { mode: 'mystery', files: ['missing-1', 'b'] },
      ]),
      ctx,
    );
    // A loop count is no longer dropped: it becomes the repeat count (ADR-0069)
    expect(ctx.notes).toEqual({
      comboPadOptions: 1,
      missingStepPads: 0,
      unknownModes: 1,
      missingFiles: 1,
      cycleRefs: 0,
    });
  });

  it('a V1 loop count becomes the repeat count — ∞ (0 or none) stays unset, a huge one is capped', () => {
    const b = mapV1Board(
      v1Board([
        { mode: 'loop', files: ['a'], loopCount: 3 },
        { mode: 'loop', files: ['a'], loopCount: 0 },
        { mode: 'loop', files: ['a'] },
        { mode: 'loop', files: ['a'], loopCount: 5000 },
        { mode: 'loop', files: ['a'], loopCount: 2.7 },
      ]),
      context(),
    )!;
    const repeats = (b.pads as LoopPad[]).map((p) => p.repeat);
    expect(repeats).toEqual([3, undefined, undefined, 999, 2]);
    expect(b.pads[1]).not.toHaveProperty('repeat');
  });

  it('a board with more pads than a 4×4 deck gets more rows; its name gets a suffix when taken', () => {
    const pads = Array.from({ length: 31 }, () => ({ mode: 'once' }));
    const b = mapV1Board(v1Board(pads, 'Board 1'), context({ takenNames: new Set(['Board 1']) }))!;
    expect(b.name).toBe('Board 1 (2)');
    expect(b.decks[0].gridConfig.rows).toBe(8);
    expect(b.decks[0].placements.at(-1)!.position).toEqual({ col: 2, row: 7 });
    expect(boardProblems(b)).toEqual([]);
  });

  it('every id is new; malformed input gives null or an empty board, never an exception', () => {
    const b = mapV1Board(v1Board([{ mode: 'once' }]), context())!;
    expect(new Set([b.id, b.decks[0].id, b.pads[0].id]).size).toBe(3);
    expect(b.id).not.toBe('board_1');
    expect(mapV1Board(null, context())).toBeNull();
    expect(mapV1Board('board', context())).toBeNull();
    expect(mapV1Board({ pads: 'x' }, context())).toMatchObject({
      name: 'Imported board',
      pads: [],
    });
  });
});

describe('mapV1Board — combos that would start themselves', () => {
  it('drops step references that close a cycle and counts them', () => {
    const ctx = context();
    const b = mapV1Board(
      v1Board([
        { mode: 'combo', steps: [{ pads: [1] }] }, // 0 → 1
        { mode: 'combo', steps: [{ pads: [0] }, { pads: [2] }] }, // 1 → 0: a cycle
        { mode: 'once' },
        { mode: 'combo', steps: [{ pads: [3, 2] }] }, // starts itself
      ]),
      ctx,
    )!;
    expect(ctx.notes.cycleRefs).toBe(2);
    expect(boardProblems(b)).toEqual([]);
    const [c0, c1, s, c3] = b.pads as [ComboPad, ComboPad, SinglePad, ComboPad];
    expect(c0.steps).toEqual([{ padIds: [] }]);
    expect(c1.steps).toEqual([{ padIds: [c0.id] }, { padIds: [s.id] }]);
    expect(c3.steps).toEqual([{ padIds: [s.id] }]);
  });
});

describe('uniqueBoardName', () => {
  it('keeps a free name, else the first free "(n)"', () => {
    expect(uniqueBoardName('A', new Set())).toBe('A');
    expect(uniqueBoardName('A', new Set(['A']))).toBe('A (2)');
    expect(uniqueBoardName('A', new Set(['A', 'A (2)']))).toBe('A (3)');
  });
});

// Cases added for surviving mutants (local mutation run 2026-10-02, v1Import 82 %).
describe('mapV1Board — malformed and boundary values', () => {
  it('values of the wrong type or empty are treated as missing', () => {
    const ctx = context();
    const b = mapV1Board(
      v1Board([
        { mode: 'once', name: 42, key: '', icons: [7], files: [1, 'a', null] },
        { mode: 'once', name: '', key: 5, icon: 'bell' },
      ]),
      ctx,
    )!;
    expect(b.pads[0]).toEqual({
      id: b.pads[0].id,
      type: 'single',
      name: 'Pad 1',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      files: [{ hash: 'id-a' }],
      order: 'sequential',
    });
    expect(b.pads[1]).toMatchObject({ name: 'Pad 2', iconRef: 'bell' });
    expect(b.decks[0].placements.every((p) => p.hotkey === undefined)).toBe(true);
    expect(ctx.notes.missingFiles).toBe(0); // wrong types are not "missing audio"
  });

  it('a file that is not available is left out of the pad and counted', () => {
    const ctx = context();
    const b = mapV1Board(v1Board([{ mode: 'loop', files: ['missing-x', 'b'] }]), ctx)!;
    expect((b.pads[0] as LoopPad).files).toEqual([{ hash: 'id-b' }]);
    expect(ctx.notes.missingFiles).toBe(1);
  });

  it('combo: malformed steps and references are skipped; a mixed chipOpts step counts once', () => {
    const ctx = context();
    const b = mapV1Board(
      v1Board([
        { mode: 'once' },
        {
          mode: 'combo',
          steps: [
            'not a step',
            { pads: 'x' },
            { pads: ['0', 0] }, // a string reference is not a V1 pad index
            { pads: [0], chipOpts: [null, { vol: 1 }] },
          ],
        },
        { mode: 'combo', steps: 'none' },
      ]),
      ctx,
    )!;
    const combo = b.pads[1] as ComboPad;
    expect(combo.type).toBe('combo');
    expect(combo.steps).toEqual([
      { padIds: [] },
      { padIds: [b.pads[0].id] },
      { padIds: [b.pads[0].id] },
    ]);
    expect((b.pads[2] as ComboPad).steps).toEqual([]);
    expect(ctx.notes.comboPadOptions).toBe(1);
    expect(ctx.notes.missingStepPads).toBe(1);
  });

  it('step durations: 0 or negative mean none; a fade-out-all step without a positive dur fades 2.5 s', () => {
    const b = mapV1Board(
      v1Board([
        {
          mode: 'combo',
          steps: [
            { pads: [], dur: 0 },
            { pads: [], dur: -1 },
            { pads: [], fadeOutAll: true, dur: 0 },
            { pads: [], fadeOutAll: true, dur: -2 },
          ],
        },
      ]),
      context(),
    )!;
    expect((b.pads[0] as ComboPad).steps).toEqual([
      { padIds: [] },
      { padIds: [] },
      { padIds: [], fadeOutAll: V1_FADE_OUT_ALL_DEFAULT },
      { padIds: [], fadeOutAll: V1_FADE_OUT_ALL_DEFAULT },
    ]);
  });

  it('a loop count of 0 is not reported; known modes are not "unknown"; no icon → no iconRef', () => {
    const ctx = context();
    const b = mapV1Board(
      v1Board([
        { mode: 'loop', loopCount: 0 },
        { mode: 'once' },
        { mode: 'playlist' },
        { mode: 'combo' },
      ]),
      ctx,
    )!;
    expect(ctx.notes).toEqual(emptyNotes());
    expect(b.pads.every((p) => !('iconRef' in p))).toBe(true);
  });

  it('an unknown mode becomes a sequential Single; the board uses the default theme', () => {
    const b = mapV1Board(v1Board([{ mode: 'mystery', files: ['a'] }]), context())!;
    expect(b.pads[0]).toMatchObject({
      type: 'single',
      order: 'sequential',
      files: [{ hash: 'id-a' }],
    });
    expect(b.themeId).toBe('hearth');
    expect(b.quickAccess).toEqual([]);
  });
});
