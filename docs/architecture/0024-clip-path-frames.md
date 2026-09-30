# ADR-0024: `clip-path` for pixel frames — `filter: drop-shadow()` instead of `box-shadow`

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** UI architecture

## Context

The design system uses `clip-path: polygon(...)` for the characteristic stepped pixel corners
of all containers (pads, cards, buttons, pills). This is the central visual identifier of the
"pixel art" look.

`clip-path` has a critical technical consequence: **`box-shadow` is clipped.** A `box-shadow`
on a `clip-path` element does not appear outside the polygon boundary — the shadow is simply
cut away.

> *This decision comes directly from HANDOFF.md §4.1 and is fundamental for every UI
> implementation. Without knowing this rule, every attempt to set an external shadow on
> `sb-pix`-family elements fails silently.*

## Decision

- **`clip-path`** for all pixel frame shapes. Never `border-radius` on `sb-pix`-family
  elements.
- **External shadow:** `filter: drop-shadow(...)` instead of `box-shadow`.
  `filter: drop-shadow` follows the actual clip-path silhouette, not the bounding box.
- **Internal (inset) shadow:** `box-shadow: inset ...` is allowed — inset shadows are rendered
  inside the padding box and clipped correctly by clip-path. That is the desired semantics.

**Practical consequence for `sb-pad is-deep`:**
the pad depth treatment (ADR-0025) combines:
- an inset box-shadow for the bevel effect (allowed)
- `filter: drop-shadow(...)` for the outer elevation shadow (required)

## Consequences

**Positive:**
- A correct shadow follows the stepped pixel silhouette — it looks like a real pixel-art
  element with depth.

**Negative / Trade-offs:**
- `filter: drop-shadow` cannot be combined with other `filter` values (e.g. `filter: blur`)
  without conflicts. Solution: the `--pad-filter-base` custom property as a composition point
  (documented in docs/design/design-notes.md).
- Browser rendering: `filter: drop-shadow` can be more expensive than `box-shadow` for
  complex clip-path polygons on weak devices. With 16–64 pads on a 4×4 grid no measured
  performance difference so far.

## Alternatives considered

**`border-radius` instead of `clip-path`:** would destroy the stepped pixel corners. That is
the "pixel art" look — not negotiable.

**SVG-based frames:** technically possible, but considerably more markup and worse
performance than CSS clip-path.

## Related

- **Files:** `v3/src/styles/tokens.css` (pixel frame base styles, drop-shadow tokens), `v3/src/components/PadGridCell.tsx`
- **ADRs:** ADR-0021 (CSS naming), ADR-0025 (is-deep pad depth), ADR-0022 (design tokens)
- **Source documents:** `design-sources/2026-05-25/HANDOFF.md §4.1`, `docs/design/design-notes.md §Drop-shadow vs Inset shadow — RESOLVED`
