# CLAUDE.md — BotC Soundboard V3 ("Soundboard of Storytelling")

> **Maintenance rule**: This file is the single source of truth for
> project-specific guidelines. Claude Code must keep it up to date
> autonomously — update it whenever new permanent standards emerge,
> existing rules are revised, or important architectural decisions are
> made. Do not wait to be asked. If you change something that implies
> a new rule, write it here immediately.

---

## Project identity

- **App name**: "Soundboard of Storytelling"
- **Origin repo (V1)**: https://github.com/Fabjun/botc-soundboard
- **V1 live URL**: https://fabjun.github.io/botc-soundboard/
- **V3 stack**: Preact + TypeScript + Vite, PWA
- **Primary target device**: iPhone + Brave browser + Bluetooth Numpad
  (Logilink ID0212v2)
- **Secondary**: laptop/desktop
- **App UI language**: English
- **Communication language**: German or English
- **Lizenz und Status**: V3 ist ein privates Tool unter "All Rights Reserved"-Lizenz (siehe `LICENSE`). Langfristig potentielles kommerzielles Produkt. Keine Open-Source-Beiträge geplant. Beim Ergänzen von Code sicherstellen, dass keine Open-Source-Lizenzen verletzt werden. Kontakt: soundboard_of_storytelling@pm.me

---

## Reference documents

- **Documentation structure (ADR-0047)** — docs are being consolidated into
  hub / leaf / template per area (`docs/product/`, `docs/design/`,
  `docs/architecture/`, `docs/development/`). New docs: English, status on
  every decision (**Decided / Open / Parked**), token names only — never
  copied values. Migration is incremental; see `docs/DOCUMENTATION_MAP.md`
  §Target structure for what is already authoritative.
- **`docs/product/PRODUCT.md`** — product concept hub (in progress; filled in
  dialogue with the user). Once a section is filled, it is authoritative for
  that topic and must be read at session start. Never fill a section with
  reconstructed content without user confirmation.
- **`V3_CONCEPT_BRIEF.md`** — binding technical architecture decisions for V3
  (stack, state, audio engine, IDB, platforms). Product concepts → `docs/product/PRODUCT.md`;
  slice plan → "Slice progress" table in this file. Read first in every session.
- **`v1-reference/index.html`** — V1 source, reference for behavior,
  audio engine, IndexedDB schema, template export/import.
  V2 (`v1_5/` in the V1 GitHub repo, versions v1.5.x → v2.0.12; not copied
  locally) is a short interim rewrite. **V1 and V2 are prototypes: explore
  them for behavior and ideas, never copy UI/CSS/markup 1:1** — re-implement
  in V3 idiom (`PRODUCT.md §7` P7). Only exception: the audio engine.
- **`SoS_DESIGN_25052026/`** — design system: tokens, JSX components.
  **Design folders (`SoS_DESIGN_<DDMMYYYY>/`, repo root):** every Claude Design download
  goes into its own new dated folder; existing folders are never overwritten. Design
  folders are **proposals, not binding** — a design element counts as Decided only once
  confirmed by the user and recorded in a component spec (`docs/design/components/`).
