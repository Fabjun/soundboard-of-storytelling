# ADR-0062: IndexedDB for all persistence, UI preferences included

**Status:** Accepted
**Date:** 2026-10-02
**Slice:** cross-cutting
**Refines:** —
**Category:** Persistence

## Context

ADR-0014 put all app content into IndexedDB and small UI state into localStorage. With the
first preferences (the last view of a board, the last backup, the All pads sort, per-pad play
times) the question came up in the owner's review of PR #39 (decision L1, 2026-10-02): keep a
second storage layer for them, or not? This ADR replaces ADR-0014 as a whole, so the decision
reads in one place; ADR-0014 is kept as the record of the earlier decision (Nygard, "Documenting
Architecture Decisions": "keep the old one around, but mark it as superseded").

## Decision

- **IndexedDB holds everything the app stores.** Library (audio Blobs + metadata), boards (with
  decks and pads) and UI preferences live in the one database `sos-v3`.
- **UI preferences** are a key-value store `keyval` in that database (DB version 6), read once
  before the first render (`v3/src/state/prefs.ts`, `loadPrefs` in `v3/src/main.tsx`) and kept
  in memory; a change updates memory at once and is written behind it.
- **No Web Storage** (localStorage, sessionStorage) anywhere in the source — guarded by
  `v3/tests/unit/codeGuards.test.ts`.
- Access to IndexedDB only through the typed helpers in `v3/src/db/idb.ts` (as before).

Source: web.dev, "Storage for the web" — "LocalStorage should be avoided because it is
synchronous and will block the main thread."

## Consequences

**Positive:**

- One storage layer: one backup path, one place to look, one test setup (fake-indexeddb).
- Preferences can go into the backup file and are readable by the service worker.
- No synchronous storage calls on the main thread.

**Negative / Trade-offs:**

- Preferences are asynchronous to read; the app therefore loads them before the first render.
- A database version bump (v6) for the new store — additive, no data is cleared.

## Alternatives considered

- **localStorage for preferences (ADR-0014):** simple and synchronous, but blocks the main
  thread, shares the origin with V1's data and cannot go into the backup the same way — rejected
  by the owner after research (L1).
- **A separate IndexedDB database for preferences:** isolation without benefit; two databases to
  open, version and back up — not taken.

## Related

- **Supersedes:** ADR-0014 (IndexedDB as sole persistence; localStorage only for UI preferences)
- **Files:** `v3/src/db/idb.ts`, `v3/src/state/prefs.ts`, `v3/src/main.tsx`,
  `v3/tests/unit/codeGuards.test.ts`
