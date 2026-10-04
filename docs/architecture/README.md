# Architecture Decision Records — Soundboard of Storytelling V3

This folder records every substantial architecture decision for V3. Each decision gets its own
file. Format: `docs/architecture/_template.md`.

**Distinction from other documents:**

- `docs/architecture/concept-brief.md` — binding architecture definitions (prescriptive)
- `docs/design/design-notes.md` — design detail decisions, open questions, RESOLVED entries
- `docs/development/testing.md` — test architecture documentation (descriptive)
- `docs/architecture/` — **why** decisions were made (history + consequences)

---

## Index

<!-- AUTO-GENERATED:adr-index START — do not edit by hand -->

### Tech stack

| #                                     | Title                                  | Status   | Slice         | Date       |
| ------------------------------------- | -------------------------------------- | -------- | ------------- | ---------- |
| [ADR-0001](0001-preact.md)            | Preact instead of React                | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0002](0002-signals.md)           | Preact Signals as state manager        | Accepted | Slice 1       | 2026-05-27 |
| [ADR-0003](0003-vite.md)              | Vite as build and dev tool             | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0004](0004-typescript-strict.md) | TypeScript strict mode                 | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0005](0005-vite-plugin-pwa.md)   | vite-plugin-pwa for the service worker | Accepted | Slice 1       | 2026-05-27 |

### Platform constraints

| #                                                          | Title                                                                    | Status   | Slice          | Date       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ | -------- | -------------- | ---------- |
| [ADR-0006](0006-platform-targets.md)                       | iOS Safari 15+ minimum, iPhone 13 Pro as primary target                  | Accepted | cross-cutting  | 2026-05-27 |
| [ADR-0007](0007-pointer-events-dnd.md)                     | Pointer events for DnD — HTML5 drag and drop forbidden                   | Accepted | Slice 3        | 2026-05-27 |
| [ADR-0057](0057-self-hosted-assets-and-license-notices.md) | Self-hosted assets and shipped license notices                           | Accepted | infrastructure | 2026-09-30 |
| [ADR-0066](0066-service-worker-updates-prompt.md)          | Service worker updates — a prompt with RELOAD, never an automatic reload | Accepted | cross-cutting  | 2026-10-03 |

### Data model

| #                                           | Title                                                          | Status                 | Slice    | Date       |
| ------------------------------------------- | -------------------------------------------------------------- | ---------------------- | -------- | ---------- |
| [ADR-0008](0008-pad-position-struct.md)     | Pad position as a `{col, row}` struct                          | Accepted               | Slice 3  | 2026-05-27 |
| [ADR-0009](0009-pad-position-null.md)       | Pad position can be `null` (UNPLACED state)                    | Superseded by ADR-0048 | Slice 3  | 2026-05-27 |
| [ADR-0010](0010-board-json-document.md)     | Board as a monolithic JSON document in IDB                     | Accepted               | Slice 3  | 2026-05-27 |
| [ADR-0011](0011-library-item-split.md)      | LibraryItem split into meta (signals) + Blob (IDB only)        | Accepted               | Slice 2  | 2026-05-27 |
| [ADR-0012](0012-sha256-noble-hashes.md)     | SHA-256 via `@noble/hashes` instead of the Web Crypto API      | Accepted               | Slice 2  | 2026-05-27 |
| [ADR-0013](0013-padset-naming.md)           | Type `PadSet` instead of `Set`                                 | Superseded by ADR-0048 | Slice 3  | 2026-05-27 |
| [ADR-0042](0042-pad-discriminated-union.md) | Pad as a discriminated union                                   | Superseded by ADR-0048 | Slice 4  | 2026-05-28 |
| [ADR-0048](0048-pad-pool-decks.md)          | Pad pool, decks and three pad types                            | Accepted               | Slice 9  | 2026-09-29 |
| [ADR-0068](0068-trim-per-file.md)           | Several files per pad, each with its own trim                  | Accepted               | Slice 15 | 2026-10-03 |
| [ADR-0070](0070-pad-icons.md)               | Pad icons — IconifyJSON sets, `set:name` keys, up to 4 per pad | Accepted               | Slice 15 | 2026-10-04 |

### Persistence

