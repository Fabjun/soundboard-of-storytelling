# ADR-0009: Pad-Position kann `null` sein (UNPLACED-State)

**Status:** Superseded by ADR-0048
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Datenmodell

## Context

Grid-Konfigurationen können sich ändern (Slice 8: user ändert cols/rows).
Wenn ein 4×4-Grid auf 3×3 schrumpft, passen die Pads aus Slots (3,3), (0,3),
(1,3), (2,3) nicht mehr ins Grid. Was passiert mit diesen Pads?

Optionen:
1. Löschen — Datenverlust, schlecht
2. In einem separaten Array speichern — Datenmodell-Komplexität
3. `position: null` setzen (UNPLACED-State) — Pad bleibt erhalten, aber
   ohne sichtbaren Slot

Das `V3_CONCEPT_BRIEF.md §4.1` dokumentiert `position: PadPosition | null`
explizit: `null = unplaced (reserved for Slice 8)`.

## Decision

```typescript
type Pad = {
  ...
  position: PadPosition | null; // null = unplaced
  ...
};
```

`null` bedeutet: das Pad ist vorhanden, aber hat keinen sichtbaren Slot im Grid.
Slice 3 weist immer eine echte Position zu (kein Pad wird unplaced erstellt).
Der UNPLACED-Mechanismus wird in Slice 8 implementiert.

Das Typ-System erzwingt, dass alle Call-Sites mit `null` umgehen müssen
(TypeScript strict, ADR-0004).

## Consequences

**Positiv:**
- Kein Datenverlust beim Grid-Schrumpfen (Slice 8).
- Pads erinnern sich an ihre gewünschte Position (DESIGN_NOTES.md §A4 ·
  "Unplaced pads remember their desired position"): bei Grid-Vergrößerung
  werden sie automatisch re-platziert.
- Typ-System erzwingt Null-Handling überall.

**Negativ / Trade-offs:**
- Jeder Code-Pfad, der `position.col/row` verwendet, muss auf `null` prüfen.
  Das ist etwas Boilerplate, verhindert aber versehentliche Crashes.

## Alternatives Considered

**Separate `unplacedPads`-Array:** Würde Pads aus dem Scene-Scope herausnehmen,
was Querverweise erfordern würde. Komplexer ohne Mehrwert.

**Löschen bei Grid-Schrumpfen:** Datenverlust. Nicht akzeptabel.

## Related

- **Dateien:** `v3/src/types.ts` (Pad.position), `v3/src/lib/padUtils.ts`
- **ADRs:** ADR-0008 (Pad-Position als {col, row}), ADR-0004 (TypeScript strict erzwingt null-Handling)
- **Quelldokumente:** `V3_CONCEPT_BRIEF.md §4.1`, `DESIGN_NOTES.md §A4 · Unplaced pads remember their desired position`
