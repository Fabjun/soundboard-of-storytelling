# ADR-0001: Preact statt React

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Tech stack

## Context

V3 ist eine PWA, die auf dem iPhone 13 Pro (Brave Browser) läuft. Bundle-Größe
ist ein messbarer Faktor: jedes KB, das über das Netzwerk geladen werden muss,
verlängert den First-Load. React (~45 KB gzip) und Preact (~3 KB gzip) bieten
dieselbe JSX-Kompatibilität.

Das Design-System (`design-sources/2026-05-25/`) lieferte JSX-Komponenten als
Ausgangsmaterial. Eine JSX-basierte Lösung war daher gesetzt; die Frage war nur,
welche Laufzeit verwendet wird.

Quelldokument: `docs/architecture/concept-brief.md §1` — "Preact (not React) — smaller bundle,
same JSX".

## Decision

Preact wird als UI-Laufzeit verwendet. React ist nicht installiert; alle Imports
verwenden `preact` und `@preact/signals`. Die JSX-Transform in `vite.config.ts`
zeigt auf `preact/jsx-runtime`.

## Consequences

**Positiv:**
- Bundle bleibt klein: JS aktuell ~100 KB gzip (inkl. App-Code), Preact-Anteil ~3 KB.
- Preact Signals sind eine First-Party-Ergänzung: kein Impedanz-Mismatch mit dem
  State-Management (ADR-0002).
- JSX-Kompatibilität: das Design-System-JSX musste für Slice 1 nicht umgeschrieben
  werden.

**Negativ / Trade-offs:**
- Preact's Ecosystem ist kleiner als React. Einige React-Bibliotheken sind nicht
  direkt kompatibel (React-only hooks, React-Testing-Library). In der Praxis
  bisher kein Blocker.
- Vitest + Playwright testen den Code direkt, ohne jsdom/React-Testing-Library —
  das war ohnehin der Ansatz (ADR-0033).

## Alternatives Considered

**React 18:** Wäre direkt mit React-Ecosystem kompatibel, aber ~42 KB größer im
Bundle. Für eine PWA mit iPhone als Primärtarget nicht gerechtfertigt.

**Vanilla JS / Lit:** Würde das Design-System-JSX nicht direkt verwenden können.
Mehr Portierungsaufwand ohne Mehrwert.

**Solid.js:** Signals-basiert wie Preact, ähnliche Bundle-Größe. Kein
JSX-Kompatibilitäts-Vorteil gegenüber dem Design-System; Ökosystem noch kleiner.

## Related

- **Dateien:** `v3/package.json` (preact, @preact/signals Dependency), `v3/vite.config.ts` (JSX-Transform)
- **ADRs:** ADR-0002 (Preact Signals), ADR-0003 (Vite)
- **Quelldokumente:** `docs/architecture/concept-brief.md §1`
- **Commits:** `8be64d4` — Slice 1: Vite + Preact scaffold
