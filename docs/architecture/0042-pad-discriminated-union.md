# ADR-0042: Pad as a discriminated union

**Status:** Superseded by ADR-0048
**Date:** 2026-05-28
**Slice:** Slice 4
**Refines:** —
**Category:** Data model

## Context

docs/architecture/concept-brief.md §4.1 defined `Pad` as a flat type with `type: PadType` and
optional type-specific fields (`libraryItemRef?: string`). Slice 3 implemented board/scene/pad
CRUD on this flat type.

Slice 4 introduces the audio engine. It dispatches to a different playback path depending on
`pad.type`. Every path needs different type-specific fields:

- `single`/`loop`: `libraryItemRef?: string` (one audio file)
- `playlist`: `files: string[]` (ordered list of hashes), `shuffle?: boolean`
- `combo`: `steps: ComboStep[]` (sequence of steps)

With the old flat type all fields are optional. TypeScript does not prevent accessing
`pad.files` on a `SinglePad` — only a runtime error (undefined) signals the problem. That makes
the engine dispatch logic error-prone.

## Decision

The flat `Pad` type is replaced by a discriminated union:

```typescript
type Pad = SinglePad | LoopPad | PlaylistPad | ComboPad;
```

Shared fields (id, name, position, volume, fadeIn, fadeOut, hotkey, color, iconRef) live in
`PadBase`. Type-specific fields are restricted to the respective variant type.

Type guards are exported next to the types:

```typescript
export const isSinglePad = (p: Pad): p is SinglePad => p.type === 'single';
export const isLoopPad = (p: Pad): p is LoopPad => p.type === 'loop';
export const isPlaylistPad = (p: Pad): p is PlaylistPad => p.type === 'playlist';
export const isComboPad = (p: Pad): p is ComboPad => p.type === 'combo';
```

A backward-compatibility migration runs in `boardGetAll()` / `boardGet()` in `idb.ts` to
convert old Slice 3 pads:

- `playlist` pads without `files`: `files = [libraryItemRef ?? ''].filter(Boolean)`
- `combo` pads without `steps`: `steps = []`

## Consequences

**Positive:**

- TypeScript prevents `pad.files` access on a `SinglePad` at compile time.
- The audio engine dispatch is unambiguous: `switch (pad.type)` narrows completely.
- Slice 4 code is self-documenting — every playback path receives a typed variant.

**Negative / Trade-offs:**

- Slice 3 code that spread `{ ...pad, type: newType }` (e.g. `applyTypeChange` in padUtils.ts)
  has to be rewritten to construct explicit union variants.
- `applyTypeChange()` is more verbose.
- IDB deserialisation needs a runtime migration step for legacy data.

## Alternatives considered

**Flat type with optional fields (status quo):** TypeScript does not catch cross-variant field
access. Rejected: the engine needs guarantees.

**Flat type + runtime guards only:** the same type, but guards that check field existence.
Rejected: TypeScript errors at call sites where `Pad` is passed to functions that expect
`SinglePad`.

**`PadType` union without a base interface:** all fields on all variants. Rejected: too much
redundant code; obscures which fields are relevant.

## Related

- **Files:** `v3/src/types.ts`, `v3/src/lib/padUtils.ts`, `v3/src/db/idb.ts`,
  `v3/src/components/PadCreationPopover.tsx`, `v3/src/components/PadEditorPanel.tsx`,
  `v3/src/screens/BoardScreen.tsx`
- **ADRs:** ADR-0008 (pad position struct), ADR-0010 (board JSON document)
- **Source documents:** `docs/architecture/concept-brief.md §4.1`, Slice 4 plan decision 2026-05-28
