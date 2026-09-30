# ADR-0023: Fünf-Ebenen-Surface-Hierarchie

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** UI architecture

## Context

Das Design-System definiert eine explizite Tiefenhierarchie für alle Flächen
der App. Das schafft visuelle Ordnung und macht es für den User intuitiv, welche
Elemente "näher" oder "weiter" sind (Canvas, Panels, Cards, Hover-States).

> *Diese Entscheidung war nicht als separater ADR dokumentiert; sie stammt direkt
> aus dem Design-System (HANDOFF.md §4.2) und wird hier als Architektur-Regel
> festgehalten, weil Verstöße (falsches Token für eine Ebene) zu visuellem
> Chaos führen.*

## Decision

Fünf Ebenen, in Reihenfolge von dunkelster zur hellsten:

| Ebene | Token | Verwendung |
|-------|-------|------------|
| 1 | `--night` | Canvas hinter allem |
| 2 | `--deep` | Persistentes Chrome (TopBar, StatusBar) |
| 3 | `--surface` | Seiten-Hintergrund innerhalb des Fensters |
| 4 | `--raised` | Inhalte innerhalb `--surface` (Cards, Inputs) |
| 5 | `--top` | Transiente States (Hover, Selected Row) |

**Regeln:**
- Keine 6. Ebene
- Keine übersprungenen Ebenen (z.B. nie `--night` direkt unter einem `--raised`-Element)
- Jede Ebene ist auf allen Themes visuell unterscheidbar

## Consequences

**Positiv:**
- User erkennt intuitiv "was sitzt über was" ohne explizite Erklärung.
- Theme-Switching (Slice 8) ist konsistent: alle fünf Ebenen werden im Theme
  überschrieben.
- Neue Komponenten folgen einem klaren Schema.

**Negativ / Trade-offs:**
- Constraint: manchmal ist man versucht, eine 6. Ebene einzuführen (z.B. Tooltip
  oder Modal). Tooltip und Modal sollten auf `--top` + `box-shadow` oder
  `filter: drop-shadow` liegen (ADR-0024), nicht auf einer 6. Ebene.

## Alternatives Considered

**Beliebige Tiefenschritte:** Mehr Flexibilität. Nachteil: inkonsistente visuelle
Sprache zwischen Screens und Komponenten.

## Related

- **Dateien:** `v3/src/styles/tokens.css` (--night, --deep, --surface, --raised, --top)
- **ADRs:** ADR-0022 (Design Tokens), ADR-0024 (clip-path + drop-shadow)
- **Quelldokumente:** `design-sources/2026-05-25/HANDOFF.md §4.2`, `CLAUDE.md §Design language §Color palette`
