// ─────────────────────────────────────────────────────────────────────────────
// sceneConflict — unit tests
//
// findConflictingScene is pure: no IDB, no signals, no DOM. No mocks needed.
// ─────────────────────────────────────────────────────────────────────────────

import type { Scene } from '../../src/types';
import { findConflictingScene } from '../../src/lib/sceneConflict';

function makeScene(id: string, name: string): Scene {
  return {
    id,
    name,
    order: 0,
    gridConfig: { cols: 4, rows: 4, gap: 8, padSize: 'md' },
    pads: [],
  };
}

const s1 = makeScene('id-1', 'Ambush');
const s2 = makeScene('id-2', 'Council');
const s3 = makeScene('id-3', 'ambush'); // intentional duplicate of s1 (case variant)
const scenes = [s1, s2];

describe('findConflictingScene', () => {
  test('empty candidate returns null', () => {
    expect(findConflictingScene(scenes, '', 'id-1')).toBeNull();
  });

  test('whitespace-only candidate returns null', () => {
    expect(findConflictingScene(scenes, '   ', 'id-1')).toBeNull();
  });

  test('no matching scene returns null', () => {
    expect(findConflictingScene(scenes, 'Prologue', 'id-99')).toBeNull();
  });

  test('exact match returns the owner scene', () => {
    expect(findConflictingScene(scenes, 'Council', 'id-1')).toBe(s2);
  });

  test('self-exclusion: same name as excludeId scene is not a conflict', () => {
    // renaming s1 to its own current name — not a conflict
    expect(findConflictingScene(scenes, 'Ambush', 'id-1')).toBeNull();
  });

  test('case-insensitive: lowercase candidate collides with stored title-case name', () => {
    expect(findConflictingScene(scenes, 'ambush', 'id-99')).toBe(s1);
  });

  test('trim: trailing space on candidate still collides', () => {
    expect(findConflictingScene(scenes, 'Ambush ', 'id-99')).toBe(s1);
  });

  test('stored name with leading/trailing spaces collides with trimmed candidate', () => {
    const spacedScenes = [makeScene('id-a', ' Ambush '), s2];
    expect(findConflictingScene(spacedScenes, 'ambush', 'id-99')).toBe(spacedScenes[0]);
  });

  test('returns first colliding scene when multiple scenes share a name', () => {
    const dupeScenes = [s1, s2, s3]; // s1='Ambush', s3='ambush'
    const result = findConflictingScene(dupeScenes, 'ambush', 'id-99');
    expect(result).toBe(s1); // first match
  });
});
