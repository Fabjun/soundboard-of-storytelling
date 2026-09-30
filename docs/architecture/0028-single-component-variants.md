# ADR-0028: One component per UI element — variants via props

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Refined by:** ADR-0052 (`BoardTopBar` exception kept, re-evaluated in Slice 13)
**Category:** UI architecture

## Context

UI development often creates the temptation to build a separate component for "slightly
different" variants of the same element: `PrimaryButton` + `SecondaryButton`, `PadSmall` +
`PadLarge`, etc.

That leads to divergence: the two variants drift apart, shared fixes are forgotten, the code
base grows horizontally.

`docs/architecture/concept-brief.md §4.2` is explicit: "Every UI element has ONE component.
Variants via props. When a new variant is needed: extend the existing component. Never create
a parallel component. If tempted, ask the user."

## Decision

Every UI element type has **one** component. Variants are controlled via props:

```typescript
function Pad({ pad, mode, isHot }: PadProps) { ... }
function Button({ label, variant, icon, onClick }: ButtonProps) { ... }
function PixelIcon({ name, size, color }: PixelIconProps) { ... }
```

When a new variant appears: a `variant` prop or new props on the existing component, not a new
parallel component.

## Exceptions

| Exception | Reason | Reference | Review |
|---|---|---|---|
| `BoardTopBar` is a separate component next to `TopBar` | The Board screen has fundamentally different header needs (mode toggle as headline) | ADR-0026 | Slice 13 (mobile layout rebuilds both) |

## Consequences

**Positive:**
- Bug fixes and styling updates apply automatically to all variants.
- Fewer components: easier navigation in the project.
- A uniform API pattern across all components.

**Negative / Trade-offs:**
- Props can become complex when many variants accumulate. Countermeasure: refactor early once
  a component has >5 variants.
- "If tempted, ask the user" requires discipline — creating a new component is always faster
  than discussing it.

## Alternatives considered

**Atomic design (atom/molecule/organism):** more structured, good for large teams. Overhead
without added value for this one-person project.

**Parallel components:** fast, but then: drift, duplication, divergence. V1 experience:
several pad variants that grew apart.

## Related

- **Files:** `v3/src/components/*.tsx` (all current ones: PixelIcon, AudioRow, Waveform, PadGridCell, PadGrid, etc.)
- **ADRs:** ADR-0021 (CSS naming — variants via is-* or sb-block-variant)
- **Source documents:** `docs/architecture/concept-brief.md §4.2`, `CLAUDE.md §Permanent coding standards`
