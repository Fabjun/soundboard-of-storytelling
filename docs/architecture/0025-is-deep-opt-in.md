# ADR-0025: `is-deep` as opt-in for the pad depth stack

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** UI architecture

## Context

The design system's `v15-pad-depth.jsx` explores six depth treatments for pads. The
recommended "full stack" variant combines: a lighter pad face, a bevel gradient, edge relief
and a chunky pixel drop shadow. It looks good but is rendering-intensive (several CSS layers,
filter: drop-shadow).

With a 4×4 grid of 16 pads, or even 6×4 with 24 pads, rendering becomes noticeable. On the
iPhone 13 Pro that is acceptable; on an iPhone 8 (ADR-0006: platform targets) it could drop
frames.

## Decision

The pad depth stack is **off** by default. Opt-in via a CSS state class:

```html
<div class="sb-pad is-deep"> ... </div>
```

`is-deep` enables: the `--pix-bg-layer` multi-layer gradient, the `--pad-filter-base`
composition point, the new tokens `--pad-edge-light`, `--pad-edge-dark`, `--shadow-pad-lift`.

Without `is-deep`: a standard pad without depth rendering overhead.

> _This decision was implemented in the Slice 1+2 audit pass (2026-05-27), when the design
> system alignment was checked. Documented in docs/design/design-notes.md §RESOLVED — Slice
> 1+2 audit pass._

## Consequences

**Positive:**

- Performance budget: pads without `is-deep` are cheap to render.
- Slice 8 can expose `is-deep` as a settings option ("High quality pad visuals") or switch it
  on as the global default once performance is verified.
- Existing code paths (pad rendering without depth) stay unchanged.

**Negative / Trade-offs:**

- Two visual states: pads with and without `is-deep`. During development one has to decide
  which state is the default.

## Alternatives considered

**Depth stack always on:** full visual quality for every pad. Risk: rendering performance on
iOS 15 devices. Not justifiable without measurement.

**Depth stack always off:** no visual added value. The goal is to make `is-deep` perform on
the iPhone, not to drop it.

## Related

- **Files:** `v3/src/styles/tokens.css` (--pad-edge-light, --pad-edge-dark, --shadow-pad-lift), `v3/src/components/PadGridCell.tsx`
- **ADRs:** ADR-0021 (CSS naming / is-\* states), ADR-0024 (clip-path + filter:drop-shadow)
- **Source documents:** `docs/design/design-notes.md §RESOLVED — DepthPad migration`, `design-sources/2026-05-25/v15-pad-depth.jsx`
- **Commits:** `eac8690` — refactor: align slice 1+2 with current design system
