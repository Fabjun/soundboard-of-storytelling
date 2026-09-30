# ADR-0026: Mode toggle as the interactive screen headline (BoardTopBar)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** UI architecture

## Context

SETUP/GAME mode switching is the central interaction on the board screen. V1 had a small mode
badge. The design system explored different placements. `v24-mode-toggle.jsx` defines the
final approach: the mode toggle is the interactive headline of the board screen, not a small
badge in a corner.

`docs/design/design-notes.md §Mode toggle as interactive screen header (v24) — RESOLVED`
documents the decision.

## Decision

The mode toggle is a `sb-mode-toggle` chrome block in `BoardTopBar`:
- 3-column grid: left column (flame + board name/breadcrumb), middle (toggle), right column
  (help/fullscreen)
- `sb-mode-badge` stays for compact/secondary surfaces
- a state flip triggers a directional spark animation (SETUP→GAME: gold sparks left to right;
  GAME→SETUP: teal right to left, ~420 ms, ~10 sparks)
- `prefers-reduced-motion`: a 220 ms drop-shadow flash instead of particles
- mobile: `is-compact` modifier (smaller font, 6 sparks)

**New tokens** (for animation composition):
- `--mode-setup-glow: rgba(141, 213, 216, 0.55)` — bright teal
- `--mode-game-glow: rgba(245, 213, 122, 0.55)` — bright gold

These close a symmetry gap: pad types had a `-soft` + `-glow` pair; mode tokens only had
`-soft`. The `-glow` tier is required for animation composition.

## Consequences

**Positive:**
- The mode is immediately visually dominant — nobody forgets which mode is active.
- Consistent semantic mapping: SETUP glow = loop teal family; GAME glow = single gold family.
  The mode colours "inherit" the pad type semantics.
- Token symmetry: mode tokens now have the same three-tier structure as pad type tokens
  (base / -soft / -glow).

**Negative / Trade-offs:**
- BoardTopBar is board-specific: a separate component next to the global `TopBar`. That is
  deliberate — the board screen has different requirements (mode toggle, board name) than
  other screens.
- More visual complexity in the top bar.

## Alternatives considered

**Small `sb-mode-badge` in the top bar corner (V1 style):** less prominent; users overlook the
mode more often. The v24 design session showed that this is a real usability problem.

**Floating mode toggle:** hovering over the grid. Would cover grid content.

## Related

- **Files:** `v3/src/components/ModeToggle.tsx`, `v3/src/components/BoardTopBar.tsx`, `v3/src/styles/tokens.css` (--mode-setup-glow, --mode-game-glow)
- **ADRs:** ADR-0021 (CSS naming / is-setup, is-game), ADR-0022 (design tokens)
- **Source documents:** `docs/design/design-notes.md §Mode toggle as interactive screen header (v24) — RESOLVED`, `design-sources/2026-05-25/v24-mode-toggle.jsx`
- **Commits:** `9eeceeb` — feat(slice-3): Board + Scene + Pad CRUD
