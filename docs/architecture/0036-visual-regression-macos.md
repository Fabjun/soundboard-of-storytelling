# ADR-0036: Visual Regression Tests lokal-only (macOS-Baselines)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure

**Category:** Test-Infrastruktur & Workflow

## Context

Visual Regression Tests (Screenshot-Vergleiche) wurden in Phase 2 eingeführt.
Das Problem: macOS und Linux (Ubuntu CI) rendern Fonts unterschiedlich.
Gleicher HTML/CSS-Code → pixelweise unterschiedliche Screenshots.

Wenn Baselines auf macOS generiert werden und CI auf Ubuntu läuft, schlagen
Visual-Tests in CI immer fehl — selbst wenn keine visuelle Regression vorliegt.

## Decision

Visual Regression Tests laufen **nur lokal auf macOS**. CI (GitHub Actions,
Ubuntu) schließt Visual-Tests aus.

Baselines werden auf macOS generiert mit Dateinamen-Suffix `-darwin.png`:

```
tests/e2e/visual/__snapshots__/
  visual-startscreen-1-chromium-darwin.png
  visual-boardscreen-setup-1-chromium-darwin.png
  ...
```

Diese Dateien werden committed und gehören zum Repo.

**Workflow:**
- Vor UI-relevanten Commits: `npm run test:e2e:visual` lokal ausführen
- Bei absichtlichen UI-Änderungen: `npm run test:e2e:update-snapshots` + neue Baselines committen

## Consequences

**Positiv:**
- Visual Regression Schutz für macOS-Entwickler ohne CI-Flakiness.
- Baselines sind committet — historisch nachvollziehbar.

**Negativ / Trade-offs:**
- Visual Regression funktioniert nicht auf Linux/Windows.
  Andere Entwickler auf anderen Plattformen haben keinen Visual-Regression-Schutz.
  Für ein Single-Developer-Projekt kein Problem.
- CI gibt keine Visual-Regression-Warnung. Nur manuelle Ausführung vor
  UI-Commits liefert Schutz.

## Alternatives Considered

**Separate Ubuntu-Baselines:** Doppelter Satz von Baselines (darwin + ubuntu).
Erheblicher Verwaltungsaufwand.

**Pixelmatch-Threshold erhöhen:** Akzeptiert mehr Pixel-Unterschiede. Macht
die Tests unzuverlässig — würden echte Regressionen übersehen.

**Percy / Chromatic:** Cloudbasierte Visual Regression Services. Externe
Dependency, Kosten. Für ein privates Projekt nicht gerechtfertigt.

## Related

- **Dateien:** `v3/tests/e2e/visual/`, `v3/playwright.config.ts` (visual project config)
- **ADRs:** ADR-0033 (Test-Strategie), ADR-0035 (Playwright)
- **Quelldokumente:** `docs/development/testing.md §Visual Regression (lokal-only)`, `CLAUDE.md §Deviations from plan`
- **Commits:** `37bfada` — test: add visual regression tests with screenshot baseline
