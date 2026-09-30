// ─────────────────────────────────────────────────────────────────────────────
// padUtils — unit tests
//
// All functions are pure: no IDB, no signals, no DOM. No mocks needed.
// ─────────────────────────────────────────────────────────────────────────────

import type { Pad, PadPosition, SinglePad } from '../../src/types';
import {
  nextFreeSlot,
  posToIndex,
  indexToPos,
  typeInference,
  padMigrationMatrix,
  applyTypeChange,
  padTypeLabel,
  padTypeColor,
  padTypeGlow,
} from '../../src/lib/padUtils';

// ── Test factory ──────────────────────────────────────────────────────────────

function makePad(
  id: string,
  pos: PadPosition | null,
  overrides?: Partial<Omit<SinglePad, 'type'>>,
): SinglePad {
  return {
    id,
    type: 'single',
    name: `Pad ${id}`,
    position: pos,
    volume: 80,
    fadeIn: 0,
    fadeOut: 0,
    ...overrides,
  };
}

// ── nextFreeSlot ──────────────────────────────────────────────────────────────

describe('nextFreeSlot', () => {
  test('empty grid returns top-left (0,0)', () => {
    expect(nextFreeSlot([], 4, 4)).toEqual({ col: 0, row: 0 });
  });

  test('full grid returns null', () => {
    const pads: Pad[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        pads.push(makePad(`${col}-${row}`, { col, row }));
      }
    }
    expect(nextFreeSlot(pads, 4, 4)).toBeNull();
  });

  test('row-major scan: skips occupied slots, returns first free', () => {
    // Occupy (0,0) and (1,0), first free should be (2,0)
    const pads = [makePad('a', { col: 0, row: 0 }), makePad('b', { col: 1, row: 0 })];
    expect(nextFreeSlot(pads, 4, 4)).toEqual({ col: 2, row: 0 });
  });

  test('wraps to next row when first row is full', () => {
    const pads = [
      makePad('a', { col: 0, row: 0 }),
      makePad('b', { col: 1, row: 0 }),
      makePad('c', { col: 2, row: 0 }),
      makePad('d', { col: 3, row: 0 }),
    ];
    expect(nextFreeSlot(pads, 4, 4)).toEqual({ col: 0, row: 1 });
  });

  test('pads with position null are ignored (not counted as occupied)', () => {
    const pads = [makePad('unplaced', null)];
    expect(nextFreeSlot(pads, 4, 4)).toEqual({ col: 0, row: 0 });
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

// ── typeInference ─────────────────────────────────────────────────────────────

describe('typeInference', () => {
  test('short clip (< 5s) → single', () => {
    expect(typeInference(4.9, 1)).toBe('single');
  });

  test('boundary 5.0s → single (ambiguous zone, defaults single)', () => {
    expect(typeInference(5.0, 1)).toBe('single');
  });

  test('upper ambiguous zone (9.99s) → single', () => {
    expect(typeInference(9.99, 1)).toBe('single');
  });

  test('boundary 10.0s → loop', () => {
    expect(typeInference(10.0, 1)).toBe('loop');
  });

  test('long clip (30s) → loop', () => {
    expect(typeInference(30, 1)).toBe('loop');
  });

  test('multi-file overrides duration: 1s + 2 files → playlist', () => {
    expect(typeInference(1, 2)).toBe('playlist');
  });

  test('multi-file overrides even long duration: 30s + 3 files → playlist', () => {
    expect(typeInference(30, 3)).toBe('playlist');
  });
});

// ── padMigrationMatrix ────────────────────────────────────────────────────────

describe('padMigrationMatrix — same type', () => {
  test('single → single = add, no drops', () => {
    const r = padMigrationMatrix('single', 'single');
    expect(r.verdict).toBe('add');
    expect(r.drops).toHaveLength(0);
  });
});

describe('padMigrationMatrix — single source', () => {
  test('single → loop = add (loop point added, source preserved)', () => {
    const r = padMigrationMatrix('single', 'loop');
    expect(r.verdict).toBe('add');
    expect(r.keeps).toContain('audio source');
    expect(r.drops).toHaveLength(0);
  });

  test('single → playlist = migrate (source becomes item 1)', () => {
    const r = padMigrationMatrix('single', 'playlist');
    expect(r.verdict).toBe('migrate');
    expect(r.migrates).toContain('audio source → playlist item 1');
  });

  test('single → combo = reset', () => {
    expect(padMigrationMatrix('single', 'combo').verdict).toBe('reset');
  });
});

describe('padMigrationMatrix — loop source', () => {
  test('loop → single = drop (loop point dropped)', () => {
    const r = padMigrationMatrix('loop', 'single');
    expect(r.verdict).toBe('drop');
    expect(r.drops).toContain('loop point');
    expect(r.keeps).toContain('audio source');
  });

  test('loop → playlist = migrate', () => {
    const r = padMigrationMatrix('loop', 'playlist');
    expect(r.verdict).toBe('migrate');
    expect(r.drops).toContain('loop point');
  });

  test('loop → combo = reset', () => {
    expect(padMigrationMatrix('loop', 'combo').verdict).toBe('reset');
  });
});

describe('padMigrationMatrix — playlist source', () => {
  test('playlist → single = lossy (items 2+ dropped)', () => {
    const r = padMigrationMatrix('playlist', 'single');
    expect(r.verdict).toBe('lossy');
    expect(r.drops).toContain('playlist items 2+');
  });

  test('playlist → loop = lossy', () => {
    const r = padMigrationMatrix('playlist', 'loop');
    expect(r.verdict).toBe('lossy');
    expect(r.drops).toContain('playlist items 2+');
  });

  test('playlist → combo = reset', () => {
    expect(padMigrationMatrix('playlist', 'combo').verdict).toBe('reset');
  });
});

describe('padMigrationMatrix — combo source always resets', () => {
  test('combo → single = reset', () => {
    expect(padMigrationMatrix('combo', 'single').verdict).toBe('reset');
  });
  test('combo → loop = reset', () => {
    expect(padMigrationMatrix('combo', 'loop').verdict).toBe('reset');
  });
  test('combo → playlist = reset', () => {
    expect(padMigrationMatrix('combo', 'playlist').verdict).toBe('reset');
  });
});

// ── applyTypeChange ───────────────────────────────────────────────────────────

describe('applyTypeChange', () => {
  test('RESET case: clears libraryItemRef', () => {
    const pad = makePad(
      'p1',
      { col: 0, row: 0 },
      {
        libraryItemRef: 'abc123',
      },
    );
    const result = applyTypeChange(pad, 'combo'); // single→combo = reset
    expect(result.type).toBe('combo');
    expect(result).not.toHaveProperty('libraryItemRef');
  });

  test('non-RESET case (ADD): preserves libraryItemRef', () => {
    const pad = makePad(
      'p1',
      { col: 0, row: 0 },
      {
        libraryItemRef: 'abc123',
      },
    );
    const result = applyTypeChange(pad, 'loop'); // single→loop = add
    expect(result.type).toBe('loop');
    expect(result).toHaveProperty('libraryItemRef', 'abc123');
  });

  test('LOSSY case: preserves libraryItemRef (item 1 survives)', () => {
    // PlaylistPad requires files: string[]; first file becomes libraryItemRef on conversion
    const pad: Pad = {
      id: 'p1',
      type: 'playlist',
      name: 'Pad p1',
      position: { col: 0, row: 0 },
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      files: ['xyz789'],
    };
    const result = applyTypeChange(pad, 'single'); // playlist→single = lossy
    expect(result.type).toBe('single');
    expect(result).toHaveProperty('libraryItemRef', 'xyz789');
  });

  test('immutable: original pad is unchanged', () => {
    const pad = makePad(
      'p1',
      { col: 0, row: 0 },
      {
        libraryItemRef: 'abc123',
      },
    );
    applyTypeChange(pad, 'combo');
    expect(pad.type).toBe('single');
    expect(pad.libraryItemRef).toBe('abc123');
  });
});

// ── padTypeLabel / padTypeColor / padTypeGlow ─────────────────────────────────

describe('padTypeLabel', () => {
  test('single → SGL', () => {
    expect(padTypeLabel('single')).toBe('SGL');
  });
  test('loop → LOOP', () => {
    expect(padTypeLabel('loop')).toBe('LOOP');
  });
  test('playlist → LIST', () => {
    expect(padTypeLabel('playlist')).toBe('LIST');
  });
  test('combo → COMBO', () => {
    expect(padTypeLabel('combo')).toBe('COMBO');
  });
});

describe('padTypeColor', () => {
  test('returns var() token for each type', () => {
    expect(padTypeColor('single')).toBe('var(--pad-single)');
    expect(padTypeColor('loop')).toBe('var(--pad-loop)');
    expect(padTypeColor('playlist')).toBe('var(--pad-playlist)');
    expect(padTypeColor('combo')).toBe('var(--pad-combo)');
  });
});

describe('padTypeGlow', () => {
  test('returns glow token for each type', () => {
    expect(padTypeGlow('single')).toBe('var(--pad-single-glow)');
    expect(padTypeGlow('loop')).toBe('var(--pad-loop-glow)');
    expect(padTypeGlow('playlist')).toBe('var(--pad-playlist-glow)');
    expect(padTypeGlow('combo')).toBe('var(--pad-combo-glow)');
  });
});
