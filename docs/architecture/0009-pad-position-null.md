# ADR-0009: Pad position can be `null` (UNPLACED state)

**Status:** Superseded by ADR-0048
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Data model

## Context

Grid configurations can change (Slice 8: the user changes cols/rows). When a 4×4 grid shrinks
to 3×3, the pads from slots (3,3), (0,3), (1,3), (2,3) no longer fit into the grid. What
happens to these pads?

Options:
1. Delete them — data loss, bad
2. Store them in a separate array — data model complexity
3. Set `position: null` (UNPLACED state) — the pad is kept, but without a visible slot

`docs/architecture/concept-brief.md §4.1` documents `position: PadPosition | null` explicitly:
`null = unplaced (reserved for Slice 8)`.

## Decision

```typescript
type Pad = {
  ...
  position: PadPosition | null; // null = unplaced
  ...
};
```

`null` means: the pad exists but has no visible slot in the grid. Slice 3 always assigns a
real position (no pad is created unplaced). The UNPLACED mechanism is implemented in Slice 8.

The type system forces every call site to handle `null` (TypeScript strict, ADR-0004).

## Consequences

**Positive:**
- No data loss when the grid shrinks (Slice 8).
- Pads remember their desired position (docs/design/design-notes.md §A4 · "Unplaced pads
  remember their desired position"): when the grid grows they are re-placed automatically.
- The type system enforces null handling everywhere.

**Negative / Trade-offs:**
- Every code path that uses `position.col/row` has to check for `null`. That is some
  boilerplate, but it prevents accidental crashes.

## Alternatives considered

**Separate `unplacedPads` array:** would take pads out of the scene scope, which would require
cross-references. More complex without added value.

**Delete when the grid shrinks:** data loss. Not acceptable.

## Related

- **Files:** `v3/src/types.ts` (Pad.position), `v3/src/lib/padUtils.ts`
- **ADRs:** ADR-0008 (pad position as {col, row}), ADR-0004 (TypeScript strict enforces null handling)
- **Source documents:** `docs/architecture/concept-brief.md §4.1`, `docs/design/design-notes.md §A4 · Unplaced pads remember their desired position`
