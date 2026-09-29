# ADR-0032: 4-Spalten-Grid konstant über alle Viewports

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Interaktion

## Context

Das Standard-Grid ist 4×4. Auf einem 360 px Portrait-Viewport wären die Cells
~78 px breit — über dem 44 px Touch-Minimum. Die Frage: Soll das Grid bei
Portrait-Mobile auf 3 Spalten umbrechen?

`docs/design/design-notes.md §A4 · grid stays 4-col on every viewport` dokumentiert die
Entscheidung mit drei Begründungen:

1. `position.col` muss viewport-stabil sein (Datenmodell-Integrität, ADR-0008)
2. Hotkey-Mapping (F1-F4 = Zeile 1 Spalten 1-4) hängt an Spaltenanzahl
3. Layout-Sprünge zwischen Desktop und Phone haben Lernkosten ohne Mehrwert

## Decision

Das Pad-Grid verwendet **immer 4 Spalten** (auf dem Standard 4×4-Grid).
Bei Portrait-Mobile: Cells sind ~78 px breit bei 360 px Viewport — über dem
44 px Minimum, akzeptabel.

Kein automatisches Reflow auf 3 Spalten bei Portrait-Viewport.

Das Grid kann in Zukunft konfigurierbar sein (Slice 8 `gridConfig`-Popover),
aber der Default ist 4×4 und der Reflow ist kein automatischer Mechanismus.

> docs/design/design-notes.md empfiehlt für Mobile einen Hard-Cap bei 5 cols max
> (Slice 8: 5×4 ist das Mobile-Maximum).

## Consequences

**Positiv:**
- `position.col` ist semantisch stabil: Spalte 3 auf dem Phone ist dieselbe
  Spalte wie Spalte 3 auf dem Desktop.
- Hotkey-Mapping ist viewport-unabhängig.
- Einfacherer Code: keine Viewport-spezifische Grid-Logik.

**Negativ / Trade-offs:**
- 4×4-Cells sind ~78 px auf 360 px Portrait — eng aber akzeptabel.
  Bei 5-col-Default wären es ~62 px — grenzwertig.
- Nutzer mit großen Fingern auf kleinen Phones könnten Schwierigkeiten haben.
  Bewusster Trade-off zugunsten Datenmodell-Stabilität.

## Alternatives Considered

**Portrait-Reflow auf 3 Spalten:** Würde Datenmodell-Instabilität einführen:
`position.col` wäre viewport-abhängig. Breaks hotkey-mapping.

**Kein Grid-Reflow, aber andere Col-Counts per gridConfig:** Korrekt —
das ist der Slice-8-Weg. Default bleibt 4×4.

## Related

- **Dateien:** `v3/src/components/PadGrid.tsx`, `v3/src/types.ts` (Scene.gridConfig)
- **ADRs:** ADR-0008 (Pad-Position als {col,row} — viewport-stabile Koordinaten), ADR-0006 (Platform Targets), ADR-0045 (Zwei-Achsen-Adaptives Modell)
- **Grenzziehung (Axis 1 vs. ADR-0032):** Axis-1-Frame-Layout-Adaptation (wo Sidebar/Bands
  sitzen, abhängig vom Screen-Format — Bottom-Bar bei schmal/Hochformat, Side-Rail bei
  breit/Querformat) ≠ das Pad-Grid-Column-Reflow, das dieses ADR adressiert. ADR-0032
  verbietet automatisches Reflow der **Pad-Grid-Spaltenanzahl** (die Pads selbst bleiben
  immer in der konfigurierten Spaltenanzahl). Axis 1 betrifft das **umgebende Frame-Layout**
  (Sidebar-Position, Band-Anordnung). Beide Konzepte sind unabhängig; kein Widerspruch.
- **Quelldokumente:** `docs/design/design-notes.md §A4 · grid stays 4-col on every viewport`
