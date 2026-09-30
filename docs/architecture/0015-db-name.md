# ADR-0015: DB name `sos-v3` (separate from V1)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 1
**Refines:** —
**Category:** Persistence

## Context

V1 and V3 run in parallel on the same device during the development phase (V1 on GitHub
Pages, V3 on the dev server). If both used the same IDB name, they could interfere with each
other's data.

V3 is also the app "Soundboard of Storytelling" (SoS), no longer the V1 app (abbreviated
"botc") — the rename of the app is reflected in the DB name.

> *This decision was not recorded as a rule of its own in the source documents. The DB name
> `sos-v3` was set directly in code while setting up Slice 2. The name had been identified in
> the plan as a possible "botc-sb-v3" inconsistency — a search in the repo confirms that
> `botc-sb-v3` never appeared in CLAUDE.md. The canonical name is `sos-v3` (from
> `v3/src/db/idb.ts`).*

## Decision

```typescript
const DB_NAME = 'sos-v3';
```

The name derives from "Soundboard of Storytelling" and is explicitly separate from V1's
database.

## Consequences

**Positive:**
- No data conflict between V1 and V3.
- The name `sos-v3` signals the app identity (SoS = Soundboard of Storytelling).

**Negative / Trade-offs:**
- V1 data is not migrated automatically. Import via template export (Slice 7) is the intended
  migration path.
- A future V4 has to choose a new DB name again (or implement a migration path).

## Alternatives considered

**`botc-soundboard-v3`:** would be more consistent with the GitHub repo name, but keeps the
outdated "botc" label after the app rename.

**Same name as V1:** would risk conflicts when both run in parallel.

## Related

- **Files:** `v3/src/db/idb.ts` (DB_NAME constant)
- **ADRs:** ADR-0014 (IndexedDB as persistence), ADR-0017 (schema versioning)
- **Source documents:** `docs/architecture/concept-brief.md §4.5`
