# ADR-0008: Pad-Position als `{col, row}` Struct

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Datenmodell

## Context

Pads leben in einem 2D-Grid (default 4×4). Eine Position kann als Array-Index
(0–15 für ein 4×4-Grid) oder als explizites `{col, row}` Struct codiert werden.

Das `docs/architecture/concept-brief.md §4.1` spezifiziert `{col, row}` direkt im Typ. Die
Wahl hat Konsequenzen für Datenmodell-Stabilität und API-Klarheit.

## Decision

```typescript
type PadPosition = {
  col: number; // 0-indexed, 0..cols-1
  row: number; // 0-indexed, 0..rows-1
};
```

Position ist ein explizites 2D-Koordinatenpaar. Array-Indizes werden intern nicht
verwendet.

## Consequences

**Positiv:**
- Viewport-stabil: `position.col` bedeutet dasselbe auf jedem Gerät und bei
  jeder Grid-Konfiguration. Bei Array-Index-Codierung müsste bei Grid-Resize
  eine Index-Neukalkulation stattfinden.
- Hotkey-Mapping ist stabil: Die F1-F4-Tasten-Zeile (Slice 4+) mappt auf
  `row=0, col=0..3`. Diese Semantik ist grid-invariant.
- 4-Spalten-Constraint (ADR-0032): `position.col` ≤ 3 ist eine validierbare
  Invariante. Bei Array-Index wäre `index % 4` ein implizites Verhältnis.
- `elementFromPoint` und cellRef-Registry in `padDnd.ts` verwenden `col/row`
  direkt für Drop-Zone-Erkennung.

**Negativ / Trade-offs:**
- IDB-Serialisierung schreibt `{col, row}` statt einer Zahl. Kein Laufzeit-
  Problem (IndexedDB serialisiert Objekte nativ), aber minimal mehr Speicher.

## Alternatives Considered

**Array-Index (0-based):** Kompakter in IDB, einfacher für sequenzielle
Iteration. Nachteil: Grid-Resize erfordert Neukalkulation aller Indizes.
Index 13 in einem 4×4-Grid ist ein anderes Pad als Index 13 in einem 5×3-Grid.

## Related

- **Dateien:** `v3/src/types.ts` (PadPosition type), `v3/src/lib/padUtils.ts` (nextFreeSlot), `v3/src/lib/padDnd.ts`
- **ADRs:** ADR-0009 (Pad-Position kann null sein), ADR-0032 (4-Spalten-Invariante)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.1`, `docs/design/design-notes.md §A4 · grid stays 4-col`
