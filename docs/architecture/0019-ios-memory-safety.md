# ADR-0019: iOS memory safety rules (150 MB LRU cache, serial decode)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Audio engine & iOS memory

## Context

iOS Safari kills the browser tab when the JS heap crosses a limit: ~600 MB on older iPhones
(iPhone 8 and earlier), ~1–1.5 GB on newer ones (iPhone 12+). This is V1's hardest lesson —
experienced several times in live use.

`CLAUDE.md §iPhone / iOS Safari — memory & stability rules` documents 7 core principles from
V1 that apply 1:1 to V3. These rules are non-negotiable — violations lead to tab kills during
live gaming use.

## Decision

**7 forbidden patterns (carried over from V1):**

1. **Never load all audio buffers into RAM.** Library listing, filtering and rename need no
   audio data — metadata-only query.
2. **Never decode audio in parallel.** Serially: one file at a time; null the previous
   buffer before the next one starts.
3. **Never keep raw audio in component state.** Only `{name, hash, size}` references;
   buffers lazily via `libGet(id)` (Slice 4+).
4. **Never load the complete library JSON for export.** Streaming: one entry at a time into a
   Blob.
5. **Always release decoded buffers after playback.** The `onended` handler must set
   `source.buffer = null`.
6. **Always null large strings immediately.** Base64, JSON after parsing.
7. **LRU cache cap: 150 MB.** V1's proven limit. Do not raise without measuring.

**Implementation consequences:**

- `libGetAllMeta()` uses a cursor and never references `cursor.value.blob` (ADR-0011).
- `processFilesSerial()` in `upload.ts` decodes one file at a time.
- The `libraryItems` signal only holds `LibraryItemMeta[]`, never `LibraryItem[]` (ADR-0011).

**Forbidden patterns in new code (CLAUDE.md §Banned patterns):**

| Pattern                                      | Why                         | Alternative                           |
| -------------------------------------------- | --------------------------- | ------------------------------------- |
| Loading all library buffers for non-playback | 150–240 MB RAM              | Metadata-only cursor                  |
| Parallel `decodeAudioData` for N files       | N × 50–100 MB PCM = OOM     | Serial, release the buffer in between |
| Raw audio in state arrays                    | Compressed + decoded in RAM | `{name, hash, size}`, lazy load       |
| Complete library JSON for export             | 150–300 MB string           | Stream entry by entry                 |
| `FileReader` loop in parallel                | N reads + N decodes         | Serial                                |

## Consequences

**Positive:**

- Tab kills in live use are prevented.
- The rules are defensive enough for older iPhones (600 MB limit).

**Negative / Trade-offs:**

- Code that would intuitively "load all files at once" has to be restructured as streaming.
  That is more development effort.
- Debugging is harder: memory leaks on iOS are not directly visible (no memory profiler in
  the Brave browser on the device).

## Alternatives considered

**No iOS-specific rules:** would produce tab kills in live use. That is the actual V1 result
before these rules — not acceptable.

## Related

- **Files:** `v3/src/db/idb.ts` (libGetAllMeta cursor), `v3/src/lib/upload.ts` (processFilesSerial), `v3/src/state/store.ts` (libraryItems = Meta only)
- **ADRs:** ADR-0006 (iPhone as primary target), ADR-0011 (LibraryItem split), ADR-0018 (V1 audio engine), ADR-0020 (AudioContext lifecycle)
- **Source documents:** `CLAUDE.md §iPhone / iOS Safari — memory & stability rules`, `v1-reference/CLAUDE.md`
