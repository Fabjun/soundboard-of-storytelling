# ADR-0017: IDB schema versioning with upgrade paths

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2 (v1: library), Slice 3 (v2: boards)
**Refines:** —
**Category:** Persistence

## Context

IndexedDB schemas have to be versioned. When a user opens V3 after an update and the DB
structure has changed (new store, new index), IDB has to run an upgrade callback. Without
correct versioning, a schema mismatch leads to a `VersionError` and the app is unusable.

> _The versioning pattern was not documented explicitly as a rule; it is a mandatory
> technical requirement of IDB and was established with the first schema (Slice 2)._

## Decision

```typescript
const DB_VERSION = 2; // Increased on every schema change

openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    // v1: library store
    if (oldVersion < 1) {
      db.createObjectStore('library', { keyPath: 'id' });
    }
    // v2: boards store
    if (oldVersion < 2) {
      db.createObjectStore('boards', { keyPath: 'id' });
    }
  },
});
```

Every new version adds an `if (oldVersion < N)` block. Existing data is kept. Schema downgrade
is not supported (IDB limitation).

**Rules:**

- increase `DB_VERSION` on every schema change
- always add new stores with `if (oldVersion < N)`, never replace them
- never delete existing data in the upgrade callback without telling the user

## Consequences

**Positive:**

- Users can fill V3 with data over months and do not lose it after app updates.
- The `oldVersion` guard makes the upgrade path auditable: every DB version is documented in
  code.

**Negative / Trade-offs:**

- The schema cannot simply be simplified (removing stores would be a breaking change for user
  data). Technical debt accumulates if old stores are never used.
- Schema downgrade is impossible: once `DB_VERSION` has been increased, there is no way back
  without deleting the whole DB.

## Alternatives considered

**No versioning (always the latest structure):** would cause a `VersionError` for users who
had an older V3 version. Risk of data loss.

**Migrations as separate SQL-like scripts:** as in Dexie.js. Unnecessary complexity for three
stores.

## Related

- **Files:** `v3/src/db/idb.ts` (DB_VERSION, upgrade callback)
- **ADRs:** ADR-0014 (IDB persistence), ADR-0015 (DB name), ADR-0016 (idb library)
- **Commits:** `c81992e` — feat(slice-2): v1 schema; `9eeceeb` — feat(slice-3): v2 schema (boards store)
