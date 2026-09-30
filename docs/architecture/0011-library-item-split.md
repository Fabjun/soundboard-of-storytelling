# ADR-0011: LibraryItem aufgeteilt in Meta (Signals) + Blob (IDB-only)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2

**Category:** Data model

## Context

Die Library enthält Audio-Dateien. Eine Audio-Datei hat zwei Aspekte:
- **Metadata:** Name, Hash, Größe, Duration, Peaks (kleine, serialisierbare Werte)
- **Blob:** Die rohen Audio-Bytes (50 KB – 10 MB pro Datei)

Wenn Blobs in den Preact-Signals-State geladen werden (für Library-Anzeige, Filter,
Rename-UI), passiert ein iOS-Fataler Fehler: iOS Safari tötet den Tab bei >600 MB–
1.5 GB JS Heap (ADR-0019). Bei einer Library mit 30+ Dateien wären das leicht
1–3 GB im RAM.

Das ist die wichtigste iOS-Memory-Regel aus V1 (CLAUDE.md §iPhone / iOS Safari):
**"Never load all audio buffers into RAM."**

## Decision

Der `LibraryItem`-Typ wird in zwei separate Types gesplittet:

```typescript
// Working-memory type — safe to store in Signals
type LibraryItemMeta = {
  id: string;        // SHA-256 hash (IS the identity)
  type: LibraryItemType;
  name: string;
  size: number;
  tags: string[];
  addedAt: number;
  duration: number;
  peaks: number[];   // 30 peak values, computed at upload, stored in IDB
};

// Full IDB entry — NEVER in component state
type LibraryItem = LibraryItemMeta & {
  blob: Blob;
};
```

**Regel:** `LibraryItemMeta[]` lebt in `libraryItems` (Signals-State).
`LibraryItem` (mit Blob) verlässt IDB nur für Playback (Slice 4+),
über `libGet(id)`, und der Caller muss die Referenz nach Nutzung freigeben.

`libGetAllMeta()` verwendet einen Cursor und dereferenziert nie `cursor.value.blob`,
damit das Blob GC-fähig bleibt (ADR-0019).

## Consequences

**Positiv:**
- Library-UI (Browse, Filter, Rename, Delete) lädt nie Blobs in RAM.
  100 Einträge × 10 B Metadata = 1 KB — vs. 100 × 5 MB Audio = 500 MB.
- TypeScript strict (ADR-0004) macht den Split unmissverständlich:
  Code der `LibraryItem` (statt `LibraryItemMeta`) in State speichert,
  kompiliert nicht.
- Waveform-Peaks (`peaks: number[]`, 30 Werte) sind Teil der Meta: die Library-
  Anzeige kann Waveform-Thumbnails rendern ohne Blob-Zugriff.

**Negativ / Trade-offs:**
- `libRename()` muss kurzzeitig den vollen `LibraryItem` laden (IDB hat kein
  Partial-Update). Der Blob ist nur für die Dauer des Calls im RAM —
  das Muster ist bewusst und in `idb.ts` dokumentiert.
- Zwei Types statt einer stärkeren Abstraction — aber die Differenzierung ist
  die Absicht, keine Schwäche.

## Alternatives Considered

**Einziger `LibraryItem`-Type, Blob lazy-geladen:** Würde denselben Fehler
riskieren wenn Code versehentlich `.blob` in State ablegt.
Der explizite Split macht das unmöglich im Typsystem.

**Alle Metadata in einem separaten IDB-Store:** Möglich, aber unnötig.
Cursor-based `libGetAllMeta()` ist genauso memory-safe ohne Schema-Komplexität.

## Related

- **Dateien:** `v3/src/types.ts` (LibraryItemMeta, LibraryItem), `v3/src/db/idb.ts` (libGetAllMeta cursor), `v3/src/state/store.ts` (libraryItems signal)
- **ADRs:** ADR-0004 (TypeScript strict macht Split erzwingbar), ADR-0019 (iOS Memory Safety Rules)
- **Quelldokumente:** `CLAUDE.md §iPhone / iOS Safari — memory & stability rules`, `CLAUDE.md §Permanent coding standards`
- **Commits:** `c81992e` — feat(slice-2): Library screen, IDB layer, serial upload pipeline
