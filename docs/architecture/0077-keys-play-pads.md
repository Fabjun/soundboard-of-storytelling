# ADR-0077: Keys play pads

**Status:** Accepted
**Date:** 2026-10-08
**Slice:** Slice 12
**Refines:** ADR-0048
**Category:** Interaction

## Context

A Bluetooth numpad turns the app into a mechanical soundboard (docs/product/README.md §6, K1 to
K16). ADR-0048 put the key on a deck's placement (`Placement.hotkey`), so one key can play
different pads in different decks; V1 stored keys as `KeyboardEvent.code` and the V1 import
keeps them. Until 3.0.181 the key was only shown: the PAD editor had a read-only field, and no
code listened for keys.

## Decision

1. **A key is `KeyboardEvent.code`** — the physical key, independent of the keyboard layout and
   of Shift: the numpad's 1 is `Numpad1`, the main keyboard's 1 is `Digit1` (K1). Stored codes
   stay as they are; the pad shows a short label (`N1`, `1`, `A`, `N+`; `keyLabel` in
   `v3/src/lib/padKeys.ts`, K10).
2. **One document listener**, started once in `v3/src/main.tsx` (`startKeyControl`,
   `v3/src/state/keyControl.ts`). It reads screen, mode, board and deck from the signals when the
   key is pressed and plays the pad only:
   - on a board in GAME (K3);
   - from the deck shown, or in All pads from the deck last selected (K14);
   - when the pad is not already playing — a second press never stops it (K4);
   - not while a text field has focus, not with Ctrl / Alt / Cmd, not for a held-down key, not
     for a key another handler already took (`defaultPrevented`);
   - never for a reserved key (`RESERVED_KEYS`): Enter, Numpad Enter, Numpad decimal and Space
     belong to the stop and pause controls (K5 to K7), Escape and Tab to dialogs and focus.
3. **Assigning:** the PAD editor's key field (deck view) takes the next key after a tap; Escape
   cancels without closing the editor, Tab moves on (no keyboard trap, WCAG 2.1.2). A key another
   pad of the deck holds is offered to move ("MOVE KEY HERE"); `setPlacementHotkey` takes it from
   the other placement in the same write, so a key never plays two pads of a deck (owner decision
   2026-10-08). A reserved key is refused with its reason.

Industry standard: `KeyboardEvent.code` for controls bound to physical key positions (MDN,
KeyboardEvent.code; Chrome Developers, "KeyboardEvent keys and codes"); rebinding a shortcut that
is taken shows the conflict and offers to reassign (macOS keyboard shortcuts, VS Code keybindings
editor).

## Consequences

**Positive:**

- The numpad plays pads in GAME without looking at the screen; keys imported from V1 work.
- Keys work in All pads, so numpad control does not drop out while browsing the pool.
- The listener holds no state of its own — it cannot act on an outdated board or deck.

**Negative / Trade-offs:**

- Which code a device sends is only known on the device (the numpad's decimal key may send
  `NumpadDecimal` or `Period`) — checked on the iPhone (manual checklist).
- Keys of the quick-access bar (K13) are not handled yet — the bar comes with Slice 13.
- A key held by a pad whose placement points at a pad no longer in the pool plays nothing.

## Alternatives considered

**`KeyboardEvent.key`:** follows the layout and Shift; the numpad 1 and the main 1 would both be
"1", against K1. Rejected.

**A listener per pad cell:** only works while the pad is in the DOM and focused. Rejected.

**Refuse a taken key** (V1): one more step for the common case of moving a key. Rejected by the
owner (2026-10-08).

## Related

- **Files:** `v3/src/lib/padKeys.ts`, `v3/src/state/keyControl.ts`,
  `v3/src/components/PadEditorPanel.tsx`, `v3/src/lib/boardModel.ts` (`setPlacementHotkey`)
- **ADRs:** ADR-0048 (keys belong to the placement), ADR-0074 (PAD editor full screen, Escape)
- **Source documents:** [docs/product/README.md §6](../product/README.md#input-keyboard--numpad)
- **Sources:** https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code,
  https://developer.chrome.com/blog/keyboardevent-keys-codes/,
  https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap
