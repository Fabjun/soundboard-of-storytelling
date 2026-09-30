# ADR-0041: Englisch als App-Sprache — keine i18n-Infrastruktur

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Process & product decisions

## Context

V3 wird primär von einer Person genutzt — dem Entwickler selbst — für
TTRPG-Sessions. Die Spieler sprechen ggf. Deutsch, aber das Soundboard ist
ein "backstage"-Tool (GM-only). Der User kommuniziert mit Claude Code auf
Deutsch oder Englisch; die App-UI ist auf Englisch.

`docs/architecture/concept-brief.md §4.11` legt fest: "English only. No i18n infrastructure
yet, but structure code so a future i18n pass is feasible."

> *Diese Entscheidung war explizit im Concept Brief dokumentiert und wird hier
> als ADR formalisiert weil "Englisch" + "keine i18n-Infrastruktur" beides
> sind — eine Scope-Einschränkung und ein Architektur-Constraint.*

## Decision

- Alle UI-Texte sind auf Englisch (hardcoded).
- Keine i18n-Bibliothek (react-intl, i18next, etc.) ist installiert.
- Code-Struktur: UI-Texte in named constants statt direkt in JSX, soweit
  praktisch. Das ermöglicht einen zukünftigen i18n-Pass ohne JSX-Durchsuchen.

## Consequences

**Positiv:**
- Kein i18n-Overhead in Bundle-Größe oder Laufzeit.
- Kein Translations-Management-Aufwand.
- Für den aktuellen Use-Case (Single-User, GM-Tool) nicht relevant.

**Negativ / Trade-offs:**
- Eine zukünftige Lokalisierung erfordert retroaktives Einführen von i18n.
  Die "named constants"-Struktur mildert den Aufwand, eliminiert ihn nicht.
- Wenn das Tool jemals kommerziell wird (CLAUDE.md: "Langfristig potentielles
  kommerzielles Produkt"), ist eine i18n-Nachtrags-Arbeit absehbar.

## Alternatives Considered

**i18n-Infrastruktur von Anfang an:** Sauberere Architektur für zukünftige
Lokalisierung. Aber Overhead für einen Use-Case, der derzeit nicht existiert.
YAGNI-Prinzip: nicht jetzt.

**Deutsch:** App-Sprache Deutsch. User verwendet primär Englisch für
Code und Tool-UI; das Design-System ist auf Englisch. Englisch ist konsistenter.

## Related

- **Dateien:** `v3/src/screens/*.tsx`, `v3/src/components/*.tsx` (UI-Texte)
- **ADRs:** ADR-0006 (Plattform-Targets), ADR-0039 (Slice-Plan: i18n nicht im Scope)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.11`, `CLAUDE.md §Project identity §App UI language`
