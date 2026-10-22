# ADR-0088: Library folders — one map from file to folder in the key-value store

**Status:** Accepted
**Date:** 2026-10-22
**Slice:** Slice 16
**Refines:** ADR-0062
**Category:** Persistence

## Context

Slice 16c brings folders to the library ([library.md L2](../product/features/library.md#l2-folders-tags-or-both):
folders as in V1, tags stay search words — decided by Claude for review). V1 kept a file's folder as
a field `folder` on its library entry and derived the folder list from the entries.

Three facts shape V3's version:

- **IndexedDB has no partial update.** A library entry holds its audio in the same record, so
  changing one field rewrites the whole record (`libRename` documents this trade-off). Moving 50
  files, or renaming a folder that holds them, would rewrite 50 audio records. The iPhone memory
  rules keep the audio out of the JavaScript heap, but each rewrite still copies the audio on
  disk.
- **The old folders are already stored as tags.** A V1 import keeps each file's `folder` as its one
  tag (owner decision B9, 2026-10-02: "the library groups of Slice 16 build on them"). V3 writes
  tags nowhere else (`addAudioFile` stores the tags a backup import passes, an upload passes none),
  so every stored tag is a former V1 folder.
- **A migration in the database upgrade can stop the app from starting.** It would run inside the
  upgrade transaction; if that aborts, the database stays at its previous version (W3C IndexedDB
  3.0, 2.1.1) and the app's open fails, so nothing loads.

## Decision

1. **One map `library-folders` in the `keyval` store** (ADR-0062): `{ [file id]: folder name }`.
   It is read with the other preferences before the first render (`loadPrefs`). A file without an
   entry is in no folder. The folder list is the set of names the files in the library use, sorted
   by name with case ignored, as the library's name sort (`v3/src/lib/padSort.ts`).
2. **Moving, renaming and removing a folder write the map once**, never a library record.
   `v3/src/state/libraryFolders.ts` holds the logic; the library screen and the backup call it.
3. **The old tags become folders without a migration.** While the map has never been written, it
   is derived from the stored entries: a file whose tags are exactly one name is in that folder.
   The first change writes the derived map with the change, and from then on the stored map is
   the only source. The tags themselves stay as they are, so nothing stored is changed or lost.
4. **A file keeps its folder in the trash.** The map is keyed by the file's hash, so RESTORE puts
   the file back where it was. Entries of files that are neither in the library nor in the trash
   are dropped on the next write.
5. **Backups carry the folder.** The export writes `folder` on each library entry of the manifest
   (an optional field; `formatVersion` stays 2, as with `originalName`, ADR-0061 amendment). The
   import takes `folder` from V3 and V1 entries alike; a file already in the library keeps its own
   folder.
6. **Names:** trimmed, inner spaces collapsed, at most 40 characters (V1's limit). A new name that
   matches an existing folder except for case joins that folder, as on a Mac's default APFS
   volume, where only the "Case-sensitive" variant keeps "Homework" and "HOMEWORK" apart.

## Consequences

**Positive:**

- Moving any number of files and renaming a folder each cost one small write, with no audio
  touched. That follows iPhone memory rule 3 in spirit: working state holds references, not
  audio.
- There is no upgrade step that could fail, and no stored record changes.
- Existing V1 folders appear as folders at once.

**Negative / Trade-offs:**

- A file's folder lives apart from its record. Code that copies library records (the backup) has
  to read the map. `v3/src/lib/backupExport.ts` does.
- The derivation in point 3 treats a single tag as a folder. A V3 backup made from another app
  version with hand-made tags would be read the same way; V3 has no way to make tags, so none exist.

## Alternatives considered

- **A field `folder` on the library entry (V1):** every move and rename rewrites audio records,
  and the old tags need an upgrade migration. Rejected for the cost and the start-up risk.
- **A separate `folders` object store:** the same as point 1 with more schema. The map is small
  (one string per file), so the existing key-value store is enough.
- **Folders as editable tags (L2 option B):** decided against in L2.

## Related

- **Files:** `v3/src/state/libraryFolders.ts`, `v3/src/state/prefs.ts`,
  `v3/src/screens/LibraryScreen.tsx`, `v3/src/lib/backupExport.ts`, `v3/src/lib/backupImport.ts`,
  `v3/src/lib/upload.ts`
- **ADRs:** ADR-0062 (preferences in IndexedDB), ADR-0061 (backup format), ADR-0087 (trash)
- **Source documents:** [library.md L2, L3](../product/features/library.md#l2-folders-tags-or-both)
- **Sources:** W3C Indexed Database API 3.0 (https://www.w3.org/TR/IndexedDB/), 2.1.1: the version
  "remains constant … unless an upgrade is aborted, in which case it is set to the previous
  version", and 2.7.1: an aborted transaction's changes are rolled back. Apple Support, "File
  system formats available in Disk Utility on Mac": plain "APFS" is the choice "if you don't need
  an encrypted or case-sensitive format"; only "APFS (Case-sensitive)" tells "Homework" from
  "HOMEWORK".
