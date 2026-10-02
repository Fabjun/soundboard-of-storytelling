// ─────────────────────────────────────────────────────────────────────────────
// padUtils — unit tests
//
// All functions are pure: no IDB, no signals, no DOM. No mocks needed.
// ─────────────────────────────────────────────────────────────────────────────

import type { Pad, PadPosition, Placement, SinglePad } from '../../src/types';
import {
  nextFreeSlot,
  posToIndex,
  indexToPos,
  padMigrationMatrix,
  applyTypeChange,
  padTypeLabel,
  padTypeColor,
  padTypeGlow,
  newPad,
  padBaseOf,
  DEFAULT_PAD_VOLUME,
} from '../../src/lib/padUtils';

// ── Test factory ──────────────────────────────────────────────────────────────

function makePad(id: string, overrides?: Partial<Omit<SinglePad, 'type'>>): SinglePad {
  return {
    id,
    type: 'single',
    name: `Pad ${id}`,
    volume: 80,
    fadeIn: 0,
    fadeOut: 0,
    files: [],
    order: 'sequential',
    ...overrides,
  };
}

/** A placement in a deck (position and key belong to the placement, ADR-0048). */
function makePlacement(id: string, pos: PadPosition): Placement {
  return { padId: id, position: pos };
}

// ── nextFreeSlot ──────────────────────────────────────────────────────────────

describe('nextFreeSlot', () => {
  test('empty grid returns top-left (0,0)', () => {
    expect(nextFreeSlot([], 4, 4)).toEqual({ col: 0, row: 0 });
  });

  test('full grid returns null', () => {
    const placements: Placement[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        placements.push(makePlacement(`${col}-${row}`, { col, row }));
      }
    }
    expect(nextFreeSlot(placements, 4, 4)).toBeNull();
  });

  test('row-major scan: skips occupied slots, returns first free', () => {
    // Occupy (0,0) and (1,0), first free should be (2,0)
    const placements = [
      makePlacement('a', { col: 0, row: 0 }),
      makePlacement('b', { col: 1, row: 0 }),
    ];
    expect(nextFreeSlot(placements, 4, 4)).toEqual({ col: 2, row: 0 });
  });

  test('wraps to next row when first row is full', () => {
    const placements = [
      makePlacement('a', { col: 0, row: 0 }),
      makePlacement('b', { col: 1, row: 0 }),
      makePlacement('c', { col: 2, row: 0 }),
      makePlacement('d', { col: 3, row: 0 }),
    ];
    expect(nextFreeSlot(placements, 4, 4)).toEqual({ col: 0, row: 1 });
  });
});

// ── posToIndex / indexToPos ───────────────────────────────────────────────────

describe('posToIndex', () => {
  test('top-left (0,0) → index 0', () => {
    expect(posToIndex({ col: 0, row: 0 }, 4)).toBe(0);
  });

  test('(1,0) → 1 in 4-col grid', () => {
    expect(posToIndex({ col: 1, row: 0 }, 4)).toBe(1);
  });

  test('(0,1) → 4 in 4-col grid', () => {
    expect(posToIndex({ col: 0, row: 1 }, 4)).toBe(4);
  });

  test('(3,3) → 15 in 4-col grid (last cell)', () => {
    expect(posToIndex({ col: 3, row: 3 }, 4)).toBe(15);
  });
});

describe('indexToPos', () => {
  test('index 0 → (0,0)', () => {
    expect(indexToPos(0, 4)).toEqual({ col: 0, row: 0 });
  });

  test('index 5 → (1,1) in 4-col grid', () => {
    expect(indexToPos(5, 4)).toEqual({ col: 1, row: 1 });
  });

  test('index 15 → (3,3) in 4-col grid', () => {
    expect(indexToPos(15, 4)).toEqual({ col: 3, row: 3 });
  });
});

describe('posToIndex / indexToPos round-trip', () => {
  test('all positions in a 4×4 grid round-trip correctly', () => {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const pos = { col, row };
        const idx = posToIndex(pos, 4);
        expect(indexToPos(idx, 4)).toEqual(pos);
      }
    }
  });
});

// ── newPad ────────────────────────────────────────────────────────────────────

describe('newPad', () => {
  test('a Single / Loop gets the default settings, its files and sequential order', () => {
    expect(newPad('p', 'loop', 'Rain', ['h1'])).toEqual({
      id: 'p',
      type: 'loop',
      name: 'Rain',
      volume: DEFAULT_PAD_VOLUME,
      fadeIn: 0,
      fadeOut: 0,
      files: ['h1'],
      order: 'sequential',
    });
    expect(newPad('p', 'single', '')).toMatchObject({ type: 'single', files: [] });
  });

  test('a Combo starts with no steps and no files', () => {
    expect(newPad('c', 'combo', 'Day', ['ignored'])).toEqual({
      id: 'c',
      type: 'combo',
      name: 'Day',
      volume: DEFAULT_PAD_VOLUME,
      fadeIn: 0,
      fadeOut: 0,
      steps: [],
    });
  });
});

// ── padMigrationMatrix (three types, ADR-0048) ───────────────────────────────

