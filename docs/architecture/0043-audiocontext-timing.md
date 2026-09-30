# ADR-0043: AudioContext Timing — Synchronous in Click Handler

**Status:** Accepted
**Date:** 2026-05-28
**Slice:** Slice 4
**Refines:** ADR-0020 (TAP TO UNLOCK — AudioContext Creation)
**Category:** Audio engine & iOS memory

---

## Context

ADR-0020 decided that the AudioContext is created via a "TAP TO UNLOCK"
gesture screen rather than eagerly at app boot. It does not specify
*where exactly* in the click handler `new AudioContext()` must appear.

iOS Safari (and Brave on iOS) enforces a strict user-gesture requirement:
`new AudioContext()` must be called **synchronously** within the same
event loop turn as the user's gesture (click/tap). If any `await` appears
before the `new AudioContext()` call, iOS's gesture window has closed and
the context is created in a suspended state that cannot be resumed.

This is the hardest-won iOS audio lesson from V1 (see v1-reference/CLAUDE.md
§"iPhone / iOS Safari — memory & stability rules").

---

## Decision

`initAudio()` (exported from `src/audio/engine.ts`) is called **synchronously
as the first statement** in the TAP TO UNLOCK click handler, before any
`await` or asynchronous work:

```typescript
function handleUnlock() {
  initAudio();                      // ← FIRST, synchronous, no await before this
  setAudioContextState('running');  // Signal update
  navigate('/boards');              // Then navigation
}
```

`initAudio()` is idempotent (no-op if already called). Calling it at any
other time (eager on boot, lazy on first pad tap) is explicitly rejected.

---

## Why this specific ordering matters

The iOS user-gesture window is only open in the **synchronous part** of the
event handler. Any microtask (`await`) or macrotask (`setTimeout`) after the
gesture marks the window as closed. Therefore:

1. `initAudio()` must be the **first line** of the handler
2. No `await` before `initAudio()`, ever
3. Navigation and state updates come **after** — they don't touch audio

The AVAudioSession silent-WAV trick inside `initAudio()` (which upgrades the
iOS session category to 'playback', preventing ringer-switch muting) also
requires a user gesture for `HTMLAudioElement.play()`. It relies on the same
synchronous placement.

---

## Consequences

**Positive:**
- AudioContext created in running state on iOS — no `ctx.resume()` needed
  at the TAP TO UNLOCK point itself
- AVAudioSession category correctly upgraded → ringer switch doesn't mute
- Straightforward: a single idempotent call, one location

**Negative:**
- The StartScreen must call `initAudio()` before any `await`. Every future
  refactor of the unlock handler must preserve this ordering. A comment in
  the code documents this invariant.

**Not affected:**
- Individual pad taps still call `ctx.resume()` defensively (in case the
  context was suspended by tab backgrounding). This is belt-and-suspenders,
  not a substitute for synchronous `initAudio()` on unlock.

**Rejected alternatives:**
- *Eager init at app boot*: iOS rejects `new AudioContext()` without a
  gesture; context would be permanently suspended.
- *Lazy on first pad tap*: The pad tap handler is async (awaits `ensureLibBuf`).
  By the time `new AudioContext()` is reached, the gesture window has closed.
- *Calling `initAudio()` after a routing `await`*: Same problem — gesture
  window closed.

ADR-0020 remains **Accepted** — ADR-0043 is a refinement specifying
implementation-level placement, not a change in strategy.

## Related

- **Dateien:** `v3/src/screens/StartScreen.tsx` (handleUnlock — Aufrufstelle), `v3/src/audio/engine.ts` (initAudio — Implementierung)
- **ADRs:** ADR-0020 (AudioContext-Lifecycle — TAP TO UNLOCK), ADR-0044 (Audio Engine Module Structure)
- **Quelldokumente:** `CLAUDE.md §iPhone / iOS Safari — memory & stability rules`, `v1-reference/CLAUDE.md §iPhone / iOS Safari`
- **Commits:** Slice 4 (2026-05-28)
