import type { Scene } from '../types';

/**
 * Returns the first scene whose name collides with candidateName, or null.
 * Collision is trimmed + case-insensitive. excludeId is the scene being renamed
 * (self-exclusion: same name typed back is not a conflict).
 */
export function findConflictingScene(
  scenes: Scene[],
  candidateName: string,
  excludeId: string,
): Scene | null {
  const normalized = candidateName.trim().toLowerCase();
  if (!normalized) return null;
  return (
    scenes.find((s) => s.id !== excludeId && s.name.trim().toLowerCase() === normalized) ?? null
  );
}
