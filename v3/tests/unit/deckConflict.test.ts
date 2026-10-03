// ─────────────────────────────────────────────────────────────────────────────
// deckConflict — unit tests
//
// findConflictingDeck is pure: no IDB, no signals, no DOM. No mocks needed.
// ─────────────────────────────────────────────────────────────────────────────

import type { Deck } from '../../src/types';
import { findConflictingDeck } from '../../src/lib/deckConflict';

function makeDeck(id: string, name: string): Deck {
  return {
    id,
    name,
    order: 0,
    gridConfig: { cols: 4, rows: 4, gap: 8, padSize: 'md' },
    placements: [],
  };
}

const s1 = makeDeck('id-1', 'Ambush');
const s2 = makeDeck('id-2', 'Council');
const s3 = makeDeck('id-3', 'ambush'); // intentional duplicate of s1 (case variant)
const decks = [s1, s2];

describe('findConflictingDeck', () => {
  test('empty candidate returns null', () => {
    expect(findConflictingDeck(decks, '', 'id-1')).toBeNull();
  });

  test('whitespace-only candidate returns null', () => {
    expect(findConflictingDeck(decks, '   ', 'id-1')).toBeNull();
  });

  test('no matching deck returns null', () => {
    expect(findConflictingDeck(decks, 'Prologue', 'id-99')).toBeNull();
  });

  test('exact match returns the owner deck', () => {
    expect(findConflictingDeck(decks, 'Council', 'id-1')).toBe(s2);
  });

  test('self-exclusion: same name as excludeId deck is not a conflict', () => {
    // renaming s1 to its own current name — not a conflict
    expect(findConflictingDeck(decks, 'Ambush', 'id-1')).toBeNull();
  });

  test('case-insensitive: lowercase candidate collides with stored title-case name', () => {
    expect(findConflictingDeck(decks, 'ambush', 'id-99')).toBe(s1);
  });

  test('trim: trailing space on candidate still collides', () => {
    expect(findConflictingDeck(decks, 'Ambush ', 'id-99')).toBe(s1);
  });

  test('stored name with leading/trailing spaces collides with trimmed candidate', () => {
    const spacedDecks = [makeDeck('id-a', ' Ambush '), s2];
    expect(findConflictingDeck(spacedDecks, 'ambush', 'id-99')).toBe(spacedDecks[0]);
  });

  test('returns first colliding deck when multiple decks share a name', () => {
    const dupeDecks = [s1, s2, s3]; // s1='Ambush', s3='ambush'
    const result = findConflictingDeck(dupeDecks, 'ambush', 'id-99');
    expect(result).toBe(s1); // first match
  });
});
