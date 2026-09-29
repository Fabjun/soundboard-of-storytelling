# ADR-0013: Type `PadSet` statt `Set`

**Status:** Superseded by ADR-0048
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Datenmodell

## Context

Das Datenmodell aus `V3_CONCEPT_BRIEF.md §4.1` nennt das Konzept "Set" —
eine benannte Sammlung von Pads für den Quick-Access-Strip (Slice 6):

```typescript
// Aus dem Concept Brief:
type Set = {
  id: string;
  name: string;
  order: number;
  pads: Pad[];
};
```

In TypeScript / JavaScript ist `Set` ein built-in Typ (`Set<T>`). Einen eigenen
`type Set` zu definieren würde zu Namens-Kollision und Lese-Verwirrung führen —
insbesondere weil `store.ts` `Set<string>` für `playingPads` und `loopingPads`
verwendet:

```typescript
export const playingPads = signal<ReadonlySet<string>>(new globalThis.Set<string>());
```

> *Diese Entscheidung war nicht explizit vorab dokumentiert; sie wurde als
> notwendige Konsequenz beim Implementieren von Slice 3 abgeleitet und
> direkt im Code gelöst. Die Deviation ist in CLAUDE.md festgehalten.*

## Decision

Der Soundboard-Typ wird `PadSet` benannt (nicht `Set`). Überall im Code,
in IDB, in Typen: `PadSet`. Wenn auf den built-in `Set<T>` referenziert wird
(z.B. in `store.ts`), kann `globalThis.Set` oder einfach `Set<string>` in
nicht-kollisionierendem Kontext verwendet werden.

## Consequences

**Positiv:**
- Kein Naming-Conflict. Compiler-Fehler wären sonst schwer zu debuggen.
- `PadSet` ist auch semantisch treffender: es ist explizit ein Set von Pads,
  nicht ein generischer Set.

**Negativ / Trade-offs:**
- Weicht vom Concept Brief ab. `V3_CONCEPT_BRIEF.md §4.1` nennt den Typ `Set`.
  Wer den Brief liest und den Code sucht, muss wissen: `Set` im Brief = `PadSet`
  im Code.

## Alternatives Considered

**Namespace-Prefix:** `SBSet` oder `BoardSet`. Entschieden gegen, weil `PadSet`
die Semantik besser transportiert.

**Import-Alias:** `import type { Set as PadSet } from './types'`. Würde den
built-in weiterhin shadowed. Keine Verbesserung.

## Related

- **Dateien:** `v3/src/types.ts` (PadSet type), `v3/src/state/store.ts` (globalThis.Set für playingPads)
- **ADRs:** ADR-0008 (Pad-Datenmodell), ADR-0004 (TypeScript strict)
- **Quelldokumente:** `V3_CONCEPT_BRIEF.md §4.1`, `CLAUDE.md §Deviations from plan`
