# Data & backup

> **Leaf of [docs/product/README.md](../README.md).** Filled 2026-09-28 in dialogue with the product
> owner. Nothing in this document is built yet; implementation is planned for Slice 10.
> Inventory of the prototype features: [v1-v2-inventory.md §5](../v1-v2-inventory.md#5-data--backup).

## Why

V3 keeps all boards and all audio only in the browser's storage (IndexedDB) on the device.
iOS can evict that storage, and there is no copy anywhere else. A backup the user can take
and restore is the only safety net.

## Decided — not yet built

| # | Statement | Status |
|---|---|---|
| D1 | **Export everything** — boards, decks, pads, library audio — into **one file**. On iPhone the file is handed to the share sheet (e.g. save to Files). | **Decided** |
| D2 | **Import** restores from such a file. | **Decided** |
| D3 | The app shows **when the last backup was made** ("last backup N days ago") and reminds the user when it is old. | **Decided** |
| D4 | The app asks the browser for **persistent storage** so iOS is less likely to evict the data. Invisible to the user. | **Decided** |
| D5 | **V1 backups can be imported.** A V1 board becomes a V3 board with one deck containing all its pads. | **Decided** |
| D6 | Large files must import on the iPhone without crashing — the file is read piece by piece, never held in memory as a whole. (How: Slice 10 planning; see BACKLOG "Stream-based export/import".) | **Decided** |

### Import rules — **Decided**

- An import **never changes or deletes** existing data; it only adds.
- Before importing, a **summary** is shown for confirmation (e.g. "1 board, 31 pads, 99 audio
  files — 12 already present. Import?").
- **Audio already present** (same content, same hash) is skipped; the existing file keeps
  its name.
- **Boards are always added as new boards.** If the name exists, the new one gets a suffix
  (e.g. "Board 1 (2)").
- **Audio first, board last.** If an import aborts, no board points at missing audio; audio
  already imported simply stays in the Library.
- **Settings from a V1 file are not applied.** V3 has its own defaults; many V1 settings have
  no V3 equivalent.

## Dropped

- **Exporting in a format V1 can read** (previously [concept-brief.md §4.6](../../architecture/concept-brief.md#46--template-exportimport)). V3 replaces
  V1; the way back has no use and would constrain the V3 format (decks, piecewise reading).
  Importing *from* V1 stays (D5).

## Parked

- **Sharing boards** with other game masters, and separate export / import of single boards
  or of the library only. Wanted; built later on top of D1/D2.
- **Auto-backup** into a folder (File System Access API — desktop Chromium only, not iPhone).
- **Reset all data.**

## Open

- **Decide the hosting address before importing real data.** The app stores its data per web
  address (origin). Changing the address later (e.g. making the repository private and moving
  from GitHub Pages to another host) starts V3 with empty storage; real data would then need
  export → import. Options discussed 2026-09-28: keep public (GitHub Pages), private + GitHub
  Pro (Pages unchanged), private + other host (new address). Current: public, GitHub Pages.

## Context

- The product owner's existing data is a **V1 backup** (V1 `version: 179`): 1 board, 31 pads
  (22 single, 2 loop, 1 playlist, 6 combo; 16 with keys), 99 audio files (~170 MB; 227 MB
  uncompressed). It lives outside the repository and must never be committed (personal /
  licensed audio, public repo).
- V1 ran as a **home-screen app** on the iPhone. Home-screen apps have their own isolated
  storage on iOS, so V3 cannot read V1's database directly — migration goes through the
  backup file.
- V1 and V3 identify audio the same way (SHA-256 of the file bytes), so duplicate detection
  works across versions.
- A V1 → V3 import has to map: V1 pad mode `once` → `single`; numeric pad ids (also used
  by combo steps) → V3 ids; V1 pad icons → kept on the pad (V3 has no pad icons yet).