describe('padMigrationMatrix', () => {
  test('same type = add, nothing changes', () => {
    const r = padMigrationMatrix('single', 'single');
    expect(r.verdict).toBe('add');
    expect(r.drops).toEqual([]);
  });

  test('single ↔ loop = add: both keep the audio files', () => {
    for (const [from, to] of [
      ['single', 'loop'],
      ['loop', 'single'],
    ] as const) {
      const r = padMigrationMatrix(from, to);
      expect(r.verdict).toBe('add');
      expect(r.keeps).toContain('audio files');
      expect(r.drops).toEqual([]);
    }
  });

  test('single / loop → combo = reset: the audio files are dropped', () => {
    for (const from of ['single', 'loop'] as const) {
      const r = padMigrationMatrix(from, 'combo');
      expect(r.verdict).toBe('reset');
      expect(r.drops).toEqual(['audio files']);
    }
  });

  test('combo → single / loop = reset: the combo steps are dropped', () => {
    for (const to of ['single', 'loop'] as const) {
      const r = padMigrationMatrix('combo', to);
      expect(r.verdict).toBe('reset');
      expect(r.drops).toEqual(['combo steps']);
    }
  });

  test('the universal fields are always kept', () => {
    expect(padMigrationMatrix('combo', 'loop').keeps).toEqual(
      expect.arrayContaining(['name', 'volume', 'fade in', 'fade out', 'hotkey', 'color', 'icon']),
    );
  });
});

// ── applyTypeChange ───────────────────────────────────────────────────────────

describe('applyTypeChange', () => {
  test('single → loop keeps files, order and trim', () => {
    const pad = makePad('p', { files: ['a', 'b'], order: 'shuffle', trimStart: 1, trimEnd: 4 });
    expect(applyTypeChange(pad, 'loop')).toEqual({
      ...pad,
      type: 'loop',
    });
  });

  test('→ combo drops the files and starts with no steps', () => {
    const r = applyTypeChange(makePad('p', { files: ['a'] }), 'combo');
    expect(r).toMatchObject({ type: 'combo', steps: [] });
    expect('files' in r).toBe(false);
  });

  test('combo → single starts with no files, sequential order', () => {
    const combo: Pad = {
      ...newPad('c', 'combo', 'Day'),
      type: 'combo',
      steps: [{ padIds: ['x'] }],
    };
    expect(applyTypeChange(combo, 'single')).toMatchObject({
      type: 'single',
      files: [],
      order: 'sequential',
    });
  });

  test('combo → combo keeps its steps; universal fields always kept', () => {
    const combo: Pad = {
      ...newPad('c', 'combo', 'Day'),
      type: 'combo',
      steps: [{ padIds: ['x'] }],
      color: 'red',
      volume: 30,
    };
    expect(applyTypeChange(combo, 'combo')).toEqual(combo);
  });

  test('immutable: original pad is unchanged', () => {
    const pad = makePad('p', { files: ['a'] });
    const copy = structuredClone(pad);
    applyTypeChange(pad, 'combo');
    expect(pad).toEqual(copy);
  });
});

// ── Pad type tokens ───────────────────────────────────────────────────────────

describe('padTypeLabel', () => {
  test('one label per type', () => {
    expect(padTypeLabel('single')).toBe('SGL');
    expect(padTypeLabel('loop')).toBe('LOOP');
    expect(padTypeLabel('combo')).toBe('COMBO');
  });
});

describe('padTypeColor', () => {
  test('returns var() token for each type', () => {
    expect(padTypeColor('single')).toBe('var(--pad-single)');
    expect(padTypeColor('loop')).toBe('var(--pad-loop)');
    expect(padTypeColor('combo')).toBe('var(--pad-combo)');
  });
});

describe('padTypeGlow', () => {
  test('returns glow token for each type', () => {
    expect(padTypeGlow('single')).toBe('var(--pad-single-glow)');
    expect(padTypeGlow('loop')).toBe('var(--pad-loop-glow)');
    expect(padTypeGlow('combo')).toBe('var(--pad-combo-glow)');
  });
});

describe('padBaseOf / timestamps (E1)', () => {
  it('keeps every shared field — also added / modified times — and drops only the type fields', () => {
    const pad = makePad('p', {
      files: ['a'],
      trimStart: 1,
      addedAt: 5,
      modifiedAt: 9,
      iconRef: 'owl',
      color: 'red',
    });
    expect(padBaseOf(pad)).toEqual({
      id: 'p',
      name: 'Pad p',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      addedAt: 5,
      modifiedAt: 9,
      iconRef: 'owl',
      color: 'red',
    });
    const combo = applyTypeChange(pad, 'combo');
    expect(padBaseOf(combo)).toEqual(padBaseOf(pad));
  });

  it('a type change keeps the times; newPad stamps the time it is given', () => {
    const pad = makePad('p', { addedAt: 5, modifiedAt: 9 });
    expect(applyTypeChange(pad, 'loop')).toMatchObject({ addedAt: 5, modifiedAt: 9 });
    expect(applyTypeChange(pad, 'combo')).toMatchObject({ addedAt: 5, modifiedAt: 9 });
    expect(newPad('n', 'single', 'N', [], 42)).toMatchObject({ addedAt: 42 });
    expect('addedAt' in newPad('n', 'single', 'N')).toBe(false);
  });
});
