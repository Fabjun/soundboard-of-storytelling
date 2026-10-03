// ─────────────────────────────────────────────────────────────────────────────
// Persistent storage (D4, docs/product/features/data-backup.md; ADR-0061)
//
// Boards and audio live only in this browser's storage, which the browser may evict under storage
// pressure. Asking for persistent storage makes eviction less likely. Invisible to the user (D4).
// navigator.storage.persist() exists on iOS Safari from 15.2 — older browsers simply skip it.
// ─────────────────────────────────────────────────────────────────────────────

export type PersistResult = 'persisted' | 'not-granted' | 'unsupported';

/** Asks the browser to keep this origin's storage. Never throws. */
export async function requestPersistentStorage(): Promise<PersistResult> {
  const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
  if (!storage?.persist) return 'unsupported';
  try {
    if (storage.persisted && (await storage.persisted())) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'not-granted';
  } catch {
    return 'not-granted';
  }
}