| #                                                           | Title                                                               | Status                 | Slice                                       | Date       |
| ----------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- | ------------------------------------------- | ---------- |
| [ADR-0014](0014-indexeddb-persistence.md)                   | IndexedDB as sole persistence; localStorage only for UI preferences | Superseded by ADR-0062 | cross-cutting                               | 2026-05-27 |
| [ADR-0015](0015-db-name.md)                                 | DB name `sos-v3` (separate from V1)                                 | Accepted               | Slice 1                                     | 2026-05-27 |
| [ADR-0016](0016-idb-library.md)                             | `idb` library as the IDB wrapper                                    | Accepted               | Slice 2                                     | 2026-05-27 |
| [ADR-0017](0017-idb-schema-versioning.md)                   | IDB schema versioning with upgrade paths                            | Accepted               | Slice 2 (v1: library), Slice 3 (v2: boards) | 2026-05-27 |
| [ADR-0061](0061-backup-file-format-and-streaming-import.md) | Backup file format and piecewise import                             | Accepted               | Slice 10                                    | 2026-10-02 |
| [ADR-0062](0062-indexeddb-for-all-persistence.md)           | IndexedDB for all persistence, UI preferences included              | Accepted               | cross-cutting                               | 2026-10-02 |

### Audio engine & iOS memory

| #                                                 | Title                                                                    | Status   | Slice         | Date       |
| ------------------------------------------------- | ------------------------------------------------------------------------ | -------- | ------------- | ---------- |
| [ADR-0018](0018-v1-audio-engine.md)               | V1 audio engine copied 1:1 — no rebuild                                  | Accepted | Slice 4       | 2026-05-27 |
| [ADR-0019](0019-ios-memory-safety.md)             | iOS memory safety rules (150 MB LRU cache, serial decode)                | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0020](0020-audiocontext-lifecycle.md)        | AudioContext lifecycle — TAP TO UNLOCK + visibilitychange                | Accepted | Slice 4       | 2026-05-27 |
| [ADR-0043](0043-audiocontext-timing.md)           | AudioContext Timing — Synchronous in Click Handler                       | Accepted | Slice 4       | 2026-05-28 |
| [ADR-0044](0044-audio-engine-module-structure.md) | Audio Engine Module Structure                                            | Accepted | Slice 4       | 2026-05-28 |
| [ADR-0065](0065-waveform-peaks-resolution.md)     | Waveform peaks — 256 per file, computed once, backfilled for old entries | Accepted | Slice 15      | 2026-10-03 |
| [ADR-0069](0069-loop-repeat.md)                   | REPEAT — a Loop plays a number of times, then stops                      | Accepted | Slice 15      | 2026-10-04 |

### UI architecture

| #                                             | Title                                                                          | Status   | Slice         | Date       |
| --------------------------------------------- | ------------------------------------------------------------------------------ | -------- | ------------- | ---------- |
| [ADR-0021](0021-css-naming.md)                | CSS classes `sb-<block>` / `sb-<block>-<part>` / `is-<state>`                  | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0022](0022-design-tokens.md)             | Design tokens in `v3/src/styles/tokens.css` — no colour literals               | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0023](0023-surface-hierarchy.md)         | Five-level surface hierarchy                                                   | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0024](0024-clip-path-frames.md)          | `clip-path` for pixel frames — `filter: drop-shadow()` instead of `box-shadow` | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0025](0025-is-deep-opt-in.md)            | `is-deep` as opt-in for the pad depth stack                                    | Accepted | Slice 3       | 2026-05-27 |
| [ADR-0026](0026-mode-toggle-headline.md)      | Mode toggle as the interactive screen headline (BoardTopBar)                   | Accepted | Slice 3       | 2026-05-27 |
| [ADR-0027](0027-pad-type-colors-semantic.md)  | Pad type colours are semantically reserved                                     | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0028](0028-single-component-variants.md) | One component per UI element — variants via props                              | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0045](0045-two-axis-adaptive-model.md)   | Two-axis adaptive model — one app, no separate systems                         | Accepted | cross-cutting | 2026-06-04 |
| [ADR-0052](0052-code-naming-conventions.md)   | Code naming conventions                                                        | Accepted | cross-cutting | 2026-09-29 |

### Interaction

| #                                        | Title                                                         | Status   | Slice         | Date       |
| ---------------------------------------- | ------------------------------------------------------------- | -------- | ------------- | ---------- |
| [ADR-0029](0029-dnd-swap-insert.md)      | SWAP + INSERT as dual DnD semantics                           | Accepted | Slice 3       | 2026-05-27 |
| [ADR-0030](0030-auto-save-debounce.md)   | Auto-save with 500 ms debounce — no explicit save button      | Accepted | Slice 3       | 2026-05-27 |
| [ADR-0031](0031-two-tap-delete.md)       | 2-tap delete as the standard confirm pattern                  | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0032](0032-grid-4col-constant.md)   | 4-column grid constant across all viewports                   | Accepted | Slice 3       | 2026-05-27 |
| [ADR-0067](0067-browser-gestures-off.md) | The browser's own touch gestures are off — the app owns touch | Accepted | cross-cutting | 2026-10-03 |

