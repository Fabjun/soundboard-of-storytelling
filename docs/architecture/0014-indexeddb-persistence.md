# ADR-0014: IndexedDB as sole persistence; localStorage only for UI preferences

**Status:** Superseded by ADR-0062
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Persistence

## Context

V3 is a local-first PWA without a backend. All data has to be persisted on the client.
Available:

- **IndexedDB:** for large structured data incl. Blobs; asynchronous API; unlimited capacity
  (managed by quota)
- **localStorage:** synchronous, strings only, ~5 MB limit

The data model (boards with scenes and pads, library with audio Blobs) is clearly IDB
territory. `docs/architecture/concept-brief.md §1` sets IndexedDB explicitly.

> _The separation (IDB for content, localStorage for UI prefs) was not documented explicitly
> as a rule of its own; it was derived as a consistent pattern from the code state and the
> concept brief._

## Decision

- **IndexedDB:** all app content data. Library (audio Blobs + metadata), boards (with scenes
  and pads). Access exclusively via the `src/db/idb.ts` API.
- **localStorage:** small UI state items that need no sync guarantee (theme choice, last open
  screen preference or similar). No audio, no boards.

Direct access to IDB outside `src/db/idb.ts` is forbidden (CLAUDE.md §Permanent coding
standards).

## Consequences

**Positive:**

- Audio Blobs of up to several GB can be stored (IDB quota depending on available storage).
- A clear boundary: `src/db/idb.ts` is the only place where IDB transactions are opened. Type
  safety and memory-safety rules are centralised.
- localStorage writes are synchronous and simple for small preferences.

**Negative / Trade-offs:**

- The IDB API is asynchronous: every interaction is async/await. No problem for the app
  architecture, but more boilerplate than `localStorage.setItem`.
- Debugging IDB in DevTools is more effort than inspecting localStorage.

## Alternatives considered

**OPFS (Origin Private File System):** more modern, but requires iOS 17+ as minimum. Not
compatible with ADR-0006 (iOS 15+ minimum).

**Everything in localStorage as JSON:** the 5 MB limit makes audio Blobs impossible.

## Related

- **Files:** `v3/src/db/idb.ts`
- **ADRs:** ADR-0015 (DB name), ADR-0016 (idb library), ADR-0017 (schema versioning), ADR-0019 (iOS memory safety)
- **Source documents:** `docs/architecture/concept-brief.md §1`, `CLAUDE.md §Permanent coding standards`
