# ADR-0005: vite-plugin-pwa für Service Worker

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 1

**Category:** Tech stack

## Context

V3 ist eine PWA: sie braucht einen Service Worker für Offline-Fähigkeit und
einen Web App Manifest für "Add to Home Screen" auf iOS/Android. V1 hatte einen
manuellen `sw.js` — ein nachgewiesener Fehlervektor.

V1-Erfahrung (aus `v1-reference/CLAUDE.md`): Der manuelle `sw.js` erforderte
disziplinierte Pflege:
1. **SHELL-Liste:** Jede neue Datei musste manuell in die Cache-Liste aufgenommen
   werden. Vergessen → Cache-Fehler nach Update.
2. **VERSION-Bump:** Bei jeder Änderung musste die Version hochgezählt werden.
   Vergessen → Browser nutzt veralteten Cache, Update wird nicht ausgerollt.

Das `docs/architecture/concept-brief.md §4.9` legt `vite-plugin-pwa` explizit fest mit der
Begründung: "V1's manual sw.js worked but required discipline. The plugin
removes that failure mode."

## Decision

`vite-plugin-pwa` generiert den Service Worker automatisch aus dem Vite-Build.
Die SHELL-Liste (precache manifest) wird auto-generiert aus dem Build-Output.
Die Version wird auto-gebumpt. Konfiguration in `v3/vite.config.ts`.

Strategie: `generateSW` (Standard-Modus). Konfiguriert für:
- Cache-first für App Shell
- Auto-update via `skipWaiting + clientsClaim`

## Consequences

**Positiv:**
- Kein manuelles SHELL-List-Management. Neue Dateien im Build werden automatisch
  erfasst.
- Kein manuelles VERSION-Bumping. Build-Hash im Output sorgt für Cache-Invalidierung.
- PWA-Validierung in `npm run build` — precache-Entries werden ausgegeben
  (Anzahl variiert je nach Build-Output; wird bei jedem Build auf der Konsole ausgegeben).

**Negativ / Trade-offs:**
- Weniger Kontrolle über den Service Worker im Vergleich zu manuellem Code.
  Für V3 kein Problem — es gibt keine dynamischen Requests, die spezielle
  Cache-Strategien bräuchten.
- Der generierte Service Worker kann nicht direkt bearbeitet werden.
  Für Custom-Logik muss `injectManifest`-Modus verwendet werden (nicht nötig bisher).

## Alternatives Considered

**Manueller `sw.js` wie V1:** Funktioniert, aber erfordert Disziplin.
Die V1-Erfahrung zeigt, dass diese Disziplin in der Praxis oft bricht.
Der Plugin-Ansatz eliminiert die Fehlerklasse strukturell.

**Workbox direkt:** `vite-plugin-pwa` wrapped Workbox — derselbe Unterbau,
aber mit Vite-Integration. Direktes Workbox-Setup würde mehr Konfiguration
erfordern ohne Mehrwert.

## Related

- **Dateien:** `v3/vite.config.ts` (Plugin-Konfiguration inkl. Web-App-Manifest — kein separates manifest.json)
- **ADRs:** ADR-0003 (Vite), ADR-0006 (iOS-Targets beeinflussen PWA-Anforderungen)
- **Quelldokumente:** `docs/architecture/concept-brief.md §4.9`
- **Commits:** `8be64d4` — Slice 1 scaffold (Plugin eingerichtet)
