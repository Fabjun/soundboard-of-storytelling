# ADR-0040: GitHub Pages Deployment gated auf CI (`workflow_run`)

**Status:** Accepted — refined by ADR-0049 (deploy the tested artifact, push-only guard)
**Date:** 2026-05-27
**Slice:** infrastructure

**Category:** Test infrastructure & workflow

## Context

V3 wird auf GitHub Pages deployed. Das Deployment soll nur stattfinden, wenn
alle Tests grün sind — sonst wird ein kaputtes Build auf der Live-URL deployed.

Das technische Problem: GitHub Actions hat `needs` für intra-Workflow-Sequenzierung
und `workflow_run` für cross-Workflow-Sequenzierung. `needs` funktioniert nur
wenn beide Jobs in derselben Workflow-Datei sind.

`deploy-pages.yml` und `tests.yml` sind separate Workflow-Dateien (saubere
Trennung von Concerns). Das erfordert `workflow_run`.

## Decision

`deploy-pages.yml` triggert via `workflow_run`:

```yaml
on:
  workflow_run:
    workflows: ["Tests"]
    types: [completed]
    branches: [main]
  workflow_dispatch:  # manuelle Auslösung erlaubt
```

Zusätzlicher Guard im Job: `if: github.event.workflow_run.conclusion == 'success'`.

Nur bei Erfolg von `tests.yml` auf `main` wird deployed.

`workflow_dispatch` ermöglicht manuelles Re-Deploy (z.B. nach Branch-Push
ohne Code-Änderung).

## Consequences

**Positiv:**
- Broken-Build-Deployment ist strukturell ausgeschlossen (nicht nur durch Konvention).
- Klare Trennung: `tests.yml` für CI-Quality-Gates, `deploy-pages.yml` für Deployment.

**Negativ / Trade-offs:**
- ~~`workflow_run` hat eine Besonderheit: es triggert nicht auf Pull Requests
  von Forks (Security-Einschränkung von GitHub). Für ein Single-Developer-
  Projekt kein Problem.~~ **Korrektur 2026-09-29: falsch.** `workflow_run` feuert auch
  nach `pull_request`-Läufen, und ein Fork kann seinen Branch `main` nennen. Seit
  ADR-0049 prüft der Deploy Ereignis (`push`) und Herkunfts-Repo.
- Deployment-Latenz: `workflow_run` startet nach Abschluss von `tests.yml`
  (nicht parallel). Gesamtlatenz: Tests (~3 min) + Deploy (~1 min).

## Alternatives Considered

**Beide Workflows in einer Datei:** Würde `needs` ermöglichen. Nachteil:
weniger klare Separation of Concerns (Test-Definition und Deploy-Definition
vermischt).

**Direktes Push-Trigger für Deploy ohne Test-Gate:** Einfacher, aber riskiert
Broken-Build-Deployments.

## Related

- **Dateien:** `.github/workflows/tests.yml`, `.github/workflows/deploy-pages.yml`
- **ADRs:** ADR-0033 (Test-Strategie), ADR-0037 (Husky Pre-Commit)
- **Quelldokumente:** `docs/development/testing.md §CI-Integration`, `CLAUDE.md §Deviations from plan`
- **Commits:** `0fcb4e9` — ci: add github actions test workflow; `9de5c19` — chore: add github pages deployment workflow
