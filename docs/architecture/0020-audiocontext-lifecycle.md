# ADR-0020: AudioContext-Lifecycle — TAP TO UNLOCK + visibilitychange

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 4

**Category:** Audio engine & iOS memory

## Context

Web Audio API auf iOS erfordert, dass der `AudioContext` in einer User-Gesture-
Callback erstellt oder resumed wird. Ohne das bleibt der Context in `suspended`
State — Playback ist nicht möglich.

Zusätzlich: Wenn der User das Tab wechselt (z.B. Nachricht empfangen während der
Gaming-Session), suspendiert iOS Safari den AudioContext. Beim Zurückkehren muss
er resume()-t werden. Das ist ein V1-bekanntes Problem.

V1 implementiert:
1. "TAP TO UNLOCK" — ein Overlay das beim ersten Tap den AudioContext erstellt
2. `visibilitychange`-Handler der bei `document.hidden` suspended und bei
   `visible` den Context resumed

Diese Lösung kommt aus V1's Erfahrung und wird in V3 übernommen (ADR-0018:
V1-Engine 1:1 kopiert).

> **Stand Slice 3:** Der AudioContext-Lifecycle wird in Slice 4 implementiert.
> Die App hat bereits einen `audioContextState` Signal (`'locked' | 'running' | 'suspended'`)
> und einen `TAP TO UNLOCK`-Button auf der StartScreen. Die Implementierung
> der tatsächlichen Web Audio Verbindung ist Slice 4.

## Decision

Der AudioContext-Lifecycle folgt V1's Muster:

1. **Initialer State:** `audioContextState = 'locked'`
2. **TAP TO UNLOCK:** User-Tap auf dem StartScreen-Overlay erstellt den
   `AudioContext` und setzt State auf `'running'`
3. **visibilitychange:** Bei `document.hidden` → `ctx.suspend()` + State `'suspended'`;
   bei `!document.hidden` → `ctx.resume()` + State `'running'`
4. **AppState-Signal:** `audioContextState` Signal in `store.ts` reflektiert den
   aktuellen State für UI-Feedback

## Consequences

**Positiv:**
- Funktioniert auf iOS Safari / Brave (User-Gesture-Anforderung erfüllt).
- Tab-Wechsel im Live-Einsatz unterbricht Audio korrekt und resumed beim Zurückkehren.
- UI kann auf State reagieren (z.B. "Audio paused" Indicator).

**Negativ / Trade-offs:**
- TAP TO UNLOCK ist ein extra User-Schritt bei jedem App-Start.
  Unvermeidlich wegen iOS-Anforderung.
- `visibilitychange` ist nicht 100% zuverlässig in allen iOS-Versionen.
  Workarounds aus V1 werden übernommen.

## Alternatives Considered

**AudioContext bei App-Init erstellen (ohne Gesture):** Würde auf iOS in
`suspended` bleiben — keine Audio. Nicht verwendbar.

**Page Visibility API ignorieren:** Audio würde beim Tab-Wechsel weiterlaufen.
Auf iOS wird der Tab ohnehin eingefroren — undefined behavior.

## Related

- **Dateien:** `v3/src/state/store.ts` (audioContextState signal), `v3/src/screens/StartScreen.tsx` (TAP TO UNLOCK UI), `v3/src/audio/` (Slice 4 — noch nicht erstellt)
- **ADRs:** ADR-0018 (V1 Audio Engine), ADR-0019 (iOS Memory Safety)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.4`, `v1-reference/index.html` (TAP TO UNLOCK Implementierung)
