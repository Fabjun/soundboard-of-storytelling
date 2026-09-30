# ADR-0026: Mode-Toggle als interaktive Screen-Headline (BoardTopBar)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** UI architecture

## Context

SETUP/GAME-Mode-Switching ist die zentrale Interaktion auf der Board-Screen.
V1 hatte einen kleinen Mode-Badge. Das Design-System explorierte verschiedene
Platzierungen. `v24-mode-toggle.jsx` definiert den endgültigen Ansatz: der
Mode-Toggle ist die interaktive Headline der Board-Screen, nicht ein kleines
Badge in einer Ecke.

Das `docs/design/design-notes.md §Mode toggle as interactive screen header (v24) — RESOLVED`
dokumentiert die Entscheidung.

## Decision

Der Mode-Toggle ist ein `sb-mode-toggle` Chrome-Block in `BoardTopBar`:
- 3-Spalten-Grid: linke Spalte (Flamme + Board-Name/Breadcrumb), Mitte (Toggle),
  rechte Spalte (Help/Fullscreen)
- `sb-mode-badge` bleibt für kompakte/sekundäre Flächen
- State-Flip löst eine direktionale Spark-Animation aus (SETUP→GAME: gold sparks
  links-nach-rechts; GAME→SETUP: teal rechts-nach-links, ~420 ms, ~10 sparks)
- `prefers-reduced-motion`: 220 ms drop-shadow flash statt Partikel
- Mobile: `is-compact` Modifier (kleinere Font, 6 sparks)

**Neue Tokens** (für Animation-Komposition):
- `--mode-setup-glow: rgba(141, 213, 216, 0.55)` — bright teal
- `--mode-game-glow: rgba(245, 213, 122, 0.55)` — bright gold

Diese schließen eine Symmetry-Lücke: Pad-Typen hatten `-soft` + `-glow` Paar;
Mode-Tokens hatten nur `-soft`. Der `-glow`-Tier ist für Animations-Komposition
erforderlich.

## Consequences

**Positiv:**
- Mode ist sofort visuell dominant — kein Vergessen welcher Mode aktiv ist.
- Konsistente semantische Zuordnung: SETUP-Glow = Loop-Teal-Familie;
  GAME-Glow = Single-Gold-Familie. Die Mode-Farben "erben" die Pad-Typ-Semantik.
- Token-Symmetry: Mode-Tokens haben jetzt denselben dreistufigen Aufbau wie
  Pad-Typ-Tokens (base / -soft / -glow).

**Negativ / Trade-offs:**
- BoardTopBar ist board-spezifisch: ein separater Komponente neben dem
  globalen `TopBar`. Das ist bewusst — Board-Screen hat andere Anforderungen
  (Mode-Toggle, Board-Name) als andere Screens.
- Mehr visual complexity in der TopBar.

## Alternatives Considered

**Kleines `sb-mode-badge` in TopBar-Ecke (V1-Stil):** Weniger prominent;
User übersieht Mode öfter. V24-Design-Session zeigte, dass das ein
echtes Usability-Problem ist.

**Floating Mode-Toggle:** Über dem Grid schwebend. Würde Grid-Content überdecken.

## Related

- **Dateien:** `v3/src/components/ModeToggle.tsx`, `v3/src/components/BoardTopBar.tsx`, `v3/src/styles/tokens.css` (--mode-setup-glow, --mode-game-glow)
- **ADRs:** ADR-0021 (CSS-Naming / is-setup, is-game), ADR-0022 (Design Tokens)
- **Quelldokumente:** `docs/design/design-notes.md §Mode toggle as interactive screen header (v24) — RESOLVED`, `design-sources/2026-05-25/v24-mode-toggle.jsx`
- **Commits:** `9eeceeb` — feat(slice-3): Board + Scene + Pad CRUD
