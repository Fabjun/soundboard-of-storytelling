# ADR-0038: `data-testid`-Konvention für E2E-Selektoren

**Status:** Superseded by ADR-0054
**Date:** 2026-05-27
**Slice:** infrastructure

**Category:** Test-Infrastruktur & Workflow

## Context

E2E-Tests brauchen stabile Selektoren für DOM-Elemente. Alternativen:
- CSS-Klassen (`sb-btn`, `.sb-scene-tab`)
- Texte (`getByText('Delete')`)
- Roles (`getByRole('button', { name: 'Delete' })`)
- `data-testid`-Attribute

CSS-Klassen brechen bei Refactoring oder wenn Design-System-Klassen umbenannt
werden (geplant für Slice 8). Text-Selektoren sind sprachabhängig und brechen
bei Copy-Änderungen. Role-Selektoren sind semantic, aber nicht eindeutig bei
mehreren gleichartigen Elementen.

## Decision

E2E-Tests verwenden primär `data-testid`-Attribute:

```typescript
await page.getByTestId('new-board-button');
await page.getByTestId(`board-row-${board.id}`);
await page.getByTestId(`scene-tab-${scene.id}`);
```

**Naming-Konvention:**
```
data-testid="<component>-<element>"           // eindeutig
data-testid="<component>-<element>-<id>"      // Instanz in einer Liste
```

**Beispiele:**
```
new-board-button
board-row-{board.id}
scene-tab-{scene.id}
scene-delete-{scene.id}
mode-toggle
mode-toggle-setup
pad-cell-empty-{col}-{row}
```

**Selector-Priorität in Playwright:**
`getByTestId` > `getByRole` > `.filter({ hasText })` > CSS-Klasse

Nur test-kritische Elemente bekommen `data-testid` (kein vollständiges DOM-Coverage).

## Consequences

**Positiv:**
- Refactoring-stabil: CSS-Umbenennungen, Design-System-Updates brechen keine Tests.
- Eindeutig: Instanz-IDs verhindern "strict mode violation" bei mehrfach vorkommenden Elementen.
- Dokumentierend: `data-testid` macht testbare Elemente im Markup erkennbar.

**Negativ / Trade-offs:**
- Markup-Pollution: `data-testid`-Attribute sind im Production-HTML sichtbar.
  Kein semantischer Wert für User, aber kein funktionaler Schaden.
- Wartungsaufwand: Wenn `data-testid` hinzugefügt werden muss, ist das ein
  Extra-Schritt beim Entwickeln.

## Alternatives Considered

**CSS-Klassen als Selektoren:** Brechen bei Slice-8-Refactoring. Nicht geeignet.

**Aria-Labels als Selektoren:** Semantic, aber erfordert vollständiges
Accessibility-Markup. V3 hat nur baseline A11y; Aria-Labels
sind nicht für jeden Button vorhanden.

## Related

- **Dateien:** `v3/src/components/*.tsx` (data-testid Attribute), `v3/tests/e2e/helpers.ts`, `v3/tests/e2e/*.spec.ts`
- **ADRs:** ADR-0033 (Test-Strategie), ADR-0035 (Playwright)
- **Quelldokumente:** `docs/development/testing.md §Test-Selector-Konvention`
- **Commits:** `cb633ab` — refactor: add data-testid attributes for test stability
