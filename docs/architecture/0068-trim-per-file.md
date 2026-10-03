# ADR-0068: Several files per pad, each with its own trim

**Status:** Accepted
**Date:** 2026-10-03
**Slice:** Slice 15
**Refines:** ADR-0048
**Category:** Data model

## Context

Since Slice 9d (ADR-0048) a Single or Loop pad holds several files (`files: string[]`, library
hashes) and one trim for the whole pad. Slice 15b builds the editor for those files (add, remove,
order). Files of one pad differ in length, so one trim for all of them rarely fits; and the engine
ignored the trim of a Loop with several files altogether (its playlist started every file whole,
as V1 did). Until version 6 every database upgrade cleared the stored boards (test data); the
owner now has real boards from the V1 import, so a format change must convert them.

## Decision

Owner decisions 2026-10-03 (trim per file; plan and engine change approved):

1. **Model:** `files: PadFile[]` with `PadFile = { hash, trimStart?, trimEnd? }`; the pad-wide trim
   is gone. Fades and volume stay per pad. Industry practice: each audio region keeps its own start
   and end — clips in Ableton Live, zones in a sampler — and a list of entries with their own
   fields is the usual shape (not parallel lists).
2. **One conversion, `migratePad`** (`v3/src/lib/padFiles.ts`), used by the database upgrade to
   version 7 and by the backup import (`parseBoard`), so both convert alike. It keeps how a pad
   sounded: a Single applied its trim to whichever file it played, so every file gets it; a Loop
   with one file gets it on that file; a Loop with several files played them whole, so none gets
   it. A pad already in the new shape comes back unchanged. The V1 import builds the new shape
   directly by the same rule (V1 played playlist files whole).
3. **Database version 7** converts the stored boards in place inside the upgrade transaction (W3C
   IndexedDB: the `versionchange` transaction allows reads and writes on every store) — never a
   clear. A failure aborts the transaction and leaves version 6 intact.
4. **Engine change** (owner-approved 2026-10-03, playback check on the iPhone checklist): the
   playlist — standalone and as a combo child — starts each file within its own trim
   (`startFileSource`); a file without a trim plays whole as before. Single and one-file Loop get
   the chosen file's trim through the facade (`toEnginePad`), without an engine change.
5. **Editor:** the PAD editor lists the files (`PadFileList`): select one for the waveform editor
   and the preview, ▲ / ▼ to move it (WCAG 2.2 SC 2.5.7, "adjacent controls for moving the element
   up or down"), ✕ with a second tap to remove it, "in order" / "shuffled"; the library picker adds
   several ticked files at once (V1 v120).

## Consequences

**Positive:**

- Each file of a pad plays exactly the part chosen for it — also in a Loop with several files.
- The owner's boards survive the format change; older backups import as before.
- One conversion function for storage and backups: they cannot drift apart.

**Negative / Trade-offs:**

- A Loop with several files that had a pad-wide trim loses it on conversion — it was never heard,
  so the sound does not change, but the stored value is gone.
- Fades stay per pad: a fade longer than a short file's trimmed region is not shortened for that
  file (the editor fits the fades to the selected file only).

## Alternatives considered

**One trim for all files (as V1):** no model change, but rarely fits files of different lengths
and still ignored by the playlist. Rejected by the owner.

**Trim only for a single file:** simple, but no trimming for pads with several files. Rejected by
the owner.

**A parallel map `trims: Record<hash, …>` next to `files: string[]`:** smaller change, but two
lists that must be kept in step. Rejected for the list of entries.

## Related

- **Files:** `v3/src/types.ts`, `v3/src/lib/padFiles.ts`, `v3/src/db/idb.ts`,
  `v3/src/lib/boardModel.ts`, `v3/src/lib/v1Import.ts`, `v3/src/audio/engine.ts`,
  `v3/src/audio/index.ts`, `v3/src/components/PadFileList.tsx`,
  `v3/src/components/PadEditorPanel.tsx`
- **ADRs:** ADR-0048 (pad pool and files), ADR-0065 (waveform peaks)
- **Sources:** https://www.ableton.com/en/manual/clip-view/ ·
  https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html ·
  https://www.w3.org/TR/IndexedDB/#upgrade-transaction-steps
