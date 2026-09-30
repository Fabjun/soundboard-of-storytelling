# ADR-0041: English as the app language — no i18n infrastructure

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Process & product decisions

## Context

V3 is used primarily by one person — the developer — for TTRPG sessions. The players may speak
German, but the soundboard is a "backstage" tool (GM only). The user talks to Claude Code in
German or English; the app UI is in English.

`docs/architecture/concept-brief.md §4.11` states: "English only. No i18n infrastructure yet,
but structure code so a future i18n pass is feasible."

> _This decision was documented explicitly in the concept brief and is formalised here as an
> ADR because "English" + "no i18n infrastructure" are both — a scope restriction and an
> architecture constraint._

## Decision

- All UI texts are in English (hard-coded).
- No i18n library (react-intl, i18next, etc.) is installed.
- Code structure: UI texts in named constants instead of directly in JSX, where practical.
  That enables a future i18n pass without searching through JSX.

## Consequences

**Positive:**

- No i18n overhead in bundle size or runtime.
- No translation management effort.
- Not relevant for the current use case (single user, GM tool).

**Negative / Trade-offs:**

- A future localisation requires introducing i18n retroactively. The "named constants"
  structure reduces the effort but does not remove it.
- If the tool ever becomes commercial (CLAUDE.md: "A potential commercial product in the long
  term"), i18n follow-up work is foreseeable.

## Alternatives considered

**i18n infrastructure from the start:** a cleaner architecture for future localisation. But
overhead for a use case that does not exist at the moment. YAGNI: not now.

**German:** German as the app language. The user uses English primarily for code and tool UI;
the design system is in English. English is more consistent.

## Related

- **Files:** `v3/src/screens/*.tsx`, `v3/src/components/*.tsx` (UI texts)
- **ADRs:** ADR-0006 (platform targets), ADR-0039 (slice plan: i18n not in scope)
- **Source documents:** `docs/architecture/concept-brief.md §4.11`, `CLAUDE.md §Project identity §Project language`
