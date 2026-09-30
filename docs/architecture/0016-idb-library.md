# ADR-0016: `idb` Library als IDB-Wrapper

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2

**Category:** Persistence

## Context

Raw IndexedDB hat eine verbose, callback-basierte API. Für TypeScript-Code
ist eine Promise-basierte API mit Type-Safety deutlich ergonomischer.

> *Diese Entscheidung war nicht explizit in den Quelldokumenten begründet.
> Sie wurde als konsistente Wahl aus `v3/package.json` und `v3/src/db/idb.ts`
> abgeleitet. `idb` ist die Standard-Empfehlung im Web-Ecosystem für typed
> IDB-Access.*

## Decision

`idb` (Jake Archibald's IndexedDB Wrapper, ~1.4 KB gzip) wird als einzige
IDB-Schnittstelle verwendet. Das gesamte Routing läuft über `src/db/idb.ts`:

```typescript
import { openDB, type IDBPDatabase } from 'idb';
```

Raw IDB-Transaktionen (`indexedDB.open(...)`, IDBTransaction, IDBRequest)
sind im Code-Basis außerhalb von `src/db/idb.ts` verboten.

## Consequences

**Positiv:**
- Promise-basierte API: `await db.get('library', id)` statt Callback-Chains.
- TypeScript generics für den Store-Zugriff.
- `openDB` mit `upgrade`-Callback macht Schema-Migration sauber (ADR-0017).
- Kleines Bundle: ~1.4 KB gzip.

**Negativ / Trade-offs:**
- Eine externe Dependency für IDB-Zugriff. Falls `idb` nicht mehr maintained
  wird, müsste migriert werden. Risiko: gering (gut maintained, weit verbreitet).

## Alternatives Considered

**Raw IndexedDB:** Mehr Kontrolle, aber verbose callback-basierte API.
Fehleranfällig in TypeScript ohne Type-Safety.

**Dexie.js:** Mächtiger ORM-ähnlicher Wrapper, ~30 KB. Für die aktuellen
Use-Cases (simple get/put/delete/cursor) erheblich oversized.

**localforage:** Höhere Abstraction, verbirgt IDB-Details. Für `libGetAllMeta()`
(cursor-based enumeration, memory-safe) nicht geeignet: localforage abstrahiert
Cursors weg.

## Related

- **Dateien:** `v3/src/db/idb.ts`, `v3/package.json`
- **ADRs:** ADR-0014 (IndexedDB als Persistenz), ADR-0017 (Schema Versioning)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.5`
