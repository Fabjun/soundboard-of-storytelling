# ADR-0015: DB-Name `sos-v3` (getrennt von V1)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 1

**Category:** Persistenz

## Context

V1 und V3 laufen während der Entwicklungsphase parallel auf demselben Gerät
(V1 auf GitHub Pages, V3 auf dem Dev-Server). Wenn beide denselben IDB-Namen
verwenden würden, könnten sie sich gegenseitig in den Daten stören.

V3 ist außerdem die App "Soundboard of Storytelling" (SoS), nicht mehr
"Blood on the Clocktower Soundboard" (botc) — die Umbenennung des Apps spiegelt
sich im DB-Namen wider.

> *Diese Entscheidung war nicht explizit als eigene Regel in den Quelldokumenten
> festgehalten. Der DB-Name `sos-v3` wurde beim Einrichten von Slice 2 direkt im
> Code gesetzt. Der Name wurde im Plan als mögliche "botc-sb-v3"-Inkonsistenz
> identifiziert — eine Suche im Repo bestätigt, dass `botc-sb-v3` nie in CLAUDE.md
> vorkam. Der kanonische Name ist `sos-v3` (aus `v3/src/db/idb.ts`).*

## Decision

```typescript
const DB_NAME = 'sos-v3';
```

Der Name leitet sich von "Soundboard of Storytelling" ab und ist explizit
von V1's Datenbank getrennt.

## Consequences

**Positiv:**
- Kein Datensegment-Konflikt zwischen V1 und V3.
- Der Name `sos-v3` signalisiert die App-Identität (SoS = Soundboard of Storytelling).

**Negativ / Trade-offs:**
- V1-Daten werden nicht automatisch migriert. Import über Template-Export (Slice 7)
  ist der vorgesehene Migrations-Pfad.
- Eine zukünftige V4 muss wieder einen neuen DB-Namen wählen (oder einen
  Migration-Pfad implementieren).

## Alternatives Considered

**`botc-soundboard-v3`:** Wäre konsistenter mit dem GitHub-Repo-Namen, aber
beibehält die veraltete "botc"-Bezeichnung nach App-Umbenennung.

**Gleicher Name wie V1:** Würde Konflikte bei parallelem Betrieb riskieren.

## Related

- **Dateien:** `v3/src/db/idb.ts` (DB_NAME Konstante)
- **ADRs:** ADR-0014 (IndexedDB als Persistenz), ADR-0017 (Schema-Versioning)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.5`
