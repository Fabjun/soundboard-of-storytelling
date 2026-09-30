# ADR-0016: `idb` library as the IDB wrapper

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2
**Refines:** —
**Category:** Persistence

## Context

Raw IndexedDB has a verbose, callback-based API. For TypeScript code a promise-based API with
type safety is considerably more ergonomic.

> _This decision was not justified explicitly in the source documents. It was derived as a
> consistent choice from `v3/package.json` and `v3/src/db/idb.ts`. `idb` is the standard
> recommendation in the web ecosystem for typed IDB access._

## Decision

`idb` (Jake Archibald's IndexedDB wrapper, ~1.4 KB gzip) is used as the only IDB interface.
All routing goes through `src/db/idb.ts`:

```typescript
import { openDB, type IDBPDatabase } from 'idb';
```

Raw IDB transactions (`indexedDB.open(...)`, IDBTransaction, IDBRequest) are forbidden in the
code base outside `src/db/idb.ts`.

## Consequences

**Positive:**

- Promise-based API: `await db.get('library', id)` instead of callback chains.
- TypeScript generics for store access.
- `openDB` with the `upgrade` callback keeps schema migration clean (ADR-0017).
- Small bundle: ~1.4 KB gzip.

**Negative / Trade-offs:**

- An external dependency for IDB access. If `idb` were no longer maintained, we would have to
  migrate. Risk: low (well maintained, widely used).

## Alternatives considered

**Raw IndexedDB:** more control, but a verbose callback-based API. Error-prone in TypeScript
without type safety.

**Dexie.js:** a powerful ORM-like wrapper, ~30 KB. Considerably oversized for the current use
cases (simple get/put/delete/cursor).

**localforage:** higher abstraction, hides IDB details. Not suitable for `libGetAllMeta()`
(cursor-based enumeration, memory-safe): localforage abstracts cursors away.

## Related

- **Files:** `v3/src/db/idb.ts`, `v3/package.json`
- **ADRs:** ADR-0014 (IndexedDB as persistence), ADR-0017 (schema versioning)
- **Source documents:** `docs/architecture/concept-brief.md §4.5`
