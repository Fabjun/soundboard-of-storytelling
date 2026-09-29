# ADR-0024: `clip-path` für Pixel-Frames — `filter: drop-shadow()` statt `box-shadow`

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** UI-Architektur

## Context

Das Design-System verwendet `clip-path: polygon(...)` für die charakteristischen
gestuften Pixel-Ecken aller Container (Pads, Cards, Buttons, Pills). Das ist der
zentrale visuelle Identifikationsmerkmal des "Pixel-Art"-Look.

`clip-path` hat eine kritische technische Konsequenz: **`box-shadow` wird geclippt.**
Ein `box-shadow` auf einem `clip-path`-Element erscheint nicht außerhalb der
Polygon-Grenze — der Schatten wird einfach weggeschnitten.

> *Diese Entscheidung stammt direkt aus HANDOFF.md §4.1 und ist fundamental für
> alle UI-Implementierungen. Ohne Kenntnis dieser Regel wird jeder Versuch,
> externen Shadow auf `sb-pix`-family-Elementen zu setzen, schweigend scheitern.*

## Decision

- **`clip-path`** für alle Pixel-Frame-Formen. Nie `border-radius` auf
  `sb-pix`-family-Elementen.
- **Externer Shadow:** `filter: drop-shadow(...)` statt `box-shadow`.
  `filter: drop-shadow` folgt dem tatsächlichen clip-path-Silhouette, nicht dem
  Bounding-Box.
- **Interner (Inset) Shadow:** `box-shadow: inset ...` ist erlaubt — Inset-Shadows
  werden innerhalb des Padding-Box gerendert und von clip-path korrekt geclippt.
  Das ist die erwünschte Semantik.

**Praktische Konsequenz für `sb-pad is-deep`:**
Die Pad-Depth-Behandlung (ADR-0025) kombiniert:
- Inset box-shadow für Bevel-Effekt (erlaubt)
- `filter: drop-shadow(...)` für äußeren Elevation-Schatten (erforderlich)

## Consequences

**Positiv:**
- Korrekter Shadow folgt dem gestuften Pixel-Silhouette — sieht aus wie ein
  echtes Pixel-Art-Element mit Tiefe.

**Negativ / Trade-offs:**
- `filter: drop-shadow` lässt sich nicht mit anderen `filter`-Werten (z.B.
  `filter: blur`) kombinieren ohne Konflikte. Lösung: `--pad-filter-base`
  Custom Property als Composition-Punkt (dokumentiert in docs/design/design-notes.md).
- Browser-Rendering: `filter: drop-shadow` kann bei komplexen clip-path-Polygonen
  auf schwachen Geräten teurer sein als `box-shadow`. Bei 16–64 Pads auf einem
  4×4-Grid bisher kein gemessener Performance-Unterschied.

## Alternatives Considered

**`border-radius` statt `clip-path`:** Würde die gestuften Pixel-Ecken zerstören.
Das ist der "Pixel-Art"-Look — nicht verhandelbar.

**SVG-basierte Frames:** Technisch möglich, aber erheblich mehr Markup und
schlechtere Performance als CSS clip-path.

## Related

- **Dateien:** `v3/src/styles/tokens.css` (Pixel-Frame base styles, drop-shadow tokens), `v3/src/components/PadGridCell.tsx`
- **ADRs:** ADR-0021 (CSS-Naming), ADR-0025 (is-deep Pad-Depth), ADR-0022 (Design Tokens)
- **Quelldokumente:** `SoS_DESIGN_25052026/HANDOFF.md §4.1`, `docs/design/design-notes.md §Drop-shadow vs Inset shadow — RESOLVED`
