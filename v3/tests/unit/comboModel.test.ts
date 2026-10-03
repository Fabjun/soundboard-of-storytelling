// ─────────────────────────────────────────────────────────────────────────────
// comboModel — combo steps and protection against cycles (Slice 11)
// Edge-case checklist: no steps / one / many, self reference, direct and indirect cycles, shared
// sub-combos (a diamond is not a cycle), step operations at the ends, bad durations.
// ─────────────────────────────────────────────────────────────────────────────

import type { Board, ComboPad, ComboStep, Pad } from '../../src/types';
import {
  addPadToStep,
  addStep,
  breakCycles,
  canStartInCombo,
  comboReach,
  combosInCycles,
  removePadFromStep,
  removeStep,
  setStepDuration,
  setStepStopAll,
} from '../../src/lib/comboModel';
import { newPad } from '../../src/lib/padUtils';
import { boardProblems } from '../../src/lib/boardModel';

const combo = (id: string, steps: string[][]): ComboPad => ({
  id,
  type: 'combo',
  name: id,
  volume: 80,
  fadeIn: 0,
  fadeOut: 0,
  steps: steps.map((padIds) => ({ padIds })),
});

const board = (pads: Pad[]): Board => ({
  id: 'b',
  name: 'B',
  themeId: 'hearth',
  pads,
  decks: [],
  quickAccess: [],
});

const single = (id: string) => newPad(id, 'single', id);

describe('comboReach / canStartInCombo', () => {
  // A starts B and s1; B starts C; C starts s2. D starts B and C (a diamond, no cycle).
  const b = board([
    combo('A', [['B', 's1']]),
    combo('B', [['C']]),
    combo('C', [[], ['s2']]),
    combo('D', [['B'], ['C']]),
    single('s1'),
    single('s2'),
  ]);

  it('collects every pad a combo starts, through nested combos', () => {
    expect([...comboReach(b, 'A')].sort()).toEqual(['B', 'C', 's1', 's2']);
    expect([...comboReach(b, 's1')]).toEqual([]);
    expect([...comboReach(b, 'missing')]).toEqual([]);
  });

  it('a combo may start any pad or combo that does not lead back to it', () => {
    expect(canStartInCombo(b, 'C', 's1')).toBe(true);
    expect(canStartInCombo(b, 'D', 'A')).toBe(true); // A does not reach D
  });

  it('never itself, and nothing that leads back to it — directly or through others', () => {
    expect(canStartInCombo(b, 'A', 'A')).toBe(false);
    expect(canStartInCombo(b, 'B', 'A')).toBe(false); // A → B
    expect(canStartInCombo(b, 'C', 'A')).toBe(false); // A → B → C
    expect(canStartInCombo(b, 'C', 'D')).toBe(false); // D → C
  });

  it('a diamond is not a cycle', () => {
    expect(combosInCycles(b)).toEqual([]);
    expect(boardProblems(b)).toEqual([]);
  });
});

describe('combosInCycles / boardProblems', () => {
  it('finds a self reference and every combo on a longer cycle', () => {
    const b = board([combo('S', [['S']]), combo('X', [['Y']]), combo('Y', [[], ['X']])]);
    expect(combosInCycles(b).sort()).toEqual(['S', 'X', 'Y']);
    expect(boardProblems(b)).toEqual([
      'combo S: starts itself (cycle)',
      'combo X: starts itself (cycle)',
      'combo Y: starts itself (cycle)',
    ]);
  });
});

describe('breakCycles', () => {
  it('removes only references that close a cycle and counts them', () => {
    const b = board([
      combo('A', [['B', 's1']]),
      combo('B', [['A'], ['s1']]),
      combo('S', [['S', 's1']]),
      single('s1'),
    ]);
    const { board: fixed, removed } = breakCycles(b);
    expect(removed).toBe(2);
    const steps = (id: string) => (fixed.pads.find((p) => p.id === id) as ComboPad).steps;
    expect(steps('A')).toEqual([{ padIds: ['s1'] }]); // A → B removed (B led back to A)
    expect(steps('B')).toEqual([{ padIds: ['A'] }, { padIds: ['s1'] }]); // now fine
    expect(steps('S')).toEqual([{ padIds: ['s1'] }]);
    expect(combosInCycles(fixed)).toEqual([]);
  });

  it('leaves a board without cycles unchanged', () => {
    const b = board([combo('A', [['B']]), combo('B', [['s1']]), single('s1')]);
    expect(breakCycles(b)).toEqual({ board: b, removed: 0 });
  });
});

describe('step operations', () => {
  const two: ComboStep[] = [{ padIds: ['a'] }, { padIds: [], duration: 2, stopAll: true }];

  it('adds an empty step at the end and removes a step by index', () => {
    expect(addStep([])).toEqual([{ padIds: [] }]);
    expect(addStep(two)).toEqual([...two, { padIds: [] }]);
    expect(removeStep(two, 0)).toEqual([two[1]]);
    expect(removeStep(two, 5)).toEqual(two);
  });

  it('adds a pad to one step once, removes it again, other steps untouched', () => {
    let s = addPadToStep(two, 1, 'b');
    s = addPadToStep(s, 1, 'b');
    expect(s).toEqual([{ padIds: ['a'] }, { padIds: ['b'], duration: 2, stopAll: true }]);
    expect(removePadFromStep(s, 1, 'b')[1].padIds).toEqual([]);
    expect(removePadFromStep(s, 1, 'b')[0]).toEqual({ padIds: ['a'] });
  });

  it('removing a pad keeps the other pads of the step', () => {
    const s = removePadFromStep([{ padIds: ['a', 'b', 'c'] }], 0, 'b');
    expect(s).toEqual([{ padIds: ['a', 'c'] }]);
  });

  it('sets the wait in seconds; 0, negative or not a number removes it', () => {
    expect(setStepDuration(two, 0, 1.5)[0]).toEqual({ padIds: ['a'], duration: 1.5 });
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(setStepDuration(two, 1, bad)[1]).toEqual({ padIds: [], stopAll: true });
    }
  });

  it('switches "stop everything first" on and off', () => {
    expect(setStepStopAll(two, 0, true)[0]).toEqual({ padIds: ['a'], stopAll: true });
    expect(setStepStopAll(two, 1, false)[1]).toEqual({ padIds: [], duration: 2 });
  });

  it('never changes the array it gets', () => {
    const copy = structuredClone(two);
    addStep(two);
    removeStep(two, 0);
    addPadToStep(two, 0, 'x');
    removePadFromStep(two, 0, 'a');
    setStepDuration(two, 0, 3);
    setStepStopAll(two, 0, true);
    expect(two).toEqual(copy);
  });
});
