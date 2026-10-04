# ADR-0032: 4-column grid constant across all viewports

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Interaction

## Context

The standard grid is 4×4. On a 360 px portrait viewport the cells would be ~78 px wide — above
the 44 px touch minimum. The question: should the grid wrap to 3 columns on portrait mobile?

`docs/design/design-notes.md §A4 · grid stays 4-col on every viewport` documents the decision
with three reasons:

1. `position.col` must be viewport-stable (data model integrity, ADR-0008)
2. The hotkey mapping (F1–F4 = row 1, columns 1–4) depends on the column count
3. Layout jumps between desktop and phone have a learning cost without added value

## Decision

The pad grid **always** uses 4 columns (on the standard 4×4 grid). On portrait mobile: cells
are ~78 px wide at a 360 px viewport — above the 44 px minimum, acceptable.

No automatic reflow to 3 columns on a portrait viewport.

The grid may become configurable in the future (Slice 8 `gridConfig` popover), but the default
is 4×4 and reflow is not an automatic mechanism.

> docs/design/design-notes.md recommends a hard cap of 5 cols max for mobile (Slice 8: 5×4 is
> the mobile maximum).

## Consequences

**Positive:**

- `position.col` is semantically stable: column 3 on the phone is the same column as column 3
  on the desktop.
- The hotkey mapping is viewport-independent.
- Simpler code: no viewport-specific grid logic.

**Negative / Trade-offs:**

- 4×4 cells are ~78 px on a 360 px portrait viewport — tight but acceptable. With a 5-column
  default they would be ~62 px — borderline.
- Users with large fingers on small phones could have difficulties. A deliberate trade-off in
  favor of data model stability.

## Alternatives considered

**Portrait reflow to 3 columns:** would introduce data model instability: `position.col` would
depend on the viewport. Breaks the hotkey mapping.

**No grid reflow, but other column counts via gridConfig:** correct — that is the Slice 8 way.
The default stays 4×4.

## Related

- **Files:** `v3/src/components/PadGrid.tsx`, `v3/src/types.ts` (Scene.gridConfig)
- **ADRs:** ADR-0008 (pad position as {col,row} — viewport-stable coordinates), ADR-0006 (platform targets), ADR-0045 (two-axis adaptive model)
- **Boundary (axis 1 vs. ADR-0032):** axis-1 frame layout adaptation (where sidebar/bands sit,
  depending on the screen format — bottom bar on narrow/portrait, side rail on wide/landscape)
  ≠ the pad grid column reflow this ADR addresses. ADR-0032 forbids automatic reflow of the
  **pad grid column count** (the pads themselves always stay in the configured column count).
  Axis 1 concerns the **surrounding frame layout** (sidebar position, band arrangement). Both
  concepts are independent; no contradiction.
- **Source documents:** `docs/design/design-notes.md §A4 · grid stays 4-col on every viewport`
