# ADR-0042: Pad als Discriminated Union

**Status:** Superseded by ADR-0048
**Date:** 2026-05-28
**Slice:** Slice 4

**Category:** Data model

## Context

docs/architecture/concept-brief.md §4.1 definierte `Pad` als flachen Typ mit `type: PadType`
und optionalen typ-spezifischen Feldern (`libraryItemRef?: string`). Slice 3
implementierte Board/Scene/Pad-CRUD auf Basis dieses flachen Typs.

Slice 4 führt die Audio-Engine ein. Diese dispatcht je nach `pad.type` auf einen
anderen Playback-Pfad. Jeder Pfad braucht andere typ-spezifische Felder:

- `single`/`loop`: `libraryItemRef?: string` (ein Audio-File)
- `playlist`: `files: string[]` (geordnete Liste von Hashes), `shuffle?: boolean`
- `combo`: `steps: ComboStep[]` (Sequenz von Schritten)

Mit dem alten flachen Typ sind alle Felder optional. TypeScript verhindert
nicht, dass auf `pad.files` bei einem `SinglePad` zugegriffen wird — nur
ein Runtime-Fehler (undefined) signalisiert das Problem. Das macht die
Engine-Dispatch-Logik fehleranfällig.

## Decision

Der flache `Pad`-Typ wird durch eine Discriminated Union ersetzt:

```typescript
type Pad = SinglePad | LoopPad | PlaylistPad | ComboPad;
```

Gemeinsame Felder (id, name, position, volume, fadeIn, fadeOut, hotkey,
color, iconRef) leben in `PadBase`. Typ-spezifische Felder sind auf den
jeweiligen Variant-Typ beschränkt.

Typ-Guards werden neben den Typen exportiert:
```typescript
export const isSinglePad   = (p: Pad): p is SinglePad   => p.type === 'single';
export const isLoopPad     = (p: Pad): p is LoopPad     => p.type === 'loop';
export const isPlaylistPad = (p: Pad): p is PlaylistPad => p.type === 'playlist';
export const isComboPad    = (p: Pad): p is ComboPad    => p.type === 'combo';
```

Eine Backward-Compat-Migration läuft in `boardGetAll()` / `boardGet()` in
`idb.ts`, um alte Slice-3-Pads zu konvertieren:
- `playlist`-Pads ohne `files`: `files = [libraryItemRef ?? ''].filter(Boolean)`
- `combo`-Pads ohne `steps`: `steps = []`

## Consequences

**Positiv:**
- TypeScript verhindert `pad.files`-Zugriff auf einem `SinglePad` zur Compile-Zeit.
- Audio-Engine-Dispatch ist eindeutig: `switch (pad.type)` narrowed vollständig.
- Slice-4-Code ist selbst-dokumentierend — jeder Playback-Pfad erhält einen
  typisierten Variant.

**Negativ / Trade-offs:**
- Slice-3-Code, der `{ ...pad, type: newType }` gespreizt hat (z.B. `applyTypeChange`
  in padUtils.ts), muss umgeschrieben werden, um explizite Union-Varianten zu konstruieren.
- `applyTypeChange()` ist ausführlicher.
- IDB-Deserialisierung braucht einen Runtime-Migrations-Schritt für Legacy-Daten.

## Alternatives Considered

**Flacher Typ mit optionalen Feldern (Status Quo):** TypeScript fängt
Cross-Variant-Feldzugriffe nicht ab. Abgelehnt: Die Engine braucht Garantien.

**Flacher Typ + nur Runtime-Guards:** Gleicher Typ, aber Guards die Feld-Existenz
prüfen. Abgelehnt: TypeScript-Fehler an Call-Sites wo `Pad` an Funktionen übergeben
wird, die `SinglePad` erwarten.

**`PadType`-Union ohne Basis-Interface:** Alle Felder auf allen Varianten.
Abgelehnt: Zu viel redundanter Code; verschleiert welche Felder relevant sind.

## Related

- **Dateien:** `v3/src/types.ts`, `v3/src/lib/padUtils.ts`, `v3/src/db/idb.ts`,
  `v3/src/components/PadCreationPopover.tsx`, `v3/src/components/PadEditorPanel.tsx`,
  `v3/src/screens/BoardScreen.tsx`
- **ADRs:** ADR-0008 (Pad-Position-Struct), ADR-0010 (Board JSON Document)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.1`, Slice-4-Planentscheidung 2026-05-28