### Test infrastructure & workflow

| #                                                 | Title                                                                         | Status                 | Slice          | Date       |
| ------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------- | -------------- | ---------- |
| [ADR-0033](0033-three-layer-testing.md)           | Four-layer test strategy (unit / E2E smoke / E2E full / visual)               | Accepted               | infrastructure | 2026-05-27 |
| [ADR-0034](0034-vitest.md)                        | Vitest for unit tests                                                         | Accepted               | infrastructure | 2026-05-27 |
| [ADR-0035](0035-playwright.md)                    | Playwright for E2E tests                                                      | Accepted               | infrastructure | 2026-05-27 |
| [ADR-0036](0036-visual-regression-macos.md)       | Visual regression tests local only (macOS baselines)                          | Accepted               | infrastructure | 2026-05-27 |
| [ADR-0037](0037-husky-precommit.md)               | Husky pre-commit hook: build + unit + smoke E2E                               | Accepted               | infrastructure | 2026-05-27 |
| [ADR-0038](0038-data-testid-convention.md)        | `data-testid` convention for E2E selectors                                    | Superseded by ADR-0054 | infrastructure | 2026-05-27 |
| [ADR-0040](0040-github-pages-deployment.md)       | GitHub Pages deployment gated on CI (`workflow_run`)                          | Accepted               | infrastructure | 2026-05-27 |
| [ADR-0049](0049-deploy-tested-artifact.md)        | Deploy the tested build artifact                                              | Accepted               | infrastructure | 2026-09-29 |
| [ADR-0051](0051-repository-security-settings.md)  | Repository security settings                                                  | Accepted               | infrastructure | 2026-09-29 |
| [ADR-0053](0053-exception-management.md)          | Exception management                                                          | Accepted               | cross-cutting  | 2026-09-29 |
| [ADR-0054](0054-test-locators-and-ids.md)         | Test locators and test IDs                                                    | Accepted               | infrastructure | 2026-09-30 |
| [ADR-0055](0055-typecheck-everything.md)          | Every TypeScript file is type-checked                                         | Accepted               | infrastructure | 2026-09-30 |
| [ADR-0056](0056-documentation-freshness.md)       | Documentation freshness is checked automatically                              | Accepted               | infrastructure | 2026-09-30 |
| [ADR-0058](0058-repository-wide-formatting.md)    | One formatter and linter setup for the whole repository                       | Accepted               | infrastructure | 2026-09-30 |
| [ADR-0059](0059-property-and-mutation-testing.md) | Property-based and mutation testing                                           | Accepted               | infrastructure | 2026-09-30 |
| [ADR-0060](0060-commit-message-convention.md)     | Commit messages follow Conventional Commits                                   | Accepted               | infrastructure | 2026-10-01 |
| [ADR-0064](0064-code-comments.md)                 | Code comments — TSDoc doc comments, file overviews, line comments for the why | Accepted               | cross-cutting  | 2026-10-03 |

### Process & product decisions

| #                                               | Title                                                                             | Status   | Slice         | Date       |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | -------- | ------------- | ---------- |
| [ADR-0039](0039-vertical-slices.md)             | Vertical slices as the development model (8 slices)                               | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0041](0041-english-only.md)                | English as the app language — no i18n infrastructure                              | Accepted | cross-cutting | 2026-05-27 |
| [ADR-0046](0046-design-code-import-gate.md)     | Design→Code Integration via Checked Import Gate                                   | Accepted | cross-cutting | 2026-06-11 |
| [ADR-0047](0047-documentation-architecture.md)  | Documentation architecture — hub / leaf / template                                | Accepted | cross-cutting | 2026-09-28 |
| [ADR-0050](0050-repository-file-naming.md)      | Repository file naming                                                            | Accepted | cross-cutting | 2026-09-29 |
| [ADR-0063](0063-release-notes-in-two-levels.md) | Release notes in two levels — "What's new" in the app, a changelog for developers | Accepted | cross-cutting | 2026-10-03 |

<!-- AUTO-GENERATED:adr-index END -->
