import type { Deck } from '../types';

/**
 * Returns the first deck whose name collides with candidateName, or null.
 * Collision is trimmed + case-insensitive. excludeId is the deck being renamed
 * (self-exclusion: same name typed back is not a conflict).
 */
export function findConflictingDeck(
  decks: Deck[],
  candidateName: string,
  excludeId: string,
): Deck | null {
  const normalized = candidateName.trim().toLowerCase();
  if (!normalized) return null;
  return (
    decks.find((s) => s.id !== excludeId && s.name.trim().toLowerCase() === normalized) ?? null
  );
}
