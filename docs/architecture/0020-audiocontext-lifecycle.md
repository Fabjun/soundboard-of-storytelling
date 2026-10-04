# ADR-0020: AudioContext lifecycle — TAP TO UNLOCK + visibilitychange

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 4
**Refines:** —
**Refined by:** ADR-0043 (AudioContext created synchronously in the click handler)
**Category:** Audio engine & iOS memory

## Context

The Web Audio API on iOS requires the `AudioContext` to be created or resumed inside a
user-gesture callback. Without that the context stays in the `suspended` state — playback is
impossible.

In addition: when the user switches tabs (e.g. a message arrives during the gaming session),
iOS Safari suspends the AudioContext. On return it has to be resumed with resume(). This is a
problem known from V1.

V1 implements:

1. "TAP TO UNLOCK" — an overlay that creates the AudioContext on the first tap
2. a `visibilitychange` handler that suspends on `document.hidden` and resumes the context on
   `visible`

This solution comes from V1's experience and is carried over into V3 (ADR-0018: V1 engine
copied 1:1).

> **As of Slice 3:** the AudioContext lifecycle is implemented in Slice 4. The app already has
> an `audioContextState` signal (`'locked' | 'running' | 'suspended'`) and a `TAP TO UNLOCK`
> button on the StartScreen. The actual Web Audio connection is Slice 4.

## Decision

The AudioContext lifecycle follows V1's pattern:

1. **Initial state:** `audioContextState = 'locked'`
2. **TAP TO UNLOCK:** a user tap on the StartScreen overlay creates the `AudioContext` and
   sets the state to `'running'`
3. **visibilitychange:** on `document.hidden` → `ctx.suspend()` + state `'suspended'`; on
   `!document.hidden` → `ctx.resume()` + state `'running'`
4. **AppState signal:** the `audioContextState` signal in `store.ts` reflects the current
   state for UI feedback

## Consequences

**Positive:**

- Works on iOS Safari / Brave (user-gesture requirement met).
- A tab switch during live use interrupts audio correctly and resumes on return.
- The UI can react to the state (e.g. an "Audio paused" indicator).

**Negative / Trade-offs:**

- TAP TO UNLOCK is an extra user step at every app start. Unavoidable because of the iOS
  requirement.
- `visibilitychange` is not 100% reliable in every iOS version. Workarounds from V1 are
  carried over.

## Alternatives considered

**Create the AudioContext at app init (without a gesture):** would stay `suspended` on iOS —
no audio. Not usable.

**Ignore the Page Visibility API:** audio would keep running on a tab switch. On iOS the tab
is frozen anyway — undefined behavior.

## Related

- **Files:** `v3/src/state/store.ts` (audioContextState signal), `v3/src/screens/StartScreen.tsx` (TAP TO UNLOCK UI), `v3/src/audio/` (Slice 4 — not yet created)
- **ADRs:** ADR-0018 (V1 audio engine), ADR-0019 (iOS memory safety)
- **Source documents:** `docs/architecture/concept-brief.md §4.4`, `v1-reference/index.html` (TAP TO UNLOCK implementation)
