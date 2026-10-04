# ADR-0069: REPEAT — a Loop plays a number of times, then stops

**Status:** Accepted
**Date:** 2026-10-04
**Slice:** Slice 15
**Refines:** ADR-0061
**Category:** Audio engine & iOS memory

## Context

The PAD editor's V1 scope includes REPEAT (docs/product/README.md, pad options): a loop plays N
times or endlessly. V1 offered ∞ or 1–999 for its loop mode and played N passes by starting a new
buffer source after each one ended (`onended` chain), which leaves small gaps between passes. V3's
V1 import dropped the count and noted it ("they now loop until stopped").

## Decision

Owner decisions 2026-10-04 (every Loop; plan and engine change approved):

1. **Model:** `LoopPad.repeat?: number`, a whole number 1–999 (`REPEAT_MAX`, V1's limit); missing =
   until stopped (∞). Optional, so stored boards and backups need no conversion; `parseBoard`
   accepts it only on a Loop and only in range. `padBaseOf` strips it, so a Loop turned into a
   Single carries no count.
2. **One file:** a single source plays the loop region `repeat` times. Web Audio:
   `AudioBufferSourceNode.start(when, offset, duration)` counts the duration "including any whole
   or partial loop iterations", so a duration of `repeat × region` ends exactly after N passes —
   seamless and sample-accurate, with no chained sources (V1's gaps). A preview started inside the
   region counts that first part as one pass. When the source ends, the pad stops as a Single does.
3. **Several files:** the playlist counts the tracks it starts and ends after `repeat` passes
   through the list (in shuffle: as many tracks).
4. **In a combo:** a Loop child still runs in the background (PR #36), but with a count it stops
   by itself after its passes instead of running until the combo stops.
5. **Editor:** a REPEAT row for Loops — ∞ button and a count field (1–999, a typed value lands in
   range). **V1 import:** `loopCount` becomes `repeat` (capped at 999); the "loop count dropped"
   note is gone.

## Consequences

**Positive:**

- REPEAT plays without gaps, more precisely than V1.
- V1 boards keep their repeat counts.
- No data conversion: the field is optional.

**Negative / Trade-offs:**

- The engine changes again (playback check on the iPhone checklist).
- A Loop with a count reports "looping" while it plays (as before), although it ends by itself.

## Alternatives considered

**V1's chain of sources:** one source per pass, restarted in `onended`. Rejected: gaps between
passes and more engine code; the Web Audio duration does it exactly.

**REPEAT only for Loops with one file (as V1):** rejected by the owner — a list repeated N times is
the same idea.

## Related

- **Files:** `v3/src/types.ts`, `v3/src/audio/engine.ts`, `v3/src/audio/types.ts`,
  `v3/src/audio/index.ts`, `v3/src/lib/boardModel.ts`, `v3/src/lib/padUtils.ts`,
  `v3/src/lib/v1Import.ts`, `v3/src/components/PadEditorPanel.tsx`
- **ADRs:** ADR-0048 (pad types), ADR-0068 (trim per file)
- **Sources:** https://webaudio.github.io/web-audio-api/#dom-audiobuffersourcenode-start
