# Library

> **Leaf of [docs/product/README.md](../README.md).** Draft of 2026-10-19 for Slice 16, written by
> Claude from the decisions already taken elsewhere (sources in each row) and the V1 prototype; the
> open questions below are put to the product owner one at a time. Nothing here is built before the
> owner approves the plan and the iPhone checklist session has run (owner decision 2026-10-19).

## Why

[P8](../README.md#7-design-principles): everything the prototypes could do comes first. The V3
library still has the scope of Slice 2 — import, rename, delete, waveform, search, and read-only
tags; ICONS, PADS and BOARDS are empty tabs (`v3/src/screens/LibraryScreen.tsx`). V1 also had a
preview, sorting, folders with multi-select and bulk move, an "in use" warning, the original file
name, pad templates and a boards tab ([v1-v2-inventory.md](../v1-v2-inventory.md), rows marked
Slice 16). One gap is a safety gap: deleting a file leaves every pad that used it without sound,
and nothing says so beforehand (V1 warned "Pads using it will no longer play").

## Decided

| #   | Statement                                                                                                                 | Source                                                            | Status      |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------- |
| D1  | The library at V1's full scope: preview, sort, groups / folders / multi-select, "in use", original file name, boards tab. | owner decision 2026-10-02 (P8), v1-v2-inventory                   | **Decided** |
| D2  | Pad templates live in the library's PADS tab.                                                                             | owner decision 2026-10-03 (moved from Slice 15)                   | **Decided** |
| D3  | Own pad icons (SVG upload) come with Slice 16.                                                                            | owner decision 2026-10-04, BACKLOG "Uploaded own pad icons"       | **Decided** |
| D4  | Undo for a deleted library file is decided here, one way for single and bulk deletes.                                     | decision 2026-10-19 (ADR-0086 amendment, Slice 18c)               | **Decided** |
| D5  | A backup import restores a file's date added and original name once the library has them.                                 | BACKLOG "Import: date added and original file name from a backup" | **Decided** |
| D6  | iPhone memory rules hold: no list, sort, preview or bulk action loads more than one audio file at a time.                 | CLAUDE.md, iPhone memory rules                                    | **Decided** |

## Steps (proposed)

Safety first, then the everyday tools, then what builds on them:

| Step | Content                                                                                               | Why in this place                                              |
| ---- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 16a  | "In use": each file shows how many pads use it; deleting one names them; undo for a deleted file (L1) | closes the safety gap before anything else touches the library |
| 16b  | Preview, sort, original file name; a backup import keeps date added and original name (D5)            | everyday tools; the date and name fields are needed by sort    |
| 16c  | Folders, multi-select, bulk move and bulk delete                                                      | builds on 16a's undo and 16b's sort                            |
| 16d  | Pad templates in the PADS tab: save a pad, put it into any board                                      | needs the library's list patterns from 16b and 16c             |
| 16e  | Own icons in the ICONS tab (SVG upload)                                                               | own security question (L7)                                     |
| 16f  | The BOARDS tab — or not (L4)                                                                          | may be dropped                                                 |

## Open

Each question is put to the owner on its own; options name the industry standard.

### L1 Undo for a deleted file

- **A — Trash (recommended):** a deleted file moves to "Recently deleted" in IndexedDB, restorable
  for 30 days, then removed for good; "Empty" removes it at once. Apple Photos and Google Photos
  keep deleted items 30 days. Survives a reload; one way for single and bulk deletes; no audio in
  memory. Costs a field on the entry, a list filter and a purge at start.
- **B — Delayed delete:** the file disappears at once and is deleted when the toast ends. Simpler,
  but lost on a reload, and the same file uploaded during the wait needs a special case.
- **C — No undo, two taps as now.**

### L2 Folders, tags, or both

- V1 had folders (one per file); V3 already stores tags (from V1 backups, read-only).
- A study on personal file organization found folders alone and tags alone equally fast for
  re-finding; using both took longer to organize without helping re-finding.
- **A — Folders as in V1 (recommended), tags stay as search words:** one system to organize, the
  prototype's behavior; nothing stored is lost.
- **B — Tags only, editable:** a file in several groups at once; new behavior compared to V1.
- **C — Both:** most flexible, slowest to keep in order.

### L3 How multi-select works

- **A — A Select mode (recommended):** SELECT shows a checkbox on each row and a bar with MOVE and
  DELETE; DONE ends it. Apple HIG: on iOS people enter an edit mode before they select list items.
- **B — Long press starts selecting:** quicker for experts, hidden for everyone else, and the app
  turns long press off (ADR-0067).

### L4 The BOARDS tab

V1's library had a second list of boards, with rename (`libRenameBoardStart`). V3's board list already does that.

- **A — Rejected (recommended):** one place for boards; record it as Rejected with this reason.
- **B — A tab that shows which boards use the library's files** (the "in use" view by board).
- **C — Build it as in V1.**

### L5 What "in use" shows

- **A (recommended):** each row shows "in N pads"; the file's details list the pads with their
  board and deck; deleting names them in the confirmation or the toast.
- **B:** only a count.

### L6 Pad templates

- **A (recommended, as V1):** the PADS tab lists the open board's pads and the saved templates;
  SAVE stores a pad's settings and file references as a template (V1 `savePadTemplate`); ADD TO
  BOARD puts a copy into the open board's pool, and the open deck (V1 `importPadTemplate`). Files
  a template needs must still be in the library.
- **B:** templates also carry their audio, so they work after the file was deleted — more storage
  and a second copy of each file.

### L7 Own icons (SVG)

An uploaded SVG can contain scripts. Options: **A —** draw it as an image only (`<img>`, which
runs no script) and keep the file as it is; **B —** clean it with a sanitizer library (a new
dependency and its license); **C —** turn it into a pixel image on upload. A recommendation follows
research in Slice 16e.

### L8 Preview

- **A (recommended):** ▶ on each row plays the file once, stops at the next ▶ or on leaving the
  library; decodes one file at a time (D6), through the engine's preview path.

### L9 Sort

- **A (recommended):** the sort of All pads (`v3/src/lib/padSort.ts`, Finder-style, reversible)
  with the library's keys — date added, last edited, name, duration; one scheme for both lists.
