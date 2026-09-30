# ADR-0008: Pad position as a `{col, row}` struct

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Data model

## Context

Pads live in a 2D grid (default 4×4). A position can be encoded as an array index (0–15 for a
4×4 grid) or as an explicit `{col, row}` struct.

`docs/architecture/concept-brief.md §4.1` specifies `{col, row}` directly in the type. The
choice has consequences for data model stability and API clarity.

## Decision

```typescript
type PadPosition = {
  col: number; // 0-indexed, 0..cols-1
  row: number; // 0-indexed, 0..rows-1
};
```

A position is an explicit 2D coordinate pair. Array indices are not used internally.

## Consequences

**Positive:**

- Viewport-stable: `position.col` means the same on every device and in every grid
  configuration. With array-index encoding, a grid resize would require recalculating the
  index.
- Hotkey mapping is stable: the F1–F4 key row (Slice 4+) maps to `row=0, col=0..3`. These
  semantics are grid-invariant.
- 4-column constraint (ADR-0032): `position.col` ≤ 3 is a verifiable invariant. With an array
  index, `index % 4` would be an implicit relationship.
- `elementFromPoint` and the cellRef registry in `padDnd.ts` use `col/row` directly for
  drop-zone detection.

**Negative / Trade-offs:**

- IDB serialisation writes `{col, row}` instead of a number. No runtime problem (IndexedDB
  serialises objects natively), but minimally more storage.

## Alternatives considered

**Array index (0-based):** more compact in IDB, simpler for sequential iteration. Drawback: a
grid resize requires recalculating every index. Index 13 in a 4×4 grid is a different pad
than index 13 in a 5×3 grid.

## Related

- **Files:** `v3/src/types.ts` (PadPosition type), `v3/src/lib/padUtils.ts` (nextFreeSlot), `v3/src/lib/padDnd.ts`
- **ADRs:** ADR-0009 (pad position can be null), ADR-0032 (4-column invariant)
- **Source documents:** `docs/architecture/concept-brief.md §4.1`, `docs/design/design-notes.md §A4 · grid stays 4-col`
