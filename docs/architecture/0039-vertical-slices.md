# ADR-0039: Vertikale Slices als Entwicklungsmodell (8 Slices)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Process & product decisions

## Context

V3 ist ein Rewrite mit klar definiertem Feature-Set. Die Frage: Wie wird die
Arbeit organisiert? Horizontal (Layer: UI-Basis zuerst, dann State, dann
Persistenz) oder vertikal (Features: jeder Slice ist ein vollständiges Feature)?

`docs/architecture/concept-brief.md §5.1` legt vertikale Slices explizit fest: "Build in
working slices, not horizontal layers. Each slice ends with a committable,
testable, screenshot-verifiable result."

## Decision

Entwicklung in **8 vertikalen Slices**:

| # | Feature | Status |
|---|---------|--------|
| 1 | Project setup + StartScreen | ✅ |
| 2 | Library + LibraryItem CRUD | ✅ |
| 3 | Board + Scene + Pad CRUD | ✅ |
| 4 | Audio playback (V1 engine) | ✅ |
| 5 | Scene switching | ⬜ |
| 6 | Sets + Quick Access | ⬜ |
| 7 | Template export/import | ⬜ |
| 8 | Settings, themes, polish | ⬜ |

Jeder Slice liefert: UI + State + Persistenz + manuelle Verifikation + Tests.

**Plan-Abweichungen** müssen explizit deklariert werden (CLAUDE.md §Deviations).

## Consequences

**Positiv:**
- Nach jedem Slice ist die App lauffähig und zeigbar. Kein monolithisches
  "Big Bang"-Release.
- Frühe Feedback-Schleifen: nach Slice 1 ist das visuelle Design sichtbar,
  nach Slice 2 ist IDB-Layer validated.
- Jede Slice-Entscheidung kann die nächste Slice informieren.

**Negativ / Trade-offs:**
- Einige Architektur-Entscheidungen (z.B. Audio-Engine-Facade) müssen vor dem
  eigentlichen Slice getroffen werden (ADR-0018 ist vorab documented, auch wenn
  Slice 4 noch aussteht).
- "Vertikale Slice" erfordert oft das Vorwegnehmen von IDB-Schemas und Types,
  auch wenn bestimmte Features erst später benötigt werden.

## Alternatives Considered

**Horizontale Layers:** UI-Komponenten zuerst (ohne IDB), dann IDB, dann Audio.
Nachteil: kein lauffähiges Produkt bis alle Layers fertig sind; Annahmen über
die Layer-Grenzen werden erst spät validiert.

**Feature-by-Feature ohne Slice-Plan:** Flexibler, aber riskanter für ein
Rewrite-Projekt mit festem Feature-Set. Slice-Plan hält den Scope kontrolliert.

## Related

- **Dateien:** `CLAUDE.md §Slice progress`, `docs/architecture/concept-brief.md §5.1`
- **ADRs:** ADR-0039 ist der Meta-ADR für alle Slice-spezifischen ADRs
- **Quelldokumente:** `docs/architecture/concept-brief.md §5.1`, `CLAUDE.md §Workflow rules §4`
- **Commits:** `8be64d4` (Slice 1), `c81992e` (Slice 2), `9eeceeb` (Slice 3)
