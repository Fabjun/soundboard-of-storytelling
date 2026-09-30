# ADR-0007: Pointer Events für DnD — HTML5 Drag-and-Drop verboten

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Platform constraints

## Context

Slice 3 (Board + Scene + Pad CRUD) erforderte zwei DnD-Interaktionen:
- Pad-zu-Pad-Drag: SWAP / INSERT innerhalb des Grids
- Library-zu-Grid-Drag: Audio-Datei aus der Library auf ein Pad-Slot ziehen

Path B (Library → Grid, "drag from library") wurde initial mit HTML5 DnD
implementiert (`draggable`, `ondragstart`, `ondragover`, `ondrop`). Das
funktionierte auf Desktop-Brave problemlos.

**Auf dem iPhone (Brave, iOS) war es stillschweigend kaputt:** iOS WebKit
unterstützt HTML5 DnD-Events auf Touch-Geräten nicht. Kein Fehler, kein Event —
der Drag initiierte einfach nie. Der Bug wurde erst beim manuellen Testen auf
dem Primärtarget entdeckt (nach dem Desktop-Test).

Nach dem Fix (Portierung auf Pointer Events) wurde die Platform-Constraint-
Entscheidung (ADR-0006) als formale Regel festgeschrieben: HTML5 DnD ist verboten.

## Decision

**Jede DnD-Interaktion in V3 verwendet ausschließlich Pointer Events.**

`draggable`, `ondragstart`, `ondragover`, `ondragenter`, `ondragleave`, `ondrop`
sind in neuem V3-Code verboten.

**Kanonische Referenz-Implementierungen:**
- `v3/src/lib/padDnd.ts` — Pad-zu-Pad (SWAP + INSERT, Ghost, cellRef-Registry)
- `v3/src/lib/libDnd.ts` — Library-zu-Grid (Drop only, Ghost, elementFromPoint)

**Muster (aus beiden Implementierungen):**
1. `element.setPointerCapture(e.pointerId)` auf `pointerdown`
2. `pointermove` auf `document` für Tracking
3. `pointerup` auf `document` für Drop-Detection
4. Ghost: `position: fixed; pointer-events: none` — Pointer-Events passieren durch den Ghost hindurch (Voraussetzung für `elementFromPoint` in libDnd.ts; padDnd.ts nutzt die gleiche Eigenschaft, verwendet aber die cellRef-Registry statt `elementFromPoint` für die Drop-Zone-Erkennung)
5. `touch-action: none` auf draggable Elements — verhindert Scroll-Capture
6. 8 px Threshold vor Drag-Start (verhindert versehentliche Drags)
7. Isoliertes Modul-State pro DnD-Typ — kein Shared State zwischen Modulen

## Consequences

**Positiv:**
- Einheitliche DnD-Implementierung funktioniert auf iOS, Android und Desktop.
- Pointer Events sind in allen Supported Platforms garantiert (ADR-0006).

**Negativ / Trade-offs:**
- Mehr Code als HTML5 DnD: Pointer Events erfordern manuelle Ghost-Element-
  Verwaltung, manuelle Drop-Zone-Erkennung via `elementFromPoint`, manuelle
  Capture-Freigabe. HTML5 DnD macht das implizit (aber nur auf Desktop).
- Playwright-Tests für Pointer-Events-Drag sind aufwändiger (Tests 9, 14, 20, 21
  sind aktuell als `test.skip` markiert, bis die Drag-Sequenz in Playwright
  stabil ist).

## Alternatives Considered

**HTML5 DnD mit Pointer-Events-Fallback:** Wäre doppelter Implementierungsaufwand.
Kein Vorteil gegenüber reinen Pointer Events, die auf allen Platforms laufen.

**react-dnd / dnd-kit:** Bibliotheken mit Pointer-Events-Support. Nicht verwendet,
weil V3 keine externe DnD-Bibliothek braucht — die zwei isolierten Module sind
ausreichend schlank und vollständig kontrollierbar.

## Related

- **Dateien:** `v3/src/lib/padDnd.ts`, `v3/src/lib/libDnd.ts`
- **ADRs:** ADR-0006 (Platform Targets), ADR-0029 (SWAP + INSERT Semantik)
- **Quelldokumente:** `CLAUDE.md §Supported Platforms`, `docs/design/design-notes.md §Slice 3 / Lessons — DnD pattern`
- **Commits:** `86502b2` — fix(slice-3): replace HTML5 DnD with pointer events in path B
