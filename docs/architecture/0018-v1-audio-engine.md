# ADR-0018: V1 Audio-Engine 1:1 kopiert — kein Neubau

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 4

**Category:** Audio engine & iOS memory

## Context

V3 braucht eine Audio-Engine für: Pad-Playback (single shots), Loop-Playback,
Playlist-Playback, Combo-Pads, Crossfade, Master + Bus Volumes, Ducking,
Fade-In/Fade-Out. V1 implementiert all das in `v1-reference/index.html` —
kampferprobt über reale TTRPG-Sessions.

Die Frage ist: Wird die V1-Engine portiert (neu in TypeScript geschrieben)
oder 1:1 kopiert und in eine Facade eingebettet?

`docs/architecture/concept-brief.md §4.4` ist explizit: **"V1's audio engine is copied
unchanged into V3.0. Do not redesign. Do not improve. Copy, wrap, move on."**

## Decision

Die V1-Audio-Engine wird **unverändert** in `v3/src/audio/` kopiert und hinter
einer TypeScript-typed Facade exponiert:

```typescript
// audio.ts — typed facade, V1-Code dahinter
export function play(padId: string): void;
export function stop(padId: string): void;
export function crossfade(from: string, to: string, duration: number): void;
```

Änderungen am Engine-Code sind verboten. Die Facade stellt die typisierte
Schnittstelle bereit; der Engine-Code selbst bleibt unverändert.

> **Stand Slice 3:** Audio-Engine noch nicht implementiert (Slice 4 ausstehend).
> Dieser ADR dokumentiert die Entscheidung, die vor dem Bauen von Slice 4
> bindend ist.

## Consequences

**Positiv:**
- Zero-Risk für Audio-Verhalten: die Engine ist proven in Production (V1).
- Kein Zeitaufwand für Neubau. Audio-Engines mit korrektem Crossfade, Ducking,
  Loop-Seam-Handling sind komplexer als sie wirken.
- iOS-spezifische Hacks (Silent WAV, visibilitychange, ctx.resume) sind bereits
  in V1 vorhanden und getestet.

**Negativ / Trade-offs:**
- Der engine code ist untyped JavaScript. Die TypeScript-Facade abstrahiert das,
  aber der interne Code bleibt `any`-Territory.
- Bugs in V1's Engine werden 1:1 in V3 übernommen. Vor dem Kopieren: V1-Engine
  gründlich lesen und bekannte Edge-Cases dokumentieren.
- "Do not improve" bedeutet auch: keine Refactoring-Impulse umsetzen.
  Engineering-Disziplin ist erforderlich.

## Alternatives Considered

**Neubau in TypeScript:** Korrekte Architektur, typsicher. Risiko: komplexe
Audio-Logik (Crossfade, Playlist-Sequencing, Ducking, iOS-Hacks) muss re-
implementiert und re-getestet werden. Mehrwöchiger Aufwand.

**Web Audio Bibliothek (Howler.js, Tone.js):** Abstrahiert Web Audio. Aber V1's
iOS-spezifische Behandlung (ctx.suspend auf visibilitychange, Silent WAV unlock)
sind schwer in generische Bibliotheken zu integrieren.

## Related

- **Dateien:** `v3/src/audio/` (noch nicht erstellt — Slice 4), `v1-reference/index.html` (Source)
- **ADRs:** ADR-0019 (iOS Memory Safety), ADR-0020 (AudioContext Lifecycle)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.4`, `CLAUDE.md §Audio engine`
