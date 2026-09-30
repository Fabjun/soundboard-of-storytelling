# ADR-0006: iOS Safari 15+ Minimum, iPhone 13 Pro als Primärtarget

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Platform constraints

## Context

V3 wird primär auf einem iPhone 13 Pro + Brave Browser verwendet (Live-Einsatz
beim Tabletop-Rollenspiel). Gleichzeitig soll die App auf Desktop und anderen
Mobilgeräten nutzbar sein. Die Frage: Welche Browser-APIs können als guaranteed
vorausgesetzt werden, welche brauchen Graceful Degradation, welche sind explizit
ausgeschlossen?

Diese Entscheidung wurde als formaler Eintrag in `docs/architecture/concept-brief.md §4.13` und
`CLAUDE.md §Supported Platforms` dokumentiert, nachdem in Slice 3 ein
iOS-Inkompatibilitäts-Bug durch fehlendes Platform-Bewusstsein entstanden war
(HTML5 Drag-and-Drop — siehe ADR-0007).

## Decision

**Primärtarget:** iPhone 13 Pro (iOS 17/18) + Brave Browser.

**Minimum:** iOS Safari 15+ (iPhone 6s, 2015, und neuer).

**Guaranteed APIs (kein Polyfill nötig):**
- Pointer Events API (iOS 13+)
- IndexedDB
- Web Audio API (mit User-Gesture-Unlock)
- Service Worker / PWA / Add to Home Screen
- CSS `clamp()`, `prefers-reduced-motion`
- IntersectionObserver, ResizeObserver

**Graceful Degradation:**
- Container Queries (iOS 16+) — Fallback zu Media Queries auf iOS 15
- View Transitions API (iOS 18+) — optionaler Polish, nie harte Dependency

**Explizit ausgeschlossen:**
- HTML5 Drag-and-Drop (`draggable`, `ondragstart`, `ondrop`) — nicht auf
  iOS Safari/Brave. Jedes DnD-Interaction muss Pointer Events verwenden.
- Jedes API das iOS 17+ als harte Dependency erfordert.

## Consequences

**Positiv:**
- Klares Feature-Set: Entwicklung kann sich auf garantierte APIs verlassen,
  ohne jeden Feature-Check.
- DnD-Verbot ist explizit dokumentiert → verhindert Wiederholung des
  Slice-3-Fehlers.

**Negativ / Trade-offs:**
- Container Queries können nicht als einzige Layout-Strategie verwendet werden;
  Media-Query-Fallbacks müssen mitgeliefert werden.
- Einige moderne CSS-Features (z.B. `:has()`, `@layer`) sind iOS 15-riskant
  und müssen geprüft werden.

## Alternatives Considered

**iOS 17+ als Minimum:** Würde View Transitions und andere moderne Features
freigeben. Aber iPhone 6s/7/8 (iOS 15/16) sind noch im Umlauf; unnötige
Einschränkung.

**Desktop-first:** App wird primär am Desktop für TTRPG-Hosting verwendet.
Gegen Desktop-first spricht, dass der User V3 explizit für den iPhone-Live-
Einsatz am Spieltisch baut.

## Related

- **Dateien:** `v3/src/lib/padDnd.ts`, `v3/src/lib/libDnd.ts` (kanonische Pointer-Events-Implementierungen)
- **ADRs:** ADR-0007 (Pointer Events DnD), ADR-0024 (clip-path Konsequenz)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.13`, `CLAUDE.md §Supported Platforms`
- **Commits:** `8b2aef1` — docs: define platform support matrix
