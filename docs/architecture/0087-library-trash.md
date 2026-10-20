# ADR-0087: Library trash — a deleted file waits 30 days in its own store

**Status:** Accepted
**Date:** 2026-10-20
**Slice:** Slice 16
**Refines:** ADR-0062
**Category:** Persistence

## Context

Deleting a library file was final behind a two-tap confirmation, and every pad that used the file
lost its sound without warning (V1 warned "Pads using it will no longer play"). Slice 16 decides one
way to undo a file delete, for single and bulk deletes (ADR-0086 amendment, decision 2026-10-19).
The owner released the Slice 16 plan on 2026-10-20 and asked Claude to take its open decisions on
the recommendations; L1 chose a trash ([library.md L1](../product/features/library.md#l1-undo-for-a-deleted-file),
for review).

Two constraints shape it: the audio of a file may never be held in memory for long (CLAUDE.md,
iPhone memory rules), and the audio engine — V1's code, not to be redesigned — reads a file straight
from the `library` store (`v3/src/audio/engine.ts`, `libGet`).

## Decision

1. **An own IndexedDB store `trash`** (DB version 11, keyPath `id`), next to `library`. A delete
   moves the entry — with its audio — from `library` to `trash` and stamps `deletedAt`
   (`libMoveToTrash`); RESTORE moves it back (`trashRestore`). Each move is ONE transaction over
   both stores, so the entry is in exactly one of them at any time.
2. **Not a mark on the library entry:** a file in the trash is gone from `library`, so the engine
   finds no audio for it and every pad that uses it stays silent — without an engine change —
   until it is restored. The library list, the pickers and the backup export read `library` only,
   so none of them sees a trashed file.
3. **30 days**, as Apple Photos and Google Photos keep deleted items; the app start removes what has
   waited longer, before the first render (`loadTrash` in `v3/src/state/libraryTrash.ts`, called by
   `v3/src/state/boot.ts`). EMPTY and "delete for good" remove at once, after the confirmation
   dialog (library.md D7, owner decision 2026-10-20).
4. **The same file again:** the id is the content hash, so a file uploaded while its copy sits in the
   trash gets the same id. RESTORE then keeps the library entry and drops only the trash copy.
5. **Memory:** a move holds one entry's audio for the length of one transaction, as `libRename`
   does; the trash list is read with a metadata cursor, as `libGetAllMeta`.
6. **Saves:** every trash write counts as a running save (`pendingSaves`), so RELOAD and the E2E
   save marker wait for it.

## Consequences

**Positive:**

- A delete is one tap with UNDO (CLAUDE.md delete rules); the toast says how many pads lose their
  sound (`v3/src/lib/fileUses.ts`).
- Survives a reload; one mechanism for the bulk delete of Slice 16c.
- No change to the audio engine, the backup format or the library entry.

**Negative / Trade-offs:**

- The audio of a deleted file stays on the device for 30 days — storage the user frees with EMPTY.
- The 30 days are checked at app start only; an app left open for weeks removes old files at its
  next start.
- A file uploaded again while its copy is in the trash shows in both lists until it is restored or
  deleted for good.

## Alternatives considered

**A `deletedAt` mark on the library entry:** fewer moves, but the engine would still find and play
the file — the pads would only fall silent with an engine change (owner approval and a playback
check), and every reader of `library` would need a filter.

**A delete delayed until the toast ends (library.md L1 B):** simpler, but lost on a reload, and the
same file uploaded during the wait needs a special case.

## Related

- **Files:** `v3/src/db/idb.ts`, `v3/src/state/libraryTrash.ts`, `v3/src/lib/fileUses.ts`,
  `v3/src/screens/LibraryScreen.tsx`, `v3/src/components/AudioRow.tsx`
- **ADRs:** ADR-0062 (IndexedDB for all persistence), ADR-0086 (undo; the toast)
- **Source documents:** [library.md](../product/features/library.md) L1, L5, D7
- **Sources:** Apple Photos and Google Photos keep deleted items 30 days
  (https://learningenglish.voanews.com/a/photo-delete/3909413.html,
  https://tbreak.com/google-photos-trash-30-days/)
