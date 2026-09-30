# ADR-0028: Ein Component pro UI-Element — Varianten via Props

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refined by:** ADR-0052 (`BoardTopBar` exception kept, re-evaluated in Slice 13)

**Category:** UI architecture

## Context

Bei UI-Entwicklung entsteht oft die Versuchung, für "leicht unterschiedliche"
Varianten desselben Elements einen separaten Komponenten zu erstellen:
`PrimaryButton` + `SecondaryButton`, `PadSmall` + `PadLarge`, etc.

Das führt zu Divergenz: die zwei Varianten entwickeln sich auseinander, sharing
von Fixes wird vergessen, die Codebase wächst horizontal.

`docs/architecture/concept-brief.md §4.2` ist explizit: "Every UI element has ONE component.
Variants via props. When a new variant is needed: extend the existing component.
Never create a parallel component. If tempted, ask the user."

## Decision

Jeder UI-Element-Typ hat **einen** Komponenten. Varianten werden über Props
gesteuert:

```typescript
function Pad({ pad, mode, isHot }: PadProps) { ... }
function Button({ label, variant, icon, onClick }: ButtonProps) { ... }
function PixelIcon({ name, size, color }: PixelIconProps) { ... }
```

Wenn eine neue Variante auftaucht: `variant` prop oder neue Props zum
bestehenden Komponenten, nicht ein neuer Parallel-Komponenten.

## Exceptions

| Exception | Reason | Reference | Review |
|---|---|---|---|
| `BoardTopBar` is a separate component next to `TopBar` | The Board screen has fundamentally different header needs (mode toggle as headline) | ADR-0026 | Slice 13 (mobile layout rebuilds both) |

## Consequences

**Positiv:**
- Bug-Fixes und Styling-Updates gelten automatisch für alle Varianten.
- Geringere Komponentenanzahl: einfachere Navigation im Projekt.
- Einheitliches API-Pattern über alle Komponenten.

**Negativ / Trade-offs:**
- Props können komplex werden wenn viele Varianten akkumuliert werden.
  Gegenmaßnahme: früh refactoren wenn eine Komponente >5 variants hat.
- "Wenn versucht, den User fragen" erfordert Disziplin — es ist immer schneller,
  einen neuen Komponenten zu erstellen als zu diskutieren.

## Alternatives Considered

**Atomic Design (Atom/Molecule/Organism):** Strukturierter, gut für große Teams.
Für dieses Eins-Personen-Projekt Overhead ohne Mehrwert.

**Parallele Komponenten:** Schnell, dann aber: Drift, Duplizierung, Divergenz.
V1-Erfahrung: mehrere Pad-Varianten, die sich auseinanderentwickelt haben.

## Related

- **Dateien:** `v3/src/components/*.tsx` (alle aktuell: PixelIcon, AudioRow, Waveform, PadGridCell, PadGrid, etc.)
- **ADRs:** ADR-0021 (CSS-Naming — Varianten via is-* oder sb-block-variant)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.2`, `CLAUDE.md §Permanent coding standards`
