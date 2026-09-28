# ADR-0035: Playwright für E2E-Tests

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure

**Category:** Test-Infrastruktur & Workflow

## Context

E2E-Tests müssen die App in einem echten Browser (nicht jsdom) testen:
Routing, IDB-Persistenz, Preact-Signal-Updates im DOM, CSS-Layout. Der
Primärtarget ist iOS/Safari (ADR-0006) — daher ist WebKit-Test-Coverage
besonders wertvoll.

> *Playwright wurde ohne detaillierte Evaluation gewählt — es ist der Standard
> für moderne Web-E2E-Tests mit Multi-Browser-Support.*

## Decision

Playwright mit sechs Projekten: `smoke` (Chromium), `smoke-webkit` (WebKit), `full` (Chromium), `mobile` (iPhone 13 Pro, WebKit), `mobile-chromium` (iPhone 13 Pro, Chromium), `visual` (Chromium, macOS-only). Konfiguration in `v3/playwright.config.ts`.

`webServer`-Konfiguration: Playwright startet den Vite-Dev-Server automatisch
vor dem Test-Run. Tests laufen gegen `http://localhost:5173/soundboard-of-storytelling/`.

**Selector-Priorität** (aus TESTING.md):
`getByTestId` > `getByRole` > `.filter({ hasText })` > CSS-Klasse

**Basis-URL:** Tests beginnen mit `page.goto('/soundboard-of-storytelling/')` und
sind self-contained (jeder Test startet mit leerer IDB via frischem Browser-Context).

## Consequences

**Positiv:**
- WebKit-Tests (Smoke) geben frühe Warnung bei Safari/iOS-Inkompatibilitäten.
- Dev-Server-Start automatisch: kein manuelles `npm run dev` vor Tests nötig.
- Browser-Context-Isolation: jeder Test hat eigene IDB.

**Negativ / Trade-offs:**
- Pointer-Events-Drag in Playwright ist aufwändig zu stabilisieren. Tests 9, 14,
  20, 21 sind als `test.skip` markiert — zu aktivieren in Phase 3 (nach
  Drag-Sequenz-Stabilisierung).
- E2E Full (~90s) ist zu langsam für Pre-Commit-Hook (läuft nur in CI).

## Alternatives Considered

**Cypress:** Bewährt, gutes UI. Kein nativer WebKit-Support (Playwright hat
webkit via Playwright WebKit). Für diese Anforderung klar Playwright.

**Testing Library + jsdom:** Unit-Tests mit DOM-Simulation. Kein echter Browser,
kein IDB, kein CSS-Layout. Nicht ausreichend für Integration-Tests.

## Related

- **Dateien:** `v3/playwright.config.ts`, `v3/tests/e2e/`, `v3/tests/e2e/helpers.ts`
- **ADRs:** ADR-0033 (Test-Strategie), ADR-0036 (Visual Regression macOS), ADR-0038 (data-testid Konvention)
- **Quelldokumente:** `TESTING.md §Werkzeuge`, `TESTING.md §Neue E2E-Tests schreiben`
- **Commits:** `4e1152f` — chore: add playwright e2e setup with smoke tests
