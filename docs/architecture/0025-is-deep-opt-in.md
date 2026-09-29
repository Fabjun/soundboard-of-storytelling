# ADR-0025: `is-deep` als Opt-In für Pad-Depth-Stack

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** UI-Architektur

## Context

Das Design-System `v15-pad-depth.jsx` exploriert sechs Depth-Treatments für Pads.
Die empfohlene "Full-Stack"-Variante kombiniert: helleres Pad-Face, Bevel-Gradient,
Edge-Relief, chunky Pixel-Drop-Shadow. Das sieht gut aus, ist aber rendering-
intensiv (mehrere CSS-Layers, filter: drop-shadow).

Bei einem 4×4-Grid mit 16 Pads, oder gar 6×4 mit 24 Pads, wird das Rendering
spürbar. Auf dem iPhone 13 Pro ist das akzeptabel, auf iPhone 8 (ADR-0006: Plattform-Targets) könnte es einen Frame-Drop geben.

## Decision

Der Pad-Depth-Stack ist standardmäßig **aus**. Opt-In via CSS-State-Klasse:

```html
<div class="sb-pad is-deep"> ... </div>
```

`is-deep` aktiviert: `--pix-bg-layer` Multi-Layer-Gradient, `--pad-filter-base`
Composition-Punkt, neue Tokens `--pad-edge-light`, `--pad-edge-dark`,
`--shadow-pad-lift`.

Ohne `is-deep`: Standard-Pad ohne Depth-Rendering-Overhead.

> *Diese Entscheidung wurde beim Slice 1+2 Audit-Pass (2026-05-27) umgesetzt,
> als das Design-System alignment-geprüft wurde. Dokumentiert in docs/design/design-notes.md
> §RESOLVED — Slice 1+2 Audit-Pass.*

## Consequences

**Positiv:**
- Performance-Budget: Pads ohne `is-deep` sind rendering-günstig.
- Slice 8 kann `is-deep` als Settings-Option exponieren ("High quality pad visuals")
  oder als globales Default einschalten, sobald Performance verifiziert ist.
- Bestehende Code-Paths (Pad-Rendering ohne Depth) bleiben unverändert.

**Negativ / Trade-offs:**
- Zwei visuelle Zustände: Pads mit und ohne `is-deep`. Während der Entwicklung
  muss man sich entscheiden, welcher State als Default gilt.

## Alternatives Considered

**Depth-Stack immer an:** Vollständige visuelle Qualität für alle Pads.
Risiko: Rendering-Performance auf iOS 15-Geräten. Ohne Messung nicht
rechtfertigbar.

**Depth-Stack immer aus:** Kein visueller Mehrwert. Das Ziel ist, `is-deep`
auf dem iPhone performant zu machen, nicht es wegzulassen.

## Related

- **Dateien:** `v3/src/styles/tokens.css` (--pad-edge-light, --pad-edge-dark, --shadow-pad-lift), `v3/src/components/PadGridCell.tsx`
- **ADRs:** ADR-0021 (CSS-Naming / is-* States), ADR-0024 (clip-path + filter:drop-shadow)
- **Quelldokumente:** `docs/design/design-notes.md §RESOLVED — DepthPad migration`, `design-sources/2026-05-25/v15-pad-depth.jsx`
- **Commits:** `eac8690` — refactor: align slice 1+2 with current design system
