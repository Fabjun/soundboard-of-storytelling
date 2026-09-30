# ADR-0023: Five-level surface hierarchy

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** UI architecture

## Context

The design system defines an explicit depth hierarchy for every surface of the app. This
creates visual order and makes it intuitive for the user which elements are "nearer" or
"further away" (canvas, panels, cards, hover states).

> *This decision was not documented as a separate ADR; it comes directly from the design
> system (HANDOFF.md §4.2) and is recorded here as an architecture rule because violations
> (the wrong token for a level) lead to visual chaos.*

## Decision

Five levels, ordered from darkest to lightest:

| Level | Token | Use |
|-------|-------|------------|
| 1 | `--night` | Canvas behind everything |
| 2 | `--deep` | Persistent chrome (TopBar, StatusBar) |
| 3 | `--surface` | Page background inside the window |
| 4 | `--raised` | Content inside `--surface` (cards, inputs) |
| 5 | `--top` | Transient states (hover, selected row) |

**Rules:**
- No sixth level
- No skipped levels (e.g. never `--night` directly under a `--raised` element)
- Every level is visually distinguishable in all themes

## Consequences

**Positive:**
- The user intuitively sees "what sits on top of what" without explanation.
- Theme switching (Slice 8) is consistent: all five levels are overridden in the theme.
- New components follow a clear scheme.

**Negative / Trade-offs:**
- Constraint: one is sometimes tempted to introduce a sixth level (e.g. tooltip or modal).
  Tooltip and modal should sit on `--top` + `box-shadow` or `filter: drop-shadow`
  (ADR-0024), not on a sixth level.

## Alternatives considered

**Arbitrary depth steps:** more flexibility. Drawback: an inconsistent visual language across
screens and components.

## Related

- **Files:** `v3/src/styles/tokens.css` (--night, --deep, --surface, --raised, --top)
- **ADRs:** ADR-0022 (design tokens), ADR-0024 (clip-path + drop-shadow)
- **Source documents:** `design-sources/2026-05-25/HANDOFF.md §4.2`, `CLAUDE.md §Design language §Color palette`
