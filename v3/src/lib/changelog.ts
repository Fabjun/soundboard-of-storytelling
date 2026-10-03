/**
 * @fileoverview Changelog — the per-push record for developers (ADR-0063)
 *
 * One entry per push, newest first; the pre-push hook requires a new APP_VERSION. Every item
 * starts with a Conventional Commits type (ADR-0060) — CHANGELOG.md is generated from this file
 * and groups the items by it. The app does not show this file: its release notes are
 * src/lib/whatsNew.ts, written for the people who use the app.
 */

/** One push: its version, date and the commit-style items it brought. */
export type ChangelogEntry = {
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Each item starts with a commit type, e.g. "fix(pads): …". */
  items: string[];
};

/** The version this build shows; equals the newest entry (checked by sync-changelog). */
export const APP_VERSION = '3.0.148';

/** The developer log, newest first; CHANGELOG.md is generated from it (sync-changelog). */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.0.148',
    date: '2026-10-03',
    items: [
      'docs: structure audit 2026-10-03 (A11–A23) in the backlog; review log closed — the whole review stack is on main',
      'test(guards): code names no slice of the superseded May plan; section dividers are one line — seven stale statements and 26 divider boxes fixed',
      'test(coverage): floors raised to the measured values (lines 92, statements 91, functions 94, branches 89)',
    ],
  },
  {
    version: '3.0.147',
    date: '2026-10-03',
    items: [
      'docs: the remaining 19 function doc comments start in the third person (ADR-0064); libGet is documented for export and rename too, in idb.ts and CLAUDE.md',
    ],
  },
  {
    version: '3.0.146',
    date: '2026-10-03',
    items: [
      'docs(adr): ADR-0064 code comments — TSDoc doc comments on every export, a /** @fileoverview */ block opening every TypeScript file, line comments for the why (TSDoc, Google TypeScript style guide)',
      'build(lint): eslint-plugin-jsdoc require-jsdoc and eslint-plugin-tsdoc syntax on src/ and scripts/; codeGuards checks the file overview',
      'docs: 114 exports documented, 34 TSDoc syntax errors fixed, 150 file headers in one form; stale comments corrected (grid size, popover flip height, playing pads, start of playback, deck duplicate)',
      'refactor(types): unused AppState, isSinglePad and isLoopPad removed',
      'fix(test): quarantine markers named in a comment no longer count — testGuards and the exception register share one scan (scripts/lib/test-markers.ts)',
    ],
  },
  {
    version: '3.0.145',
    date: '2026-10-03',
    items: [
      'feat(backup): EXPORT writes a ZIP archive — every audio file as it is plus the manifest backup.json (owner decision B1); our own ZIP reader after PKWARE APPNOTE 6.3.10 slices the audio out of the file',
      'feat(backup): gzip backups are unpacked by fflate on every browser, so V1 backups import on iOS before 16.4 too (owner decision B8)',
      'feat(backup): an import restores library tags — V3 tags, a V1 folder as one tag (owner decision B9)',
      'docs(adr): ADR-0061 accepted with the owner answers B1–B9; review log records the landed stack #31–#40',
    ],
  },
  {
    version: '3.0.144',
    date: '2026-10-03',
    items: [
      'fix(pads): a waiting auto-save is written when the editor closes, switches pad or the page is hidden — never dropped (PR #40, squash of editor-flush)',
    ],
  },
  {
    version: '3.0.143',
    date: '2026-10-03',
    items: [
      'feat(decks): All pads sorting remembered per board, duplicated deck after its original; refactor(prefs): UI preferences in IndexedDB, ADR-0062 (PR #39, squash of review-changes)',
    ],
  },
  {
    version: '3.0.142',
    date: '2026-10-03',
    items: [
      'feat(combo): combo editor (minimal first version), combo step model with cycle protection; a new pad or deck is selected at once (PR #38, squash of slice-11-combo-editor)',
    ],
  },
  {
    version: '3.0.141',
    date: '2026-10-03',
    items: [
      'feat(backup): export everything into one file, import V1 and V3 backups piece by piece, persistent storage, last-backup reminder (PR #37, squash of slice-10-backup)',
    ],
  },
  {
    version: '3.0.140',
    date: '2026-10-03',
    items: [
      'feat(model): Single and Loop hold several files with an order; Playlist merges into Loop; a multi-file Loop runs in the background of a combo; DB v5 (PR #36, squash of slice-9d-pad-files)',
    ],
  },
  {
    version: '3.0.139',
    date: '2026-10-03',
    items: [
      'feat(decks): pads without a deck from All pads; boards reopen in their last view (PR #34, squash of all-pads-owner-decisions)',
    ],
  },
  {
    version: '3.0.138',
    date: '2026-10-03',
    items: [
      'fix(board): every board change builds on the latest board — five lost-change bugs (PR #33, squash of board-writes)',
    ],
  },
  {
    version: '3.0.137',
    date: '2026-10-03',
    items: [
      'feat(decks): All pads view; remove a pad from one deck or delete it everywhere; deck checklist in the PAD editor (PR #32, squash of slice-9e-all-pads)',
    ],
  },
  {
    version: '3.0.136',
    date: '2026-10-03',
    items: [
      'feat(model): pad pool — pads belong to the board, decks place them; DB v4 clears test boards (PR #31, squash of slice-9c-pad-pool)',
      'build(deps): the docs link checker uses chokidar 4 — chokidar 3 pulled in braces with a high advisory (GHSA-vfj7-8cjw-p6xm) that has no fixed version',
    ],
  },
  {
    version: '3.0.135',
    date: '2026-10-03',
    items: [
      'feat: the app shows "What\'s new" — release notes in plain words, grouped into new, improved, fixed and removed (ADR-0063)',
      'docs: CHANGELOG.md in the Keep a Changelog layout, grouped by change type; older items given their commit type',
    ],
  },
  {
    version: '3.0.134',
    date: '2026-10-03',
    items: [
      'test(guards): guard rules are cited by name, never by number — the numbers shift when rules are added',
    ],
  },
  {
    version: '3.0.132',
    date: '2026-10-02',
    items: [
      'docs: plan — STOP ALL in two stages and a saving status (Slice 12), undo / redo (new Slice 18), relative units before Slice 13, Tab access and plain error messages as UI rules (owner decisions)',
    ],
  },
  {
    version: '3.0.131',
    date: '2026-10-02',
    items: [
      'fix(layout): the deck grid scrolls when its pads do not fit, and the start screen footer no longer covers BOARD / LIBRARY on a short window',
      'feat: the app is operated by its buttons — the A shortcut for adding a pad is gone (owner decision; keyboard control of the app is parked)',
      'fix: the app no longer shows internal plan names (the HOTKEY field said "Slice 8")',
      'docs: plan — editing several files per pad belongs to Slice 15; testing.md: what we test',
    ],
  },
  {
    version: '3.0.130',
    date: '2026-10-02',
    items: [
      'docs: owner decisions on #37, #38, #39 and the P8 slice plan (new Slices 16 Library, 17 Help & onboarding); every V1/V2 feature now carries a decision, checked by docsGuards',
    ],
  },
  {
    version: '3.0.128',
    date: '2026-10-02',
    items: [
      'test(e2e): the WebKit seed no longer reloads the page — the next navigation crashed WebKit on Linux CI (Playwright issue #43070)',
    ],
  },
  {
    version: '3.0.127',
    date: '2026-10-02',
    items: [
      'docs: review log — #36 decisions built; decisions for #37, #38, #39 and the P8 slice proposal prepared with sources',
    ],
  },
  {
    version: '3.0.126',
    date: '2026-10-02',
    items: [
      'feat(pads): a Loop with several files runs in the background of a combo and its list repeats; it glows like any loop; the old Playlist colours are gone (owner decisions on PR #36; engine change awaits the playback check)',
    ],
  },
  {
    version: '3.0.124',
    date: '2026-10-02',
    items: [
      'docs(adr): every "Refines" has its "Refined by" back-link — checked by docsGuards; three missing back-links added',
    ],
  },
  {
    version: '3.0.122',
    date: '2026-10-02',
    items: [
      'docs: plan — Slice 15 PAD editor at V1 scope (before Slice 12); principle P8: every V1/V2 feature is built unless deliberately rejected',
    ],
  },
  {
    version: '3.0.121',
    date: '2026-10-02',
    items: [
      'docs: review log — engine fix #35 accepted and merged; boot fix, local traces; flaky-test note on machine overload',
    ],
  },
  {
    version: '3.0.120',
    date: '2026-10-02',
    items: [
      'fix(audio): a combo step whose child ends at once no longer starts the next step twice, cuts short a sibling or skips the step duration (owner playback check passed)',
    ],
  },
  {
    version: '3.0.118',
    date: '2026-10-02',
    items: [
      'test(e2e): local runs keep the trace of every failed test, so a rare failure in a git hook can be diagnosed afterwards',
    ],
  },
  {
    version: '3.0.116',
    date: '2026-10-02',
    items: [
      'test(guards): rule 6 checks who replaces boards / library list in the store, so reading them for an export stays allowed',
    ],
  },
  {
    version: '3.0.115',
    date: '2026-10-02',
    items: [
      'fix(boot): boards and the library list load before the first screen — a board created right after the start can no longer vanish',
    ],
  },
  {
    version: '3.0.113',
    date: '2026-10-02',
    items: [
      'docs: review log — the Single default fix on main and PR #40 (a waiting auto-save is written, never dropped)',
    ],
  },
  {
    version: '3.0.112',
    date: '2026-10-02',
    items: [
      'fix(pads): a pad name typed just before the next pad opens, or before switching apps, is saved — the waiting auto-save is written, never dropped',
    ],
  },
  {
    version: '3.0.111',
    date: '2026-10-02',
    items: [
      'fix(pads): a new pad is Single unless you pick another type — no Loop guessed from long files; the suggested name follows the chosen file',
    ],
  },
  {
    version: '3.0.110',
    date: '2026-10-02',
    items: ['docs: review log — the review session with the owner and PR #39'],
  },
  {
    version: '3.0.109',
    date: '2026-10-02',
    items: [
      'feat(decks): a duplicated deck appears directly after its original (owner decision D4 after research)',
      'refactor(prefs): UI preferences (last view, last backup) live in IndexedDB instead of Web Storage (owner decision L1 after research); DB v6 only adds a store',
      'feat(decks): All pads can be sorted — name, date added, date modified, kind, not in a deck first, duration, last played — each reversible and remembered per board (owner decision E1)',
    ],
  },
  {
    version: '3.0.108',
    date: '2026-10-02',
    items: [
      'docs: research before every decision (owner rule); testing pitfall — a new git worktree runs no hooks until npm ci',
    ],
  },
  {
    version: '3.0.107',
    date: '2026-10-02',
    items: [
      'ci: commit messages follow Conventional Commits, checked by commitlint (S6, ADR-0060 accepted by the owner)',
    ],
  },
  {
    version: '3.0.106',
    date: '2026-10-02',
    items: ['docs: review log — Slice 11 pull request (#38)'],
  },
  {
    version: '3.0.105',
    date: '2026-10-02',
    items: [
      'feat(combo): combo steps model and protection against combos that start themselves (Slice 11); an imported V1 combo that would do so loses that step reference',
      'feat(combo): combo editor in the PAD editor — steps with the pads that start together, the wait and "stop everything first"; only pads that cannot start the combo itself are offered',
      'fix(board): a new pad or deck is selected at once, not after it is saved — a name typed right after ADD PAD went to the previous pad',
    ],
  },
  {
    version: '3.0.104',
    date: '2026-10-02',
    items: ['docs: review log — the PR #37 row that 3.0.103 missed'],
  },
  {
    version: '3.0.103',
    date: '2026-10-02',
    items: ['docs: review log — Slice 10 pull request (#37)'],
  },
  {
    version: '3.0.102',
    date: '2026-10-02',
    items: [
      'feat(backup): the app asks the browser for persistent storage at start (Slice 10, D4); ADR-0061 proposes the backup file format and piecewise import',
      'feat(backup): backup files (V1 and V3, gzip or plain) are read piece by piece — one library entry in memory at a time',
      'feat(backup): V1 boards map to V3 boards with one deck — all pad modes, combos with their steps, keys, volume and fades',
      'feat(backup): importing a backup — summary first, then audio one file at a time and boards last; nothing existing changes',
      'feat(backup): IMPORT on the board list — choose a V1 or V3 backup, confirm the summary, follow the progress, read what was dropped',
      'feat(backup): EXPORT saves all boards and audio in one file (share sheet on the iPhone, download elsewhere); the board list shows when the last backup was made and reminds after a week',
    ],
  },
  {
    version: '3.0.101',
    date: '2026-10-02',
    items: [
      'test: the start screen visual test hides the version footer (a longer version moved the centred line); review log: PRs #35/#36, Slice 9 structure review',
    ],
  },
  {
    version: '3.0.100',
    date: '2026-10-02',
    items: [
      'feat(model): three pad types — Single and Loop hold several files with an order, Playlist merges into Loop; a Single with several files plays the next one in turn or a random one; DB v5 (Slice 9d, ADR-0048)',
      'test: the start screen visual test hides the version footer — a longer version moved the centred line and failed it',
    ],
  },
  {
    version: '3.0.99',
    date: '2026-10-02',
    items: [
      'test: board model mutation score 92.76 % → 100 % (edge cases of free cells, keys, undo order, consistency rules); coverage floor 89/90/80/87',
    ],
  },
  {
    version: '3.0.97',
    date: '2026-10-02',
    items: ['docs: review log — owner decisions O1–O8 of 2026-10-02 and the new pull requests'],
  },
  {
    version: '3.0.96',
    date: '2026-10-02',
    items: [
      'feat(decks): All pads can create pads that sit in no deck (ADD PAD, A key, library drop); a board reopens in the view it showed last',
      'test: a change shows before it is saved — E2E reloads wait for running board saves (data-saving on <html>)',
    ],
  },
  {
    version: '3.0.95',
    date: '2026-10-02',
    items: [
      'fix(board): changes build on the latest board — deck undo keeps later edits, two quick A presses get two cells, the A key works right after switching to SETUP; deck badges show the position 1, 2, 3; a new deck takes the smallest free "Deck N"',
    ],
  },
  {
    version: '3.0.94',
    date: '2026-10-01',
    items: [
      'feat(decks): All pads view of the whole pool; remove a pad from one deck or delete it everywhere ("used in N decks"); PAD editor deck checklist places a pad in other decks (Slice 9e, ADR-0048)',
    ],
  },
  {
    version: '3.0.93',
    date: '2026-10-01',
    items: [
      'feat(model): pad pool — pads belong to the board, decks place them with position and key; duplicated decks share their pads; quick-access model; DB v4 (Slice 9c, ADR-0048)',
    ],
  },
  {
    version: '3.0.92',
    date: '2026-10-01',
    items: [
      'test: WebKit test seed never creates the database (race broke app boot); lint forbids conditional assertions in E2E tests; mutation break threshold 73',
    ],
  },
  {
    version: '3.0.91',
    date: '2026-10-01',
    items: [
      'test: engine tests for combo children and the fade-out-all step; found a bug — a combo step can start the next step twice (pinned, fix pending owner approval)',
    ],
  },
  {
    version: '3.0.90',
    date: '2026-10-01',
    items: ['test: mutation break threshold 68 % after the first complete CI run (68.89 %)'],
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
    items: ['ci: ADR-0046 gate stops if artifact absent for scanning checks (close first-run gap)'],
  },
  {
    version: '3.0.24',
    date: '2026-06-11',
    items: [
      'docs: record import-gate decision (ADR-0046) — no design output enters production unchecked; 5-point import gate; per-session spec dial; add Claude Design session spec (docs/design/CLAUDE_DESIGN_SPEC.md); sharpen rule 6 to literal stat output; add FOUNDATION_ANALYSIS coupling row; add BACKLOG import-gate script candidate',
    ],
  },
  {
    version: '3.0.23',
    date: '2026-06-11',
    items: [
      'docs: fix Evidence Requirements wording defects (relay-gap draft: E1 closing line, Files-touched routine carve-out, commit-gate exceptions), add E6 approval integrity, update incident count to six',
    ],
  },
  {
    version: '3.0.22',
    date: '2026-06-11',
    items: [
      'docs: add Evidence Requirements (E1–E5) to CLAUDE.md — mechanical guardrails after five wrong repo-state claims in planning; plan-format requirements (### Evidence / ### Files touched); Plan-Mode commit gate; post-push --stat mandate',
    ],
  },
  {
    version: '3.0.21',
    date: '2026-06-10',
    items: [
      'docs: Pass 7 — annotate dead §8.8 references + removed --pix-bg-layer token in DESIGN_NOTES; update Slice 4 header (complete, C1/C2 deferred); record I20 Slice-3 sign-offs with file:line evidence; annotate A3 Scene CRUD items (settled/deferred/superseded); fix false "stepwise reorder shipped" claim in BACKLOG; add §8.8 inset-shadow content-gap entry to BACKLOG; add ADR-category↔CATEGORY_ORDER coupling row to FOUNDATION_ANALYSIS.md',
    ],
  },
  {
    version: '3.0.20',
    date: '2026-06-06',
    items: [
      'docs: Pass 6 — fix stale facts/refs/counts across ADRs (import path, manifest.json, build time, elementFromPoint pattern, ADR-0006 descriptions, ADR-0041 reference); fix ADR-0043/0044 headers to template; formalize Refines: field in template; recategorize ADR-0039+0041 into new Prozess- & Produktentscheidungen category; add §6 coupling row to FOUNDATION_ANALYSIS.md',
    ],
  },
  {
    version: '3.0.19',
    date: '2026-06-06',
    items: [
      "docs: Pass 5 — correct test/gate/project counts in TESTING.md + ADRs (0033/0034/0035/0037), mark fixme'd mobile tests as deferred (not active coverage), annotate Slice-7 manual checklist items, fix section numbering, add testing coupling entry",
    ],
  },
  {
    version: '3.0.18',
    date: '2026-06-06',
    items: [
      'docs: Pass 4 BACKLOG maintenance — record settled scene decisions (I24 SETTLED/I25 decided-pending-code), supersede desktop-first framing per ADR-0045, fix ADR-0015 citation, add Axis-1 breakpoint tracking, status markers (K11/K13), remove completed I22 phrasing item',
    ],
  },
  {
    version: '3.0.17',
    date: '2026-06-06',
    items: [
      'docs: Pass 3 corrections — fix sb-stack→sb-col in CLAUDE.md+Cheatsheet (§5a as canonical list), align GAME color rule to --mode-game, remove dead update_log rule, correct IDB/build-command/framework staleness, register 5 is-* DnD+looping classes in DESIGN_SYSTEM §3, fix token-source file in §A header, add coupling-map entries',
    ],
  },
  {
    version: '3.0.16',
    date: '2026-06-05',
    items: [
      'docs: Complete DOCUMENTATION_MAP + README doc index; add curated layout-primitives list (§5a) to DESIGN_SYSTEM as single source of truth (sb-row/sm/wrap/fill, sb-col, sb-flex-1); record coupling + planned drift-guard',
    ],
  },
  {
    version: '3.0.15',
    date: '2026-06-05',
    items: [
      'docs: V3_CONCEPT_BRIEF modernisation — record Signals/idb decisions, fix paradigm/signatures/structure, remove stale open-choice framing, update slice status to post-Slice-4 reality; refine coupling map',
    ],
  },
  {
    version: '3.0.14',
    date: '2026-06-05',
    items: [
      'docs: Full documentation audit — inventory + currency check of all 20 documents + 45 ADRs; 8 critical, 40 important, 24 cosmetic findings recorded; 12 category-D items flagged for user judgment',
    ],
  },
  {
    version: '3.0.13',
    date: '2026-06-05',
    items: [
      'docs: Foundation drift correction — align V3_CONCEPT_BRIEF with ADR-0045 (two-axis model); precision BACKLOG C10 label; fix --mode-play → --mode-game token; replace stale §4.1 type block with pointer; past-tense Session 3; add document coupling map',
    ],
  },
  {
    version: '3.0.12',
    date: '2026-06-05',
    items: [
      'docs: Foundation analysis pass 1 — codebase map, 8 prioritized findings (critical: 3-col layout at 390px, zero adaptive CSS, C10 unresolved in code), per-area findings, 7 deep-dive recommendations',
    ],
  },
  {
    version: '3.0.11',
    date: '2026-06-04',
    items: [
      'docs: Replace mobile-vs-desktop split with two-axis adaptive model (screen format × input type); write ADR-0045; supersede old framing in BACKLOG; clarify ADR-0032 boundary; resolve device-detection question',
    ],
  },
  {
    version: '3.0.10',
    date: '2026-06-04',
    items: [
      'docs: Mobile Board design round 1 (Claude Design) — adopted refinements (sheet-shrink, FLIP re-wrap, STOP ALL priority, color-independent mode legibility), gap-creation + swipe/mode-switch decisions, parked feature candidates',
    ],
  },
  {
    version: '3.0.9',
    date: '2026-06-04',
    items: [
      'ci: pre-push hook now blocks when the APP_VERSION bump is missing (one push = one version); CLAUDE.md pre-commit checklist extended',
    ],
  },
  {
    version: '3.0.8',
    date: '2026-06-04',
    items: [
      'docs: Library-as-tile-grid working assumption, modular sidebar building block, multi-level settings hierarchy — BACKLOG Design Session 2026-06-04',
      'docs: C10 assumption verified (Library structurally different from pad grid), C10 point 8 als Sonderfall des allgemeinen Hierarchie-Modells ausgewiesen',
      'docs: architecture motto "Think big, but don\'t rush" added',
    ],
  },
  {
    version: '3.0.7',
    date: '2026-05-28',
    items: [
      'fix: several loop pads can play at the same time — ctx.resume() no longer awaited in playback functions (otherwise iOS WebKit cancels running sources)',
    ],
  },
  {
    version: '3.0.6',
    date: '2026-05-28',
    items: [
      'fix: AudioContext starts reliably on iOS — ctx.resume() directly in initAudio() within the TAP TO UNLOCK gesture tick',
    ],
  },
  {
    version: '3.0.5',
    date: '2026-05-28',
    items: [
      'fix: iOS file picker shows MP3 files — explicit MIME types instead of audio/* (Brave/Safari need both: MIME + extension)',
    ],
  },
  {
    version: '3.0.4',
    date: '2026-05-28',
    items: [
      'feat: Audio playback: SINGLE, LOOP, PLAYLIST, COMBO pads all play audio',
      'feat: LRU decoded-buffer cache (150 MB cap) — iOS memory safety preserved from V1',
      'feat: TAP TO UNLOCK wires AudioContext synchronously in gesture handler (iOS requirement)',
      'fix: iOS ringer switch — silent WAV upgrades audio session to "playback" category',
      'feat: is-hot / is-looping CSS state driven by Preact Signals — reactive without polling',
    ],
  },
  {
    version: '3.0.3',
    date: '2026-05-27',
    items: [
      'feat: Board, Scene, Pad CRUD — full create / rename / duplicate / delete',
      'feat: Pad DnD: SWAP + INSERT via Pointer Events (iOS-safe — no HTML5 DnD)',
      'feat: SETUP / GAME mode toggle with spark animation',
      'feat: 3 pad-creation paths: tap empty slot, library drag, ADD PAD button',
      'feat: Pad type selection dialog with 2-tap-delete confirm pattern',
    ],
  },
  {
    version: '3.0.2',
    date: '2026-05-27',
    items: [
      'feat: Library: import audio files, rename, delete',
      'feat: Serial upload pipeline — never loads all audio into RAM at once (iOS safety)',
      'feat: SHA-256 content addressing via @noble/hashes — works without Secure Context (iPhone LAN)',
      'feat: Waveform peak visualisation computed at import, stored in IDB',
    ],
  },
  {
    version: '3.0.1',
    date: '2026-05-27',
    items: [
      'build: project scaffold — Preact + TypeScript + Vite + PWA (vite-plugin-pwa)',
      'feat: StartScreen with TAP TO UNLOCK entry point',
      'feat: Design system: tokens, typography, pixel-art icon set',
      'feat: IndexedDB persistence layer with typed helpers',
    ],
  },
];
