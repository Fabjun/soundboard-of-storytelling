# ADR-0010: Board als monolithisches JSON-Dokument in IDB

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Datenmodell

## Context

Das Board-Datenmodell ist hierarchisch: `Board → [Scene → [Pad]]`. In einer
relationalen Datenbank würden diese in separaten Tabellen mit Foreign Keys
gespeichert. In IndexedDB gibt es keine Joins — Daten können entweder in
separaten Stores mit manuellen Lookups gespeichert werden, oder als
eingebettetes Dokument.

Entscheidungspunkt Slice 3: Wie wird ein Board in IDB persistiert?

## Decision

Ein Board wird als einzelnes JSON-Dokument gespeichert. Scenes und Pads sind
embedded (nicht in separaten IDB-Stores). Jede Mutation (Pad umbenennen,
Scene hinzufügen, Pad bewegen) schreibt das komplette Board-Dokument.

```typescript
boardPut(board: Board): Promise<void>
// Upsert des kompletten Dokuments, enthält alle Scenes und Pads.
```

Einschätzung der Größe: Bei 5 Scenes × 16 Pads sind es ~50 KB JSON.
IDB-Writes dieser Größe sind auf modernen Geräten typischerweise <5 ms.

Der Trade-off ist bewusst und ist in `v3/src/db/idb.ts` (Kommentarblock am
Anfang) sowie in `docs/design/design-notes.md` dokumentiert:

> *BOARD PERSISTENCE TRADE-OFF: Boards are stored as complete JSON documents.
> Any pad edit rewrites the full ~50KB document. Acceptable at 5×16 pads;
> see docs/design/design-notes.md "Slice 8 / Performance" for optimisation path if
> measured to be a bottleneck.*

## Consequences

**Positiv:**
- Einfache Transaktionen: kein Join-Code, kein referential integrity management.
- Auto-Save (ADR-0030): eine einzige `boardPut(board)` nach jeder Mutation.
  Kein Tracking welche Sub-Entity sich geändert hat.
- Konsistente Snapshots: Das gespeicherte Dokument ist immer consistent
  (Board + alle Scenes + alle Pads in einem Atomic Write).
- Loading-Einfachheit: `boardGetAll()` lädt alle Boards komplett (keine
  Joins, keine Second-Level-Queries).

**Negativ / Trade-offs:**
- Write-Amplification: Ein Pad-Rename schreibt das komplette 50 KB-Dokument.
  Bei 5 Scenes × 16 Pads akzeptabel; bei 20+ Scenes könnte das messbar werden.
- Kein partielles Update in IDB (IDB hat keinen UPDATE-Operator). Das Dokument
  muss immer vollständig gelesen → geändert → geschrieben werden.

**Optimierungspfad (nur wenn gemessen):**
Separaten `scenes`-Store einführen, Board hält nur `sceneIds: string[]`.
Erst wenn Performance-Problem quantifiziert ist — nicht spekulativ.

## Alternatives Considered

**Separate `scenes` + `pads` Stores:** Würde granulare Updates erlauben.
Nachteil: Joins in JavaScript, referential integrity manuell verwalten,
komplexere Transaktionen. Bei ≤5 Scenes kein Mehrwert.

**Scenes embedded, Pads in separatem Store:** Hybrid. Komplexer als
Full-Document ohne klaren Vorteil bei der erwarteten Datenmenge.

## Related

- **Dateien:** `v3/src/db/idb.ts` (boardPut/Get/GetAll/Delete), `v3/src/state/store.ts` (upsertBoard)
- **ADRs:** ADR-0014 (IndexedDB sole persistence), ADR-0030 (Auto-Save debounce)
- **Quelldokumente:** `CLAUDE.md §V3 audio/IDB API`, `docs/design/design-notes.md §Slice 8 / Performance`
- **Commits:** `9eeceeb` — feat(slice-3): Board + Scene + Pad CRUD
