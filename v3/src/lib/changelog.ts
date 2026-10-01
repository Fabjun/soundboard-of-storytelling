// In-app changelog — mirrors CHANGELOG.md but structured for the UI.
// Most-recent entry first. version must match APP_VERSION in StartScreen.

export type ChangelogEntry = {
  version: string;
  date: string;
  items: string[];
};

export const APP_VERSION = '3.0.93';

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.0.93',
    date: '2026-10-01',
    items: [
      'feat(decks): All pads view of the whole pool; remove a pad from one deck or delete it everywhere ("used in N decks"); PAD editor deck checklist places a pad in other decks (Slice 9e, ADR-0048)',
    ],
  },
  {
    version: '3.0.89',
    date: '2026-10-01',
    items: [
      'feat(model): pad pool — pads belong to the board, decks place them with position and key; duplicated decks share their pads; quick-access model; DB v4 (Slice 9c, ADR-0048)',
    ],
  },
  {
    version: '3.0.87',
    date: '2026-10-01',
    items: [
      'ci: mutation test processes get a heap cap (a looping mutant filled the CI runner); the summary fails on a missing module; review log for work done while the owner is away',
    ],
  },
  {
    version: '3.0.86',
    date: '2026-10-01',
    items: [
      'ci: weekly mutation testing as one job per module with vitest related, plus a summary job; locally half the cores; guards read the file list from git (T11c)',
    ],
  },
  {
    version: '3.0.85',
    date: '2026-09-30',
    items: [
      'ci: the weekly mutation job reports its runtime and fails from 70 % of its time limit; structure review checks thresholds and runtimes',
    ],
  },
  {
    version: '3.0.84',
    date: '2026-09-30',
    items: [
      'test: drag-and-drop flow unit tests (padDnd mutation score 30 % → 91.6 %); mutation runs guarded against timeout inflation (T11c)',
    ],
  },
  {
    version: '3.0.83',
    date: '2026-09-30',
    items: [
      'test: mutation testing with StrykerJS, weekly in CI with a break threshold (T11c, ADR-0059)',
    ],
  },
  {
    version: '3.0.82',
    date: '2026-09-30',
    items: [
      'test: property-based tests with fast-check (T11b)',
      'fix: file sizes just below 1 MB showed "1024 KB" instead of "1.0 MB"',
    ],
  },
  {
    version: '3.0.81',
    date: '2026-09-30',
    items: ['docs(test): edge-case checklist for choosing test cases (T11a)'],
  },
  {
    version: '3.0.80',
    date: '2026-09-30',
    items: ['chore(deps): Preact 11 (major)'],
  },
  {
    version: '3.0.79',
    date: '2026-09-30',
    items: [
      'refactor: inline style lengths carry explicit units (preparation for Preact 11), guarded by the type checker',
    ],
  },
  {
    version: '3.0.78',
    date: '2026-09-30',
    items: [
      'ci: Dependabot ignores @types/node majors (follows .nvmrc) and TypeScript majors (blocked by typescript-eslint), with reasons in the exception register and guards',
    ],
  },
  {
    version: '3.0.77',
    date: '2026-09-30',
    items: ['chore(deps): jsdom 30 (major, unit-test DOM)'],
  },
  {
    version: '3.0.76',
    date: '2026-09-30',
    items: ['chore(deps): size-limit and @size-limit/file 14 (major)'],
  },
  {
    version: '3.0.75',
    date: '2026-09-30',
    items: ['chore(deps): vitest 5 with @vitest/coverage-v8 and @vitest/ui 5 (major, one family)'],
  },
  {
    version: '3.0.74',
    date: '2026-09-30',
    items: [
      'chore(deps): development minor/patch updates (Playwright 1.63, ESLint 10.11, Prettier 3.9, typescript-eslint 8.71, lint-staged, tsx, vite); libDnd.ts reformatted for Prettier 3.9',
    ],
  },
  {
    version: '3.0.73',
    date: '2026-09-30',
    items: [
      'chore(deps): preact 10.29.8, @preact/signals 2.11.3, @noble/hashes 2.4.0 (minor/patch)',
    ],
  },
  {
    version: '3.0.72',
    date: '2026-09-30',
    items: [
      'docs: CI and hook step lists generated from their sources; code blocks and the API list in CLAUDE.md checked; one .gitignore (audit A4, A7, A8)',
    ],
  },
  {
    version: '3.0.71',
    date: '2026-09-30',
    items: [
      'test: unused code in tests is reported again; ESLint rule switches carry a checked reason and appear in the exception register',
    ],
  },
  {
    version: '3.0.70',
    date: '2026-09-30',
    items: [
      'ci: Dependabot groups lockstep dependency families (incl. majors), guarded by a test; guard file headers numbered in order',
    ],
  },
  {
    version: '3.0.69',
    date: '2026-09-30',
    items: [
      'test: unit tests have a 500 ms local time budget (5 s in CI), so slow tests fail before the push',
    ],
  },
  {
    version: '3.0.68',
    date: '2026-09-30',
    items: [
      'fix(test): table guard scans lines instead of parsing (CI timeout); a table GitHub showed as plain text repaired',
    ],
  },
  {
    version: '3.0.67',
    date: '2026-09-30',
    items: [
      'chore: one formatter and linter setup for the whole repository; scripts moved to v3/scripts; Markdown formatting refuses content changes; table cells escaped (ADR-0058)',
    ],
  },
  {
    version: '3.0.66',
    date: '2026-09-30',
    items: [
      'fix: fonts are self-hosted and work offline; no request to third-party origins; license notices ship with every build (ADR-0057)',
    ],
  },
  {
    version: '3.0.65',
    date: '2026-09-30',
    items: [
      'chore: remove the V1 reference copy (incl. third-party icons without licence file) from the public repository; structure audit findings recorded',
    ],
  },
  {
    version: '3.0.64',
    date: '2026-09-30',
    items: [
      'docs: slice completion checklist gains a short structure review; full audits only on occasion',
    ],
  },
  {
    version: '3.0.63',
    date: '2026-09-30',
    items: [
      'docs: section references are anchored links, checked by docsGuards; hard-coded test counts removed; hook step list corrected (T13, ADR-0056)',
    ],
  },
  {
    version: '3.0.62',
    date: '2026-09-30',
    items: [
      'fix(ci): prepare script installs Vale from v3/ (CI npm ci failed); pre-push runs npm ci in a fresh worktree when install files change',
    ],
  },
  {
    version: '3.0.61',
    date: '2026-09-30',
    items: [
      'docs: Vale checks active docs for superseded terms; paths in code spans must exist; stale statements fixed (T13, ADR-0056)',
    ],
  },
  {
    version: '3.0.60',
    date: '2026-09-30',
    items: [
      'docs: link check validates anchors across files (remark-validate-links replaces markdown-link-check); 9 broken anchors fixed (T13)',
    ],
  },
  {
    version: '3.0.59',
    date: '2026-09-30',
    items: [
      'docs: project language English only — all docs, ADRs, tool and hook messages translated; guards for ADR headers and German text (S5)',
    ],
  },
  {
    version: '3.0.58',
    date: '2026-09-30',
    items: [
      'test: every TypeScript file is type-checked — unit and E2E tests, tool configs, scripts (ADR-0055); 7 hidden type errors fixed (T12)',
    ],
  },
  {
    version: '3.0.57',
    date: '2026-09-30',
    items: [
      'test: locators follow Playwright/Testing Library guidance (ADR-0054) — no CSS-class locators, state via aria-pressed, one test ID scheme, consistent spec names (S4)',
      'a11y: pads announce "pressed" while playing; pad type buttons announce the selected type; the start-screen flame is exposed as an image',
    ],
  },
  {
    version: '3.0.56',
    date: '2026-09-29',
    items: [
      'chore: one exception scheme (ADR-0053) — every suppression with reason, temporary ones with BACKLOG reference, generated exception register; config files now linted (S3)',
    ],
  },
  {
    version: '3.0.55',
    date: '2026-09-29',
    items: [
      'refactor: code naming scheme (ADR-0052) — TopBar/StatusBar/BoardTopBar without version suffixes, App.tsx, sb-theme-*, unused CSS removed, scripts named after npm scripts; guarded by tests (S2)',
    ],
  },
  {
    version: '3.0.54',
    date: '2026-09-29',
    items: [
      'chore: remove unused Vite scaffold files; package renamed soundboard-of-storytelling, APP_VERSION is the only version (S1)',
    ],
  },
  {
    version: '3.0.53',
    date: '2026-09-29',
    items: [
      'security: GitHub protections on (Dependabot alerts/updates, secret scanning + push protection, private reporting, protected main, GitHub-owned actions only); SECURITY.md (T9)',
    ],
  },
  {
    version: '3.0.52',
    date: '2026-09-29',
    items: [
      'docs: one naming scheme (ADR-0050) — docs in docs/ (lowercase-kebab, hubs README.md), design-sources/<ISO date>, generated CHANGELOG.md, guarded by tests',
    ],
  },
  {
    version: '3.0.51',
    date: '2026-09-29',
    items: [
      'ci: deploy publishes the exact tested build (no rebuild), push-only guard against PR/fork code; GitHub Actions on current versions (T8d)',
    ],
  },
  {
    version: '3.0.50',
    date: '2026-09-29',
    items: ['docs: README rewritten for clients and colleagues (purpose, status, license)'],
  },
  {
    version: '3.0.49',
    date: '2026-09-29',
    items: [
      'ci: weekly check (Monday) — full test suite, audit/outdated report, stale Dependabot PRs turn it red (T8c)',
    ],
  },
  {
    version: '3.0.48',
    date: '2026-09-29',
    items: [
      'ci: npm audit (high/critical) blocks in CI and pre-push; scripts/*.ts type-checked in pre-commit and CI (T8b)',
    ],
  },
  {
    version: '3.0.47',
    date: '2026-09-29',
    items: [
      'chore(security): npm audit 15 → 0 (dev tooling incl. vite/rolldown; vitest 4.1.11); Dependabot groups minor/patch, majors separately (T8a)',
    ],
  },
  {
    version: '3.0.46',
    date: '2026-09-29',
    items: [
      'test: guards — every logic module tested, every quarantine references BACKLOG; generated test inventory in TESTING.md (T7)',
    ],
  },
  {
    version: '3.0.45',
    date: '2026-09-29',
    items: [
      'test: full E2E subset in WebKit (CRUD + drag & drop in the Safari engine); coverage floor in CI (T6)',
    ],
  },
  {
    version: '3.0.44',
    date: '2026-09-29',
    items: [
      'test: E2E against the production build incl. PWA checks (service worker, manifest, offline) in CI and pre-push (T5)',
    ],
  },
  {
    version: '3.0.43',
    date: '2026-09-29',
    items: [
      'test: lint rules against test traps (no assertions, .only, silent skip/fixme, invalid expect); Playwright forbidOnly (T10)',
    ],
  },
  {
    version: '3.0.42',
    date: '2026-09-29',
    items: [
      'test: audio engine characterization tests (T4); src/audio in coverage; found bug: combo stop-all step stops itself',
    ],
  },
  {
    version: '3.0.41',
    date: '2026-09-29',
    items: [
      'test: upload pipeline — serial decode, context close order, metadata-only state, duplicates, errors (T2)',
      'test: drag-and-drop E2E — pad swap, pad insert, library drag (were empty TODO stubs); deck reorder found not built (T3)',
    ],
  },
  {
    version: '3.0.40',
    date: '2026-09-29',
    items: [
      'docs(adr): ADR-0048 pad pool, decks and three pad types (Slice 9 plan)',
      'refactor: Scene renamed to Deck in UI, code, CSS classes and tests (Slice 9b); DB v3 clears old test boards',
      'test: guard for E2E project membership, dedicated test port 5199, Node 24 in CI, visual tests in pre-push, flaky tests fail CI',
    ],
  },
  {
    version: '3.0.39',
    date: '2026-09-29',
    items: ['test(e2e): list reporter — failing tests are named in the terminal (pre-push, CI)'],
  },
  {
    version: '3.0.38',
    date: '2026-09-29',
    items: [
      'feat(flame): new ice transformation from the "Hearth" design — frost creeps in from the edge, 4 s frozen, ice shards, steam, melt drips, re-ignite; glow follows the pixel shape (no box, no circle)',
      'feat(flame): canvas rendering; idle flicker, inner glow and heart flicker kept',
      'docs(design): Claude Design state of 2026-09-28 added (SoS_DESIGN_28092026)',
    ],
  },
  {
    version: '3.0.37',
    date: '2026-09-29',
    items: [
      'feat(start): animated pixel flame from the Claude Design draft (v13) replaces the static placeholder — tap to spark and freeze, idle to thaw',
      'fix(flame): sparks were drawn black (design colour bug); frost no longer shows a light box',
      'feat(flame): inner glow and heart flicker; sparks cool into black smoke',
    ],
  },
  {
    version: '3.0.36',
    date: '2026-09-28',
    items: [
      'docs: slice re-plan — Slices 9–14 (5–8 superseded, numbers not reused); platforms: all smartphones',
    ],
  },
  {
    version: '3.0.35',
    date: '2026-09-28',
    items: [
      'docs: design folder convention (dated, proposals not binding); PAD spec design sources',
      'chore: rename app path botc-soundboard-v3 → soundboard-of-storytelling (Vite base, PWA scope, tests)',
    ],
  },
  {
    version: '3.0.34',
    date: '2026-09-28',
    items: ['docs(design): first component spec — PAD (card format, detail levels, zoom per deck)'],
  },
  {
    version: '3.0.33',
    date: '2026-09-28',
    items: [
      'docs(product): V1/V2 feature inventory with V3 status per feature',
      'docs(product): PRODUCT.md §6 Input — keyboard & numpad decisions (K1–K12)',
      'docs(product): data & backup feature spec (export, import, V1 migration)',
      'docs(product): PRODUCT.md §5 Pads — three pad types, combos as building blocks; P1 clarified',
      'docs(product): PRODUCT.md §5 Board concept — pad pool, scenes as views, quick-access bar',
      'docs: DOCUMENTATION_MAP product progress table',
      'docs(product): Q1 decided — Scene renamed to Deck; first glossary',
      'docs: terminology sweep — deck, STOP ALL, Q1 status in all texts written 2026-09-28',
    ],
  },
  {
    version: '3.0.32',
    date: '2026-09-28',
    items: [
      'docs(product): PRODUCT.md §7 Design principles (P1–P7); Q2 pad-type naming; V1/V2 reference rule in CLAUDE.md',
    ],
  },
  {
    version: '3.0.31',
    date: '2026-09-28',
    items: [
      'docs: ADR-0047 documentation architecture (hub/leaf/template); PRODUCT.md skeleton; component spec template; Claude Design scoped to visual styling',
      'docs: ADR-0047 source-to-target mapping, section-level transfer rule, archive convention',
      'docs(product): PRODUCT.md §3 App modes GAME/SETUP — mode behavior, mode switch, Lock',
    ],
  },
  {
    version: '3.0.30',
    date: '2026-09-28',
    items: ['docs(backlog): mark scene-rename duplicate check as done'],
  },
  {
    version: '3.0.29',
    date: '2026-06-18',
    items: ['feat(scenes): scene-rename live duplicate check + blocking behavior — Part 2b'],
  },
  {
    version: '3.0.28',
    date: '2026-06-18',
    items: ['feat(scenes): scene-rename conflict display classes + markup (no behavior) — Part 2a'],
  },
  {
    version: '3.0.27',
    date: '2026-06-15',
    items: [
      'docs: register is-conflict in closed is-* vocabulary (§3 + ADR-0021) per scene-rename (a) decision',
    ],
  },
  {
    version: '3.0.26',
    date: '2026-06-15',
    items: [
      'docs: complete scene-rename import gate against artifact — self-audit verified, is-conflict pending',
    ],
  },
  {
    version: '3.0.25',
    date: '2026-06-15',
    items: ['ADR-0046: gate stops if artifact absent for scanning checks (close first-run gap)'],
  },
  {
    version: '3.0.24',
    date: '2026-06-11',
    items: [
      'Docs: record import-gate decision (ADR-0046) — no design output enters production unchecked; 5-point import gate; per-session spec dial; add Claude Design session spec (docs/design/CLAUDE_DESIGN_SPEC.md); sharpen rule 6 to literal stat output; add FOUNDATION_ANALYSIS coupling row; add BACKLOG import-gate script candidate',
    ],
  },
  {
    version: '3.0.23',
    date: '2026-06-11',
    items: [
      'Docs: fix Evidence Requirements wording defects (relay-gap draft: E1 closing line, Files-touched routine carve-out, commit-gate exceptions), add E6 approval integrity, update incident count to six',
    ],
  },
  {
    version: '3.0.22',
    date: '2026-06-11',
    items: [
      'Docs: add Evidence Requirements (E1–E5) to CLAUDE.md — mechanical guardrails after five wrong repo-state claims in planning; plan-format requirements (### Evidence / ### Files touched); Plan-Mode commit gate; post-push --stat mandate',
    ],
  },
  {
    version: '3.0.21',
    date: '2026-06-10',
    items: [
      'Docs: Pass 7 — annotate dead §8.8 references + removed --pix-bg-layer token in DESIGN_NOTES; update Slice 4 header (complete, C1/C2 deferred); record I20 Slice-3 sign-offs with file:line evidence; annotate A3 Scene CRUD items (settled/deferred/superseded); fix false "stepwise reorder shipped" claim in BACKLOG; add §8.8 inset-shadow content-gap entry to BACKLOG; add ADR-category↔CATEGORY_ORDER coupling row to FOUNDATION_ANALYSIS.md',
    ],
  },
  {
    version: '3.0.20',
    date: '2026-06-06',
    items: [
      'Docs: Pass 6 — fix stale facts/refs/counts across ADRs (import path, manifest.json, build time, elementFromPoint pattern, ADR-0006 descriptions, ADR-0041 reference); fix ADR-0043/0044 headers to template; formalize Refines: field in template; recategorize ADR-0039+0041 into new Prozess- & Produktentscheidungen category; add §6 coupling row to FOUNDATION_ANALYSIS.md',
    ],
  },
  {
    version: '3.0.19',
    date: '2026-06-06',
    items: [
      "Docs: Pass 5 — correct test/gate/project counts in TESTING.md + ADRs (0033/0034/0035/0037), mark fixme'd mobile tests as deferred (not active coverage), annotate Slice-7 manual checklist items, fix section numbering, add testing coupling entry",
    ],
  },
  {
    version: '3.0.18',
    date: '2026-06-06',
    items: [
      'Docs: Pass 4 BACKLOG maintenance — record settled scene decisions (I24 SETTLED/I25 decided-pending-code), supersede desktop-first framing per ADR-0045, fix ADR-0015 citation, add Axis-1 breakpoint tracking, status markers (K11/K13), remove completed I22 phrasing item',
    ],
  },
  {
    version: '3.0.17',
    date: '2026-06-06',
    items: [
      'Docs: Pass 3 corrections — fix sb-stack→sb-col in CLAUDE.md+Cheatsheet (§5a as canonical list), align GAME color rule to --mode-game, remove dead update_log rule, correct IDB/build-command/framework staleness, register 5 is-* DnD+looping classes in DESIGN_SYSTEM §3, fix token-source file in §A header, add coupling-map entries',
    ],
  },
  {
    version: '3.0.16',
    date: '2026-06-05',
    items: [
      'Docs: Complete DOCUMENTATION_MAP + README doc index; add curated layout-primitives list (§5a) to DESIGN_SYSTEM as single source of truth (sb-row/sm/wrap/fill, sb-col, sb-flex-1); record coupling + planned drift-guard',
    ],
  },
  {
    version: '3.0.15',
    date: '2026-06-05',
    items: [
      'Docs: V3_CONCEPT_BRIEF modernisation — record Signals/idb decisions, fix paradigm/signatures/structure, remove stale open-choice framing, update slice status to post-Slice-4 reality; refine coupling map',
    ],
  },
  {
    version: '3.0.14',
    date: '2026-06-05',
    items: [
      'Docs: Full documentation audit — inventory + currency check of all 20 documents + 45 ADRs; 8 critical, 40 important, 24 cosmetic findings recorded; 12 category-D items flagged for user judgment',
    ],
  },
  {
    version: '3.0.13',
    date: '2026-06-05',
    items: [
      'Docs: Foundation drift correction — align V3_CONCEPT_BRIEF with ADR-0045 (two-axis model); precision BACKLOG C10 label; fix --mode-play → --mode-game token; replace stale §4.1 type block with pointer; past-tense Session 3; add document coupling map',
    ],
  },
  {
    version: '3.0.12',
    date: '2026-06-05',
    items: [
      'Docs: Foundation analysis pass 1 — codebase map, 8 prioritized findings (critical: 3-col layout at 390px, zero adaptive CSS, C10 unresolved in code), per-area findings, 7 deep-dive recommendations',
    ],
  },
  {
    version: '3.0.11',
    date: '2026-06-04',
    items: [
      'Docs: Replace mobile-vs-desktop split with two-axis adaptive model (screen format × input type); write ADR-0045; supersede old framing in BACKLOG; clarify ADR-0032 boundary; resolve device-detection question',
    ],
  },
  {
    version: '3.0.10',
    date: '2026-06-04',
    items: [
      'Docs: Mobile Board design round 1 (Claude Design) — adopted refinements (sheet-shrink, FLIP re-wrap, STOP ALL priority, color-independent mode legibility), gap-creation + swipe/mode-switch decisions, parked feature candidates',
    ],
  },
  {
    version: '3.0.9',
    date: '2026-06-04',
    items: [
      'Infra: pre-push hook now blocks when the APP_VERSION bump is missing (one push = one version); CLAUDE.md pre-commit checklist extended',
    ],
  },
  {
    version: '3.0.8',
    date: '2026-06-04',
    items: [
      'Docs: Library-as-tile-grid working assumption, modular sidebar building block, multi-level settings hierarchy — BACKLOG Design Session 2026-06-04',
      'Docs: C10 assumption verified (Library structurally different from pad grid), C10 Punkt 8 als Sonderfall des allgemeinen Hierarchie-Modells ausgewiesen',
      'Docs: architecture motto "Think big, but don\'t rush" added',
    ],
  },
  {
    version: '3.0.7',
    date: '2026-05-28',
    items: [
      'Fix: several loop pads can play at the same time — ctx.resume() no longer awaited in playback functions (otherwise iOS WebKit cancels running sources)',
    ],
  },
  {
    version: '3.0.6',
    date: '2026-05-28',
    items: [
      'Fix: AudioContext starts reliably on iOS — ctx.resume() directly in initAudio() within the TAP TO UNLOCK gesture tick',
    ],
  },
  {
    version: '3.0.5',
    date: '2026-05-28',
    items: [
      'Fix: iOS file picker shows MP3 files — explicit MIME types instead of audio/* (Brave/Safari need both: MIME + extension)',
    ],
  },
  {
    version: '3.0.4',
    date: '2026-05-28',
    items: [
      'Audio playback: SINGLE, LOOP, PLAYLIST, COMBO pads all play audio',
      'LRU decoded-buffer cache (150 MB cap) — iOS memory safety preserved from V1',
      'TAP TO UNLOCK wires AudioContext synchronously in gesture handler (iOS requirement)',
      'iOS ringer-switch fix: silent WAV upgrades audio session to "playback" category',
      'is-hot / is-looping CSS state driven by Preact Signals — reactive without polling',
    ],
  },
  {
    version: '3.0.3',
    date: '2026-05-27',
    items: [
      'Board, Scene, Pad CRUD — full create / rename / duplicate / delete',
      'Pad DnD: SWAP + INSERT via Pointer Events (iOS-safe — no HTML5 DnD)',
      'SETUP / GAME mode toggle with spark animation',
      '3 pad-creation paths: tap empty slot, library drag, ADD PAD button',
      'Pad type selection dialog with 2-tap-delete confirm pattern',
    ],
  },
  {
    version: '3.0.2',
    date: '2026-05-27',
    items: [
      'Library: import audio files, rename, delete',
      'Serial upload pipeline — never loads all audio into RAM at once (iOS safety)',
      'SHA-256 content addressing via @noble/hashes — works without Secure Context (iPhone LAN)',
      'Waveform peak visualisation computed at import, stored in IDB',
    ],
  },
  {
    version: '3.0.1',
    date: '2026-05-27',
    items: [
      'Project scaffold: Preact + TypeScript + Vite + PWA (vite-plugin-pwa)',
      'StartScreen with TAP TO UNLOCK entry point',
      'Design system: tokens, typography, pixel-art icon set',
      'IndexedDB persistence layer with typed helpers',
    ],
  },
];
