# ADR-0002: Preact Signals as state manager

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 1
**Refines:** —
**Category:** Tech stack

## Context

V3 needs a central store for UI state (current board, current scene, current mode, library
items, playback state). `docs/architecture/concept-brief.md §4.3` named two options as equal:
**Zustand** (~1 KB, popular in the React/Preact ecosystem) and **Preact Signals** (~1 KB,
native Preact package). The choice was delegated to Claude Code with a duty to justify it.

## Decision

**Preact Signals** (`@preact/signals`) was chosen for Slice 1.

Reasoning: signals are a native Preact concept — no wrapper components, no `useSelector`, no
`Provider`. Components subscribe automatically to the signals they read (JSX binding via
`.value`). Mutations go through exported setter functions. The store lives in
`src/state/store.ts` as module singletons.

The user confirmed the choice in Slice 1.

## Consequences

**Positive:**
- No provider wrapping needed — signals are globally accessible.
- Computed signals (`computed()`) replace selector logic: `currentBoard` and `currentScene`
  are derived signals, no extra state.
- Granular re-renders: only components that read a signal re-render on mutation — without
  `shouldComponentUpdate` or memo.
- Unit tests must reset signals explicitly before every test (module singletons persist
  between tests). Solved via `beforeEach` resets in unit tests.

**Negative / Trade-offs:**
- Signals are module singletons: tests cannot simply provision a "fresh store". Workaround:
  an explicit `beforeEach` reset (documented in `docs/development/testing.md §Known pitfalls`).
- No time-travel debugging (Redux DevTools etc.). No loss for this project.

## Alternatives considered

**Zustand:** popular, supports middleware, optional DevTools support. Would also have been
fine. Preact Signals were chosen because of the native Preact fit and because no Zustand
provider is needed.

**Preact Context + useReducer:** more boilerplate, no automatic granularity. Context for
global state would also be available on every level — no real advantage over signals.

**MobX:** larger, more complex, not needed.

## Related

- **Files:** `v3/src/state/store.ts`, `v3/src/types.ts` (AppState interface)
- **ADRs:** ADR-0001 (Preact), ADR-0011 (LibraryItem never as a Blob in a signal)
- **Source documents:** `docs/architecture/concept-brief.md §4.3`, `CLAUDE.md §Architecture → State`
- **Commits:** `8be64d4` — Slice 1 scaffold (signals introduced)
