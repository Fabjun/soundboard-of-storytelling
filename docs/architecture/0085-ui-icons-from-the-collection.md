# ADR-0085: Every icon of the interface comes from the pad icon collection

**Status:** Accepted
**Date:** 2026-10-14
**Slice:** cross-cutting
**Refines:** ADR-0070
**Category:** UI architecture

## Context

The interface drew its symbols from two sources: the project's own set `sos-ui` (ADR-0072:
`PixelIcon`, 24 hand-made icons — scroll, book, cog, sparkle, flame …) and, since 2026-10-11, the
board toolbar from the pad icon collection (`ToolbarIcon`: the Lock, search, quick access, decks,
undo and redo). Two styles next to each other, and the same meaning drawn differently: BACK was a
flame on two screens and a play triangle on a third. Owner decision 2026-10-14: the symbols of the
menus and screens are replaced by fitting icons from the icon library, to keep one style — as a
general concept.

## Decision

1. **One source:** every icon of the interface is an icon of the pad icon collection (ADR-0070),
   from the set nikoichu, which the toolbar already used — the pads' own style.
2. **One icon per meaning:** `UI_ICONS` in `v3/scripts/build-icons.ts` maps a meaning to a
   collection icon — board, library, settings, update, import, back, add, play, edit, delete,
   error, saved, key, app, locked / unlocked, search, quick access, decks, undo, redo. A meaning is
   drawn the same everywhere (BACK is one arrow on every screen). `build:icons` copies their
   drawings into `v3/src/icons/ui.json` for the start bundle (every screen shows some; Iconify:
   bundle the icons needed at once).
3. **One component:** `UiIcon` (`v3/src/components/UiIcon.tsx`) draws them — name, size, color,
   class; at whole multiples of the 16-pixel grid only (integer scaling, the pixel-art standard);
   decorative (`aria-hidden`), the control carries the name. `PixelIcon`, `ToolbarIcon` and
   `sos-ui.json` are removed; a label no longer repeats its icon ("NEW DECK", not "+ NEW DECK").
4. **Guarded:** `iconGuards` allows only free licenses (CC0, MIT) for the sets, so no own set comes
   back, and checks that each drawing in `ui.json` is its key's drawing in the collection;
   `codeGuards` counts `UiIcon` as decorative in the check of control names.

The choice of each icon was made by looking at the candidates side by side (preview sheet,
2026-10-14) and is open to the owner's review.

## Exceptions

| Exception                                                  | Reason                                                                                                           | Reference | Review                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------- |
| The menu button's "⋯" stays a character (`MenuButton.tsx`) | The collection has no "more" icon — nikoichu's only candidate, "hamburger", draws a burger (preview, 2026-10-14) | ADR-0085  | a fitting icon comes into the collection |

## Consequences

**Positive:**

- One style for pads and interface; one meaning, one picture.
- A new UI icon is a line in `UI_ICONS` — no drawing by hand.

**Negative / Trade-offs:**

- The icons are 16×16 drawings made for pads. Pixel art scaled by a fraction blurs (the back
  arrow at 11 px, measured), so `UiIcon` draws at the nearest whole multiple of the grid — at
  least 16 px; icons that were 10–14 px are 16 px now, and one at 40 px is 48 px.
- A drag handle as a 16 px icon is larger than the 10 px character it replaced: it is hidden on a
  compact pad (below 80 px, where it covered the name) and the name keeps room for it in SETUP.

## Alternatives considered

**Keep `sos-ui` and redraw it in the collection's style:** a second set to maintain by hand, and
the owner asked for the library's icons.

**Mix sets (Kenney, pixelarticons) where nikoichu has no fitting icon:** possible later, but
nikoichu had a fitting icon for every meaning, and one set keeps the line width and pixel grid alike.

## Amendments

**2026-10-14 (3.0.243) — symbols written as characters become icons too.** The buttons' × ✕
▲ ▼ ◀ ▶ ★ ≡ ⏸ ⏹ ⣿ are icons now: close (`nikoichu:exit-cross`), the four directions (Kenney 1-bit
chevrons — the same 16-pixel grid; nikoichu's arrows look like pins, so this is where a second set
is used), pause and stop (nikoichu), all pads (`nikoichu:clipboard-list`), drag
(`nikoichu:arrows-up-down`); removing an item from a list (a file, an icon, a key, a combo step's
pad) is the delete icon, ✕ was used for both. The board list's two-tap delete says CONFIRM like
every other two-tap delete (it said "!!"). Buttons whose only name was the character got an
`aria-label` ("Clear the search"). `codeGuards` ("symbols are icons") keeps symbol characters out
of the markup, the one exception named above.

## Related

- **Files:** `v3/scripts/build-icons.ts`, `v3/src/icons/ui.json`, `v3/src/components/UiIcon.tsx`,
  `v3/tests/unit/iconGuards.test.ts`
- **ADRs:** ADR-0070 (pad icons), ADR-0072 (superseded: the own set `sos-ui`)
