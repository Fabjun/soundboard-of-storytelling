# ADR-0031: 2-Tap-Delete als Standard-Confirm-Pattern

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Interaction

## Context

Delete-Operationen (Pad löschen, Library-Eintrag löschen, Scene löschen,
Board löschen) sind destruktiv und schwer rückgängig zu machen (Auto-Save
schreibt sofort, ADR-0030). Ein versehentliches Tap auf einem iPhone mit
kleinen Targets führt ohne Bestätigung zu Datenverlust.

Standard-Alternativen: Modal/Dialog ("Are you sure?"), Undo-Toast, oder
2-Tap-Confirm direkt am Delete-Button.

`CLAUDE.md §Permanent coding standards` und `CLAUDE.md §UI rules` legen explizit
fest: "Every delete button: 2-tap confirmation."

## Decision

Jeder Delete-Button verwendet **2-Tap-Confirm**: Erstes Tap zeigt den Confirm-State
des Buttons (visuell hervorgehoben, Label "CONFIRM" oder mit `is-danger`-State),
zweites Tap führt die Operation aus. Kein Modal, kein separater Dialog.

Der Confirm-State setzt sich automatisch zurück nach ~3 Sekunden ohne zweiten
Tap (oder bei Tap außerhalb des Buttons).

## Consequences

**Positiv:**
- Kein versehentliches Löschen durch einen Einzeltap.
- Kein Modal-Interrupt (unterbricht den Flow weniger als ein Dialog).
- Funktioniert ohne separate Overlay-Komponente.
- Mindest-Touch-Target 44 px (iOS guideline, CLAUDE.md §UI rules) wird
  eingehalten — auch im Confirm-State.

**Negativ / Trade-offs:**
- Zwei Taps statt einer für jede Delete-Operation. Leicht erhöhter Aufwand
  für Power-User.
- Stateful: der Confirm-State muss in der Komponente gehalten werden
  (`useState` oder ähnlich). Kein globaler State nötig.

## Alternatives Considered

**Modal/Dialog:** Standard in Desktop-Apps. Auf Mobile mit kleinem Screen
ist ein Modal mehr visueller Interrupt als nötig.

**Undo-Toast:** Sofort löschen, dann 5s Undo-Möglichkeit zeigen. Eleganter
UX, aber technisch aufwändiger (IDB-Rollback). Slice 3 nutzt Undo-Toast
spezifisch für Scene-Delete (wo Datenverlust besonders groß sein kann).
Als Standard-Pattern nicht gewählt.

## Related

- **Dateien:** `v3/src/components/AudioRow.tsx` (2-tap delete für Library), `v3/src/components/SceneRail.tsx`, `v3/src/screens/BoardListScreen.tsx`
- **ADRs:** ADR-0030 (Auto-Save macht Undo ohne explizites Pattern schwierig)
- **Quelldokumente:** `CLAUDE.md §Permanent coding standards`, `CLAUDE.md §UI rules`
