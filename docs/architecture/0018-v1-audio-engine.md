# ADR-0018: V1 audio engine copied 1:1 — no rebuild

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 4
**Refines:** —
**Refined by:** ADR-0044 (audio engine module structure)
**Category:** Audio engine & iOS memory

## Context

V3 needs an audio engine for: pad playback (single shots), loop playback, playlist playback,
combo pads, crossfade, master + bus volumes, ducking, fade-in/fade-out. V1 implements all of
this in `v1-reference/index.html` — battle-tested over real TTRPG sessions.

The question: is the V1 engine ported (rewritten in TypeScript) or copied 1:1 and embedded
behind a facade?

`docs/architecture/concept-brief.md §4.4` is explicit: **"V1's audio engine is copied
unchanged into V3.0. Do not redesign. Do not improve. Copy, wrap, move on."**

## Decision

The V1 audio engine is copied **unchanged** into `v3/src/audio/` and exposed behind a
TypeScript-typed facade:

```typescript
// audio.ts — typed facade, V1 code behind it
export function play(padId: string): void;
export function stop(padId: string): void;
export function crossfade(from: string, to: string, duration: number): void;
```

Changes to the engine code are forbidden. The facade provides the typed interface; the engine
code itself stays unchanged.

> **As of Slice 3:** audio engine not implemented yet (Slice 4 pending). This ADR records the
> decision that is binding before Slice 4 is built.

## Consequences

**Positive:**

- Zero risk for audio behaviour: the engine is proven in production (V1).
- No time spent on a rebuild. Audio engines with correct crossfade, ducking and loop-seam
  handling are more complex than they look.
- iOS-specific hacks (silent WAV, visibilitychange, ctx.resume) already exist and are tested
  in V1.

**Negative / Trade-offs:**

- The engine code is untyped JavaScript. The TypeScript facade abstracts that, but the
  internal code stays `any` territory.
- Bugs in V1's engine are carried over 1:1 into V3. Before copying: read the V1 engine
  thoroughly and document known edge cases.
- "Do not improve" also means: do not act on refactoring impulses. Engineering discipline is
  required.

## Alternatives considered

**Rebuild in TypeScript:** correct architecture, type-safe. Risk: complex audio logic
(crossfade, playlist sequencing, ducking, iOS hacks) has to be re-implemented and re-tested.
Several weeks of effort.

**Web audio library (Howler.js, Tone.js):** abstracts Web Audio. But V1's iOS-specific
handling (ctx.suspend on visibilitychange, silent WAV unlock) is hard to integrate into
generic libraries.

## Related

- **Files:** `v3/src/audio/` (not yet created — Slice 4), `v1-reference/index.html` (source)
- **ADRs:** ADR-0019 (iOS memory safety), ADR-0020 (AudioContext lifecycle)
- **Source documents:** `docs/architecture/concept-brief.md §4.4`, `CLAUDE.md §Audio engine`
