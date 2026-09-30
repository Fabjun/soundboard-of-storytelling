# ADR-0004: TypeScript strict mode

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Tech stack

## Context

The project principle (CLAUDE.md §Permanent coding standards) is: "TypeScript strict mode. No
`any`." This is an engineering-discipline decision: implicit assumptions in the type system
are a main cause of bugs — especially in an app with a complex data model (boards, scenes,
pads, library, audio state) and few edge cases that can be verified manually.

## Decision

`tsconfig.app.json` has `"strict": true` set, as well as `"noUnusedLocals": true`. `any`
types are forbidden. For types that are hard to express: clarify with the user before
resorting to `unknown` or type assertions.

ESLint does not additionally check `no-unused-vars` (that is `noUnusedLocals` in the
tsconfig) — documented as a deviation in CLAUDE.md.

## Consequences

**Positive:**

- Null checks are enforced: `position: PadPosition | null` has to be handled at the call
  site, no accidental `undefined` dereferences.
- Unused variables are revealed at compile time.
- Type splits like `LibraryItemMeta` vs. `LibraryItem` are enforced by the type system
  (ADR-0011): code that wrongly stores a Blob in signals does not compile.

**Negative / Trade-offs:**

- More upfront effort when typing V1 audio engine code (originally written in untyped JS).
  Solved with explicit type assertions at the facade boundary.

## Alternatives considered

**No strict mode:** would silently allow the `any` decisions. In an app with iOS memory
constraints (ADR-0019), accidental Blob leaks into state are too risky.

## Related

- **Files:** `v3/tsconfig.app.json`, `v3/tsconfig.json`
- **ADRs:** ADR-0011 (LibraryItem split enforces type safety), ADR-0019 (iOS memory safety)
- **Source documents:** `CLAUDE.md §Permanent coding standards`
