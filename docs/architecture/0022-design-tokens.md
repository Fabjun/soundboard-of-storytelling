# ADR-0022: Design-Tokens in `tokens.css` — keine Farbliterale

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** UI-Architektur

## Context

Das Design-System liefert `SoS_DESIGN_25052026/tokens.css` als komplettes
Token-System: Farben, Typography, Spacing, Pixel-Frame-Styles, Theme-Overrides,
Animation-Keyframes. `docs/architecture/concept-brief.md §4.7` legt fest: "Token language
follows the design system canonically."

Die Alternative wäre, Farben/Fonts/Spacing direkt im JSX oder CSS zu kodieren.

## Decision

**Keine Farbliterale, keine hardcodierten Spacing-Werte ≥12 px in neuem Code.**
Alle visuellen Werte kommen aus `tokens.css` Custom Properties:

```css
/* Erlaubt */
color: var(--text);
background: var(--surface);
gap: var(--space-4);

/* Verboten */
color: #ccc;
background: #1a1a2e;
gap: 16px;
```

`v3/src/styles/tokens.css` started as a copy of `SoS_DESIGN_25052026/tokens.css`
but has diverged during V3 development: 9 tokens were added (runtime animation
variables, grid layout variables, new ambient glow tokens — `--flame-soft`,
`--flame-aura`, `--grid-cols/gap/rows`, `--spark-duration/dx/dy`, `--undo-duration`),
and `--pix-bg-layer` was removed. The design handoff origin
(`SoS_DESIGN_25052026/tokens.css`) is kept as a reference only and is not loaded by
the app. See `docs/README.md` for the full documentation structure.
Theme-Overrides (`.theme-verdant`, `.theme-neon`,
`.theme-crimson`) sind in `tokens.css` enthalten.

**Verboten in neuem V3-Code (aus docs/design/design-system-cheatsheet.md):**
- Neue Farbliterale
- `--sb-*` Legacy-Aliase (nur für rückwärtskompatible Verweise)
- `border-radius` auf `sb-pix`-family (clip-path, ADR-0024)
- Theme-Overrides für Spacing / Radius / Type (nur Farben werden theme-spezifisch)

## Consequences

**Positiv:**
- Theme-Switching (Slice 8) ist trivial: anderes CSS-Class auf Root-Element,
  Token-Overrides greifen automatisch überall.
- Konsistenz: 50+ Komponenten verwenden dieselben Token-Namen.
- Token-Dokumentation in `CLAUDE.md §Design language` ist kanonisch.

**Negativ / Trade-offs:**
- Token-Namen müssen bekannt sein (`--gold` statt `#F5D57A`). Learning-Aufwand
  einmalig beim Einlesen des Cheatsheets.
- Kein TypeScript-Support für Token-Namen (CSS Custom Properties sind Strings).
  Tippfehler werden erst beim Rendern sichtbar.

## Alternatives Considered

**CSS-in-JS (Emotion, styled-components):** TypeScript-Support für Token-Namen.
Nicht kompatibel mit dem Design-System-Ansatz (HANDOFF.md: "copy tokens.css
verbatim"). Overhead ohne Mehrwert für diese App-Größe.

**Tailwind:** Utility-first, kein Token-System per se. Würde das bestehende
Design-System ersetzen. Nicht gewählt.

## Related

- **Dateien:** `v3/src/styles/tokens.css`, `SoS_DESIGN_25052026/tokens.css`
- **ADRs:** ADR-0021 (CSS-Naming), ADR-0023 (Surface Hierarchy), ADR-0027 (Pad-Typ-Farben)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.7`, `CLAUDE.md §Design language`, `SoS_DESIGN_25052026/HANDOFF.md §4`
