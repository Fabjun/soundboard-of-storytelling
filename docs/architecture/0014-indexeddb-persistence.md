# ADR-0014: IndexedDB alleinige Persistenz; localStorage nur für UI-Präferenzen

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Persistence

## Context

V3 ist eine local-first PWA ohne Backend. Alle Daten müssen client-seitig
persistiert werden. Zur Verfügung stehen:
- **IndexedDB:** Für große strukturierte Daten inkl. Blobs; asynchrone API;
  unbegrenzte Kapazität (durch Quota verwaltet)
- **localStorage:** Synchron, String-only, ~5 MB Limit

Das Datenmodell (Boards mit Scenes und Pads, Library mit Audio-Blobs) ist
klar IDB-Territory. `docs/architecture/concept-brief.md §1` legt IndexedDB explizit fest.

> *Die Trennung (IDB für Content, localStorage für UI-Prefs) war nicht explizit
> als eigene Regel dokumentiert; sie wurde als konsistentes Muster aus dem
> Code-Stand und dem Concept Brief abgeleitet.*

## Decision

- **IndexedDB:** Alle App-Content-Daten. Library (Audio-Blobs + Metadata), Boards
  (mit Scenes und Pads). Zugriff ausschließlich über `src/db/idb.ts`-API.
- **localStorage:** Kleine UI-State-Items, die keine Sync-Garantie brauchen
  (Theme-Choice, Last-Open-Screen-Preference o.ä.). Kein Audio, keine Boards.

Direkter Zugriff auf IDB außerhalb von `src/db/idb.ts` ist verboten
(CLAUDE.md §Permanent coding standards).

## Consequences

**Positiv:**
- Audio-Blobs können bis zu mehreren GB gespeichert werden (IDB-Quota je nach
  verfügbarem Speicher).
- Klare Boundary: `src/db/idb.ts` ist der einzige Ort, an dem IDB-Transaktionen
  geöffnet werden. Typsicherheit und Memory-Safety-Regeln sind zentralisiert.
- localStorage-Writes sind synchron und einfach für kleine Präferenzen.

**Negativ / Trade-offs:**
- IDB-API ist asynchron: jede Interaktion ist async/await. Kein Problem für
  die App-Architektur, aber mehr Boilerplate als `localStorage.setItem`.
- IDB-Debugging in DevTools ist aufwändiger als localStorage-Inspektion.

## Alternatives Considered

**OPFS (Origin Private File System):** Moderner, aber iOS 17+ als Minimum.
Nicht kompatibel mit ADR-0006 (iOS 15+ Minimum).

**Alles in localStorage als JSON:** 5 MB Limit macht Audio-Blobs unmöglich.

## Related

- **Dateien:** `v3/src/db/idb.ts`
- **ADRs:** ADR-0015 (DB-Name), ADR-0016 (idb Library), ADR-0017 (Schema Versioning), ADR-0019 (iOS Memory Safety)
- **Quelldokumente:** `docs/architecture/concept-brief.md §1`, `CLAUDE.md §Permanent coding standards`
