# ADR-0002: Preact Signals als State Manager

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 1

**Category:** Tech Stack

## Context

V3 braucht einen zentralen Store für UI-State (current board, current scene,
current mode, library items, playback state). Das `docs/architecture/concept-brief.md §4.3`
nannte zwei Optionen als gleichwertig: **Zustand** (~1 KB, beliebt im
React/Preact-Ecosystem) und **Preact Signals** (~1 KB, natives Preact-Paket).
Die Wahl war an Claude Code delegiert mit Begründungspflicht.

## Decision

**Preact Signals** (`@preact/signals`) wurde für Slice 1 gewählt.

Begründung: Signals sind ein natives Preact-Konzept — keine Wrapper-Komponenten,
kein `useSelector`, kein `Provider`. Komponenten subscriben automatisch auf die
Signals, die sie lesen (JSX-Binding via `.value`). Mutationen über exportierte
Setter-Funktionen. Der Store lebt in `src/state/store.ts` als Modul-Singletons.

Der User bestätigte die Wahl in Slice 1.

## Consequences

**Positiv:**
- Kein Provider-Wrapping nötig — Signals sind global zugreifbar.
- Computed Signals (`computed()`) ersetzen Selector-Logik: `currentBoard` und
  `currentScene` sind derived signals, kein extra State.
- Granulare Re-Renders: nur Komponenten, die ein Signal lesen, re-rendern bei
  Mutation — ohne `shouldComponentUpdate` oder Memo.
- Unit-Tests müssen Signals vor jedem Test explizit resetten (Modul-Singletons
  persistieren zwischen Tests). Gelöst via `beforeEach`-Resets in Unit-Tests.

**Negativ / Trade-offs:**
- Signals sind Modul-Singletons: Tests können nicht einfach einen "fresh store"
  provisionieren. Workaround: expliziter `beforeEach`-Reset (dokumentiert in
  `docs/development/testing.md §Bekannte Fallstricke`).
- Kein Time-Travel-Debugging (Redux DevTools etc.). Für dieses Projekt kein
  Verlust.

## Alternatives Considered

**Zustand:** Beliebt, middleware-fähig, optional DevTools-Support. Wäre ebenfalls
fine gewesen. Preact Signals gewählt weil nativer Preact-Fit und kein
Zustand-Provider nötig.

**Preact Context + useReducer:** Mehr Boilerplate, keine automatische Granularität.
Zudem wäre Context für globalen State auf jedem Level verfügbar — kein wirklicher
Vorteil gegenüber Signals.

**MobX:** Größer, komplexer, nicht nötig.

## Related

- **Dateien:** `v3/src/state/store.ts`, `v3/src/types.ts` (AppState interface)
- **ADRs:** ADR-0001 (Preact), ADR-0011 (LibraryItem nie als Blob im Signal)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.3`, `CLAUDE.md §Architecture → State`
- **Commits:** `8be64d4` — Slice 1 scaffold (Signals eingeführt)
