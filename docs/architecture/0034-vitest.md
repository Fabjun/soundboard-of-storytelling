# ADR-0034: Vitest für Unit-Tests

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** infrastructure

**Category:** Test-Infrastruktur & Workflow

## Context

Unit-Tests in einem Vite/Preact/TypeScript-Projekt brauchen einen Test-Runner.
Die natürliche Wahl im Vite-Ecosystem ist Vitest — es nutzt dieselbe
Vite-Konfiguration und ist damit setup-frei.

> *Vitest wurde ohne explizite Evaluation von Alternativen gewählt.
> Es ist der de-facto Standard für Vite-Projekte und bedurfte keiner
> separaten Abwägung.*

## Decision

Vitest (`vitest`) als Unit-Test-Runner. Konfiguration in `v3/vitest.config.ts`.

**Besonderheit:** IndexedDB ist nicht in jsdom implementiert. Lösung: `fake-indexeddb`
als In-Memory-IDB-Implementierung. Setup via `v3/tests/unit/setup.ts`:

```typescript
import 'fake-indexeddb/auto';
```

Dieses Setup gilt für alle Unit-Tests. Jeder Test der IDB nutzt, muss `_resetDB()`
und `new IDBFactory()` in `beforeEach` aufrufen (dokumentiert in `docs/development/testing.md
§Bekannte Fallstricke §2`).

**Signals-Reset-Pflicht:** Preact Signals sind Modul-Singletons. Unit-Tests die
Signals testen, müssen in `beforeEach` alle berührten Signals resetten.

## Consequences

**Positiv:**
- ~1s Laufzeit für 102 Unit-Tests (Stand v3.0.18). Schnellste Feedback-Schleife.
- Keine separate Webpack/Babel-Konfiguration — Vitest nutzt Vite nativ.
- `fake-indexeddb` ermöglicht echte IDB-API-Tests ohne Browser.

**Negativ / Trade-offs:**
- `fake-indexeddb` ist eine Simulation — es kann Edge-Cases geben, wo es sich
  anders verhält als echter Browser-IDB. Für die getesteten Patterns (get/put/delete/cursor)
  ist es ausreichend zuverlässig.
- Signals als Modul-Singletons: jeder Test, der Signals berührt, braucht explizite
  Resets. Vergessene Resets führen zu Flakiness zwischen Tests.

## Alternatives Considered

**Jest:** Weit verbreitet, gutes Ecosystem. Braucht extra Konfiguration für
Vite/TypeScript/ES Modules. Kein Vorteil gegenüber Vitest in einem Vite-Projekt.

**node:test (built-in):** Zu minimal für Signal-Testing, keine jsdom-Integration.

## Related

- **Dateien:** `v3/vitest.config.ts`, `v3/tests/unit/setup.ts`, `v3/tests/unit/*.test.ts`
- **ADRs:** ADR-0033 (Test-Strategie) — fake-indexeddb-Isolation ist in §Decision dieses ADRs dokumentiert; kein separates ADR
- **Quelldokumente:** `docs/development/testing.md §Werkzeuge`, `docs/development/testing.md §Neue Unit-Tests schreiben`
- **Commits:** `47ff8b0` — chore: add vitest setup and first unit tests
