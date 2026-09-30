# ADR-0017: IDB Schema-Versioning mit Upgrade-Pfaden

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2 (v1: library), Slice 3 (v2: boards)

**Category:** Persistence

## Context

IndexedDB-Schemas müssen versioniert werden. Wenn ein User V3 nach einem Update
öffnet und die DB-Struktur sich geändert hat (neuer Store, neuer Index), muss
IDB einen Upgrade-Callback ausführen. Ohne korrekte Versioning führt ein
Schema-Mismatch zu einem `VersionError` und die App ist unnutzbar.

> *Das Versioning-Muster war nicht explizit als Regel dokumentiert; es ist eine
> zwingende technische Anforderung von IDB und wurde beim ersten Schema-Aufbau
> (Slice 2) etabliert.*

## Decision

```typescript
const DB_VERSION = 2; // Erhöht bei jeder Schema-Änderung

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

Jede neue Version fügt ein `if (oldVersion < N)` Block hinzu. Bestehende Daten
bleiben erhalten. Schema-Downgrade ist nicht unterstützt (IDB-Limitierung).

**Regeln:**
- `DB_VERSION` bei jeder Schema-Änderung erhöhen
- Neue Stores immer mit `if (oldVersion < N)` addieren, nicht ersetzen
- Existing-Daten nie in Upgrade-Callback löschen ohne User-Kommunikation

## Consequences

**Positiv:**
- Nutzer können V3 über Monate mit Daten befüllen und nach App-Updates
  verlieren sie keine Daten.
- Der `oldVersion`-Guard macht den Upgrade-Pfad audit-fähig: jede DB-Version
  ist im Code dokumentiert.

**Negativ / Trade-offs:**
- Schema kann nicht einfach vereinfacht werden (Stores entfernen wäre ein
  breaking change für User-Daten). Technische Schulden akkumulieren sich,
  wenn alte Stores nie genutzt werden.
- Schema-Downgrade ist unmöglich: wenn `DB_VERSION` erhöht wurde, gibt es
  kein Zurück ohne vollständige DB-Löschung.

## Alternatives Considered

**Kein Versioning (immer aktuellste Struktur):** Würde `VersionError` bei
Nutzern auslösen, die eine ältere V3-Version hatten. Datenverlust-Risiko.

**Migrations als separate SQL-ähnliche Scripts:** Wie in Dexie.js. Für
drei Stores unnötige Komplexität.

## Related

- **Dateien:** `v3/src/db/idb.ts` (DB_VERSION, upgrade callback)
- **ADRs:** ADR-0014 (IDB Persistenz), ADR-0015 (DB-Name), ADR-0016 (idb Library)
- **Commits:** `c81992e` — feat(slice-2): v1 schema; `9eeceeb` — feat(slice-3): v2 schema (boards store)