- **`v1-reference/HANDOFF.md`** — design system handoff document.
  Originally written for V1 migration context (refers to "porting JSX
  to vanilla", phase plan for V1 modernization). For V3, ignore the
  porting guidance and phase plan — V3 uses JSX directly via Preact
  and follows the slice plan in the "Slice progress" table below. Still
  valuable for: JSX-file index, design intent (type-color spine,
  depth stack, multi-cue mode), token-system rationale.

---

## Architecture (non-negotiable)

- **Stack**: Preact + TypeScript + Vite. No React, no other framework.
- **State**: central store — **Preact Signals** (decided Slice 1).
  Signals live in `src/state/store.ts`. Components read via `.value`
  or auto-subscribing JSX binding. Mutations via exported setter
  functions (e.g. `addPlayingPad`, `removeLoopingPad`).
- **Persistence**: IndexedDB. V1 `library` store preserved; `boards`
  store added for Board documents (Scenes and Pads embedded as JSON).
  Sets store deferred to Slice 6.
- **Preferences**: `localStorage` (small UI state, theme choice, etc.)
- **PWA**: managed via `vite-plugin-pwa`. No manual `sw.js`. Auto-
  generated SHELL list, auto-bumped version on build.
- **Audio engine**: V1's engine code, copied unchanged into V3 and
  wrapped behind a typed facade in `src/audio/`. Do not redesign.

---

## Supported Platforms (Minimum)

**Primary target:** iPhone 13 Pro (iOS 17/18) with Brave browser.

**Minimum supported versions:**
- iOS Safari 15+ (iPhone 6s, 2015, and newer)
- Android Chrome 100+ (~2022 and newer)
- Desktop: current Chromium, Firefox, Safari (last 2 major versions)

**Available modern features (all supported on minimum):**
- Pointer Events API (iOS 13+)
- IndexedDB
- Web Audio API (with user-gesture unlock)
- Service Worker / PWA (Add to Home Screen)
- CSS `clamp()`, `prefers-reduced-motion`
- IntersectionObserver, ResizeObserver

**Features requiring graceful degradation:**
- Container Queries (iOS 16+) — fall back to Media Queries on iOS 15
- View Transitions API (iOS 18+) — optional polish only; never a hard dep

**Features explicitly avoided (not supported on minimum):**
- **HTML5 Drag-and-Drop on iOS — always use Pointer Events instead.**
  `draggable`, `ondragstart`, `ondragover`, `ondrop` are not supported
  on iOS Safari/Brave. Any DnD interaction (pad-to-pad, library-to-grid,
  future scene reorder etc.) MUST use Pointer Events.
  Pattern: see `src/lib/padDnd.ts` (pad DnD) and `src/lib/libDnd.ts` (library DnD).
- Anything requiring iOS 17+ as a hard dependency

**Why this section exists:**
During Slice 3, Path B (library → grid drag) was accidentally implemented
with HTML5 DnD. It worked on desktop but was silently broken on the primary
target (iPhone + Brave). The fix required a new `libDnd.ts` module.
Having explicit platform constraints prevents the same category of bug
in future slices.

---

## iPhone / iOS Safari — memory & stability rules (CRITICAL)

iOS Safari kills the tab when JS heap exceeds ~600 MB (older iPhones)
or ~1–1.5 GB (newer). This is V1's hardest-won lesson and applies
identically to V3. Every code path touching IndexedDB or audio must
respect these limits.

### Core principles (carried over from V1)

1. **Never load all audio buffers into RAM.** Library listing,
   filtering, renaming — none of these need the audio data. Use a
   metadata-only query.
2. **Never decode audio in parallel.** Decode one file at a time;
   release the previous buffer before starting the next.
3. **Never store raw audio in component state or working arrays.**
   Store only `{name, hash, size}` references; lazy-load buffers via
   the database helper on demand.
4. **Never JSON-load the entire library at once for export.** Stream
   one entry at a time into a Blob.
5. **Always release decoded buffers** after playback ends (`onended`
   handlers must null out `s.buffer`).
6. **Always null large strings** (base64, JSON) immediately after
   parsing — don't wait for GC.
7. **Cap the buffer LRU cache.** V1 used 150 MB; V3 inherits this
   limit unless deliberately reconsidered with the user.

### V3-specific implementation notes

The function names from V1 (`libGetAll`, `libGetAllMeta`,
`_ensureLibBuf`, etc.) are V1's. V3 will have differently-named
equivalents in TypeScript. The **patterns are non-negotiable** even
if the names change. When porting any V1 audio/IDB code:

- Read the V1 implementation first
- Identify which of the seven principles above it implements
- Implement the V3 equivalent preserving the principle
- Document the new function name in this file under "V3 audio/IDB API"
  (added by Claude Code when the code is written)

### Banned patterns (regardless of name)

| Pattern | Why | Replacement principle |
|---------|-----|----------------------|
| Loading all library buffers for any non-playback purpose | 150–240 MB into RAM | Metadata-only cursor |
| Parallel `decodeAudioData` over N files | N × 50–100 MB PCM = OOM at N > 10 | Serial decode, release between |
| Storing raw audio in working state arrays | Holds compressed + decoded copies | Store `{name, hash, size}`, lazy-load |
| Loading full library JSON for export | 150–300 MB string in RAM | Stream entries one at a time |
| `FileReader` loop in parallel for N files | N parallel reads + N parallel decodes | Serial file processing |

### When adding any new code that touches audio or IDB

Ask: "Does this load all audio buffers at once? Does this trigger
parallel decodes? Does this hold raw audio in working state?" If yes
to any → refactor before shipping.

---

## Design language

### Tokens

Use the design system tokens from `v3/src/styles/tokens.css` (canonical
source; `SoS_DESIGN_25052026/tokens.css` is the design-handoff reference
and has diverged). Never hardcode colors, fonts, or spacing.

### Color palette (canonical names from design system)

```
--night, --deep, --surface, --raised, --border
--gold, --gold-dim, --gold-bright, --gold-soft
--flame, --blood, --blood-bright, --blood-soft
--text, --text-dim, --text-mute, --text-strong
--mode-setup, --mode-game
--pad-single, --pad-loop, --pad-playlist, --pad-combo
  (each with -soft and -glow variants)
```

### Color code rule (never mix)

- SETUP mode = teal/cool (`--mode-setup`)
- GAME mode = gold/warm (`--mode-game`)

### Typography

- `--font-display` — titles only, Press Start 2P-like
- `--font-ui` — UI labels, buttons, headings, VT323-like
- `--font-mono` — body, descriptions, filenames, Share Tech Mono-like

### UI rules

- No emojis. Use Unicode/ASCII glyphs from the design's icon system.
- Every delete button: 2-tap confirmation (first tap shows confirm
  state, second tap executes)
- All counts/labels: dynamic from data, never hardcoded
- Scroll position of overlays/list views: save and restore on re-open
- Minimum touch target on all interactive elements: 44px (iOS guideline)
- `overscroll-behavior: none` on all fixed overlay panels
- `-webkit-overflow-scrolling: touch` on all scroll containers

---

## Permanent coding standards

- **TypeScript strict mode**. No `any`. If a type is hard to express,
  ask the user before resorting to `unknown` or assertions.
- **Single Source of Truth for components**: one function per UI
  element type, variants via props. Never parallel components for
  "slightly different" needs. If tempted, ask.
- **Delete buttons**: always 2-tap confirmation.
- **JSX safety**: Preact auto-escapes children. Do not bypass this
  with `dangerouslySetInnerHTML` unless absolutely required and
  approved.
- **IndexedDB access**: through typed helpers only. Never raw
  transactions outside the `src/db/` layer.
- **Waveform data**: computed at upload time and stored alongside
  the audio entry. Use stored peaks; only re-decode as fallback for
  legacy entries.
- **Library entries**: always `{name, hash, size, peaks?}` shape in
  working memory. Never raw audio in working state.
- **CSS class vs. inline style — four paths** (see also `DESIGN_SYSTEM_CHEATSHEET.md §Decision tree`):
  Before adding `style={}` or a new `class=`, pick the right path:
  - **Path A — use existing class:** Consult `DESIGN_SYSTEM.md §6` first. If an `sb-*` or
    `is-*` class fits, use it. Checking §6 before creating any new class is mandatory — not
    optional.
  - **Path B — create new class:** No existing class fits **and** the value is structural or
    reusable. Create a new `sb-*` class: follow naming conventions (ADR-0021), use design
    tokens (ADR-0022), add `/* @inventory: … */`, register in §6 in the same commit. Check
    §6 first for a class with similar function — extend (e.g., `is-*` variant) rather than
    duplicate. If duplication risk is unclear, raise the question. Layout-only structures
    (flex/gap/align-only wrappers) belong in named layout primitives — see
    `DESIGN_SYSTEM.md §5a` for the canonical list (`sb-row`, `sb-col`, `sb-flex-1`,
    and variants) — not inline exceptions.
  - **Path C — inline = dynamic only:** `style={}` is legitimate only for values computed at
    runtime: animation coordinates, drag positions, data-driven dimensions, state-dependent
    values. Test: "can this value be written as a CSS string literal without referencing
    runtime data?" If yes → it belongs in a class, not inline.
  - **Path D — forbidden:** Inline styles for static values. Covers three sub-cases:
    - Token-using values: `style={{ color: 'var(--flame)' }}` is the same violation as
      `style={{ color: '#F5A623' }}` — the token reference does not make it Path C.
    - Static layout values: `style={{ display: 'flex', gap: 8 }}` — use a layout primitive
      class (Path B), not an inline exception.
    - Mixed blocks: `style={{ display: 'flex', color: 'var(--gold)' }}` — the whole block is
      Path D; there is no loophole of attaching a structural property to a layout one.

  **Canonical example** (`sb-creation-popover-section` drift case):
  ```tsx
  // Bad — Path D: static structural values; sb-creation-popover-section already exists
  <div style={{ padding: '8px', borderTop: '1px solid var(--border-soft)' }}>

  // Good — Path A: use the existing class
  <div class="sb-creation-popover-section">

  // Bad — Path D: static layout value (no inline exception for layout)
  <div style={{ display: 'flex', gap: 6 }}>

  // Good — Path B: use / create a layout primitive class
  <div class="sb-row">

  // Good — Path C: value is computed at runtime
  <div style={{ transform: `translateX(${dragOffset}px)` }}>
  ```
- **Inline-style audit:** `npm run audit:inline-styles` reports all `style={}` blocks
  classified against the four-path rule (pure-layout / structural / mixed / dynamic /
  custom-setter / unclassified). Non-blocking; runs in CI as informational. Use it to
  measure inline-style drift after any migration pass, or any time you want to check
  whether new violations crept in. Post-Session-3 baseline (2026-06-05):
  0 Path-D violations (2 unclassified remain).

---

## Evidence Requirements (non-negotiable)

Introduced after six wrong repo-state/process incidents, one nearly destructive —
these are mechanical obligations, not principles.

**E1 — Existence/location:** Before asserting a file/section exists, does not exist,
or is at a specific path: run `pwd && find . -iname "<name>"` (or `grep -n` for
sections) from repo root. No stderr suppression — a mistyped path must fail visibly,
not look like absence. Paste the output inline before the claim. No command+output block shown = claim not allowed.

**E2 — File creation:** Before proposing to create any file: paste
`pwd && find . -iname "<filename>"` output proving absence. No find output =
plan-format error. (Highest blast radius — overwrite/duplication risk.)

**E3 — Implementation status:** Any plan row claiming code is implemented / not
implemented / deferred: add a `Code evidence:` sub-item (grep or Read file:line).
BACKLOG ✅, DESIGN_NOTES, and commit messages are claims to verify, never code evidence.

**E4 — Execution-time scope:** If execution requires touching a file not on the
plan's **Files touched** list: STOP, report file + reason, wait for go-ahead. No
"trivially correct" exceptions.

**E5 — Section citations:** Citing a §-number or specific text requires quoting the
actual text verbatim from a fresh Read — no paraphrase from memory.

**E6 — Approval integrity:** Execution requires explicit approval of the specific
plan version presented. If approval status is uncertain — tool failure during plan
handoff (e.g. ExitPlanMode error), compacted context, or only generic continuation
signals ("go on", "continue", "weiter") — re-present the plan (summary + Files
touched) and obtain explicit approval first. Generic continuation prompts are
never plan approval.

### Plan format (Plan-Mode plans)

Every Plan-Mode plan must contain two named sections:

**`### Evidence`** — all E1/E2/E3/E5 proofs collected. If the plan makes no
existence/status/citation claims: `Evidence: no existence/status claims in this plan`
— never silently absent.

**`### Files touched`** — complete enumeration of files the plan deliberately edits;
any non-doc file flagged ⚠ for approval. Routine additionally: `v3/src/lib/changelog.ts`
(version bump); files regenerated by `npm run sync:docs` — no ⚠ needed.

---

## Workflow rules

1. **Read `V3_CONCEPT_BRIEF.md` at session start.** It is the binding
   architecture document.
2. **Before implementing any change**: explain the plan and design
   context, wait for confirmation.
3. **"Kannst du X?" is a question** — answer first, wait for go-ahead
   before implementing.
4. **Vertical slices**: build complete vertical features (UI + state
   + persistence), not horizontal layers. Slice plan: "Slice progress"
   table in this file (single source).
5. **After every feature or fix**: verify manually, then
   `git add . && git commit -m "..." && git push`
6. After every push: paste the **literal output** of `git --no-pager show --stat HEAD`
   verbatim in the summary — not a prose description of the file list. Also include what
   changed and what was verified.
7. **Update this CLAUDE.md** when permanent standards change.
8. **Testing**: see `TESTING.md` for full test architecture, commands, and
   conventions. Phase 2 testing infrastructure is complete:
   - Pre-commit: sync:docs (auto-stage) + build + lint + unit tests + smoke E2E + link:check
   - CI: GitHub Actions `tests.yml` runs unit + lint + size + docs sync check + link check + full E2E
   - Deploy is gated on green `tests.yml` run (via `workflow_run`)
9. **Design→code imports**: all Claude Design output entering production code must pass
   the import gate (5-point check: Path-D styles, class-name registries, hex/px literals,
   TODO-CLASS markers, token existence) — see ADR-0046. Session spec for production-near
   design sessions: `docs/design/CLAUDE_DESIGN_SPEC.md`.
   **Scope of Claude Design (user decision 2026-09-28):** Claude Design is used only for
   visual styling — buttons, colors, typography and similar element-level appearance.
   Layout, screen structure and adaptive behavior are designed and built together
   directly in code, not via Claude Design prototypes.
10. **Visual Regression**: Runs automatically in the pre-push hook on macOS.
    Additionally useful before UI-relevant commits (components, CSS, tokens):
    `cd v3 && npm run test:e2e:visual`
    Check for unexpected diffs. If change is intentional: update baselines
    with `npm run test:e2e:update-snapshots` and commit the new `.png` files.
    Visual tests are macOS-only (Ubuntu CI excluded — font rendering differs).
11. **Lint + Format**: ESLint and Prettier are configured. Before committing
    any TypeScript/TSX: `npm run lint` must exit 0. Format with
    `npm run format` if needed. CI enforces both.
12. **Architecture Decision Records**: Bei jeder substantiellen Architektur-
    Entscheidung (Datenmodell, Persistenz, Cross-Cutting-Pattern, Plattform-
    Annahmen, neue Infrastruktur) ein ADR in `docs/architecture/` anlegen.
    Format laut `docs/architecture/_template.md`. Index in
    `docs/architecture/README.md` ergänzen. Verstreute Architektur-Notizen in
    `DESIGN_NOTES.md` sind keine ADRs — `DESIGN_NOTES.md` dokumentiert
    Design-Detail-Entscheidungen; `docs/architecture/` dokumentiert
    Architektur-Entscheidungen.
    **Neues ADR-Header-Feld:** `**Category:**` (nach `**Slice:**`) — eines der
    8 kanonischen Werte; Generator-Fehler wenn fehlend → "Unkategorisiert".
13. **Auto-generierte Inventuren**: Vier Sections werden per Generator befüllt —
    nie manuell editieren:
    - `docs/architecture/README.md §Index` — via `npm run sync:adr`
    - `DESIGN_SYSTEM.md §6` (sb-*-Klassen) — via `npm run sync:classes`
    - `DESIGN_SYSTEM.md §A` (Tokens) — via `npm run sync:tokens`
    - `TESTING.md §Test-Inventar` (Specs je Projekt, Unit-Tests) — via `npm run sync:tests`
    Der Pre-Commit-Hook führt `sync:docs` automatisch aus und staged die
    Ergebnisse. Zum manuellen Aktualisieren: `cd v3 && npm run sync:docs`.
    Neue sb-*-Klassen dokumentieren mit `/* @inventory: Beschreibung */`
    am CSS-Selektor. Neue Tokens bekommen ihre Beschreibung aus dem
    Inline-Kommentar nach dem Semikolon in `tokens.css`.
14. **Open work items**: All deferred items and known limitations are tracked in
    `BACKLOG.md` (repo root). Slice plans should consult and update it. At each
    slice completion, before the final commit: mark completed items `✅ Done (commit SHA)`
    and add any new deferred items surfaced during the slice.
15. **Test infrastructure first (user decision 2026-09-29):** a safe, trustworthy test
    environment has the highest priority. Gaps found in the test setup (unassigned or
    skipped specs, untested critical modules, env drift) are closed **before** feature work
    continues. New E2E specs must be listed in `v3/tests/e2e/projects.ts` (guard test).
    Flaky tests follow the quarantine procedure in `TESTING.md` — never silently skipped.

### Pre-commit checklist (mandatory before ANY commit)

Applies to slices, refactors, audit passes, bugfixes — every commit
without exception:

> **Automatisch erzwungen** (Phase 2 + Doku-Sync): Husky-Pre-Commit-Hook führt
> sieben Gates in Folge aus und blockt bei Fehler:
> 1. `npm run sync:docs` + `git add` (~1s) — Auto-generierte Docs; Ergebnis wird automatisch gestaged
> 2. `npm run build` (tsc + vite, ~4s)
> 2a. `npm run typecheck:scripts` (~1s) — Typprüfung von `scripts/*.ts` (Generatoren/Audits außerhalb von `v3/`)
> 3. `npx lint-staged` — Prettier + ESLint nur auf gestageten Dateien; auto-fix + re-stage
> 4. `npm run test` (vitest, ~1s)
> 5. `npm run test:e2e:smoke` (Chromium + WebKit, ~6s)
> 6. `npm run link:check` (markdown-link-check, ~1s) — tote interne Links
>
> CI führt zusätzlich `npm audit --audit-level=high` (blockierend), `test:coverage` (Coverage-Untergrenze), `format:check`, `lint`, `sync:docs` (+ `git diff --exit-code`) und `link:check` aus.
>
> Das manuelle Vorgehen unten bleibt als Baseline dokumentiert.
> Nach `git clone`: `cd v3 && npm install` aktiviert den Hook automatisch.

### Pre-push gate (mandatory before every push)

> **Automatisch erzwungen**: Husky-Pre-Push-Hook läuft bei `git push` und blockt bei Fehler:
> 1. **Version-Bump-Check** (~0s) — `APP_VERSION` in `v3/src/lib/changelog.ts` muss sich gegenüber `origin/main` geändert haben (one push = one version bump); übersprungen wenn `origin/main` nicht erreichbar (Erstpush)
> 2. `npm audit --audit-level=high` (~2s) — Sicherheitslücken high/critical blockieren
> 3. `npm run size` (~2s) — Bundle-Size-Limit (200 kB JS / 50 kB CSS gzip)
> 4. `npm run test:e2e:all` (~3 min) — alle sechs Dev-Server-Projekte: smoke + smoke-webkit + full + full-webkit + mobile + mobile-chromium
> 5. `npm run test:e2e:prod` — Build, dann smoke + full + pwa gegen den fertigen Build (`vite preview`, Service Worker)
> 6. **Nur macOS:** `npm run test:e2e:visual` (~15s) — visuelle Regression
>
> Schlägt ein Schritt fehl: **erst Fehlerausgabe/Report lesen, dann neu starten** (ein neuer Lauf überschreibt den Report).
>
> Bypass (bewusst): `git push --no-verify` — für Notfälle oder wenn der Hook bereits lokal grün verifiziert wurde.
> Der pre-push-Hook schließt die Lücke zwischen lokalem pre-commit (nur smoke) und CI (smoke + full + mobile).
> Nach `git clone`: `cd v3 && npm install` aktiviert den Hook automatisch.

0. **Bump `APP_VERSION` + CHANGELOG-Eintrag** in `v3/src/lib/changelog.ts` — vor jedem Push erforderlich, im selben Commit wie die Änderung. Wird vom Pre-push-Hook erzwungen.
1. `cd v3 && npm run build` — must exit 0 with zero TypeScript errors
2. `git add` the relevant files, then `git commit` — lint-staged auto-formats + lints staged files
3. `cd v3 && npm run test` — all unit tests must pass (exit 0)
4. `cd v3 && npm run test:e2e:smoke` — 10 smoke tests must pass
5. `cd v3 && npm run dev` — must start without errors (verify briefly)
6. Only then: `git push`

If any check fails: **do not commit**. Report the failure, ask for direction.

> **Plan-Mode commit gate:** Before committing Plan-Mode work, run
> `git diff --cached --name-only` and compare against the plan's **Files touched**
> list. Any file not on it → abort and report before committing.
> Standing exceptions:
> — outputs of `npm run sync:docs` (whichever files the script stages)
> — `v3/src/lib/changelog.ts` (version bump)
> Non-Plan-Mode work is covered by the post-push `--stat` summary (Workflow rule 6).

### Manual verification before commit

After build passes, manually verify the slice's user-facing functionality:

1. Run `npm run dev` and open the app in a browser
2. Walk through the user flow the slice introduced or modified
3. Document in the commit message OR in chat: which flows were verified

**Example:** "Verified: StartScreen loads, LIBRARY button opens Library,
IMPORT loads audio file correctly, files appear in list with waveform,
rename via input works, 2-tap delete removes file from list and IDB."

**Why:** Build success means "compiles", not "works". Logic bugs, UI bugs,
and persistence bugs don't fail the build but break functionality. Manual
verification is the only way to catch them before commit.

**Scope:** Verify the flows the slice touched, not the whole app. A Slice 2
commit doesn't need to verify Slice 1 functionality unless Slice 2 modified
shared components.

**If verification fails:** Do not commit. Fix the bug, re-verify, then commit.

### Slice completion checklist (additional, on top of pre-commit)

Before committing a slice, also:

1. Manually verify the slice's user-facing flows (see section above)
2. **Unit tests must be green**: `npm run test` exit 0
3. **New logic modules need unit-test coverage**: every module in `src/lib`,
   `src/state`, `src/db`, `src/audio` needs `tests/unit/**/<name>.test.ts` or a
   justified entry in the EXEMPT list of `tests/unit/testGuards.test.ts` (enforced).
   No coverage required for UI components or event handlers.
3a. **Test review** (rule 15): new user flows are covered by E2E tests (Chromium,
   and `full-webkit` where no playback is needed); every new test was counter-checked
   (break the code → red); guards are green; no quarantine without a BACKLOG entry;
   raise the coverage floor in `vitest.config.ts` to the new measured values (rounded down).
4. Update CLAUDE.md "Slice progress" table with completion date
5. **Update BACKLOG.md**: mark completed items `✅ Done (commit SHA)`, add any
   new deferred items surfaced during the slice.
6. **For slices touching audio (`src/audio/`), IDB (`src/db/`), or file-handling
   (import/export):** run through `docs/MANUAL_IPHONE_CHECKLIST.md` before the final
   commit. These checks cannot be automated in Playwright and have caught iOS-only bugs
   (audio playback, file picker, tab-switch lifecycle) that passed all automated tests.
7. **Remind the user to push.** After the final commit of a slice or sub-session, output
   a brief reminder: "N commits are unpushed — consider `git push` to back up work on
   GitHub and (if app code changed) trigger the Pages deployment." Do NOT push
   automatically — the user triggers the push after reviewing what's going out. Rationale:
   this is a public repo with live deployment; pushes should be consciously initiated, not
   automated. Committed work is not backed up until pushed.
   _Applies equally to CSS Class Discipline sub-sessions and any other multi-commit
   doc/tooling sessions._

---

## Build & dev commands

All commands run from the `v3/` subdirectory:

```bash
cd v3 && npm run dev           # dev server → http://localhost:5173 (HMR); E2E tests start their own server on 5199
cd v3 && npm run build         # production build → v3/dist/ (tsc + vite)
cd v3 && npm run preview       # serve v3/dist/ locally for PWA testing
cd v3 && npm run test          # unit tests (vitest, once) — run before commit
cd v3 && npm run test:watch    # unit tests in watch mode (while developing)
cd v3 && npm run test:e2e      # smoke + smoke-webkit + full E2E (Playwright); pre-push runs test:e2e:all (adds mobile)
```

See `TESTING.md` for the full test architecture and conventions.

---

## V3 audio/IDB API

Canonical entry points for the IDB layer (`src/db/idb.ts`).
Use only these functions — never raw IDB transactions outside `src/db/`.

```typescript
// ── Library (src/db/idb.ts) ───────────────────────────────────────────────
libGetAllMeta(): Promise<LibraryItemMeta[]>
  // Cursor-based enumeration — blob never loaded, iOS-safe for any library size.
  // Call at app boot; populates libraryItems signal.

libGet(id: string): Promise<LibraryItem | null>
  // Returns full entry including Blob. Only call for playback (Slice 4+).
  // Caller must release reference after use.

libPut(item: LibraryItem): Promise<void>
  // Upsert. Called once per file during upload (after peaks computed).

libDelete(id: string): Promise<void>
  // Delete by SHA-256 hash-id.

libRename(id: string, newName: string): Promise<void>
  // Reads full entry (Blob briefly in RAM), patches name, re-puts.
  // IDB has no partial-update; this is the correct pattern.
```

Upload pipeline (`src/lib/upload.ts`):

```typescript
processFilesSerial(files: File[]): Promise<void>
  // Serial decode (never parallel). Calls addLibraryItemMeta() per file
  // for live UI progress. Sets uploadStatus signal on completion.

computeHash(buf: ArrayBuffer): string
  // SHA-256 via @noble/hashes (no Secure Context required — works on iPhone LAN).

computePeaks(decoded: AudioBuffer, N?: number): number[]
  // N=30 peaks from channel 0. Call before nulling decoded buffer.
```

```typescript
// ── Boards (src/db/idb.ts) ───────────────────────────────────────────────
boardGetAll(): Promise<Board[]>
  // Load all boards (JSON-only documents, no blobs). Called at app boot;
  // populates boards signal. iOS-safe: boards contain no audio data.

boardGet(id: string): Promise<Board | null>
  // Load a single board by ID. Used for optimistic reads before edits.

boardPut(board: Board): Promise<void>
  // Upsert entire board document (Board + embedded Scenes + Pads).
  // TRADE-OFF: any pad/scene edit rewrites the full ~50KB document.
  // Acceptable at 5×16 pads; see DESIGN_NOTES.md "Slice 8 / Performance"
  // for optimisation path if measured to be a bottleneck.

boardDelete(id: string): Promise<void>
  // Delete board and all embedded scenes/pads in one operation.
```

---

## Slice progress

| # | Name | Status | Date | Notes |
|---|------|--------|------|-------|
| 1 | Project setup + StartScreen | ✅ Complete | 2026-05-27 | Vite + Preact + TS scaffold; tokens.css; PixelIcon; TopBarV2; StatusBarV2; StartScreen; Preact Signals store; PWA config |
| 2 | Library + LibraryItem CRUD | ✅ Complete | 2026-05-27 | idb + @noble/hashes; LibraryItemMeta/LibraryItem split; serial upload pipeline; AudioRow; Waveform; 2-tap delete; rename via <input>; 2-column layout; 4 tabs |
| 3 | Board + Scene + Pad CRUD | ✅ Complete | 2026-05-27 | Board CRUD (BoardListScreen), Scene CRUD (SceneRail, inline rename, duplicate, reorder, delete+undo), Pad CRUD (3 paths: tap-slot popover, library drag, ADD PAD), Pad DnD (SWAP+INSERT), PadTypeConfirmDialog (v23 Option C), ModeToggle with sparks, SETUP/GAME modes, empty states **Correction 2026-09-29:** scene/deck reorder was never built (listed here by mistake); see BACKLOG "Deck reorder". |
| 4 | Audio playback | ✅ Complete | 2026-05-28 | Discriminated union (ADR-0042), engine.ts/index.ts/types.ts (ADR-0044), iOS hacks + LRU 150 MB (ADR-0043), all 4 pad types, Signal bridge, TAP TO UNLOCK wired, is-hot/is-looping CSS classes |
| 5 | Scene switching | ↷ Superseded | 2026-09-28 | May plan — replaced by 9 + 13 (see mapping below) |
| 6 | Sets + Quick Access | ↷ Superseded | 2026-09-28 | May plan — sets dropped; quick-access bar → 9 + 13 |
| 7 | Template export/import | ↷ Superseded | 2026-09-28 | May plan — replaced by 10 |
| 8 | Settings, themes, polish | ↷ Superseded | 2026-09-28 | May plan — replaced by 14 (layout items → 13) |
| 9 | Data model | ⬜ Pending (next) | — | Pad pool + decks, rename Scene → Deck (UI, code, stored data), Playlist → Loop, multi-file Single/Loop (PRODUCT.md §5). ADR required. V3 data may be wiped (only test data): delete **only** the `sos-v3` database — never origin-wide storage (V1's `botc` DB shares the origin `fabjun.github.io`). |
| 10 | Data backup & import | ⬜ Pending | — | Single-file export/import, V1 import incl. all library audio, piecewise reading, persistent storage, last-backup indicator (`docs/product/features/data-backup.md`) |
| 11 | Combo editor | ⬜ Pending | — | Minimal first version, then towards V1 scope and beyond (PRODUCT.md §5 Combos) |
| 12 | Live control | ⬜ Pending | — | Numpad K1–K14, STOP ALL, pause, Wake Lock, mode switch stops sounds, Lock (PRODUCT.md §3, §6). Goal: first real game night with V3 (laptop / tablet) |
| 13 | Adaptive layout | ⬜ Pending | — | Smartphones in general (not only iPhone): deck switcher, All pads, quick-access bar, search/sort bar, PAD card format + zoom (`docs/design/components/pad.md`) |
| 14 | Settings & polish | ⬜ Pending | — | Settings screen, Settings options from PRODUCT.md P2, themes |

**Re-plan 2026-09-28 (numbering rule):** Slices 5–8 of the May plan are superseded; their numbers
are **never reused**. Every existing reference to "Slice 5–8" (BACKLOG, ADRs, DESIGN_NOTES, code
comments) keeps meaning the May plan. Mapping old → new:

| Old (May plan) | New |
|---|---|
| 5 Scene switching | 9 (model) + 13 (deck switcher UI) |
| 6 Sets + Quick Access | sets dropped; quick-access bar → 9 (model) + 13 (UI) |
| 7 Template export/import | 10 |
| 8 Settings, themes, polish | 14; layout-related items → 13 |

**Deviations from plan:**
- State manager chosen: Preact Signals (confirmed by user, Slice 1).
- App renamed from `app.tsx` kept as-is (Vite scaffold default); imported with lowercase `./app`.
- `LibraryItem.blob` never stored in Signals: type split into `LibraryItemMeta` (in state) + `LibraryItem` (IDB only).
- SHA-256 uses `@noble/hashes/sha2.js` (not Web Crypto API) — required for iPhone LAN dev server (no Secure Context at http://IP).
- Library screen is 2-column in Slice 2; inspector panel deferred to Slice 8+.
- Slice 3: Board persistence as full JSON document (Board + Scenes + Pads); trade-off documented in idb.ts and DESIGN_NOTES.md.
- Slice 4: `stopPad(padId, immediate, fadeOut?)` takes explicit fadeOut parameter — engine doesn't hold a Pad reference after playback starts; callers pass `pad.fadeOut`. Pad-on-stop fadeOut is effectively 0 in Slice 4 (Slice 8 refinement).
- Slice 4: Infinite loops only (no loopCount > 0 support); crossfade is a stub (`stop(from)` + `play(to)`).
- Slice 4: `audio.spec.ts` added to FULL_TESTS in playwright.config.ts.
- Slice 3: `libDragItemId` state removed from BoardScreen — PadGrid reads drag payload directly from `e.dataTransfer`, not from Preact Signals state.
- Slice 3: `Waveform` component has no `width` prop (fills flex container); fixed in PadEditorPanel, LibraryPanel, PadCreationPopover.
- Phase 2 (Testing Infra): `@size-limit/preset-app` replaced with `@size-limit/file` — preset-app uses Chrome for timing (crashes on this ARM mac due to estimo/chromium issue); file plugin measures gzip size only, which is what we need.
- Phase 2: Visual regression baselines are macOS-only (`*-darwin.png`); excluded from CI (Ubuntu font rendering differs).
- Phase 2: `no-unused-vars: 'off'` in eslint.config.js — handled by `noUnusedLocals: true` in tsconfig.app.json. Re-enable if tsconfig flag is ever disabled.
- Phase 2: deploy-pages.yml uses `workflow_run` (not `needs`) for cross-workflow sequencing — `needs` only works within the same workflow file.
