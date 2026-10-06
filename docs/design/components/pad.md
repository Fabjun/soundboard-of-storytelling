# PAD

> **Component spec** — one file per UI element.
> Rules: [ADR-0047](../../architecture/0047-documentation-architecture.md) — English,
> status on every statement, token **names** only (values live in `v3/src/styles/tokens.css`).

**Status:** Draft
**Code:** `v3/src/components/PadGridCell.tsx` (grid cell + pad), styles `.sb-pad` in `v3/src/styles/tokens.css`
**Last reviewed:** 2026-09-28

Status markers used below: **Decided** · **Open** · **Parked**
(see [docs/product/README.md — Status legend](../../product/README.md#status-legend)).
"Not yet built" marks decided behavior the code does not implement yet.

---

## Purpose

The PAD is the trigger in the grid of a deck, of All pads and of the quick-access bar. Tapping
or pressing its key plays or stops its sound (GAME) or opens it for editing (SETUP). Pad types
and behavior: [docs/product/README.md §5 Pads](../../product/README.md#pads).

| Statement                                                                                                                               | Status      |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| The element is called **PAD** everywhere. Its shape resembles a playing card — fitting the deck metaphor — but it is not called "card". | **Decided** |

## Anatomy

| Part               | Description                                                                                                                                                                  | Status                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Shape              | **Card format:** a slightly portrait rectangle.                                                                                                                              | **Decided** — _not yet built_                                                    |
| Picture area (top) | Shows the pad's icon(s) — 1 to 4 in V1's arrangement. A pad without its own icon shows the **placeholder icon of its type** (Single, Loop, Combo), so all pads look uniform. | **Decided** — built in Slice 15d (ADR-0070); appearance reviewed with the design |
| Info area (bottom) | **Name** (always visible) and the **assigned key** ([product §6 K10](../../product/README.md#input-keyboard--numpad)).                                                       | **Decided** — _not yet built_                                                    |
| Type spine         | Colored bar on the left edge showing the pad type (current code, ADR-0027).                                                                                                  | **Open** — current code, review pending                                          |

## Variants

| Variant      | When                                                                             | Status                       |
| ------------ | -------------------------------------------------------------------------------- | ---------------------------- |
| Aspect ratio | Adjustable in Settings. The default is chosen by testing visually on the device. | **Decided** — value **Open** |

## States

Current code (closed `is-*` vocabulary, [design-system.md §3](../design-system.md#3-state-vocabulary-closed-set)) — listed for reference, not yet
reviewed as part of this spec.

| State        | Trigger             | Appearance (current code)                                                           | Status                    |
| ------------ | ------------------- | ----------------------------------------------------------------------------------- | ------------------------- |
| `is-hot`     | Pad is playing      | Spine widens to the perimeter; glow in pad type color                               | **Open** — review pending |
| `is-looping` | Loop pad is running | Class is set (`PadGridCell.tsx:104`) but has **no style** yet — looks like `is-hot` | **Open** — review pending |
| `is-setup`   | SETUP mode          | Dashed border (drag-ready)                                                          | **Open** — review pending |

## Behavior

### In GAME mode

Single tap starts / stops the pad; keys per deck ([product §3](../../product/README.md#3-app-modes-game-and-setup), [§5](../../product/README.md#5-core-concepts), [§6](../../product/README.md#6-platforms--input)). No further
PAD-specific behavior decided yet.

### In SETUP mode

Tap opens the PAD editor; pads can be dragged while no search or sort is active ([product §3](../../product/README.md#3-app-modes-game-and-setup),
[§5](../../product/README.md#5-core-concepts)).

## Adaptive behavior

Per [ADR-0045](../../architecture/0045-two-axis-adaptive-model.md).

### Zoom and detail levels

| Statement                                                                                                                                                                                                                   | Status                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| The grid can be zoomed; pads shrink and show less detail as they get smaller: **large** — card with picture and info · **medium** — card with info only · **small** — square.                                               | **Decided** (concept) — the size itself is built (PAD SIZE slider, ADR-0075); detail levels _not yet built_             |
| Zoom applies **per board** — the PAD SIZE slider sets all decks and All pads of the board, from any of them (owner decision 2026-10-06; was: per deck). Whether it applies per board or app-wide becomes a Settings option. | **Decided** — per board built in 3.0.178 (`Board.padSize`, ADR-0075 Amendments); the Settings option _not yet built_    |
| Zoom control: a **PAD SIZE slider** at the top of the deck rail, in SETUP (as in V1) — owner decision 2026-10-06, replaces the + / − buttons and Ctrl/Cmd + mouse wheel.                                                    | **Decided** — built in 3.0.177 (ADR-0075)                                                                               |
| Zoom by **+ / − buttons** and **Ctrl/Cmd + mouse wheel** (plain wheel keeps scrolling the grid).                                                                                                                            | **Parked** (owner decision 2026-10-06 — the slider instead)                                                             |
| Zoom by gesture (pinch / swipe).                                                                                                                                                                                            | **Parked**                                                                                                              |
| Zoom by key press.                                                                                                                                                                                                          | **Parked** — keys to be chosen with the key settings ([product §6 K12](../../product/README.md#input-keyboard--numpad)) |

### Axis 1 — Screen format (narrow / wide)

_Pending — defined with the mobile Board layout._

### Axis 2 — Input type (touch / pointer + keyboard)

_Pending._

## Tokens & classes

Names only — no values.

- Tokens: `--pad-single`, `--pad-loop`, `--pad-combo` (and `-soft` / `-glow` variants) — current
  code. The Playlist color tokens were removed with the Playlist → Loop merge (owner decision
  2026-10-02, PR #36; [product §5](../../product/README.md#5-core-concepts)).
- Classes: `sb-pad`, `sb-pad-grid`, `sb-pad-grid-cell`, `sb-pad-icons` (picture area) — current
  code.

## Accessibility

Touch target min. 44 px at every zoom level (CLAUDE.md UI rules). Pad type must stay readable
without color (current: spine position; to be reviewed). _Further details pending._

## Open questions

| #   | Question                                                                                                                                                                                 | Status                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PQ1 | Default aspect ratio (tested visually on the device).                                                                                                                                    | **Decided** 2026-10-06 (for now) — square pads of at most the board's pad size (PAD SIZE slider, 88px by default); as many pads per row as the window allows, in reading order, no horizontal scrolling, the grid scrolls down (ADR-0075); the name is one line ending in … Card format and detail levels stay with Slice 13 |
| PQ2 | What the **small** (square) level shows: key, icon, or first letter.                                                                                                                     | **Open**                                                                                                                                                                                                                                                                                                                     |
| PQ3 | Pad icons: V1 had ~2,300 pixel icons, up to 4 per pad ([v1-v2-inventory.md §4](../../product/v1-v2-inventory.md#4-library)). Which icon system does V3 use, and what is the placeholder? | **Decided** 2026-10-04 — a curated collection of pixel icons as IconifyJSON sets, keys `set:name` ([ADR-0070](../../architecture/0070-pad-icons.md)); placeholder per pad type from the collection: a circle (Single), an infinity sign (Loop), a double circle (Combo)                                                      |
| PQ4 | Minimum zoom vs. the 44 px touch target on a phone.                                                                                                                                      | **Open**                                                                                                                                                                                                                                                                                                                     |

## Sources

- Decisions: product owner dialogue 2026-09-28 (card format, placeholder icon, zoom per deck,
  zoom controls, detail levels).
- Product context: [docs/product/README.md §3](../../product/README.md#3-app-modes-game-and-setup),
  [§5](../../product/README.md#5-core-concepts), [§6](../../product/README.md#6-platforms--input).
- ADRs: ADR-0027 (pad type colors), ADR-0045 (two-axis adaptive model).
- Earlier related idea: docs/backlog.md "2b — Library form" (tiles stack details by display size).
- Design explorations (proposals, not binding): `design-sources/2026-05-25/v15-pad-depth.jsx` (depth
  treatments → current DepthPad), `v17-pad-appearance.jsx` (Settings → pad appearance with live
  preview), `v18-pad-depth-migration.jsx`, `v26-pad-shape.jsx` (square vs. grid-stretched).
  v26 proposed **square** as default — superseded by the card format above. Its mechanism (an
  aspect-ratio custom property on the pad, switched by a class on the board canvas) fits the
  "aspect ratio adjustable in Settings" decision and can be reused.
