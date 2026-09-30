# ADR-0011: LibraryItem split into meta (signals) + Blob (IDB only)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2
**Refines:** —
**Category:** Data model

## Context

The library contains audio files. An audio file has two aspects:
- **Metadata:** name, hash, size, duration, peaks (small, serialisable values)
- **Blob:** the raw audio bytes (50 KB – 10 MB per file)

If Blobs are loaded into the Preact signals state (for library display, filtering, rename
UI), an iOS-fatal error happens: iOS Safari kills the tab at >600 MB–1.5 GB of JS heap
(ADR-0019). With a library of 30+ files that would easily be 1–3 GB in RAM.

This is the most important iOS memory rule from V1 (CLAUDE.md §iPhone / iOS Safari):
**"Never load all audio buffers into RAM."**

## Decision

The `LibraryItem` type is split into two separate types:

```typescript
// Working-memory type — safe to store in Signals
type LibraryItemMeta = {
  id: string;        // SHA-256 hash (IS the identity)
  type: LibraryItemType;
  name: string;
  size: number;
  tags: string[];
  addedAt: number;
  duration: number;
  peaks: number[];   // 30 peak values, computed at upload, stored in IDB
};

// Full IDB entry — NEVER in component state
type LibraryItem = LibraryItemMeta & {
  blob: Blob;
};
```

**Rule:** `LibraryItemMeta[]` lives in `libraryItems` (signals state). `LibraryItem` (with
Blob) leaves IDB only for playback (Slice 4+), via `libGet(id)`, and the caller must release
the reference after use.

`libGetAllMeta()` uses a cursor and never dereferences `cursor.value.blob`, so the Blob stays
collectable by the GC (ADR-0019).

## Consequences

**Positive:**
- The library UI (browse, filter, rename, delete) never loads Blobs into RAM. 100 entries ×
  10 B metadata = 1 KB — vs. 100 × 5 MB audio = 500 MB.
- TypeScript strict (ADR-0004) makes the split unambiguous: code that stores `LibraryItem`
  (instead of `LibraryItemMeta`) in state does not compile.
- Waveform peaks (`peaks: number[]`, 30 values) are part of the meta: the library display
  can render waveform thumbnails without Blob access.

**Negative / Trade-offs:**
- `libRename()` has to load the full `LibraryItem` briefly (IDB has no partial update). The
  Blob is in RAM only for the duration of the call — the pattern is deliberate and documented
  in `idb.ts`.
- Two types instead of one stronger abstraction — but the differentiation is the intent, not a
  weakness.

## Alternatives considered

**A single `LibraryItem` type, Blob lazy-loaded:** would risk the same error if code
accidentally puts `.blob` into state. The explicit split makes that impossible in the type
system.

**All metadata in a separate IDB store:** possible, but unnecessary. The cursor-based
`libGetAllMeta()` is just as memory-safe without schema complexity.

## Related

- **Files:** `v3/src/types.ts` (LibraryItemMeta, LibraryItem), `v3/src/db/idb.ts` (libGetAllMeta cursor), `v3/src/state/store.ts` (libraryItems signal)
- **ADRs:** ADR-0004 (TypeScript strict makes the split enforceable), ADR-0019 (iOS memory safety rules)
- **Source documents:** `CLAUDE.md §iPhone / iOS Safari — memory & stability rules`, `CLAUDE.md §Permanent coding standards`
- **Commits:** `c81992e` — feat(slice-2): Library screen, IDB layer, serial upload pipeline
