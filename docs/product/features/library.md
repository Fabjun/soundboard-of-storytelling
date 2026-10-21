# Library

> **Leaf of [docs/product/README.md](../README.md).** Plan for Slice 16. The owner released it on
> 2026-10-20 ahead of the iPhone checklist session ("release Slice 16 now and check it more
> closely later", translated) and asked Claude to take the open decisions on its recommendations;
> those rows are marked **Decided — for review**. The iPhone checklist stays owed: 16a changes
> IndexedDB.

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
| D7  | A delete that cannot be undone is confirmed in a dialog that names it, with CANCEL and DELETE — never by a second tap.    | owner decision 2026-10-20 (an accidental double tap)              | **Decided** |

## Steps

Safety first, then the everyday tools, then what builds on them:

| Step | Content                                                                                                                                         | Why in this place                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 16a  | "In use" (L5); delete in one tap with UNDO, "Recently deleted" for 30 days (L1); delete for good and EMPTY through the confirmation dialog (D7) | closes the safety gap before anything else touches the library |
| 16b  | Preview (L8), sort (L9), original file name; a backup import keeps date added and original name (D5); the list fits a phone                     | everyday tools; the date and name fields are needed by sort    |
| 16c  | Folders (L2), Select mode (L3), bulk move and bulk delete                                                                                       | builds on 16a's trash and 16b's sort                           |
| 16d  | Pad templates in the PADS tab (L6)                                                                                                              | needs the library's list patterns from 16b and 16c             |
| 16e  | Own icons in the ICONS tab (L7)                                                                                                                 | its own security question                                      |

**Built:** 16a in 3.0.270 ([ADR-0087](../../architecture/0087-library-trash.md)); of 16b the
original file name and D5 in 3.0.271 (ADR-0061 amendment 2026-10-21), the sort (L9) in 3.0.272 —
newest first by default, as V1's library (`date-desc`) — and the list on a phone in 3.0.272
(BACKLOG "AudioRow grid overflow on iPhone 13 Pro (390px viewport)"). Of 16b the preview (L8) is
left. The BOARDS tab is Rejected (L4).

## Decisions L1–L9 (Decided — for review)

Decided by Claude on the owner's instruction of 2026-10-20, each on the recommendation of the draft
of 2026-10-19; the alternatives stay listed so the review can pick another.

### L1 Undo for a deleted file

**A, a trash.** A deleted file moves to "Recently deleted", restorable for 30 days, then removed for good; EMPTY
removes everything there at once. Apple Photos and Google Photos keep deleted items 30 days.
Survives a reload; one way for single and bulk deletes.

- **How (ADR-0087):** an own IndexedDB store `trash`, not a mark on the library entry — the audio
  engine reads a file straight from the library (`v3/src/audio/engine.ts`), so a file in the trash
  is gone for every pad without an engine change, and back when it is restored.
- Not chosen: **B** a delete delayed until the toast ends (lost on a reload); **C** no undo.

### L2 Folders, tags, or both

**A, folders as in V1; tags stay search words.** A study on personal file organization found folders alone and tags alone equally fast for
re-finding, and both together slower to keep in order. Not chosen: **B** tags only, editable;
**C** both.

### L3 How multi-select works

**A, a Select mode.** SELECT shows a checkbox on each row and a bar with MOVE and DELETE; DONE ends it (Apple HIG: on iOS
people enter an edit mode before they select list items). Not chosen: **B** long press, which the
app turns off (ADR-0067).

### L4 The BOARDS tab

**A, Rejected.** V3's board list already lists and renames boards (V1's library tab did that, `libRenameBoardStart`);
one place for boards. Not chosen: **B** an "in use by board" tab; **C** V1's tab.

### L5 What "in use" shows

**A.** Each row shows "in N pads"; deleting names how many pads lose their sound. The file's details list
the pads with their board — with the details view of 16b. Not chosen: **B** only a count.

### L6 Pad templates

**A, as V1.** The PADS tab lists the saved templates; SAVE AS TEMPLATE stores a pad's settings and file
references (V1 `savePadTemplate`); ADD TO BOARD puts a copy into the open board's pool and deck (V1
`importPadTemplate`). Files a template needs must still be in the library. Not chosen: **B**
templates with their own copy of the audio.

### L7 Own icons (SVG)

**A, drawn as an image only.** An uploaded SVG is shown only through `<img>`, which runs no script and loads nothing from outside
("JavaScript is disabled … External resources … can't be fetched", MDN, SVG as an image); the
file is never opened as a page. OWASP ASVS 5.2.7 asks to "sanitize, disable, or sandbox"
user-supplied SVG scripts — `<img>` disables them, without a new dependency. Not chosen: **B** a
sanitizer library; **C** a pixel image made on upload.

### L8 Preview

**A.** ▶ on each row plays the file once and stops at the next ▶ or on leaving the library; one file
decoded at a time (D6), through the engine's preview path.

### L9 Sort

**A.** The sort of All pads (`v3/src/lib/padSort.ts`, Finder-style, reversible) with the library's keys —
date added, name, duration; one scheme for both lists.
