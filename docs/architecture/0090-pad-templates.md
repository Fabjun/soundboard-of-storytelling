# ADR-0090: Pad templates in their own IndexedDB store

**Status:** Accepted
**Date:** 2026-10-23
**Slice:** Slice 16
**Refines:** ADR-0062
**Category:** Persistence

## Context

Slice 16d brings V1's pad templates to the library's PADS tab ([library.md
L6](../product/features/library.md#l6-pad-templates), decided by Claude for review): SAVE AS
TEMPLATE keeps a pad's settings and file references, ADD puts a copy on a board. V1 stored a
template as a library entry of type `pad` (`savePadTemplate`, `libPut({hash: 'pad_…', type: 'pad',
padData})`). In V3 a library entry is an audio file with its blob (`LibraryItem`), and the library
list, the trash and the backup read the store as audio.

## Decision

1. **An own IndexedDB store `templates`** (DB version 12, keyPath `id`), next to `library`. The v12
   step only adds the store; every other store stays as it is (an aborted upgrade would leave the
   app without its database, W3C IndexedDB 3.0 2.1.1 — adding a store cannot fail on data).
2. **A template is `{ id, name, savedAt, pad }`** (`PadTemplate`): a copy of a Single or Loop pad
   without its dates. A combo is none — its steps name pads of its own board, which a copy on
   another board would not have (V1 copied the step indices and broke the same way).
3. **ADD makes a new pad**: a new id, `addedAt` now, into the chosen board's pool and, when a deck
   is chosen, onto its next free cell (`addPadToFreeCell`, a full deck grows a row). It goes through
   `updateBoard`, so the board's undo takes it back. The library belongs to no board, so ADD asks
   for one (TemplateAddDialog).
4. **No audio in a template** (L6 A): the files must still be in the library; the PADS tab says how
   many are missing.
5. **Delete is one tap with UNDO** (CLAUDE.md delete rules — undoable, so not asked); the template
   is held in memory until the toast goes.

## Consequences

**Positive:**

- The library store stays audio only; the library list, the trash and the backup need no filter.
- Templates load with the stored state before the first render (`v3/src/state/boot.ts`).

**Negative / Trade-offs:**

- Backups do not carry templates yet, and the V1 import still skips V1 templates — the next step
  of Slice 16d (BACKLOG "Pad templates in backups").

## Alternatives considered

- **Templates in the library store with `type: 'pad'` (V1):** every reader of the library would
  have to filter them out, and a `LibraryItem` needs a blob. Rejected.
- **Templates in the key-value store:** the store holds small preferences (ADR-0062); templates
  are user content, like boards, which have their own store. Rejected.

## Related

- **Files:** `v3/src/db/idb.ts`, `v3/src/state/padTemplates.ts`,
  `v3/src/components/PadTemplatesTab.tsx`, `v3/src/components/TemplateAddDialog.tsx`,
  `v3/src/components/PadEditorPanel.tsx`
- **ADRs:** ADR-0062 (IndexedDB for all persistence), ADR-0087 (trash), ADR-0088 (folders)
- **Source documents:** [library.md L6](../product/features/library.md#l6-pad-templates)
