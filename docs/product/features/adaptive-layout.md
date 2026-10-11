# Adaptive layout

> **Leaf of [docs/product/README.md](../README.md).** Filled 2026-10-10 in dialogue with the product
> owner. Implementation is Slice 13, in the steps below; built so far: steps 13a (3.0.210), 13b (3.0.211), 13e without the card format (3.0.212), 13c (3.0.213) and 13d (3.0.214 the bar, 3.0.215 its keys).
> Architecture: [ADR-0045](../../architecture/0045-two-axis-adaptive-model.md) (one adaptive app,
> axis 1 screen format, axis 2 input type).

## Why

The app has to work well on smartphones in general, on tablets and on desktop
([product §6 Platforms](../README.md#platforms)). Today the Board screen has one layout, made
for wide screens: the deck rail on the left, STOP ALL and PAUSED in the top bar. The stylesheet
has no breakpoint at all. On a phone the pads get little room, names are cut off (BACKLOG "Pad
names cut off on narrow screens"), and the live controls sit in the top corner — the hardest place
to reach with one hand. Until this slice, real game nights run on laptop or tablet.

## Decided

| #   | Statement                                                                                                                                                                                                                                                                                                                          | Status                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| L1  | Two frames by window width: **narrow** below **600 px**, **wide** from 600 px. 600 px is the start value — the boundary between Material 3's _compact_ and _medium_ window size classes — and is calibrated on the owner's phone and tablet (ADR-0045: thresholds are set empirically on devices).                                 | **Decided** — built in 3.0.210 (ADR-0082); calibration open                                           |
| L2  | Narrow: a **dock** at the bottom holds **STOP ALL**, **PAUSED** and the **save status** (one bar instead of the dock plus the status bar — the grid keeps the height, [P4](../README.md#principles)). The top bar keeps back, the mode toggle and the Lock, which play rarely needs.                                               | **Decided** — built in 3.0.210 (ADR-0082)                                                             |
| L3  | Narrow: decks are switched by **tabs above the pad grid** — All pads first, then every deck — scrolling sideways when they do not fit. One tap switches; the current deck is always visible. Deck actions, NEW DECK and PAD SIZE are reached from the tab row in SETUP.                                                            | **Decided** — built in 3.0.211: a DECKS tab at the end of the row opens the rail's content as a panel |
| L4  | Wide: the **deck rail** on the left stays as today (folds to its button). Tabs and rail are **two variants of one deck switcher**, not two components (one component per element, variants by props).                                                                                                                              | **Decided** — built in 3.0.211 (`DeckRail` `variant`)                                                 |
| L5  | Order of the steps: 13a → 13b → 13e → 13c → 13d → 13f → 13g (table below).                                                                                                                                                                                                                                                         | **Decided**                                                                                           |
| L6  | Deck reorder: drag & drop together with a way to reorder without dragging (WCAG 2.2 SC 2.5.7), planned in step 13g — BACKLOG "Deck reorder (drag & drop) — feature not built". The way without dragging is **▲ / ▼** at the deck in SETUP, the scheme of the PAD editor's file list; both come in 13g (owner decision 2026-10-11). | **Decided**                                                                                           |
| L7  | Search and sort sit in **one bar above the grid, in every view**; in a deck the sort offers every key of All pads plus **Arrangement** (the deck's own order), and lasts until it is set back or the view changes (owner decision 2026-10-10).                                                                                     | **Decided** — built in 3.0.213                                                                        |
| L8  | The **quick-access bar** is V1's strip: **above the grid in every view**, up to **5 pads**, pinned with ★ in the PAD editor; a deck key and a quick-access key are never the same — the PAD editor refuses it and names the holder (K2, owner decision 2026-10-10).                                                                | **Decided** — built in 3.0.214, keys in 3.0.215                                                       |
| L9  | **Now playing** is one line in the status bar (wide) and in the dock (narrow), as in V1: "N playing: a · b · c…" — the first three names, then … — or "No sound" when nothing plays; announced politely (`role="status"`). The pads keep their glow (owner decision 2026-10-11).                                                   | **Decided** — step 13f                                                                                |

### Steps

| Step | Content                                                                                                                   | Open questions                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 13a  | The two frames (L1, L2): the narrow dock with STOP ALL, PAUSED and the save status; the wide frame as today.              | —                                                                                   |
| 13b  | The deck switcher: tabs (narrow) and rail (wide) as one component (L3, L4).                                               | —                                                                                   |
| 13e  | Pad detail levels and the card format ([pad.md](../../design/components/pad.md)); names no longer cut off.                | the card's aspect ratio (PQ1, tested on the device); PQ2 and PQ4 decided 2026-10-10 |
| 13c  | Search and sort per view ([product §5](../README.md#board-decks--quick-access)); keys of the last deck stay active (K14). | — (L7)                                                                              |
| 13d  | The quick-access bar with fixed board-wide keys (K13) and the collision check with deck keys (K2).                        | — (L8)                                                                              |
| 13f  | Which sounds are playing now (V1 had a now-playing bar).                                                                  | — (L9)                                                                              |
| 13g  | Deck reorder (L6).                                                                                                        | — (L6)                                                                              |

## Open

- **Calibration** of the 600 px boundary (L1) on the owner's phone and tablet.
- **Card format** of the pad (PQ1, [pad.md](../../design/components/pad.md#open-questions)) —
  tested on the device.

## Standards

- **Window size classes** (Material 3): compact below 600 dp — 99.96 % of phones in portrait —,
  medium from 600 dp, expanded from 840 dp; a navigation bar for compact widths becomes a rail on
  larger ones ([Android Developers — Window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes)).
- **Tabs** group sibling content as a secondary navigation layer and scroll when there are many
  ([Android Developers — Layout and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns)).
- **Thumb zone:** about half of the people hold and operate a phone with one hand; the lower
  middle is easiest to reach, the top corners hardest (Steven Hoober,
  [Smashing Magazine — The Thumb Zone](https://smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users)).
- **Reflow** (WCAG 2.2 SC 1.4.10, AA): no two-dimensional scrolling at 320 CSS px width
  ([W3C — Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow)).
- **Target size:** 44 px (Apple HIG; WCAG 2.2 SC 2.5.5, AAA) — the project's minimum — above the AA
  minimum of 24 px (SC 2.5.8;
  [DAISY Knowledge Base — Target size (minimum)](https://kb.daisy.org/publishing/docs/conformance/wcag/target-size-minimum.html)).
- **Dragging movements** (WCAG 2.2 SC 2.5.7, AA): every drag has a single-pointer alternative,
  for example a menu with "Move up / Move down"
  ([Atlassian — Pragmatic drag and drop, accessibility guidelines](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines/)).
