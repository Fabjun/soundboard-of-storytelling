# ADR-0034: Vitest for unit tests

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

Unit tests in a Vite/Preact/TypeScript project need a test runner. The natural choice in the
Vite ecosystem is Vitest — it uses the same Vite configuration and therefore needs no setup.

> *Vitest was chosen without an explicit evaluation of alternatives. It is the de facto
> standard for Vite projects and needed no separate weighing.*

## Decision

Vitest (`vitest`) as the unit test runner. Configuration in `v3/vitest.config.ts`.

**Special case:** IndexedDB is not implemented in jsdom. Solution: `fake-indexeddb` as an
in-memory IDB implementation. Setup via `v3/tests/unit/setup.ts`:

```typescript
import 'fake-indexeddb/auto';
```

This setup applies to all unit tests. Every test that uses IDB must call `_resetDB()` and
`new IDBFactory()` in `beforeEach` (documented in `docs/development/testing.md
§Known pitfalls §2`).

**Signal reset duty:** Preact signals are module singletons. Unit tests that test signals must
reset every signal they touch in `beforeEach`.

## Consequences

**Positive:**
- ~1s runtime for 102 unit tests (as of v3.0.18). The fastest feedback loop.
- No separate webpack/Babel configuration — Vitest uses Vite natively.
- `fake-indexeddb` enables real IDB API tests without a browser.

**Negative / Trade-offs:**
- `fake-indexeddb` is a simulation — there can be edge cases where it behaves differently from
  real browser IDB. For the tested patterns (get/put/delete/cursor) it is reliable enough.
- Signals as module singletons: every test that touches signals needs explicit resets.
  Forgotten resets lead to flakiness between tests.

## Alternatives considered

**Jest:** widely used, good ecosystem. Needs extra configuration for Vite/TypeScript/ES
modules. No advantage over Vitest in a Vite project.

**node:test (built-in):** too minimal for signal testing, no jsdom integration.

## Related

- **Files:** `v3/vitest.config.ts`, `v3/tests/unit/setup.ts`, `v3/tests/unit/*.test.ts`
- **ADRs:** ADR-0033 (test strategy) — the fake-indexeddb isolation is documented in §Decision of this ADR; no separate ADR
- **Source documents:** `docs/development/testing.md §Tools`, `docs/development/testing.md §Writing unit tests`
- **Commits:** `47ff8b0` — chore: add vitest setup and first unit tests
