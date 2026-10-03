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
- **Origin repo (V1)**: `Fabjun/botc-soundboard` — **private since 2026-09-29**, V1 live site
  offline. Complete local archive outside this repo: `~/dev/archive/botc-soundboard.git`
  (mirror, full history) + checkout `~/dev/archive/botc-soundboard/` (incl. V2 in `v1_5/`).
  Never copy it into this public repo.
- **V3 stack**: Preact + TypeScript + Vite, PWA
- **Primary target device**: iPhone + Brave browser + Bluetooth Numpad
  (Logilink ID0212v2)
- **Secondary**: laptop/desktop
- **Project language**: **English only** — app UI, code, comments, docs, commit messages,
  tool/hook/CI messages (user decision 2026-09-29; German legacy text is translated in the
  structure clean-up, stage 4)
- **Chat with the user**: German only
- **License and status**: V3 is a private tool under an "All Rights Reserved" license (see `LICENSE`). A potential commercial product in the long term. No open-source contributions planned. When adding code, make sure no open-source licenses are violated. Contact: soundboard_of_storytelling@pm.me

---

## Guiding priorities (user decision 2026-09-29)

1. **Safety** — a trustworthy test environment and secure development and deployment
   come first (Workflow rule 15, `docs/development/testing.md`).
2. **Structure and clarity** — work strictly structured. One uniform scheme for everything
   of a kind (file and folder names, code identifiers, components, CSS classes, test IDs,
   docs, commit messages) is the minimum:
   - never introduce a second style next to an existing one;
   - no scheme yet → propose one (ADR) before adding more of that kind — based on
     researched current industry standards (name the sources; deviate only with a reason);
   - inconsistency found → report it and plan the clean-up, never extend it;
   - guard schemes with tests where feasible (`testGuards`, `docsGuards`, `codeGuards`, lint rules);
   - exceptions follow one scheme (ADR-0053): rule + reason, temporary ones also
     `BACKLOG "…"`; all are listed in the generated `docs/development/exceptions.md`;
   - documentation stays current by checks, not by memory (ADR-0056): links and anchors
     (`link:check`), superseded terms in active docs (Vale, `lint:docs`), paths in code spans
     must exist (full paths, no ambiguous short names; external/planned files as plain text);
   - section references are links to an anchor — in Markdown
     [testing.md §Flaky tests](docs/development/testing.md#flaky-tests-quarantine), in code
     comments `path.md#anchor` (repository-relative, no section sign); a pseudo-heading that is
     referenced becomes a real heading (docsGuards);
   - derivable facts (counts, lists of specs/steps) are generated or referenced, never typed —
     e.g. test counts live only in the generated test inventory.
3. **Features** — only on top of 1 and 2.

### Working principles (user decisions 2026-09-29)

- **Research first** — before any plan, decision, scheme or tooling choice, research the
  current industry standard / official guidance (web, not memory alone) and cite the sources
  in the plan; deviate only with a stated reason. This holds for **every** decision, large or
  small, whether it is put to the owner or taken by Claude: the recommended option is the
  researched most professional solution, with its source (user decision 2026-10-02).
- **Try to refute your own draft** — critically review every plan and result, including the
  counter-check itself (can it be vacuous or cause harm?), and improve it before presenting.
- **A repeated error is a pattern** — when an error class occurs a second time, stop fixing
  instances: find the root cause, search the whole project for further instances, remove the
  source and add a systematic check (guard, lint rule, test) so it cannot recur.

---

## Reference documents

- **File naming (ADR-0050, enforced by `docsGuards.test.ts`)** — root holds only
  `README.md`, `LICENSE`, `CHANGELOG.md`, `CLAUDE.md`; everything else in `docs/` in
  lowercase-kebab; hubs are the folder's `README.md`; dates ISO (`YYYY-MM-DD`).
- **Documentation structure (ADR-0047)** — docs are being consolidated into
  hub / leaf / template per area (`docs/product/`, `docs/design/`,
  `docs/architecture/`, `docs/development/`). New docs: English, status on
  every decision (**Decided / Open / Parked**), token names only — never
  copied values. Migration is incremental; see
  [docs/README.md §Target structure](docs/README.md#target-structure-migration-in-progress--adr-0047)
  for what is already authoritative.
- **`docs/product/README.md`** — product concept hub (in progress; filled in
  dialogue with the user). Once a section is filled, it is authoritative for
  that topic and must be read at session start. Never fill a section with
  reconstructed content without user confirmation.
- **`docs/architecture/concept-brief.md`** — binding technical architecture decisions for V3
  (stack, state, audio engine, IDB, platforms). Product concepts → `docs/product/README.md`;
  slice plan → "Slice progress" table in this file. Read first in every session.
- **V1 source** — index.html in the local archive (`~/dev/archive/botc-soundboard/`, see
  "Origin repo"; not in this public repo since 2026-09-30), reference for behavior,
  audio engine, IndexedDB schema, template export/import.
  V2 (`v1_5/` in the V1 repo, versions v1.5.x → v2.0.12; available in the local
  archive, see "Origin repo") is a short interim rewrite. **V1 and V2 are prototypes: explore
  them for behavior and ideas, never copy UI/CSS/markup 1:1** — re-implement
  in V3 idiom ([docs/product/README.md §7](docs/product/README.md#7-design-principles) P7). Only exception: the audio engine.
- **`design-sources/2026-05-25/`** — design system: tokens, JSX components.
  **Design folders (`design-sources/<YYYY-MM-DD>/`, ISO date — ADR-0050):** every Claude
  Design download goes into its own new dated folder; existing folders are never
  overwritten; downloaded file names inside are kept as delivered. Design
  folders are **proposals, not binding** — a design element counts as Decided only once
  confirmed by the user and recorded in a component spec (`docs/design/components/`).
- **`design-sources/2026-05-25/HANDOFF.md`** — design system handoff document.
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
  store added for Board documents (decks and pads embedded as JSON, ADR-0010).
  Pad sets (`Board.sets`) exist in the model only; they are replaced by the
  quick-access bar (ADR-0048).
- **Preferences**: IndexedDB too — key-value store `keyval`, loaded before the first render
  (`v3/src/state/prefs.ts`); no Web Storage anywhere (ADR-0062, owner decision 2026-10-02).
- **PWA**: managed via `vite-plugin-pwa`. No hand-written service worker (V1 had one). Auto-
  generated SHELL list, auto-bumped version on build.
- **No third-party origins at runtime** (ADR-0057): fonts and all other assets are
  self-hosted and precached; every build ships `third-party-licenses.txt` with the license
  of each production dependency. Guarded by `v3/tests/e2e/pwa.spec.ts`.
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
  future deck reorder etc.) MUST use Pointer Events.
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

| Pattern                                                  | Why                                   | Replacement principle                 |
| -------------------------------------------------------- | ------------------------------------- | ------------------------------------- |
| Loading all library buffers for any non-playback purpose | 150–240 MB into RAM                   | Metadata-only cursor                  |
| Parallel `decodeAudioData` over N files                  | N × 50–100 MB PCM = OOM at N > 10     | Serial decode, release between        |
| Storing raw audio in working state arrays                | Holds compressed + decoded copies     | Store `{name, hash, size}`, lazy-load |
| Loading full library JSON for export                     | 150–300 MB string in RAM              | Stream entries one at a time          |
| `FileReader` loop in parallel for N files                | N parallel reads + N parallel decodes | Serial file processing                |

### When adding any new code that touches audio or IDB

Ask: "Does this load all audio buffers at once? Does this trigger
parallel decodes? Does this hold raw audio in working state?" If yes
to any → refactor before shipping.

---

## Design language

### Tokens

Use the design system tokens from `v3/src/styles/tokens.css` (canonical
source; `design-sources/2026-05-25/tokens.css` is the design-handoff reference
and has diverged). Never hardcode colors, fonts, or spacing.

### Color palette (canonical names from design system)

```
--night, --deep, --surface, --raised, --border
--gold, --gold-dim, --gold-bright, --gold-soft
--flame, --blood, --blood-bright, --blood-soft
--text, --text-dim, --text-mute, --text-strong
--mode-setup, --mode-game
--pad-single, --pad-loop, --pad-combo
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
- Every area whose content can be larger than the window scrolls — nothing is cut off or hidden
  under another bar (WCAG 2.2 SC 1.4.10 Reflow; `v3/tests/e2e/layout-reach.spec.ts` scrolls with
  the mouse wheel and requires each control to be wholly visible)
- The app shows no internal plan names (slice numbers, backlog) — guarded by `codeGuards` ("the app shows no internal plan names")
- Every control works with the Tab key and has an accessible name (icon buttons: `aria-label`);
  error messages say in plain words what happened and what to do (Nielsen heuristic 9) — owner
  decision 2026-10-02; the existing screens get an audit (BACKLOG "Tab access and plain errors")
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
- **Stored state loads before the first render** (2026-10-02): library list and boards are
  loaded in `v3/src/state/boot.ts`, and `main.tsx` renders only afterwards (like redux-persist's
  PersistGate) — a load that finishes later would replace what the user created meanwhile
  (guarded by `codeGuards`: "the stored state is loaded only before the first render").
- **Suggestions are derived, choices are state** (2026-10-02): a value the app suggests (e.g. a
  pad name from the chosen file) is computed on render — never written into the same state as a
  value the user typed or picked, so it can neither overwrite a choice nor pass for one
  ([docs/design/design-notes.md](docs/design/design-notes.md), A2 Suggestion vs. pick).
- **Delayed writes are flushed, never dropped** (2026-10-02): a write that waits (auto-save
  debounce) goes through `v3/src/lib/debouncedSave.ts` and is written at once when its context
  ends — the editor closes or switches pad, the page is hidden (Chrome Page Lifecycle: persist
  unsaved state on hidden). Every file with a timer is listed with its reason (guarded by `codeGuards`: "timers are listed with their reason").
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
- **CSS class vs. inline style — four paths** (see also [design-system-cheatsheet.md §Decision tree](docs/design/design-system-cheatsheet.md#decision-tree)):
  Before adding `style={}` or a new `class=`, pick the right path:
  - **Path A — use existing class:** Consult [design-system.md §6](docs/design/design-system.md#6-component-inventory) first. If an `sb-*` or
    `is-*` class fits, use it. Checking the inventory before creating any new class is mandatory — not
    optional.
  - **Path B — create new class:** No existing class fits **and** the value is structural or
    reusable. Create a new `sb-*` class: follow naming conventions (ADR-0021), use design
    tokens (ADR-0022), add `/* @inventory: … */`, register it in the inventory in the same commit. Check
    the inventory first for a class with similar function — extend (e.g., `is-*` variant) rather than
    duplicate. If duplication risk is unclear, raise the question. Layout-only structures
    (flex/gap/align-only wrappers) belong in named layout primitives — see
    [design-system.md §5a](docs/design/design-system.md#5a-layout-primitives) for the canonical list (`sb-row`, `sb-col`, `sb-flex-1`,
    and variants) — not inline exceptions.
  - **Path C — inline = dynamic only:** `style={}` is legitimate only for values computed at
    runtime: animation coordinates, drag positions, data-driven dimensions, state-dependent
    values. Test: "can this value be written as a CSS string literal without referencing
    runtime data?" If yes → it belongs in a class, not inline. Lengths always carry their unit
    (`` `${n}px` ``, never a bare number — Preact 11 no longer appends `px`); guarded by
    `codeGuards.test.ts`.
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

**E5 — Section citations:** Citing a section or specific text requires quoting the
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

1. **Read `docs/architecture/concept-brief.md` at session start.** It is the binding
   architecture document.
2. **Before implementing any change**: explain the plan and design
   context, wait for confirmation.
3. **"Kannst du X?" is a question** — answer first, wait for go-ahead
   before implementing.
4. **Vertical slices**: build complete vertical features (UI + state +
   persistence), not horizontal layers. Slice plan: "Slice progress"
   table in this file (single source).
5. **After every feature or fix**: verify manually, then
   `git add . && git commit -m "..." && git push`
6. After every push: paste the **literal output** of `git --no-pager show --stat HEAD`
   verbatim in the summary — not a prose description of the file list. Also include what
   changed and what was verified.
7. **Update this CLAUDE.md** when permanent standards change.
8. **Testing**: see `docs/development/testing.md` for full test architecture, commands, and
   conventions. Phase 2 testing infrastructure is complete:
   - Pre-commit, pre-push and CI steps: generated tables in
     [testing.md §CI integration](docs/development/testing.md#ci-integration) (`npm run sync:steps`)
     — never list them by hand.
   - Deploy is gated on green `tests.yml` push run (via `workflow_run`) and publishes the
     exact build tested in `e2e-prod` — never rebuilds (ADR-0049)
   - Weekly: `weekly.yml` (Monday) reruns `tests.yml` + audit/outdated report; Dependabot
     PRs open > 14 days turn it red (T8c)
9. **Design→code imports**: all Claude Design output entering production code must pass
   the import gate (5-point check: Path-D styles, class-name registries, hex/px literals,
   TODO-CLASS markers, token existence) — see ADR-0046. Session spec for production-near
   design sessions: `docs/design/claude-design-spec.md`.
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
11. **Lint + Format** (ADR-0058): one Prettier config for the whole repository
    (`.prettierrc.json` at the root); ESLint covers `v3/` including `v3/scripts/`. Markdown is
    formatted by `npm run format:md`, which fails instead of changing content — fix the source
    (escape a bare `*`/`_`, a `|` in a table cell). Before committing any TypeScript/TSX:
    `npm run lint` must exit 0. Format with `npm run format` if needed. CI enforces both.
    11a. **Commit messages** (ADR-0060, proposed): Conventional Commits —
    `<type>(<scope>): <description>`, types `build chore ci docs feat fix perf refactor revert
style test`; checked by the `commit-msg` hook and for pull requests in CI.
12. **Architecture Decision Records**: for every substantial architecture decision (data
    model, persistence, cross-cutting pattern, platform assumptions, new infrastructure)
    create an ADR in `docs/architecture/`, following `docs/architecture/_template.md`; the
    index in `docs/architecture/README.md` is generated. Scattered architecture notes in
    `docs/design/design-notes.md` are not ADRs — `docs/design/design-notes.md` records design
    detail decisions; `docs/architecture/` records architecture decisions.
    **ADR header** (fixed order): `**Status:**`, `**Date:**`, `**Slice:**`, `**Refines:**`
    (`—` if none), `**Category:**` — one of the 9 canonical values listed in the template; a
    missing category shows up as "Uncategorized" in the generated index.
13. **Generated inventories**: these places are filled by generators (all run by `npm run sync:docs`) — never edit them by hand:
    - [docs/architecture/README.md §Index](docs/architecture/README.md#index) — via `npm run sync:adr`
    - [docs/design/design-system.md §6](docs/design/design-system.md#6-component-inventory) (`sb-*` classes) — via `npm run sync:classes`
    - [docs/design/design-system.md §A](docs/design/design-system.md#a-token-inventory) (Tokens) — via `npm run sync:tokens`
    - [docs/development/testing.md §Test inventory](docs/development/testing.md#test-inventory) (specs per project, unit tests) — via `npm run sync:tests`
    - [docs/development/testing.md §CI integration](docs/development/testing.md#ci-integration) (CI, pre-commit and pre-push steps) — via `npm run sync:steps`
    - `CHANGELOG.md` (whole file, from `v3/src/lib/changelog.ts`) — via `npm run sync:changelog`
    - `docs/development/exceptions.md` (exception register, whole file) — via `npm run sync:exceptions`
      The pre-commit hook runs `sync:docs` and stages the results. To refresh manually:
      `cd v3 && npm run sync:docs`. Document new `sb-*` classes with
      `/* @inventory: description */` at the CSS selector. New tokens take their description
      from the inline comment after the semicolon in `v3/src/styles/tokens.css`.
14. **Open work items**: All deferred items and known limitations are tracked in
    `docs/backlog.md`. Slice plans should consult and update it. At each
    slice completion, before the final commit: mark completed items `✅ Done (commit SHA)`
    and add any new deferred items surfaced during the slice.
15. **Test infrastructure first (user decision 2026-09-29):** a safe, trustworthy test
    environment has the highest priority. Gaps found in the test setup (unassigned or
    skipped specs, untested critical modules, env drift) are closed **before** feature work
    continues. New E2E specs must be listed in `v3/tests/e2e/projects.ts` (guard test).
    Flaky tests follow the quarantine procedure in `docs/development/testing.md` — never silently skipped.

### Pre-commit checklist (mandatory before ANY commit)

Applies to slices, refactors, audit passes, bugfixes — every commit
without exception:

> **Enforced automatically** by the Husky pre-commit hook (`.husky/pre-commit`); it blocks on
> failure. The steps are generated from the hook:
> [testing.md §Pre-commit hook](docs/development/testing.md#pre-commit-hook). CI runs more
> (coverage floor, format check, docs sync check …):
> [testing.md §Workflows](docs/development/testing.md#workflows).
>
> The manual procedure below stays documented as the baseline.
> After `git clone`: `cd v3 && npm install` activates the hook automatically.

### Pre-push gate (mandatory before every push)

> **Enforced automatically** by the Husky pre-push hook (`.husky/pre-push`) on `git push`; it
> blocks on failure. The steps are generated from the hook:
> [testing.md §Pre-push hook](docs/development/testing.md#pre-push-hook). One push = one
> version bump (`APP_VERSION` in `v3/src/lib/changelog.ts` must differ from `origin/main`).
>
> If a step fails: **read the error output / report first, then re-run** (a new run overwrites the report).
>
> Deliberate bypass: `git push --no-verify` — only for probe pushes without app code, or when the hook already ran green for exactly this state; state the reason in chat / commit message (ADR-0053).
> The pre-push hook closes the gap between the local pre-commit (smoke only) and CI (all suites).
> After `git clone`: `cd v3 && npm install` activates the hook automatically.

0. **Bump `APP_VERSION` + changelog entry** in `v3/src/lib/changelog.ts` — required before every push, in the same commit as the change. Enforced by the pre-push hook. Every item starts with a commit type. A change people can notice (`feat`, `fix`, `perf`, `a11y`) also gets a sentence in `v3/src/lib/whatsNew.ts` — plain words, what they can now do (ADR-0063; checked by `v3/tests/unit/whatsNew.test.ts`).
1. `cd v3 && npm run build` — must exit 0 with zero TypeScript errors
2. `git add` the relevant files, then `git commit` — lint-staged auto-formats + lints staged files
3. `cd v3 && npm run test` — all unit tests must pass (exit 0)
4. `cd v3 && npm run test:e2e:smoke` — all smoke tests must pass
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
   3a. **Test review** (rule 15): test cases are chosen with the
   [edge-case checklist](docs/development/testing.md#test-design-edge-case-checklist); new user flows are covered by E2E tests (Chromium,
   and `full-webkit` where no playback is needed); every new test was counter-checked
   (break the code → red); guards are green; no quarantine without a BACKLOG entry;
   raise the coverage floor in `vitest.config.ts` to the new measured values (rounded down), and
   the mutation threshold (`thresholds.break` in `v3/stryker.config.mjs`) when the weekly score rose.
4. Update CLAUDE.md "Slice progress" table with completion date
   4a. **Update `README.md`** (public, read by clients and colleagues): move finished features
   from "Planned next" to "Available now", adjust "Planned next". English, professional,
   no concrete game names, only built features under "Available now". Node version and
   live URL are guarded by `tests/unit/docsGuards.test.ts`.
5. **Update docs/backlog.md**: mark completed items `✅ Done (commit SHA)`, add any
   new deferred items surfaced during the slice.
   5a. **Structure review (~15 min, user decision 2026-09-30)** — a short retrospective on
   structure, not a full audit. Goal: every finding that can be automated becomes a check
   (guard, lint rule, generator), so the next review has less to find.
   - Read the generated `docs/development/exceptions.md`: is every new exception justified;
     is any temporary one due (its BACKLOG trigger reached)?
   - Did this slice introduce a new kind of thing (names, files, formats, IDs, references)?
     → a scheme exists (ADR) and is guarded.
   - Is any fact typed by hand that the code determines (counts, lists, step lists)?
     → generate it or reference the source.
   - Did an error class occur twice? → pattern: root cause, project-wide search, check.
   - Thresholds and runtimes: raise the coverage floor and the mutation `thresholds.break` where
     the last measurement rose — thresholds only ever go up; lowering one is an exception that
     needs the owner's decision. Read the last weekly run summary: runtimes near their limit (the
     mutation job fails from 70 % of its time limit) get a plan before they break.
   - Findings: fix now, or record in `docs/backlog.md` with a trigger.

   A **full structure audit** runs only on occasion: before a new phase (e.g. first live use),
   after large upgrades, or when the review finds a pattern it cannot settle in 15 minutes.

6. **For slices touching audio (`src/audio/`), IDB (`src/db/`), or file-handling
   (import/export):** run through `docs/development/manual-iphone-checklist.md` before the final
   commit. These checks cannot be automated in Playwright and have caught iOS-only bugs
   (audio playback, file picker, tab-switch lifecycle) that passed all automated tests.
7. **Push (user decision 2026-09-30):** work items that need no user decision — an approved
   plan, or work that follows directly from agreed rules — are committed **and pushed**
   autonomously once all gates are green; report the result with `git show --stat` and name
   any file outside the plan's file list. Stop and ask when a genuine decision is open
   (product behaviour, a new scheme or convention, trade-offs, anything irreversible or
   outward-facing beyond a normal push).

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

See `docs/development/testing.md` for the full test architecture and conventions.

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
  // Upsert entire board document (Board + embedded decks + pads).
  // TRADE-OFF: any pad/deck edit rewrites the full ~50KB document.
  // Acceptable at 5×16 pads; see docs/design/design-notes.md "Slice 8 / Performance"
  // for optimisation path if measured to be a bottleneck.

boardDelete(id: string): Promise<void>
  // Delete board and all embedded decks/pads in one operation.
```

---

## Slice progress

<!-- vale SoS.SupersededTerms = NO --><!-- reason: historical slice records keep the names valid at the time (Scene before Slice 9b) -->

| #   | Name                        | Status                                      | Date       | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------- | ------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Project setup + StartScreen | ✅ Complete                                 | 2026-05-27 | Vite + Preact + TS scaffold; tokens.css; PixelIcon; TopBar; StatusBar; StartScreen; Preact Signals store; PWA config                                                                                                                                                                                                                                                                                                                                                                |
| 2   | Library + LibraryItem CRUD  | ✅ Complete                                 | 2026-05-27 | idb + @noble/hashes; LibraryItemMeta/LibraryItem split; serial upload pipeline; AudioRow; Waveform; 2-tap delete; rename via <input>; 2-column layout; 4 tabs                                                                                                                                                                                                                                                                                                                       |
| 3   | Board + Scene + Pad CRUD    | ✅ Complete                                 | 2026-05-27 | Board CRUD (BoardListScreen), Scene CRUD (SceneRail, inline rename, duplicate, reorder, delete+undo), Pad CRUD (3 paths: tap-slot popover, library drag, ADD PAD), Pad DnD (SWAP+INSERT), PadTypeConfirmDialog (v23 Option C), ModeToggle with sparks, SETUP/GAME modes, empty states **Correction 2026-09-29:** scene/deck reorder was never built (listed here by mistake); see BACKLOG "Deck reorder".                                                                           |
| 4   | Audio playback              | ✅ Complete                                 | 2026-05-28 | Discriminated union (ADR-0042), engine.ts/index.ts/types.ts (ADR-0044), iOS hacks + LRU 150 MB (ADR-0043), all 4 pad types, Signal bridge, TAP TO UNLOCK wired, is-hot/is-looping CSS classes                                                                                                                                                                                                                                                                                       |
| 5   | Scene switching             | ↷ Superseded                                | 2026-09-28 | May plan — replaced by 9 + 13 (see mapping below)                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 6   | Sets + Quick Access         | ↷ Superseded                                | 2026-09-28 | May plan — sets dropped; quick-access bar → 9 + 13                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 7   | Template export/import      | ↷ Superseded                                | 2026-09-28 | May plan — replaced by 10                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 8   | Settings, themes, polish    | ↷ Superseded                                | 2026-09-28 | May plan — replaced by 14 (layout items → 13)                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 9   | Data model                  | 🔶 on main; slice completion checklist open | —          | Pad pool + decks, rename Scene → Deck (UI, code, stored data), Playlist → Loop, multi-file Single/Loop ([docs/product/README.md §5](docs/product/README.md#5-core-concepts)). ADR required. V3 data may be wiped (only test data): delete **only** the `sos-v3` database — never origin-wide storage (V1's `botc` DB shares the origin `fabjun.github.io`).                                                                                                                         |
| 10  | Data backup & import        | 🔶 on main; slice completion checklist open | —          | Single-file export/import, V1 import incl. all library audio, piecewise reading, persistent storage, last-backup indicator (`docs/product/features/data-backup.md`)                                                                                                                                                                                                                                                                                                                 |
| 11  | Combo editor                | 🔶 on main; slice completion checklist open | —          | Minimal first version, then towards V1 scope and beyond ([docs/product/README.md §5 Pads](docs/product/README.md#pads))                                                                                                                                                                                                                                                                                                                                                             |
| 12  | Live control                | ⬜ Pending                                  | —          | Numpad K1–K14, STOP ALL in two stages (K16), pause, Wake Lock, a visible "saving / saved" status, mode switch stops sounds, Lock ([docs/product/README.md §3](docs/product/README.md#3-app-modes-game-and-setup), [§6](docs/product/README.md#6-platforms--input)). Goal: first real game night with V3 (laptop / tablet)                                                                                                                                                           |
| 13  | Adaptive layout             | ⬜ Pending                                  | —          | Smartphones in general (not only iPhone): deck switcher, All pads, quick-access bar, search/sort bar, PAD card format + zoom (`docs/design/components/pad.md`)                                                                                                                                                                                                                                                                                                                      |
| 14  | Settings & polish           | ⬜ Pending                                  | —          | Settings screen, Settings options from docs/product/README.md P2, themes                                                                                                                                                                                                                                                                                                                                                                                                            |
| 15  | PAD editor (V1 scope)       | ⬜ Pending                                  | —          | **Runs after 11, before 12** (owner decision 2026-10-02). At least the V1 editor: waveform with playhead and PREVIEW (respects fade and trim), trim start / end, REPEAT (a loop N times — engine change: owner approval + playback check), icons (up to 4 per pad), pad templates, several files per Single / Loop (add, remove, order — the model has them since 9d, the editor still sets one file) ([docs/product/README.md §5 Pad options](docs/product/README.md#pad-options)) |
| 16  | Library                     | ⬜ Pending                                  | —          | V1 library at full scope (owner decision 2026-10-02, P8): preview, sort, groups / folders / multi-select, "in use" indicator, original filename, boards tab. Order in the plan: **Open**                                                                                                                                                                                                                                                                                            |
| 17  | Help & onboarding           | ⬜ Pending                                  | —          | Onboarding on first launch, context tips per screen (owner decision 2026-10-02, P8). Order in the plan: **Open**                                                                                                                                                                                                                                                                                                                                                                    |
| 18  | Undo / redo                 | ⬜ Pending                                  | —          | Undo and redo for edits and deletions (owner decision 2026-10-02; Nielsen: user control and freedom — undo before confirmation dialogs). Needs an ADR (command history over board writes). Order in the plan: **Open**                                                                                                                                                                                                                                                              |

**Order (owner decision 2026-10-02):** … 11 → 15 → 12 → 13 → 14 — Slice 15 was added after the
re-plan and runs before 12; numbers are identifiers, not the order. Slices 16, 17 and 18 are not
placed yet (Open). Before Slice 13: a structure step — sizes in relative units (owner decision
2026-10-02, BACKLOG "Relative units").

**Re-plan 2026-09-28 (numbering rule):** Slices 5–8 of the May plan are superseded; their numbers
are **never reused**. Every existing reference to "Slice 5–8" (BACKLOG, ADRs, DESIGN_NOTES, code
comments) keeps meaning the May plan. Mapping old → new:

| Old (May plan)             | New                                                  |
| -------------------------- | ---------------------------------------------------- |
| 5 Scene switching          | 9 (model) + 13 (deck switcher UI)                    |
| 6 Sets + Quick Access      | sets dropped; quick-access bar → 9 (model) + 13 (UI) |
| 7 Template export/import   | 10                                                   |
| 8 Settings, themes, polish | 14; layout-related items → 13                        |

### Deviations from plan

- State manager chosen: Preact Signals (confirmed by user, Slice 1).
- Root component file renamed `app.tsx` (Preact scaffold default) → `App.tsx` on 2026-09-29 to match the PascalCase component files (ADR-0052).
- `LibraryItem.blob` never stored in Signals: type split into `LibraryItemMeta` (in state) + `LibraryItem` (IDB only).
- SHA-256 uses `@noble/hashes/sha2.js` (not Web Crypto API) — required for iPhone LAN dev server (no Secure Context at http://IP).
- Library screen is 2-column in Slice 2; inspector panel deferred to Slice 8+.
- Slice 3: Board persistence as full JSON document (Board + Scenes + Pads); trade-off documented in idb.ts and docs/design/design-notes.md.
- Slice 4: `stopPad(padId, immediate, fadeOut?)` takes explicit fadeOut parameter — engine doesn't hold a Pad reference after playback starts; callers pass `pad.fadeOut`. Pad-on-stop fadeOut is effectively 0 in Slice 4 (Slice 8 refinement).
- Slice 4: Infinite loops only (no loopCount > 0 support); crossfade is a stub (`stop(from)` + `play(to)`).
- Slice 4: `audio.spec.ts` added to FULL_TESTS in playwright.config.ts.
- Slice 3: `libDragItemId` state removed from BoardScreen — PadGrid reads drag payload directly from `e.dataTransfer`, not from Preact Signals state.
- Slice 3: `Waveform` component has no `width` prop (fills flex container); fixed in PadEditorPanel, LibraryPanel, PadCreationPopover.
- Phase 2 (Testing Infra): `@size-limit/preset-app` replaced with `@size-limit/file` — preset-app uses Chrome for timing (crashes on this ARM mac due to estimo/chromium issue); file plugin measures gzip size only, which is what we need.
- Phase 2: Visual regression baselines are macOS-only (`*-darwin.png`); excluded from CI (Ubuntu font rendering differs).
- Phase 2: `no-unused-vars: 'off'` in eslint.config.js — handled by `noUnusedLocals: true` in tsconfig.app.json. Re-enable if tsconfig flag is ever disabled.
- Phase 2: deploy-pages.yml uses `workflow_run` (not `needs`) for cross-workflow sequencing — `needs` only works within the same workflow file.

<!-- vale SoS.SupersededTerms = YES -->
