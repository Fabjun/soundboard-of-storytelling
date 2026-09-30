# ADR-0044: Audio Engine Module Structure

**Status:** Accepted
**Date:** 2026-05-28
**Slice:** Slice 4
**Refines:** ADR-0018 (Audio Engine Strategy — "copy V1 unchanged")
**Category:** Audio engine & iOS memory

---

## Context

ADR-0018 states "copy V1 audio engine unchanged into V3". In practice
this is not possible: V1's engine is a 5000-line HTML monolith using
numeric string IDs, global variables (`window.AudioContext`,
`window.gain`, etc.), and no TypeScript. Literal copying would produce
uncompilable code and a maintenance hazard.

The goal of ADR-0018 was to avoid redesigning the audio *algorithms*
(LRU eviction, iOS hacks, playlist advancement, combo sequencer).
That goal remains valid and binding.

---

## Decision

Port V1's audio algorithms into three TypeScript files under `src/audio/`:

### `src/audio/types.ts`
Internal type definitions for the audio module:
- `PadInstance` — handle returned by playback primitives (start/stop)
- `ComboRuntimeState` — per-combo step tracking
- `AudioCallbacks` — event interface for Signal bridge

### `src/audio/engine.ts`
Core logic. Module-scope state replaces V1's globals:
- `ctx`, `masterGain` — AudioContext + master gain
- `srcs` — active source nodes per pad ID
- `gains` — per-pad GainNodes
- `libBufs`, `libBufLru`, `libBufBytes` — decoded-buffer LRU cache
- `libBufLoading` — in-flight decode deduplication
- `comboState` — combo runtime per pad ID

Exports (private to the module, called by index.ts):
- `initAudio()` — idempotent, called synchronously in user-gesture handler
- `playOnce(padId, pad: SinglePad)`
- `playLoop(padId, pad: LoopPad)`
- `playPlaylist(padId, pad: PlaylistPad)`
- `playCombo(padId, pad: ComboPad)`
- `stopPad(padId, immediate?)`
- `stopAllInternal()`
- `fadeOutAllInternal(duration)`
- `configureCallbacks(cb: AudioCallbacks)`

### `src/audio/index.ts`
Public facade. Re-exports `initAudio`; provides `play`, `stop`,
`stopAll`, `fadeOutAll`, `isPlaying`, `crossfade`. Wires callbacks
to Preact Signals (`addPlayingPad`, `removePlayingPad`, etc.).

---

## Algorithm fidelity (non-negotiable)

The following V1 algorithms are ported unchanged in semantics:

| Algorithm | V1 location | V3 module |
|-----------|-------------|-----------|
| LRU eviction (150 MB cap, byte counting) | ~2751–2775 | engine.ts `lruSet`/`lruDelete` |
| In-flight decode dedup (`libBufLoading`) | ~2881–2893 | engine.ts `ensureLibBuf` |
| iOS silent WAV AVAudioSession fix | ~3200 | engine.ts `initAudio` |
| `ctx.resume()` in every play path | V1 all play fns | engine.ts every play fn |
| `s.buffer = null` in `onended` before `playNext` | V1 playlist | engine.ts `playPlaylist` |
| `visibilitychange` resume handler | V1 init | engine.ts `initAudio` |
| Combo step sequencer with PadInstance handles | ~3974–4238 | engine.ts combo group |

---

## Crossfade signature correction

ADR-0018 defined `crossfade(from: string, to: string, duration: number)`.

V3 changes the second argument to `crossfade(from: string, to: Pad, duration: number)`.

**Reason**: `play(padId, pad)` receives a Pad object from the caller
(the audio module does not look up pads from a store). `crossfade` must
be consistent: the caller provides the Pad to play, not just its ID.
The ID is already on `to.id`.

ADR-0018 remains **Accepted** — ADR-0044 is a refinement, not a
supersession. The strategy (V1 algorithms, no redesign) is unchanged.

---

## Consequences

**Positive:**
- TypeScript enforces correct variant dispatch via discriminated union
- Module-scope state is trivially testable (import, call, inspect)
- Three-file structure is easy to audit and extend

**Negative:**
- Manual porting effort vs. copy-paste (~300–400 LOC engine.ts)
- Any deviation from V1 semantics must be caught by test or iPhone
  manual verification (Slice 4 Phase 5 / verification checklist)

## Alternatives Considered

**V1 JS als `<script>`-Tag oder nicht-typisierte `.js`-Datei:** Keine Type-Safety,
keine Möglichkeit V3's `Pad`-Discriminated-Union zu übergeben, globale Namespace-Pollution.
Verworfen.

## Related

- **Dateien:** `v3/src/audio/engine.ts`, `v3/src/audio/index.ts`, `v3/src/audio/types.ts`
- **ADRs:** ADR-0018 (V1 Audio-Engine 1:1 kopiert — kein Neubau), ADR-0019 (iOS Memory Safety), ADR-0042 (Pad als Discriminated Union), ADR-0043 (AudioContext Timing)
- **Quelldokumente:** `CLAUDE.md §V3 audio/IDB API`, `v1-reference/CLAUDE.md §iPhone / iOS Safari`
- **Commits:** Slice 4 (2026-05-28)
