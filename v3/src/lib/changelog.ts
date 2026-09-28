// In-app changelog — mirrors CHANGELOG.md but structured for the UI.
// Most-recent entry first. version must match APP_VERSION in StartScreen.

export type ChangelogEntry = {
  version: string;
  date: string;
  items: string[];
};

export const APP_VERSION = '3.0.33';

export const CHANGELOG: ChangelogEntry[] = [
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
      'Infra: Pre-push-Hook blockt jetzt bei fehlendem APP_VERSION-Bump (one push = one version); CLAUDE.md pre-commit-Checkliste ergänzt',
    ],
  },
  {
    version: '3.0.8',
    date: '2026-06-04',
    items: [
      'Docs: Library-as-tile-grid working assumption, modular sidebar building block, multi-level settings hierarchy — BACKLOG Design Session 2026-06-04',
      'Docs: C10 assumption verified (Library structurally different from pad grid), C10 Punkt 8 als Sonderfall des allgemeinen Hierarchie-Modells ausgewiesen',
      'Docs: Architektur-Motto "Think big, but don\'t rush" ergänzt',
    ],
  },
  {
    version: '3.0.7',
    date: '2026-05-28',
    items: [
      'Fix: mehrere Loop-PADs gleichzeitig spielbar — ctx.resume() nicht mehr awaited in Playback-Funktionen (iOS WebKit cancelld sonst laufende Sources)',
    ],
  },
  {
    version: '3.0.6',
    date: '2026-05-28',
    items: [
      'Fix: AudioContext auf iOS zuverlässig gestartet — ctx.resume() direkt in initAudio() im TAP-TO-UNLOCK-Gesture-Tick',
    ],
  },
  {
    version: '3.0.5',
    date: '2026-05-28',
    items: [
      'Fix: iOS Datei-Picker zeigt MP3-Dateien — explizite MIME-Typen statt audio/* (Brave/Safari erfordert beide: MIME + Extension)',
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
