// ─────────────────────────────────────────────────────────────────────────────
// comboModel — property-based tests (Slice 11)
// Random combo graphs (combos referencing each other and singles): breakCycles always leaves a
// board without cycles, only removes references (never adds or reorders), and leaves a board
// that had no cycle as it was. Example-based tests: comboModel.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { fc, test } from '@fast-check/vitest';
import type { Board, ComboPad, Pad } from '../../src/types';
import { breakCycles, combosInCycles } from '../../src/lib/comboModel';
import { newPad } from '../../src/lib/padUtils';

const COMBOS = 5;
const ids = [...Array.from({ length: COMBOS }, (_, i) => `c${i}`), 's0', 's1'];

const graph = fc.array(
  fc.array(fc.array(fc.constantFrom(...ids), { maxLength: 3 }), { maxLength: 3 }),
  { minLength: COMBOS, maxLength: COMBOS },
);

function toBoard(stepsPerCombo: string[][][]): Board {
  const combos: ComboPad[] = stepsPerCombo.map((steps, i) => ({
    ...newPad(`c${i}`, 'combo', `c${i}`),
    type: 'combo',
    steps: steps.map((padIds) => ({ padIds })),
  }));
  const pads: Pad[] = [...combos, newPad('s0', 'single', 's0'), newPad('s1', 'single', 's1')];
  return { id: 'b', name: 'B', themeId: 'hearth', pads, decks: [], quickAccess: [] };
}

const isSubsequence = (part: string[], whole: string[]) => {
  let i = 0;
  for (const x of whole) if (x === part[i]) i++;
  return i === part.length;
};

describe('breakCycles — property', () => {
  test.prop([graph])('the result never has a cycle and only lost references', (g) => {
    const before = toBoard(g);
    const { board: after, removed } = breakCycles(before);
    expect(combosInCycles(after)).toEqual([]);
    let lost = 0;
    before.pads.forEach((p, i) => {
      const q = after.pads[i];
      if (p.type !== 'combo' || q.type !== 'combo') return expect(q).toEqual(p);
      expect(q.steps).toHaveLength(p.steps.length);
      p.steps.forEach((s, k) => {
        expect(isSubsequence(q.steps[k].padIds, s.padIds)).toBe(true);
        lost += s.padIds.length - q.steps[k].padIds.length;
      });
    });
    expect(removed).toBe(lost);
  });

  test.prop([graph])('a board without a cycle stays as it is', (g) => {
    const b = toBoard(g);
    fc.pre(combosInCycles(b).length === 0);
    expect(breakCycles(b)).toEqual({ board: b, removed: 0 });
  });
});
