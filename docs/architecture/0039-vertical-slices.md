# ADR-0039: Vertical slices as the development model (8 slices)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Process & product decisions

## Context

V3 is a rewrite with a clearly defined feature set. The question: how is the work organized?
Horizontally (layers: UI base first, then state, then persistence) or vertically (features:
every slice is a complete feature)?

`docs/architecture/concept-brief.md §5.1` sets vertical slices explicitly: "Build in working
slices, not horizontal layers. Each slice ends with a committable, testable,
screenshot-verifiable result."

## Decision

Development in **8 vertical slices**:

| #   | Feature                     | Status |
| --- | --------------------------- | ------ |
| 1   | Project setup + StartScreen | ✅     |
| 2   | Library + LibraryItem CRUD  | ✅     |
| 3   | Board + Scene + Pad CRUD    | ✅     |
| 4   | Audio playback (V1 engine)  | ✅     |
| 5   | Scene switching             | ⬜     |
| 6   | Sets + Quick Access         | ⬜     |
| 7   | Template export/import      | ⬜     |
| 8   | Settings, themes, polish    | ⬜     |

Every slice delivers: UI + state + persistence + manual verification + tests.

**Plan deviations** have to be declared explicitly (CLAUDE.md §Deviations).

## Consequences

**Positive:**

- After every slice the app runs and can be shown. No monolithic "big bang" release.
- Early feedback loops: after Slice 1 the visual design is visible, after Slice 2 the IDB
  layer is validated.
- Every slice decision can inform the next slice.

**Negative / Trade-offs:**

- Some architecture decisions (e.g. the audio engine facade) have to be made before the
  actual slice (ADR-0018 is documented in advance, even though Slice 4 is still pending).
- "Vertical slice" often requires anticipating IDB schemas and types, even if certain features
  are only needed later.

## Alternatives considered

**Horizontal layers:** UI components first (without IDB), then IDB, then audio. Drawback: no
runnable product until all layers are done; assumptions about the layer boundaries are
validated only late.

**Feature by feature without a slice plan:** more flexible, but riskier for a rewrite project
with a fixed feature set. The slice plan keeps the scope under control.

## Related

- **Files:** `CLAUDE.md §Slice progress`, `docs/architecture/concept-brief.md §5.1`
- **ADRs:** ADR-0039 is the meta ADR for all slice-specific ADRs
- **Source documents:** `docs/architecture/concept-brief.md §5.1`, `CLAUDE.md §Workflow rules §4`
- **Commits:** `8be64d4` (Slice 1), `c81992e` (Slice 2), `9eeceeb` (Slice 3)
