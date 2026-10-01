// ─────────────────────────────────────────────────────────────────────────────
// UI preferences in localStorage (ADR-0014: small UI state only — never boards or audio)
//
// Keys: `sos-v3:<name>[:<id>]`. Web Storage is shared by the whole origin, and V1 runs on the
// same origin (fabjun.github.io) — the prefix keeps V3's keys apart, like the IndexedDB name.
// Storage can be unavailable or full (private mode, quota): reads then return null and writes
// are skipped — a preference is never worth an error.
// ─────────────────────────────────────────────────────────────────────────────

const PREFIX = 'sos-v3:';

/** The view a board showed last: a deck id, or the All pads view. */
export type BoardView = { kind: 'deck'; deckId: string } | { kind: 'all-pads' };

const lastViewKey = (boardId: string) => `${PREFIX}last-view:${boardId}`;

/** The view this board showed last (owner decision 2026-10-02), or null when none is stored. */
export function getLastView(boardId: string): BoardView | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(lastViewKey(boardId));
  } catch {
    return null;
  }
  if (raw === 'all-pads') return { kind: 'all-pads' };
  if (raw?.startsWith('deck:')) return { kind: 'deck', deckId: raw.slice('deck:'.length) };
  return null;
}

export function setLastView(boardId: string, view: BoardView): void {
  try {
    localStorage.setItem(
      lastViewKey(boardId),
      view.kind === 'all-pads' ? 'all-pads' : `deck:${view.deckId}`,
    );
  } catch {
    // unavailable or full — the board then opens in its first deck
  }
}

/** Forgets the stored view, e.g. when the board is deleted. */
export function clearLastView(boardId: string): void {
  try {
    localStorage.removeItem(lastViewKey(boardId));
  } catch {
    // nothing stored that could be removed
  }
}
