/**
 * @fileoverview padFit — unit tests: the pad side that makes the whole grid fit its panel
 *
 * Edge-case checklist: width binds, height binds, height would go below the touch target (the
 * floor holds, width still wins), one column / one row, no rows, zero or missing size, NaN and
 * Infinity, a gap larger than the panel.
 */

import { MIN_PAD_FIT, padFit } from '../../src/lib/padFit';

const base = { width: 400, height: 800, cols: 4, rows: 4, gap: 8 };

describe('padFit', () => {
  it('is bound by the width when the panel is tall: (400 − 3 gaps) / 4 columns', () => {
    expect(padFit(base)).toBeCloseTo((400 - 24) / 4, 5);
  });

  it('is bound by the height when the panel is short: (200 − 3 gaps) / 4 rows', () => {
    expect(padFit({ ...base, height: 200 })).toBeCloseTo((200 - 24) / 4, 5);
  });

  it('never goes below the touch target for the height — the grid scrolls instead', () => {
    expect(padFit({ ...base, height: 100 })).toBe(MIN_PAD_FIT);
  });

  it('lets the width win over the floor: a narrow panel shrinks pads below the touch target', () => {
    // (130 − 24) / 4 = 26.5 px wide — nothing is cut off
    expect(padFit({ ...base, width: 130, height: 100 })).toBeCloseTo(26.5, 5);
  });

  it('handles one column and one row without a gap', () => {
    expect(padFit({ width: 300, height: 500, cols: 1, rows: 1, gap: 8 })).toBe(300);
  });

  it('is bound by the width alone while there are no rows', () => {
    expect(padFit({ ...base, rows: 0 })).toBeCloseTo((400 - 24) / 4, 5);
  });

  it('is null while the size is not known', () => {
    expect(padFit({ ...base, width: 0 })).toBeNull();
    expect(padFit({ ...base, height: 0 })).toBeNull();
    expect(padFit({ ...base, cols: 0 })).toBeNull();
    expect(padFit({ ...base, width: Number.NaN })).toBeNull();
    expect(padFit({ ...base, height: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it('never returns a negative side when the gaps are wider than the panel', () => {
    expect(padFit({ ...base, width: 10, gap: 20 })).toBe(0);
  });
});
