# ADR-0037: Husky Pre-Commit-Hook: Build + Unit + Smoke E2E

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure

**Category:** Test-Infrastruktur & Workflow

## Context

Manuelles Ausführen von Build + Tests vor jedem Commit erfordert Disziplin.
In der Praxis wird ein Schritt vergessen — besonders in schnellen Fix-Sessions.
Das `CLAUDE.md §Pre-commit checklist` war ursprünglich ein manueller Prozess.

Nach Phase 2 ist der Pre-Commit-Hook automatisiert via Husky.

## Decision

Husky-Pre-Commit-Hook (`v3/.husky/pre-commit`) führt sechs Gates sequenziell aus:

1. `npm run sync:docs` + `git add` (~1s) — Auto-generierte Docs (ADR-Index, Klassen, Tokens)
2. `npm run build` (tsc + vite, ~4s)
3. `npx lint-staged` (~1s) — Prettier + ESLint auf gestageten Dateien; auto-fix + re-stage
4. `npm run test` (vitest, ~1s)
5. `npm run test:e2e:smoke` (Chromium + WebKit, ~6s)
6. `npm run link:check` (~1s) — markdown-link-check auf alle .md-Dateien

**Gesamt: ~15s.** Schlägt ein Gate fehl → Commit wird abgebrochen.

**Aktivierung:** `cd v3 && npm install` aktiviert den Hook automatisch
(via Husky's `prepare`-Script in `package.json`).

## Consequences

**Positiv:**
- Eliminiert eine Fehlerklasse: "Broke in CI but worked locally" — weil
  lokal nie getestet wurde.
- Zwingt zu kurzen Feedback-Schleifen: 11s ist schnell genug um nie
  übersprungen zu werden.
- Smoke-Tests decken Chromium + WebKit ab — frühe Warnung bei Safari-Inkompatibilitäten.

**Negativ / Trade-offs:**
- 11s Overhead pro Commit. Bei häufigen WIP-Commits kann das nervig sein.
  Workaround: `git commit --no-verify` für echte WIP-Commits (nicht empfohlen).
- Erfordert Node.js und alle Dependencies im `v3/`-Verzeichnis.
  Nach `git clone`: `cd v3 && npm install` ist Pflicht.

## Alternatives Considered

**Nur Build im Pre-Commit:** Schneller (~4s). Aber Unit-Test- und Smoke-E2E-
Fehler werden erst in CI entdeckt — zu spätes Feedback.

**CI-only Gates:** Kein lokaler Hook. Warten auf CI (Minutes statt Seconds)
verlangsamt den Development-Rhythmus.

## Related

- **Dateien:** `v3/.husky/pre-commit`, `v3/package.json` (prepare script)
- **ADRs:** ADR-0033 (Test-Strategie), ADR-0040 (CI-Deploy gated auf Tests)
- **Quelldokumente:** `CLAUDE.md §Pre-commit checklist`, `docs/development/testing.md §Pre-Commit-Hook`
- **Commits:** `4296648` — chore: add husky pre-commit hook; `9839fdb` — chore: extend pre-commit hook with smoke e2e tests
