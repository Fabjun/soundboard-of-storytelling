# Adaptive layout

> **Leaf of [docs/product/README.md](../README.md).** Filled 2026-10-10 in dialogue with the product
> owner. Nothing in this document is built yet; implementation is Slice 13, in the steps below.
> Architecture: [ADR-0045](../../architecture/0045-two-axis-adaptive-model.md) (one adaptive app,
> axis 1 screen format, axis 2 input type).

## Why

The app has to work well on smartphones in general, on tablets and on desktop
([product §6 Platforms](../README.md#platforms)). Today the Board screen has one layout, made
for wide screens: the deck rail on the left, STOP ALL and PAUSED in the top bar. The stylesheet
has no breakpoint at all. On a phone the pads get little room, names are cut off (BACKLOG "Pad
names cut off on narrow screens"), and the live controls sit in the top corner — the hardest place
to reach with one hand. Until this slice, real game nights run on laptop or tablet.

## Decided — not yet built

| #   | Statement                                                                                                                                                                                                                                                                                          | Status      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| L1  | Two frames by window width: **narrow** below **600 px**, **wide** from 600 px. 600 px is the start value — the boundary between Material 3's _compact_ and _medium_ window size classes — and is calibrated on the owner's phone and tablet (ADR-0045: thresholds are set empirically on devices). | **Decided** |
| L2  | Narrow: a **dock** at the bottom holds **STOP ALL**, **PAUSED** and the **save status** (one bar instead of the dock plus the status bar — the grid keeps the height, [P4](../README.md#principles)). The top bar keeps back, the mode toggle and the Lock, which play rarely needs.               | **Decided** |
| L3  | Narrow: decks are switched by **tabs above the pad grid** — All pads first, then every deck — scrolling sideways when they do not fit. One tap switches; the current deck is always visible. Deck actions, NEW DECK and PAD SIZE are reached from the tab row in SETUP.                            | **Decided** |
| L4  | Wide: the **deck rail** on the left stays as today (folds to its button). Tabs and rail are **two variants of one deck switcher**, not two components (one component per element, variants by props).                                                                                              | **Decided** |
| L5  | Order of the steps: 13a → 13b → 13e → 13c → 13d → 13f → 13g (table below).                                                                                                                                                                                                                         | **Decided** |
| L6  | Deck reorder: drag & drop together with a way to reorder without dragging (WCAG 2.2 SC 2.5.7), planned in step 13g — BACKLOG "Deck reorder (drag & drop) — feature not built".                                                                                                                     | **Decided** |

### Steps

| Step | Content                                                                                                                   | Open questions                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 13a  | The two frames (L1, L2): the narrow dock with STOP ALL, PAUSED and the save status; the wide frame as today.              | —                                     |
| 13b  | The deck switcher: tabs (narrow) and rail (wide) as one component (L3, L4).                                               | —                                     |
| 13e  | Pad detail levels and the card format ([pad.md](../../design/components/pad.md)); names no longer cut off.                | pad.md PQ2, PQ4                       |
| 13c  | Search and sort per view ([product §5](../README.md#board-decks--quick-access)); keys of the last deck stay active (K14). | Where the search field sits           |
| 13d  | The quick-access bar with fixed board-wide keys (K13) and the collision check with deck keys (K2).                        | Where it sits; how many pads it holds |
| 13f  | Which sounds are playing now (V1 had a now-playing bar).                                                                  | Confirm it, and where it sits         |
| 13g  | Deck reorder (L6).                                                                                                        | The form of the way without dragging  |

## Open

- **PQ2 / PQ4** — what a small pad shows, and the smallest zoom against the 44 px touch target
  ([pad.md](../../design/components/pad.md#open-questions)). Decided with step 13e.
- **Search field, quick-access bar, now-playing** — where each sits on a phone and on a wide
  screen. Decided with steps 13c, 13d and 13f.

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
