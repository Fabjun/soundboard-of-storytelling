# ADR-0029: SWAP + INSERT als duale DnD-Semantik

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Interaktion

## Context

Pad-zu-Pad-Drag im Grid (SETUP-Modus) braucht eine definierte Semantik:
Was passiert, wenn Pad A auf Slot B gezogen wird?

Optionen:
1. **SWAP:** A nimmt die Position von B, B nimmt die Position von A
2. **MOVE:** A nimmt die Position von B, B und alle anderen Pads bleiben wo sie sind
   (aber B's Slot ist jetzt leer — außer B wird verschoben)
3. **INSERT:** A nimmt die Position zwischen anderen Pads ein (wie in einer Liste),
   andere Pads schieben sich weg

Eine App mit einem fixen Grid (4×4) braucht eine andere Semantik als eine
lineare Liste. SWAP ist für Grid intuitiver; INSERT ist für Reorder-Operationen
sinnvoll (z.B. wenn man Pad #1 zwischen Pad #3 und #4 schiebt).

## Decision

**Beide Semantiken werden unterstützt**, gesteuert durch die Drop-Zone-Position:

- **SWAP:** Drop direkt auf einem belegten Slot → Positionen tauschen
- **INSERT:** Drop auf einer Drop-Zone zwischen Slots → Pads schieben sich weg

Die Erkennung läuft über eine `cellRef`-Registry in `padDnd.ts`:
jedes Grid-Cell registriert sich mit seinem `{col, row}`. Beim `pointerup`
wird per `document.elementFromPoint` der Drop-Target bestimmt und gegen
die Registry gecheckt.

## Consequences

**Positiv:**
- Beide häufigen Reorder-Operationen sind natürlich unterstützt.
- Klare visuelle Feedback: SWAP zeigt einen direkten Position-Tausch,
  INSERT zeigt eine "Einfüge-Lücke".

**Negativ / Trade-offs:**
- Komplexere Implementierung als nur SWAP. `padDnd.ts` ist das aufwändigste
  einzelne Modul in Slice 3.
- Playwright-Tests für diese Interaktion sind als `test.skip` markiert
  (Tests 20, 21) — Pointer-Events-Drag in Playwright ist aufwändig zu
  stabilisieren.

## Alternatives Considered

**Nur SWAP:** Einfacher. Nachteil: Reordering in größeren Grids erfordert
mehrere aufeinanderfolgende SWAPs.

**Nur INSERT:** Natürlich für lineare Listen; für 2D-Grids intuitiv schwieriger.

## Related

- **Dateien:** `v3/src/lib/padDnd.ts` (SWAP + INSERT Implementierung), `v3/tests/unit/padDnd.test.ts` (applySwap, applyInsert pure function tests)
- **ADRs:** ADR-0007 (Pointer Events für DnD), ADR-0008 (Pad-Position als {col,row})
- **Quelldokumente:** `docs/design/design-notes.md §Slice 3 / Lessons — DnD pattern`, `docs/development/testing.md §Bekannte Fallstricke §5`
- **Commits:** `9eeceeb` — feat(slice-3)
