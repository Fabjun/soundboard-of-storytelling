# ADR-0061: Backup file format and piecewise import

**Status:** Proposed
**Date:** 2026-10-02
**Slice:** Slice 10
**Refines:** ADR-0014
**Category:** Persistence

> **Proposed — decided provisionally while the product owner was away (2026-10-02), review
> pending** ([review-log.md](../development/review-log.md)). The product decisions D1–D6 and the
> import rules are the owner's ([data-backup.md](../product/features/data-backup.md)); this ADR
> only fills in the technical "how" that D6 left to Slice 10 planning.

## Context

V3 keeps boards and audio only in the browser (IndexedDB). [data-backup.md](../product/features/data-backup.md)
decides: export everything into one file (D1), import it again (D2), show the last backup (D3), ask
for persistent storage (D4), import V1 backups (D5), and read large files piece by piece so the
iPhone does not crash (D6).

The owner's real data is a V1 backup: one board, 31 pads, 99 audio files, about 227 MB. V1 writes
`{version, exported, settings, boards, library: [{hash, name, type, size, added, data}]}` — JSON,
audio as base64 in `data`, the library array last, gzip-compressed where `CompressionStream`
exists. V1 itself imports with `file.text()` + `JSON.parse` — the whole file as one string, which
is exactly what the iPhone memory rules forbid ([CLAUDE.md §iPhone](../../CLAUDE.md#iphone--ios-safari--memory--stability-rules-critical),
rules 4 and 6).

Browser support on the minimum targets (iOS Safari 15+): `Blob.stream()` since Safari 14.1,
`DecompressionStream` / `CompressionStream` only since Safari 16.4, `navigator.storage.persist()`
since Safari 15.2 (sources below).

## Decision

### 1. Reading: a stream, one library entry at a time

An import never holds the file as one string. The file is read as a stream
(`Blob.stream()` → `DecompressionStream('gzip')` for `.gz` files → UTF-8 text) into a streaming
JSON parser, **`@streamparser/json`** (MIT, no dependencies), with
`paths: ['$.boards', '$.library.*']` and `keepStack: false`: the boards arrive as one value, each
library entry as its own value, and an entry is dropped once it has been handled. At most one
audio file (its base64 string and its bytes) is in memory at a time — the same peak as V1's
export.

An import makes **two passes** over the file:

1. **Summary** — boards and, per library entry, only `hash`/`name`/`type` (the base64 string is
   dropped at once). Shows the confirmation summary required by the import rules.
2. **Import** — audio first, one entry at a time (base64 → bytes → the upload pipeline's serial
   decode for duration and peaks; entries whose hash is already in the library are skipped), boards
   last. An abort leaves no board pointing at missing audio.

A `.gz` backup on a browser without `DecompressionStream` (iOS < 16.4) is refused with a clear
message (unpack it first) rather than read as a whole.

### 2. V1 → V3 mapping (D5)

| V1                                                | V3                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| board                                             | a new board (name with a suffix if taken) with **one deck** holding all its pads                                  |
| pad `mode: once`                                  | Single (`files`, order `sequential`)                                                                              |
| pad `mode: loop`                                  | Loop (`files`); `loopCount` is dropped — V3 loops run until stopped                                               |
| pad `mode: playlist` / `chain` / `random`         | Loop with its files; `shuffle` (or `random`) → order `shuffle`                                                    |
| pad `mode: combo`                                 | Combo; step `pads` (V1 pad indexes) → V3 pad ids, `dur` → `duration`, `stopAll` kept                              |
| step `fadeOutAll: true`                           | `fadeOutAll` = the step's `dur` (default 2.5 s) — V1 uses `dur` as the fade time there, so no separate `duration` |
| step `chipOpts` (volume / fade per pad in a step) | dropped (not in the V3 model yet) — counted in the summary                                                        |
| `volume` (0–100), `fadeIn`, `fadeOut`, trim       | kept                                                                                                              |
| `key` (`KeyboardEvent.code`)                      | the placement's `hotkey`                                                                                          |
| `icons`                                           | first icon → `iconRef`                                                                                            |
| library entries `type: 'pad'` (pad templates)     | skipped — counted in the summary                                                                                  |
| `settings`                                        | not applied (import rules)                                                                                        |

### 3. V3's own backup file (D1/D2) — provisional choice

Same shape as V1's file, so one reader serves both: JSON
`{format: 'sos-v3-backup', formatVersion: 1, appVersion, exported, boards, library: [...]}` with
the library last and audio as base64; written as Blob parts one entry at a time (never one big
string), gzip-compressed where `CompressionStream` exists. The file name is
`soundboard-backup-YYYY-MM-DD.json[.gz]`.

### 4. Persistent storage (D4)

At app start, `navigator.storage.persist()` is requested when the browser offers it; the result is
not shown (D4: invisible).

## Consequences

**Positive:**

- Imports of any size stay within the iPhone memory rules; one reader for V1 and V3 files.
- Audio-first ordering and hash-based skipping make an aborted import harmless and a repeated
  import idempotent for audio.

**Negative / Trade-offs:**

- base64 makes the file about a third larger than the audio; gzip recovers part of it.
- Two passes read the file twice (time, not memory).
- `@streamparser/json` is a 0.x package — pinned, tested through our own reader tests, and only
  loaded for import (dynamic `import()`), so it does not grow the start-up bundle.
- `.gz` backups cannot be read on iOS 15.0–16.3.

## Alternatives considered

- **`file.text()` + `JSON.parse`** (V1's way) — rejected: the whole file in memory (D6).
- **A hand-written streaming tokenizer** — feasible, but a maintained, tested parser is the safer
  choice for splitting strings and escapes across chunks.
- **ZIP container with raw audio files** (no base64, random access by slicing) — smaller files and
  inspectable, but needs a ZIP writer and reader (CRC-32, central directory) and a second reader
  next to the V1 one. **Open for the owner** as the alternative to §3.

## Related

- **Files:** v3/src/lib/backupReader.ts, v3/src/lib/v1Import.ts (planned)
- **ADRs:** ADR-0014 (IndexedDB as sole persistence), ADR-0048 (pad pool, three pad types)
- **Source documents:** [data-backup.md](../product/features/data-backup.md),
  [v1-v2-inventory.md §5](../product/v1-v2-inventory.md#5-data--backup)
- **Sources:**
  - https://github.com/juanjoDiaz/streamparser-json — `paths`, `keepStack: false` for large arrays
  - https://caniuse.com/mdn-api_blob_stream — `Blob.stream()` Safari 14.1
  - https://caniuse.com/mdn-api_decompressionstream — `DecompressionStream` Safari 16.4
  - https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist — `persist()`
  - https://caniuse.com/mdn-api_navigator_storage — `navigator.storage` iOS Safari 15.2
  - https://webkit.org/blog/14403/updates-to-storage-policy/ — WebKit storage eviction policy
