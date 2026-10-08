# ADR-0078: STOP ALL in two stages

**Status:** Proposed
**Date:** 2026-10-08
**Slice:** Slice 12
**Refines:** ADR-0077
**Category:** Interaction

## Context

The owner decided STOP ALL in two stages (K16): the first press fades every sound out over
2.5 s, a second press while it fades stops at once; the numpad decimal key is the same action
(K6); Enter stops the sound started last with that pad's fade-out (K5). Built while the owner was
away (2026-10-08): the decisions are the owner's, the way they are built is provisional — review
pending. The engine offers `fadeOutAll(duration)`, but its cleanup timer stops every pad in its
table when the fade ends — also a pad started during the fade (pinned by a `test.fails` in
`v3/tests/unit/audio/engine.test.ts`). A game master who presses STOP ALL and at once starts the
next atmosphere would lose it after 2.5 s.

## Decision

1. `v3/src/state/stopControl.ts` holds the two stages: `pressStopAll()` fades each playing pad
   with the engine's per-pad fade (`stop(id, false, 2.5)`) and sets `stopAllFading` for 2.5 s; a
   press while it is set calls `stopAll()` (hard stop). `stopLast()` stops the last entry of
   `playingPads` (start order) with its pad's fade-out. The engine stays unchanged (ADR-0048 §4).
2. Keys (`v3/src/state/keyControl.ts`): the numpad decimal and the numpad Enter are taken in the
   capture phase, before a focused pad or button sees them (their Enter handler would toggle the
   focused control as well); the main Enter stops the last sound only while no control has focus
   — then it activates the control (WAI-ARIA button pattern). All of it in GAME on a board only.
3. The STOP ALL button sits in the board's top bar, GAME only, always enabled (an emergency stop
   is never greyed out), and reads STOP NOW while the first stage fades.

Industry standard: QLab's panic — Escape fades all cues, a second Escape hard-stops (QLab forum
threads, see Sources); WAI-ARIA Authoring Practices, button pattern (Enter activates the focused
button).

## Consequences

**Positive:**

- A pad started during the first stage keeps playing; the second stage stops it too (hard stop).
- The numpad's stop keys work whatever has focus; Enter never fights a focused button.

**Negative / Trade-offs:**

- A fading pad leaves the "playing" look at once (the engine reports it stopped when the fade
  starts) — STOP NOW on the button is the only sign that a fade still runs.
- Running combos stop at once in the first stage (the engine cannot fade a combo).
- The 2.5 s are fixed until Settings exist (K12).

## Alternatives considered

**`fadeOutAll` for the first stage:** one call, but cuts pads started during the fade. Rejected
until the engine is fixed (BACKLOG "Engine: fade out all stops pads started during the fade").

**Main Enter always stops the last sound:** simpler, but Enter on a focused pad would both toggle
it and stop another sound. Rejected.

## Related

- **Files:** `v3/src/state/stopControl.ts`, `v3/src/state/keyControl.ts`,
  `v3/src/components/BoardTopBar.tsx`
- **ADRs:** ADR-0077 (keys play pads), ADR-0048 §4 (engine changes need the owner)
- **Source documents:** [docs/product/README.md §6](../product/README.md#input-keyboard--numpad)
- **Sources:** https://groups.google.com/g/qlab/c/zbv3kBV5CUo,
  https://www.w3.org/WAI/ARIA/apg/patterns/button/
