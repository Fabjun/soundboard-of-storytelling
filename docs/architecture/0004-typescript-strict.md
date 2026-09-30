# ADR-0004: TypeScript strict mode

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Tech stack

## Context

Der Projekt-Grundsatz (CLAUDE.md §Permanent coding standards) ist:
"TypeScript strict mode. No `any`." Das ist eine Engineering-Disziplin-Entscheidung:
implizite Annahmen im Typsystem sind eine Hauptursache für Bugs — besonders bei
einer App mit komplexem Datenmodell (Boards, Scenes, Pads, Library, Audio-State)
und wenig manuell verifizierbaren Edge-Cases.

## Decision

`tsconfig.app.json` hat `"strict": true` gesetzt sowie `"noUnusedLocals": true`.
`any`-Typen sind verboten. Bei schwer ausdrückbaren Typen: mit User klären, bevor
`unknown` oder Type-Assertions verwendet werden.

ESLint überwacht nicht zusätzlich auf `no-unused-vars` (das ist `noUnusedLocals`
im tsconfig) — dokumentiert als Deviation in CLAUDE.md.

## Consequences

**Positiv:**
- Null-Checks werden erzwungen: `position: PadPosition | null` muss am Call-Site
  gehandelt werden, keine versehentlichen `undefined`-Dereferenzierungen.
- Ungenutzte Variablen werden zur Compile-Zeit aufgedeckt.
- Typ-Splits wie `LibraryItemMeta` vs. `LibraryItem` werden durch das Typsystem
  erzwungen (ADR-0011): Code, der fälschlicherweise einen Blob in Signals
  speichert, kompiliert nicht.

**Negativ / Trade-offs:**
- Mehr Upfront-Aufwand beim Typen von V1-Audio-Engine-Code (der ursprünglich in
  ungetyptem JS geschrieben wurde). Gelöst durch explizite Type-Assertions an der
  Facade-Grenze.

## Alternatives Considered

**Kein strict mode:** Würde die `any`-Entscheidungen stillschweigend erlauben.
Bei einer App mit iOS-Memory-Constraints (ADR-0019) sind versehentliche
Blob-Leaks im State zu riskant.

## Related

- **Dateien:** `v3/tsconfig.app.json`, `v3/tsconfig.json`
- **ADRs:** ADR-0011 (LibraryItem-Split erzwingt Typsicherheit), ADR-0019 (iOS Memory Safety)
- **Quelldokumente:** `CLAUDE.md §Permanent coding standards`
