# ADR-0033: Vier-Schichten-Test-Strategie (Unit / E2E Smoke / E2E Full / Visual)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure

**Category:** Test infrastructure & workflow

## Context

Testing-Infrastruktur wurde in Phase 1 (Slice 3.5) nach Abschluss von Slice 3
eingeführt. Zu diesem Zeitpunkt existierten 3 Feature-Slices mit substantiellem
Code. Die Frage: Welche Test-Typen, welche Tools, welche Abdeckungsziele?

`docs/architecture/concept-brief.md §6` hatte Tests ursprünglich als "deferred" markiert. Nach
Slice 3 wurde klar, dass ohne automatisierte Tests das weitere Slice-Development
riskant würde (Regressionen nicht erkennbar).

## Decision

**Vier Test-Schichten:**

| Schicht | Tool | Zweck | Laufzeit | CI |
|---------|------|-------|----------|----|
| Unit | Vitest | Logik-Korrektheit (pure functions, signals, IDB) | ~1s | ✓ |
| E2E Smoke | Playwright Chromium+WebKit | Kritische Pfade | ~6s | ✓ |
| E2E Full | Playwright Chromium | Vollständige Verifikation (Slices 3–4): Board/Scene/Pad CRUD, Audio-Engine | ~90s | ✓ |
| Visual Regression | Playwright Screenshots | Pixel-Vergleich | ~30s | ✗ (lokal only) |

**Gate-Reihenfolge:** Unit → E2E Smoke → E2E Full (CI); Pre-Commit: sync:docs → Build → lint-staged → Unit → E2E Smoke → link:check (ADR-0037); Pre-Push: Version-Bump + Size → E2E All (ADR-0037).

**Bundle-Size-Monitoring:** `@size-limit/file` misst gzip-Größen nach Build.
Limits: JS 200 KB, CSS 50 KB. In CI integriert. Hinweis: `@size-limit/preset-app`
wurde verworfen, weil es Chrome für Timing-Messungen via `estimo` verwendet
und auf ARM-Mac (M-Chip) wegen Chromium-Binary-Inkompatibilität crashed.
`@size-limit/file` misst gzip-Größe ohne Chrome-Dependency — ausreichend.

## Consequences

**Positiv:**
- Unit-Tests decken Logik-Korrektheit ab (pure functions in `src/lib/`, Signals in `src/state/`).
- Smoke-Tests laufen in ~6s und decken die fünf kritischsten Pfade ab.
- Visual Regression verhindert unbeabsichtigte UI-Änderungen (lokal vor
  UI-relevanten Commits).

**Negativ / Trade-offs:**
- E2E Full mit ~90s ist zu lang für Pre-Commit (läuft nur in CI).
- Visual Regression schlägt auf Ubuntu-CI fehl (Font-Rendering-Unterschied,
  ADR-0036) — wird aus CI ausgeschlossen.

## Alternatives Considered

**Nur Unit-Tests:** Schnell, aber deckt keine Browser-Kompatibilität, keine
Routing-Logik, keine IDB-Round-trips ab. Reicht nicht für eine App mit komplexem
UI-State.

**Nur E2E:** Langsam, schwer zu debuggen. Unit-Tests für pure functions sind
die schnellste Feedback-Schleife.

## Related

- **Dateien:** `v3/vitest.config.ts`, `v3/playwright.config.ts`, `v3/.size-limit.json`, `docs/development/testing.md`
- **ADRs:** ADR-0034 (Vitest), ADR-0035 (Playwright), ADR-0036 (Visual Regression macOS), ADR-0037 (Husky Pre-Commit)
- **Quelldokumente:** `docs/development/testing.md §Überblick`
- **Commits:** `47ff8b0` — chore: add vitest setup; `4e1152f` — chore: add playwright e2e setup
