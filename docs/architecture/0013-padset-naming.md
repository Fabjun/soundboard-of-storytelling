# ADR-0013: Type `PadSet` instead of `Set`

**Status:** Superseded by ADR-0048
**Date:** 2026-05-27
**Slice:** Slice 3
**Refines:** —
**Category:** Data model

## Context

The data model in `docs/architecture/concept-brief.md §4.1` calls the concept "Set" — a named
collection of pads for the quick-access strip (Slice 6):

```typescript
// From the concept brief:
type Set = {
  id: string;
  name: string;
  order: number;
  pads: Pad[];
};
```

In TypeScript / JavaScript, `Set` is a built-in type (`Set<T>`). Defining our own `type Set`
would lead to a name collision and confusing code — especially because `store.ts` uses
`Set<string>` for `playingPads` and `loopingPads`:

```typescript
export const playingPads = signal<ReadonlySet<string>>(new globalThis.Set<string>());
```

> *This decision was not documented explicitly beforehand; it was derived as a necessary
> consequence while implementing Slice 3 and solved directly in code. The deviation is
> recorded in CLAUDE.md.*

## Decision

The soundboard type is named `PadSet` (not `Set`). Everywhere in code, in IDB, in types:
`PadSet`. Where the built-in `Set<T>` is referenced (e.g. in `store.ts`), `globalThis.Set` or
simply `Set<string>` can be used in a non-colliding context.

## Consequences

**Positive:**
- No naming conflict. Compiler errors would otherwise be hard to debug.
- `PadSet` is also more precise semantically: it is explicitly a set of pads, not a generic
  set.

**Negative / Trade-offs:**
- Deviates from the concept brief. `docs/architecture/concept-brief.md §4.1` calls the type
  `Set`. Anyone reading the brief and looking for the code has to know: `Set` in the brief =
  `PadSet` in the code.

## Alternatives considered

**Namespace prefix:** `SBSet` or `BoardSet`. Decided against, because `PadSet` carries the
semantics better.

**Import alias:** `import type { Set as PadSet } from './types'`. Would still shadow the
built-in. No improvement.

## Related

- **Files:** `v3/src/types.ts` (PadSet type), `v3/src/state/store.ts` (globalThis.Set for playingPads)
- **ADRs:** ADR-0008 (pad data model), ADR-0004 (TypeScript strict)
- **Source documents:** `docs/architecture/concept-brief.md §4.1`, `CLAUDE.md §Deviations from plan`
