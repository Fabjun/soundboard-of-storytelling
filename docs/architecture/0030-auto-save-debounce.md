# ADR-0030: Auto-Save mit 500 ms Debounce — kein expliziter Save-Button

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 3

**Category:** Interaction

## Context

PWA-Apps ohne Backend haben keinen "Server speichert beim Schließen"-Pfad.
Wenn der User das Tab schließt ohne gespeichert zu haben, gehen Änderungen verloren.

Optionen: Expliziter Save-Button (wie in Desktop-Software), Auto-Save bei jeder
Änderung, oder debounced Auto-Save.

V1 hatte explizites Speichern in manchen Bereichen — das führte zu Datenverlust
wenn User vergaßen zu speichern. V3 soll das vermeiden.

> *Diese Entscheidung war nicht explizit als Regel dokumentiert; sie wurde aus
> dem konsistenten Code-Muster (jede Mutation ruft boardPut mit Debounce auf)
> abgeleitet und ist als Deviation in CLAUDE.md implizit dokumentiert
> ("Auto-Save mit 500ms Debounce, kein expliziter Save-Button").*

## Decision

Jede Board/Scene/Pad-Mutation triggert einen **500 ms debounced Write** in IDB
via `boardPut(board)`. Es gibt keinen expliziten "Save"-Button im SETUP-Modus.

**Technisches Muster:**
1. User-Aktion ändert den Board-State in Signals
2. `useEffect`/`useSignalEffect` oder Event-Handler ruft `boardPut(board)` auf
3. Debounce: wenn innerhalb von 500 ms weitere Änderungen kommen, wird nur
   der letzte Write ausgeführt

## Consequences

**Positiv:**
- Kein Datenverlust durch vergessenes Speichern.
- Einfachere UX: kein "Unsaved changes"-Dialog beim Tab-Schließen.
- Kompatibel mit PWA offline-first: Daten sind immer in IDB aktuell.

**Negativ / Trade-offs:**
- Write-Amplification zusammen mit ADR-0010 (Board als Dokument): jede
  Pad-Bewegung schreibt das komplette ~50 KB-Dokument. Debounce begrenzt
  die Frequenz (max. 2 Writes/s bei kontinuierlicher Aktivität).
- Kein Undo bei unbeabsichtigten Änderungen — es sei denn die App
  implementiert explizites Undo. Slice 3 hat Undo für Scene-Delete als
  spezifischen Fall (UndoToast-Komponente).

## Alternatives Considered

**Expliziter Save-Button:** Bekannte UX für Desktop-Software. Für eine mobile
PWA an einem Spieltisch unpassend: User ist mental beschäftigt, wird Speichern
vergessen.

**Kein Debounce (sofort bei jeder Änderung):** Maximale Datensicherheit.
Bei schnellen DnD-Moves wären das 10+ Writes in 500 ms. Messbar schlechtere
Performance.

## Related

- **Dateien:** `v3/src/db/idb.ts` (boardPut), `v3/src/screens/BoardScreen.tsx`
- **ADRs:** ADR-0010 (Board als JSON-Dokument — Write-Amplification), ADR-0014 (IDB Persistenz)
- **Quelldokumente:** `CLAUDE.md §Deviations from plan`
