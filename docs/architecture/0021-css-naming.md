# ADR-0021: CSS-Klassen `sb-<block>` / `sb-<block>-<part>` / `is-<state>`

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** UI-Architektur

## Context

Das Design-System aus `SoS_DESIGN_25052026/` definiert eine CSS-Namenskonvention,
die in V3 direkt übernommen wird. Die Konvention ist im `docs/design/design-system-cheatsheet.md`
("The 60-second contract") beschrieben.

Die Frage beim Portieren: Soll BEM (Block__Element--Modifier) verwendet werden,
oder eine vereinfachte Variante? Das Design-System hat diese Frage bereits für
uns beantwortet: BEM-ähnlich, aber ohne `__` und `--`.

## Decision

**Klassen-Struktur:**
- Block: `sb-<block>` (z.B. `sb-pad`, `sb-btn`, `sb-card`)
- Part: `sb-<block>-<part>` (z.B. `sb-pad-spine`, `sb-btn-label`)
- State: `is-<state>` (z.B. `is-hot`, `is-setup`, `is-danger`, `is-deep`)

**Regeln (aus docs/design/design-system-cheatsheet.md §60-second contract):**
- Kein BEM `__` (kein `sb-pad__spine`) — nur einfaches `-`
- Kein BEM `--` für Modifier (kein `sb-btn--primary`) — States sind `is-*`
- States sind nie block-namespaced (`is-hot`, nicht `pad--hot`)
- Neue `sb-*` Klassen: im selben Commit in `docs/design/design-system.md §6` registrieren

**Pixel-Frame-Customization:**
- Nie neues clip-path / border CSS für Varianten
- Customization via CSS Custom Properties: `--pix-bg`, `--pix-border`, `--pix-step`

**State-Vocabulary (verwaltetes Inventar — vollständig in docs/design/design-system.md §3;
neue Klassen dort eintragen, nicht hier):**

## Consequences

**Positiv:**
- Design-System-JSX kann direkt als Ausgangscode verwendet werden (ADR-0001).
- Konsistenz zwischen den ~20 Komponenten in `v3/src/components/`.
- Eindeutige State-Vocabulary verhindert redundante Klassen.

**Negativ / Trade-offs:**
- Nicht klassisches BEM: Entwickler mit BEM-Hintergrund müssen den Unterschied
  lernen. Dokumentiert im Cheatsheet.
- Geschlossene State-Vocabulary: neue States brauchen explizite Registrierung
  in `docs/design/design-system.md §3` vor Verwendung.

## Alternatives Considered

**Klassisches BEM:** Mehr Präzision für komplexe Hierarchien. Für dieses
Design-System (flache Komponentenstruktur, wenige Sub-Elemente) unnötig.

**CSS Modules / Tailwind:** Scoped Klassen, kein globaler Namespace. Würde
das Design-System-JSX nicht direkt verwendbar machen (ADR-0001). Nicht gewählt.

## Related

- **Dateien:** `v3/src/styles/tokens.css`, `v3/src/components/*.tsx`
- **ADRs:** ADR-0022 (Design Tokens), ADR-0024 (clip-path), ADR-0025 (is-deep)
- **Quelldokumente:** `docs/design/design-system-cheatsheet.md`, `SoS_DESIGN_25052026/HANDOFF.md §4.1`

## Amendments

**2026-06-15:** `is-conflict` zur Vocabulary hinzugefügt (registriert in `docs/design/design-system.md §3`).
Anlass: Scene-Rename-Import-Gate (`docs/design/imports/scene-rename-conflict.md`) hat die Klasse
als fehlend im geschlossenen Set markiert; User hat Option (a) — globale State-Klasse — gewählt
(vs. (c) Komponenten-lokaler Modifier). Semantik: Namenskonflikt / ungültige Eingabe bei
Uniqueness-Checks. Wiederverwendbar bei Board-Rename, PadSet-Namen und allen künftigen
Validierungs-Konflikt-Situationen.
