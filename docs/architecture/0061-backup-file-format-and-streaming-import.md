# ADR-0061: Backup file format and piecewise import

**Status:** Accepted
**Date:** 2026-10-02
**Slice:** Slice 10
**Refines:** ADR-0062
**Refined by:** ADR-0069 (V1 `loopCount` becomes the Loop's repeat count)
**Category:** Persistence

> **Accepted by the owner on 2026-10-02** with the review answers B1–B9
> ([review-log.md](../development/review-log.md)); changed by them: the file is a ZIP archive (B1),
> gzip is unpacked by our own code on every browser (B8), library tags are restored (B9). The
> product decisions D1–D6 and the import rules are the owner's
> ([data-backup.md](../product/features/data-backup.md)); this ADR fills in the technical "how"
> that D6 left to Slice 10 planning.

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

The reader tells three kinds of file apart by their first bytes, never by the file name: a ZIP
archive (V3's own format, §3), gzip (V1 backups and early V3 backups) and plain JSON. An import
never holds the file as one string. JSON — a whole file, or the manifest of an archive — is read
as a stream (`Blob.stream()` → gzip unpacking where needed → UTF-8 text) into a streaming JSON
parser, **`@streamparser/json`** (MIT, no dependencies), with `paths: ['$.boards', '$.library.*']`
and `keepStack: false`: the boards arrive as one value, each library entry as its own value, and
an entry is dropped once it has been handled.

Each library entry carries its audio on demand: in a JSON file the base64 text is decoded and
freed when the import asks for it; in an archive the audio is a `Blob.slice` of the file. At most
one audio file is in memory at a time.

**gzip is unpacked by our own code, on every browser** (owner decision B8): fflate's streaming
`Gunzip` (MIT) in a `TransformStream`, instead of the browser's `DecompressionStream`, which iOS
Safari has only since 16.4. One code path, tested the same way on every engine; V1 backups import
on iOS 15 too.

An import makes **two passes** over the file:

1. **Summary** — boards and, per library entry, only `hash`/`name`/`type`; no audio is read.
   Shows the confirmation summary required by the import rules. For an archive this reads only
   the manifest.
2. **Import** — audio first, one entry at a time (the upload pipeline's serial decode for
   duration and peaks; entries whose hash is already in the library are skipped), boards last. An
   abort leaves no board pointing at missing audio. Library tags are restored (owner decision
   B9): a V3 entry's `tags`, a V1 entry's `folder` as one tag; audio already in the library keeps
   its own tags.

### 2. V1 → V3 mapping (D5)

| V1                                                | V3                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| board                                             | a new board (name with a suffix if taken) with **one deck** holding all its pads                                  |
| pad `mode: once`                                  | Single (`files`, order `sequential`)                                                                              |
| pad `mode: loop`                                  | Loop (`files`); `loopCount` → `repeat`, capped at 999 (amended 2026-10-04, ADR-0069)                              |
| pad `mode: playlist` / `chain` / `random`         | Loop with its files; `shuffle` (or `random`) → order `shuffle`                                                    |
| pad `mode: combo`                                 | Combo; step `pads` (V1 pad indexes) → V3 pad ids, `dur` → `duration`, `stopAll` kept                              |
| step `fadeOutAll: true`                           | `fadeOutAll` = the step's `dur` (default 2.5 s) — V1 uses `dur` as the fade time there, so no separate `duration` |
| step `chipOpts` (volume / fade per pad in a step) | dropped (not in the V3 model yet) — counted in the summary                                                        |
| `volume` (0–100), `fadeIn`, `fadeOut`, trim       | kept                                                                                                              |
| `key` (`KeyboardEvent.code`)                      | the placement's `hotkey`                                                                                          |
| `icons`                                           | first icon → `iconRef`                                                                                            |
| library entries `type: 'pad'` (pad templates)     | skipped — counted in the summary                                                                                  |
| `settings`                                        | not applied (import rules)                                                                                        |

### 3. V3's own backup file (D1/D2)

A **ZIP archive** (owner decision B1), `soundboard-backup-YYYY-MM-DD.zip`:

- `audio/<content hash><extension>` — every library audio file **as it is**: no base64, no
  compression (audio is compressed already). The extension follows the audio type, so the files
  open in any player.
- `backup.json` — the manifest, written last:
  `{format: 'sos-v3-backup', formatVersion: 2, appVersion, exported, boards, library: [...]}`;
  each library entry `{id, name, type, tags, addedAt, file}` names its audio file. The manifest has
  V1's shape, so the same JSON reader serves both.

**Writing** — fflate's streaming `Zip` with stored entries (`ZipPassThrough`): one audio file at a
time is read from IndexedDB and copied into the archive's Blob parts before the next.

**Reading** — our own reader after the ZIP specification (PKWARE APPNOTE 6.3.10,
v3/src/lib/zipArchive.ts): the end of central directory record leads to the central directory,
the authoritative list of entries (4.3.6, 4.3.16); each entry's local header gives where its data
starts (4.3.7); the data is a `Blob.slice` of the file. Only stored entries are read; split,
ZIP64, encrypted or compressed archives are refused with a message (the file was changed after
the export). fflate's streaming reader is not used: for entries written with a data descriptor
(fflate's writer always writes one, flag bit 3) it finds an entry's end by searching the data for
the descriptor signature — audio bytes can contain it by chance, and APPNOTE 4.3.9 makes that
signature optional anyway.

Integrity: an entry's id is the SHA-256 of its bytes, which the import computes again.

Format 1 (JSON with base64 audio, `.json[.gz]`, written by 3.0.141 only) stays readable through the
JSON path.

### 4. Persistent storage (D4)

At app start, `navigator.storage.persist()` is requested when the browser offers it; the result is
not shown (D4: invisible).

## Consequences

**Positive:**

- Imports of any size stay within the iPhone memory rules; one JSON reader for V1 and V3 files.
- A V3 backup is about as large as the audio itself (no base64), its summary reads only the
  manifest, and its audio files can be opened with any ZIP tool.
- Audio-first ordering and hash-based skipping make an aborted import harmless and a repeated
  import idempotent for audio.
- Every backup kind imports on every supported browser, iOS 15 included.

**Negative / Trade-offs:**

- A V1 backup is still JSON with base64 — read twice, and decoded entry by entry.
- Two passes read a JSON file twice (time, not memory).
- Our own ZIP reader is code to maintain; it is small, follows the specification and is tested
  against fflate's writers (with and without data descriptors, with extra fields and a comment).
- A ZIP that was unpacked and packed again (usually compressed) is refused.
- `@streamparser/json` is a 0.x package — pinned, tested through our own reader tests, and only
  loaded for import (dynamic `import()`), so it does not grow the start-up bundle.

## Alternatives considered

- **`file.text()` + `JSON.parse`** (V1's way) — rejected: the whole file in memory (D6).
- **A hand-written streaming tokenizer** — feasible, but a maintained, tested parser is the safer
  choice for splitting strings and escapes across chunks.
- **JSON with base64 audio for V3 too** (format 1, the provisional choice) — replaced by the
  owner's B1: base64 makes data about a third larger (MDN) and the audio cannot be opened.
- **fflate's streaming `Unzip` for reading** — rejected: it finds the end of a data-descriptor
  entry by searching for a signature that audio can contain (see §3).
- **Refusing `.gz` where `DecompressionStream` is missing** (the provisional choice) — replaced by
  the owner's B8; keeping the native path next to fflate would leave one of the two untested on
  most test runs.

## Amendments

**2026-10-04:** V1's `loopCount` is no longer dropped: it becomes the Loop's repeat count, capped
at 999 (ADR-0069, owner decision 2026-10-04). The import summary no longer notes dropped loop
counts.

## Related

- **Files:** v3/src/lib/backupReader.ts, v3/src/lib/zipArchive.ts, v3/src/lib/backupExport.ts,
  v3/src/lib/backupImport.ts, v3/src/lib/v1Import.ts
- **ADRs:** ADR-0062 (IndexedDB for all persistence), ADR-0048 (pad pool, three pad types)
- **Source documents:** [data-backup.md](../product/features/data-backup.md),
  [v1-v2-inventory.md §5](../product/v1-v2-inventory.md#5-data--backup)
- **Sources:**
  - https://github.com/juanjoDiaz/streamparser-json — `paths`, `keepStack: false` for large arrays
  - https://caniuse.com/mdn-api_blob_stream — `Blob.stream()` Safari 14.1
  - https://caniuse.com/mdn-api_decompressionstream — `DecompressionStream` Safari 16.4
  - https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT — ZIP specification 6.3.10
    (4.3.6 layout, 4.3.7 local header, 4.3.9 data descriptor, 4.3.12 central directory, 4.3.16 end
    record)
  - https://github.com/101arrowz/fflate — `Zip`, `ZipPassThrough`, `Gunzip` (MIT); its streaming
    `Unzip` scans for the descriptor signature (source of 0.8.3, `Unzip.prototype.push`)
  - https://developer.mozilla.org/en-US/docs/Glossary/Base64 — base64 is about a third larger
  - https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist — `persist()`
  - https://caniuse.com/mdn-api_navigator_storage — `navigator.storage` iOS Safari 15.2
  - https://webkit.org/blog/14403/updates-to-storage-policy/ — WebKit storage eviction policy
