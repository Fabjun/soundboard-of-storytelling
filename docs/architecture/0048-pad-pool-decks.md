# ADR-0048: Pad pool, decks and three pad types

**Status:** Accepted
**Date:** 2026-09-29
**Slice:** Slice 9
**Category:** Datenmodell

## Context

The product concept decided on 2026-09-28 (`docs/product/README.md §5`) no longer fits the
data model built in Slices 1–4 (`v3/src/types.ts`):

- **Ownership:** today `Board → scenes[] → pads[]` — every pad lives in exactly one scene and
  carries its own `position` and `hotkey`. The product needs a **pad pool** per board: the same
  pad appears in several **decks** (the new name for scenes, docs/product/README.md Q1), each with its own
  arrangement and keys; building-block pads live in no deck and are used by combos.
- **Pad sets:** `Board.sets: PadSet[]` (ADR-0013) are dropped — decks and a board-wide
  **quick-access bar** cover them.
- **Pad types:** four types (ADR-0042) become three — **Single, Loop, Combo**. The former
  Playlist merges into Loop; Single and Loop accept several files (docs/product/README.md §5 Pads).

V3 holds only test data (confirmed by the product owner); the owner's real data is a V1 backup
imported in Slice 10.

## Decision

### 1. Data model

```ts
type Board = {
  id: string;
  name: string;
  themeId: string;
  pads: Pad[];                   // pad pool — all pads of the board
  decks: Deck[];                 // formerly scenes
  quickAccess: QuickAccessEntry[]; // board-wide bar (UI: Slice 13)
};

type Deck = {
  id: string;
  name: string;
  order: number;
  gridConfig: { cols: number; rows: number; gap: number; padSize: string };
  placements: Placement[];       // which pads, where, with which key
};

type Placement = { padId: string; position: PadPosition; hotkey?: string };
type QuickAccessEntry = { padId: string; hotkey?: string };

type Pad = SinglePad | LoopPad | ComboPad;          // discriminated union kept
type PadBase = { id; name; iconRef?; color?; volume; fadeIn; fadeOut };
type SinglePad = PadBase & { type: 'single'; files: string[]; order: FileOrder; trimStart?; trimEnd? };
type LoopPad   = PadBase & { type: 'loop';   files: string[]; order: FileOrder; trimStart?; trimEnd? };
type ComboPad  = PadBase & { type: 'combo';  steps: ComboStep[] };  // padIds reference the pool
type FileOrder = 'sequential' | 'shuffle';
```

- **Position and key move from the pad to the placement.** A pad has no position of its own;
  "unplaced" (ADR-0009) now simply means "in no deck".
- **One `order` field for Single and Loop** (P5 — one building block, not two):
  Loop plays its files one after another, in order or shuffled; Single plays one file per
  trigger — the next one in turn (`sequential`) or a random one (`shuffle`).
- **Combo steps** keep referencing pads by id; the pool makes cross-deck and nested combos
  natural (docs/product/README.md §5 Combos).
- `PadSet`, `Board.sets`, `Board.settings.quickAccessLayout / quickAccessSetCount` and the
  `activeSetIds` signal are removed.

### 2. Behavior (final, not provisional)

The product owner decided to build the behavior in its final form now; only look and phone
layout follow in Slice 13.

| Behavior | Decision |
|---|---|
| Editing a pad | changes it everywhere it appears |
| **Duplicate deck** | the copy references the **same pads** (new placements, same pad ids). An independent "duplicate pad" action may come later. |
| **All pads** | its own view, first entry in the deck rail; shows the whole pool (incl. pads in no deck), sorted by name; no saved arrangement |
| **Remove from deck** | removes the placement; the pad stays in the pool (visible in All pads). Two-tap confirm. |
| **Delete pad** | removes the pad from the pool, all placements, the quick-access bar and combo steps. Two-tap confirm, shows "used in N decks". |
| **Add a pad to other decks** | PAD editor section "Decks": a checklist of all decks; checking places the pad on the next free slot of that deck, unchecking removes the placement |
| Choosing several files in the PAD editor | model ready in Slice 9; editing UI in Slice 11 |

### 3. Persistence

- ADR-0010 stays: a board is one JSON document (now with `pads`, `decks`, `quickAccess`).
- Each structural change of the stored board shape in Slice 9 bumps the `sos-v3` version and
  **clears only the `boards` store** (old-format test boards): v3 with the Scene → Deck rename
  (9b), v4 with the pad pool (9c). The `library` store (audio) is untouched. No other database is ever touched — the
  V1 database `botc` shares the origin `fabjun.github.io` and must never be affected.

### 4. Audio engine — change under product-owner control

Single with several files and Loop with several files (the former playlist path) need a change
to the play dispatch in `v3/src/audio/`. Rule agreed with the product owner:

1. Engine changes are their own step and commit, separate from everything else.
2. Before any edit: the affected functions, the reason and the code before/after are shown;
   nothing is changed without explicit approval.
3. After the edit: the product owner tries playback manually before the commit.

### 5. Implementation steps (Slice 9)

| Step | Content |
|---|---|
| 9a | this ADR |
| 9b | rename Scene → Deck (code, UI text, CSS classes, tests) — names only, no behavior change |
| 9c | pad pool, placements, quick-access model, DB v3, store and all consumers |
| 9d | three pad types with files + order; engine dispatch (rule §4) |
| 9e | All pads view, remove-from-deck vs delete-pad, deck checklist in the PAD editor |

## Consequences

**Positiv:**
- The model matches the product concept (docs/product/README.md §5) — no provisional behavior to unlearn.
- One pad, many decks: no copies to keep in sync; combos reference one pool.
- Fewer concepts: sets dropped, three pad types, one `order` field.
- Deck = arrangement + key layer, which is exactly what the numpad control needs (§6 K2, K14).

**Negativ / Trade-offs:**
- Existing V3 test boards are wiped once (DB v3); library audio is kept.
- Two kinds of removal must be clearly distinguishable in the UI.
- A shared pad edited in one deck changes in all decks — intended, but must be understood.
- `--pad-playlist*` tokens and the `is-playlist` state lose their pad type; tokens stay for now
  (design reference), the state is removed with 9d.
- Trim with several files: `trimStart/trimEnd` apply per pad; behaviour with several files is
  decided when trim gets its UI (low priority, docs/product/README.md §5).

## Alternatives Considered

- **Pads owned by decks plus a "building block" flag (model A)** — rejected by the product
  owner: copies per deck, no real building-block system.
- **Migrating old V3 boards instead of clearing** — rejected: only test data exists; a
  migration would be code kept forever for no user.
- **Provisional Slice 9 behavior (delete = delete everywhere, no All pads view)** — rejected:
  behavior that changes again later causes confusion.
- **Separate `playbackOrder` fields per type** — rejected in favour of one `order` field.

## Related

- **Dateien:** `v3/src/types.ts`, `v3/src/db/idb.ts`, `v3/src/state/store.ts`, `v3/src/audio/`
- **ADRs:** supersedes ADR-0042 (four-type union), ADR-0009 (position on the pad),
  ADR-0013 (`PadSet`); keeps ADR-0010 (board as one JSON document)
- **Quelldokumente:** `docs/product/README.md §5` (board concept, pads, combos), §6 (keys),
  Q1 (Deck), Q2 (three types); `docs/backlog.md §3` "Board pad pool", "Playlist → Loop merge"
- **Commits:** —
