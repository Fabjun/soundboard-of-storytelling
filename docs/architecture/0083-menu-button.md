# ADR-0083: Action menus — one MenuButton after the W3C menu button pattern

**Status:** Proposed
**Date:** 2026-10-11
**Slice:** Slice 13
**Refines:** —
**Category:** UI architecture

## Context

On 2026-10-11 the deck rail's rename, duplicate and delete buttons measured 28 px wide — below the
project's 44 px touch minimum (CLAUDE.md UI rules). Three 44 px buttons would leave the active
deck's name about 14 px. The product owner decided the same day: one 44 px "⋯" button that opens a
menu with the three actions, and a check that measures every visible button
(`docs/backlog.md` "Small icon buttons below the 44 px touch target"). The app had no menu yet.

## Decision

1. **One component, `MenuButton`** (`v3/src/components/MenuButton.tsx`), for every "⋯" menu of
   actions — the actions come as data (`label`, `onSelect`, `testid`, `danger`), never a second
   menu component.
2. **The W3C APG menu button pattern for actions**
   ([W3C — Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/),
   [example: actions](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/)):
   the button has `aria-haspopup="menu"` and `aria-expanded`; the menu is `role="menu"` with
   `menuitem` entries; opening puts the focus on the first entry; ↑ / ↓ / Home / End move between
   them; Escape closes it and gives the focus back to the button (`useEscapeKey`, ADR-0074); Tab and
   a press outside close it.
3. **A delete keeps its two taps** (CLAUDE.md UI rules): its `onSelect` returns `true` on the first
   tap, so the menu stays open and the entry says "Delete — tap again".
4. The menu hangs below its button (`sb-menu-list`, absolutely placed, right-aligned); each entry is
   a 44 px row (`sb-menu-item`, `is-danger` for a delete).

## Consequences

**Positive:**

- Every action control in a deck row is 44 px; the name keeps its room.
- Keyboard and screen readers get the menu behavior they know.
- The next "⋯" menu (pads, boards) is the same component.

**Negative / Trade-offs:**

- One tap more for an action (open, then choose) — accepted for rare actions; the main action of a
  row (select the deck) stays one tap.
- A menu at the bottom of a scrolled list opens downwards; it is reached by scrolling.

## Alternatives considered

**Disclosure pattern** (a button that shows a group of ordinary buttons, no `menu` role): fits
navigation lists better, but the APG names the menu button for a list of actions.

**Three 44 px buttons:** about 14 px left for the deck name — rejected by the owner.

## Related

- **Files:** `v3/src/components/MenuButton.tsx`, `v3/src/components/DeckRail.tsx`,
  `v3/tests/e2e/deck-crud.spec.ts`, `v3/tests/e2e/mobile/touch-targets.spec.ts`
- **ADRs:** ADR-0074 (dialogs and Escape)
