# ADR-0010: Board as a monolithic JSON document in IDB

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Data model

## Context

The board data model is hierarchical: `Board → [Scene → [Pad]]`. A relational database would
store these in separate tables with foreign keys. IndexedDB has no joins — data can either be
stored in separate stores with manual lookups, or as an embedded document.

Decision point in Slice 3: how is a board persisted in IDB?

## Decision

A board is stored as a single JSON document. Scenes and pads are embedded (not in separate
IDB stores). Every mutation (rename a pad, add a scene, move a pad) writes the complete board
document.

```typescript
boardPut(board: Board): Promise<void>
// Upsert of the complete document, containing all scenes and pads.
```

Size estimate: with 5 scenes × 16 pads it is ~50 KB of JSON. IDB writes of this size typically
take <5 ms on modern devices.

The trade-off is deliberate and documented in `v3/src/db/idb.ts` (comment block at the top)
and in `docs/design/design-notes.md`:

> *BOARD PERSISTENCE TRADE-OFF: Boards are stored as complete JSON documents.
> Any pad edit rewrites the full ~50KB document. Acceptable at 5×16 pads;
> see docs/design/design-notes.md "Slice 8 / Performance" for optimisation path if
> measured to be a bottleneck.*

## Consequences

**Positive:**
- Simple transactions: no join code, no referential integrity management.
- Auto-save (ADR-0030): a single `boardPut(board)` after every mutation. No tracking of which
  sub-entity changed.
- Consistent snapshots: the stored document is always consistent (board + all scenes + all
  pads in one atomic write).
- Simple loading: `boardGetAll()` loads all boards completely (no joins, no second-level
  queries).

**Negative / Trade-offs:**
- Write amplification: a pad rename writes the complete 50 KB document. Acceptable at 5 scenes
  × 16 pads; with 20+ scenes it could become measurable.
- No partial update in IDB (IDB has no UPDATE operator). The document always has to be fully
  read → changed → written.

**Optimisation path (only if measured):**
introduce a separate `scenes` store; the board holds only `sceneIds: string[]`. Only once a
performance problem is quantified — not speculatively.

## Alternatives considered

**Separate `scenes` + `pads` stores:** would allow granular updates. Drawback: joins in
JavaScript, referential integrity managed by hand, more complex transactions. No added value
with ≤5 scenes.

**Scenes embedded, pads in a separate store:** a hybrid. More complex than the full document
without a clear advantage at the expected data volume.

## Related

- **Files:** `v3/src/db/idb.ts` (boardPut/Get/GetAll/Delete), `v3/src/state/store.ts` (upsertBoard)
- **ADRs:** ADR-0014 (IndexedDB sole persistence), ADR-0030 (auto-save debounce)
- **Source documents:** `CLAUDE.md §V3 audio/IDB API`, `docs/design/design-notes.md §Slice 8 / Performance`
- **Commits:** `9eeceeb` — feat(slice-3): Board + Scene + Pad CRUD
