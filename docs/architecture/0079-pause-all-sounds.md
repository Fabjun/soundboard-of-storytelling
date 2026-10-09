# ADR-0079: Pause all sounds

**Status:** Accepted
**Date:** 2026-10-08
**Slice:** Slice 12
**Refines:** ADR-0043
**Category:** Audio engine & iOS memory

## Context

K7 / K8 (docs/product/README.md §6, owner decisions 2026-09-28): Space pauses every sound — to
talk at the table — and resumes it on the next press; while paused, any sound action resumes
everything and plays the new sound; stop actions end the paused sounds; a clearly visible
PAUSED shows. The product doc notes that this needs an engine change, approved separately: the
engine resumes a suspended context whenever a pad plays (wanted here, K8) and whenever the app
becomes visible again (`visibilitychange`, ADR-0043) — the second would end a pause behind the
user's back. Built while the owner was away (2026-10-08) on its own branch, after the precedent
of the engine fix O1 / PR #35: prepared, then the owner decides. The owner accepted the details
on 2026-10-09 and released the merge the same day, before the iPhone playback check; that check
(iPhone checklist "Pause") stays open.

## Decision

1. **Engine (`v3/src/audio/engine.ts`), minimal:** a `userPaused` flag; `pauseAll()` sets it and
   suspends the context; `resumeAll()` clears it and resumes; the `visibilitychange` handler
   resumes only while the flag is off. Nothing else in the engine changes — its play paths
   already resume a halted context (K8).
2. **Facade (`v3/src/audio/index.ts`):** `pause()` / `resume()` set the `audioPaused` signal;
   `play()` resumes first while paused, so the signal and the engine flag never disagree.
3. **Controls:** `togglePause` (`v3/src/state/pauseControl.ts`) — nothing playing → nothing;
   Space in GAME unless a control has focus (`keyControl`); stop actions during a pause stop at
   once — a fade cannot run on a suspended clock — STOP ALL also ends the pause, Enter ends it
   when it stopped the last paused sound (`stopControl`). PAUSED shows as a button in the board
   top bar; a tap resumes (also usable without a keyboard).

Industry standard: `AudioContext.suspend()` / `resume()` — "halts audio hardware access and
reduces CPU/battery usage", the time stops and every source keeps its place (MDN,
AudioContext.suspend). This is how Web Audio apps pause globally.

## Consequences

**Positive:**

- Every sound — Singles, Loops, combos — pauses at its exact place and goes on from there.
- Coming back to the app keeps a pause; iOS halting the context on its own is still undone.

**Negative / Trade-offs:**

- A pause suspends the whole context: the PAD editor's preview pauses too (it is SETUP-only, and
  a mode switch stops every sound).
- Engine change: the owner's playback check on the iPhone (suspend / resume on iOS, a call
  during a pause) is still open — iPhone checklist "Pause".

## Alternatives considered

**Stop and remember positions, restart on resume:** works without an engine change, but loses
combo timing and fades and re-decodes; far more code. Rejected.

**Pause each pad's sources:** Web Audio sources cannot pause, only stop. Rejected.

## Related

- **Files:** `v3/src/audio/engine.ts`, `v3/src/audio/index.ts`, `v3/src/state/pauseControl.ts`,
  `v3/src/state/stopControl.ts`, `v3/src/state/keyControl.ts`, `v3/src/components/BoardTopBar.tsx`
- **ADRs:** ADR-0043 (context resume), ADR-0048 §4 (engine changes need the owner), ADR-0078
- **Source documents:** [docs/product/README.md §6](../product/README.md#input-keyboard--numpad)
- **Sources:** https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend
