# Architecture Decision Records — Soundboard of Storytelling V3

Dieses Verzeichnis dokumentiert alle substantiellen Architektur-Entscheidungen für V3.
Jede Entscheidung bekommt eine eigene Datei. Format: `docs/architecture/_template.md`.

**Abgrenzung zu anderen Dokumenten:**
- `docs/architecture/concept-brief.md` — bindende Architektur-Festlegungen (präskriptiv)
- `docs/design/design-notes.md` — Design-Detail-Entscheidungen, offene Fragen, RESOLVED-Einträge
- `docs/development/testing.md` — Test-Architektur-Dokumentation (deskriptiv)
- `docs/architecture/` — **warum** Entscheidungen so getroffen wurden (historisch + Konsequenzen)

---

## Index

<!-- AUTO-GENERATED:adr-index START — nicht manuell editieren -->
### Tech Stack

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0001](0001-preact.md) | Preact statt React | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0002](0002-signals.md) | Preact Signals als State Manager | Accepted | Slice 1 | 2026-05-27 |
| [ADR-0003](0003-vite.md) | Vite als Build- und Dev-Tool | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0004](0004-typescript-strict.md) | TypeScript strict mode | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0005](0005-vite-plugin-pwa.md) | vite-plugin-pwa für Service Worker | Accepted | Slice 1 | 2026-05-27 |

### Plattform-Constraints

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0006](0006-platform-targets.md) | iOS Safari 15+ Minimum, iPhone 13 Pro als Primärtarget | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0007](0007-pointer-events-dnd.md) | Pointer Events für DnD — HTML5 Drag-and-Drop verboten | Accepted | Slice 3 | 2026-05-27 |

### Datenmodell

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0008](0008-pad-position-struct.md) | Pad-Position als `{col, row}` Struct | Accepted | Slice 3 | 2026-05-27 |
| [ADR-0009](0009-pad-position-null.md) | Pad-Position kann `null` sein (UNPLACED-State) | Superseded by ADR-0048 | Slice 3 | 2026-05-27 |
| [ADR-0010](0010-board-json-document.md) | Board als monolithisches JSON-Dokument in IDB | Accepted | Slice 3 | 2026-05-27 |
| [ADR-0011](0011-library-item-split.md) | LibraryItem aufgeteilt in Meta (Signals) + Blob (IDB-only) | Accepted | Slice 2 | 2026-05-27 |
| [ADR-0012](0012-sha256-noble-hashes.md) | SHA-256 via `@noble/hashes` statt Web Crypto API | Accepted | Slice 2 | 2026-05-27 |
| [ADR-0013](0013-padset-naming.md) | Type `PadSet` statt `Set` | Superseded by ADR-0048 | Slice 3 | 2026-05-27 |
| [ADR-0042](0042-pad-discriminated-union.md) | Pad als Discriminated Union | Superseded by ADR-0048 | Slice 4 | 2026-05-28 |
| [ADR-0048](0048-pad-pool-decks.md) | Pad pool, decks and three pad types | Accepted | Slice 9 | 2026-09-29 |

### Persistenz

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0014](0014-indexeddb-persistence.md) | IndexedDB alleinige Persistenz; localStorage nur für UI-Präferenzen | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0015](0015-db-name.md) | DB-Name `sos-v3` (getrennt von V1) | Accepted | Slice 1 | 2026-05-27 |
| [ADR-0016](0016-idb-library.md) | `idb` Library als IDB-Wrapper | Accepted | Slice 2 | 2026-05-27 |
| [ADR-0017](0017-idb-schema-versioning.md) | IDB Schema-Versioning mit Upgrade-Pfaden | Accepted | Slice 2 (v1: library), Slice 3 (v2: boards) | 2026-05-27 |

### Audio-Engine & iOS Memory

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0018](0018-v1-audio-engine.md) | V1 Audio-Engine 1:1 kopiert — kein Neubau | Accepted | Slice 4 | 2026-05-27 |
| [ADR-0019](0019-ios-memory-safety.md) | iOS Memory Safety Rules (150 MB LRU-Cache, serielles Decode) | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0020](0020-audiocontext-lifecycle.md) | AudioContext-Lifecycle — TAP TO UNLOCK + visibilitychange | Accepted | Slice 4 | 2026-05-27 |
| [ADR-0043](0043-audiocontext-timing.md) | AudioContext Timing — Synchronous in Click Handler | Accepted | Slice 4 | 2026-05-28 |
| [ADR-0044](0044-audio-engine-module-structure.md) | Audio Engine Module Structure | Accepted | Slice 4 | 2026-05-28 |

### UI-Architektur

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0021](0021-css-naming.md) | CSS-Klassen `sb-<block>` / `sb-<block>-<part>` / `is-<state>` | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0022](0022-design-tokens.md) | Design-Tokens in `tokens.css` — keine Farbliterale | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0023](0023-surface-hierarchy.md) | Fünf-Ebenen-Surface-Hierarchie | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0024](0024-clip-path-frames.md) | `clip-path` für Pixel-Frames — `filter: drop-shadow()` statt `box-shadow` | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0025](0025-is-deep-opt-in.md) | `is-deep` als Opt-In für Pad-Depth-Stack | Accepted | Slice 3 | 2026-05-27 |
| [ADR-0026](0026-mode-toggle-headline.md) | Mode-Toggle als interaktive Screen-Headline (BoardTopBar) | Accepted | Slice 3 | 2026-05-27 |
| [ADR-0027](0027-pad-type-colors-semantic.md) | PAD-Typ-Farben sind semantisch reserviert | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0028](0028-single-component-variants.md) | Ein Component pro UI-Element — Varianten via Props | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0045](0045-two-axis-adaptive-model.md) | Zwei-Achsen-Adaptives Modell — eine App, keine getrennten Systeme | Accepted | cross-cutting | 2026-06-04 |
| [ADR-0052](0052-code-naming-conventions.md) | Code naming conventions | Accepted | cross-cutting | 2026-09-29 |

### Interaktion

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0029](0029-dnd-swap-insert.md) | SWAP + INSERT als duale DnD-Semantik | Accepted | Slice 3 | 2026-05-27 |
| [ADR-0030](0030-auto-save-debounce.md) | Auto-Save mit 500 ms Debounce — kein expliziter Save-Button | Accepted | Slice 3 | 2026-05-27 |
| [ADR-0031](0031-two-tap-delete.md) | 2-Tap-Delete als Standard-Confirm-Pattern | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0032](0032-grid-4col-constant.md) | 4-Spalten-Grid konstant über alle Viewports | Accepted | Slice 3 | 2026-05-27 |

### Test-Infrastruktur & Workflow

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0033](0033-three-layer-testing.md) | Vier-Schichten-Test-Strategie (Unit / E2E Smoke / E2E Full / Visual) | Accepted | infrastructure | 2026-05-27 |
| [ADR-0034](0034-vitest.md) | Vitest für Unit-Tests | Accepted | infrastructure | 2026-05-27 |
| [ADR-0035](0035-playwright.md) | Playwright für E2E-Tests | Accepted | infrastructure | 2026-05-27 |
| [ADR-0036](0036-visual-regression-macos.md) | Visual Regression Tests lokal-only (macOS-Baselines) | Accepted | infrastructure | 2026-05-27 |
| [ADR-0037](0037-husky-precommit.md) | Husky Pre-Commit-Hook: Build + Unit + Smoke E2E | Accepted | infrastructure | 2026-05-27 |
| [ADR-0038](0038-data-testid-convention.md) | `data-testid`-Konvention für E2E-Selektoren | Superseded by ADR-0054 | infrastructure | 2026-05-27 |
| [ADR-0040](0040-github-pages-deployment.md) | GitHub Pages Deployment gated auf CI (`workflow_run`) | Accepted — refined by ADR-0049 (deploy the tested artifact, push-only guard) | infrastructure | 2026-05-27 |
| [ADR-0049](0049-deploy-tested-artifact.md) | Deploy the tested build artifact | Accepted | infrastructure | 2026-09-29 |
| [ADR-0051](0051-repository-security-settings.md) | Repository security settings | Accepted | infrastructure | 2026-09-29 |
| [ADR-0053](0053-exception-management.md) | Exception management | Accepted | cross-cutting | 2026-09-29 |
| [ADR-0054](0054-test-locators-and-ids.md) | Test locators and test IDs | Accepted | infrastructure | 2026-09-30 |
| [ADR-0055](0055-typecheck-everything.md) | Every TypeScript file is type-checked | Accepted | infrastructure | 2026-09-30 |

### Prozess- & Produktentscheidungen

| # | Titel | Status | Slice | Datum |
|---|-------|--------|-------|-------|
| [ADR-0039](0039-vertical-slices.md) | Vertikale Slices als Entwicklungsmodell (8 Slices) | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0041](0041-english-only.md) | Englisch als App-Sprache — keine i18n-Infrastruktur | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0046](0046-design-code-import-gate.md) | Design→Code Integration via Checked Import Gate | Accepted | cross-cutting | 2026-06-11 |
| [ADR-0047](0047-documentation-architecture.md) | Documentation architecture — hub / leaf / template | Accepted | cross-cutting | 2026-09-28 |
| [ADR-0050](0050-repository-file-naming.md) | Repository file naming | Accepted | cross-cutting | 2026-09-29 |
<!-- AUTO-GENERATED:adr-index END -->
