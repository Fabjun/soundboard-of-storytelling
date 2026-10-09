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
export const APP_VERSION = '3.0.189';

/** The developer log, newest first; CHANGELOG.md is generated from it (sync-changelog). */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.0.189',
    date: '2026-10-09',
    items: [
      'refactor(styles): one look for a disabled control — the token --disabled-opacity (0.4) and cursor: not-allowed for every :disabled / aria-disabled rule (there were three: 0.4 / 0.5, cursor default / not-allowed); disabled tabs a little dimmer; guard "one look for a disabled control" (counter-checked); 0.4 and not-allowed accepted by the owner 2026-10-09',
      'chore(audio): fadeOutAll is reserved as Parked until the engine fix — its old reason (Slice 12, the first STOP ALL stage) no longer held, STOP ALL fades pad by pad',
      'test: coverage floor raised after the Slice 12 stack (measured lines 93.74 · statements 92.70 · functions 94.69 · branches 91.51 → floor 93 / 92 / 94 / 91)',
      'docs: backlog "Two styles for a disabled control" done; structure review of Slice 12 in the pull request',
    ],
  },
  {
    version: '3.0.188',
    date: '2026-10-09',
    items: [
      'refactor(styles): the sb-* component classes move unchanged from tokens.css to components.css; tokens.css keeps the tokens and themes (joined, the two files are byte-identical to the old one; BACKLOG "Component styles out of tokens.css")',
      "feat(a11y): type and spacing follow the user's text size (ADR-0081, owner scheme 2026-10-02, applied as accepted by the owner 2026-10-09) — the --space-* and --fs-* tokens and every font-size, padding, margin and gap are rem (px / 16), so at the default text size every visual baseline stays pixel-identical; px stays for borders, radii, pixel-art details and touch minimums (three named exceptions)",
      'test: codeGuards "type and spacing in rem" (no px in a type or spacing property but the named exceptions; the tokens are rem); E2E a11y doubles the root font size and sees type and spacing double (counter-checked with the old px tokens: 14 instead of 28 → red); the guard counter-checked 3×',
      'docs: ADR-0081 (refines ADR-0022); CLAUDE.md §Tokens; docs/README.md names components.css; backlog "Relative units" and "Component styles out of tokens.css" done, clamp() / growing pad cells left for Slice 13',
    ],
  },
  {
    version: '3.0.187',
    date: '2026-10-09',
    items: [
      'fix(a11y): opening a board, choosing a deck, choosing the file of a new pad, selecting and renaming a library file work with the keyboard — clickable divs became real buttons (sb-row-button, the row look without a frame), the rows other buttons stay siblings (owner rule 2026-10-02 "every control works with the Tab key"; ADR-0080, accepted by the owner 2026-10-09)',
      'fix(a11y): PixelIcon is decorative (aria-hidden) — it announced its file name ("book", "flame") as the name of buttons; five icon buttons named only by title got an aria-label (board back, board list rename / delete, deck rename / duplicate / delete, library delete); the source item of a new pad reaches the 44px touch height',
      'fix(errors): plain words and a next step (Nielsen 9) instead of raw browser errors — backup export, an unexpected import error, the three upload errors ("not an audio file this browser can play — use MP3, M4A or WAV" …); the technical cause goes to the console; the upload details were a hover-only tooltip, now a <details> opened with a tap, Enter or Space',
      'test: E2E a11y (axe-core via @axe-core/playwright, dev only, MPL-2.0) — every main screen, WCAG 2.2 A/AA without color-contrast (BACKLOG "Text contrast below WCAG AA"), a keyboard-only flow board → deck → new pad and an import error opened with the keyboard, Chromium and WebKit; codeGuards "controls work with Tab and have a name" (a click handler on a control Tab reaches; an icon-only button has an aria-label); counter-checked; eslint-plugin-jsx-a11y not used — its peer range ends at ESLint 9',
      'docs: ADR-0080 (accepted); CLAUDE.md UI rule points to the checks; backlog audit done, "Text contrast below WCAG AA" new; three visual baselines (deck rail entries 1px lower)',
    ],
  },
  {
    version: '3.0.186',
    date: '2026-10-09',
    items: [
      'fix(hooks): the pre-commit hook stages every generated doc — it named them by hand and missed CLAUDE.md (sync:api), so the API list was left unstaged twice (Slices 12b and 12d; CI "Docs sync" would have caught it). One list, v3/scripts/lib/generated-docs.ts: writeGenerated refuses any file not in it, the hook stages what scripts/list-generated-docs.ts prints (own step "staging the generated docs")',
      'test: docsGuards "generated docs come from one list" — every listed file exists; the hook names no generated file itself; writeGenerated refuses an unlisted file and writes nothing; counter-checked (CLAUDE.md unlisted → sync:api stops with the reason; a hand-named file in the hook / no check in writeGenerated → red)',
    ],
  },
  {
    version: '3.0.185',
    date: '2026-10-08',
    items: [
      'feat(status): the status bar says whether changes are saved (Slice 12e) — SAVING… while a write waits or runs (pendingSaves), SAVED when none does, NOT SAVED after a failed board save (red, announced as an alert, the tooltip says what happened and what to do; sb-error-label); saveState in src/state/store.ts — words, place and what counts accepted by the owner 2026-10-09',
      'fix(save): a failed board save is no longer silent — boardWrites sets lastSaveFailed (the board already went back to its stored state; until now only the console knew), the next successful save clears it',
      'test: unit boardWrites save state (saving → saved, failed, a running save wins, the next success clears; counter-checked: failure not recorded / not cleared → red); E2E save-status in Chromium and WebKit (SAVED, SAVING… while the name waits, SAVED again; 5 × 2 runs stable; counter-checked: a fixed SAVED → red); five visual baselines with the new status section',
      'docs: slice table 12e in review',
    ],
  },
  {
    version: '3.0.184',
    date: '2026-10-08',
    items: [
      'feat(mode): switching GAME / SETUP stops every sound at once and ends a running STOP ALL fade (Slice 12c; switchMode in src/state/modeControl.ts, stopAllNow in src/state/stopControl.ts) — provisional detail: no fade, review pending',
      'feat(mode): the Lock — a toggle with a lock icon next to the mode toggle, GAME only; while on, SETUP is dimmed (aria-disabled) and cannot be chosen; off by default and after every reload (modeLocked lives in memory only); decks still switch',
      'feat(icons): sos-ui gains its own lock icon (16×16, ADR-0072)',
      'test: unit modeControl (switch stops first, same mode / Lock change nothing, Lock in GAME only, starts off) and stopControl stopAllNow; E2E mode-lock in Chromium and WebKit (GAME only, locked tap changes nothing, unlock, reload turns it off) and stop-all "switching to SETUP stops every sound"; counter-checked (Lock without effect, switch without stop → red); visual baseline board in GAME with the lock',
      'docs: product §3 Switching modes / Lock built with the provisional details marked; slice table 12c in review; backlog "Two styles for a disabled control"; iPhone checklist "Mode switch stops sounds; the Lock"',
    ],
  },
  {
    version: '3.0.183',
    date: '2026-10-08',
    items: [
      'feat(stop): STOP ALL in two stages (Slice 12b, K9 / K16, ADR-0078 proposed) — a button in the board top bar in GAME: the first press fades every playing pad out over 2.5 s, pad by pad; a second press while it fades (the button reads STOP NOW) stops everything at once (src/state/stopControl.ts)',
      'feat(keys): the numpad decimal key is STOP ALL (K6); the numpad Enter stops the sound started last with its pad fade-out, the next press the one before (K5); the main Enter does the same unless a control has focus — the numpad stop keys are taken in the capture phase, so a focused pad is not toggled as well',
      'test: engine bugs pinned with test.fails — fadeOutAll cuts off a pad started during the fade; a Single started again during its fade-out cannot be stopped (both BACKLOG; engine changes need the owner); unit stopControl (stages, timing, last-started order, fade-out) and keyControl stop keys (GAME only, text fields, focused control keeps Enter, capture phase); E2E stop-all (Chromium: button in GAME only, both stages, back after the fade, numpad Enter / Enter / numpad decimal); counter-checked — the E2E second-stage check was vacuous at first (the label returns after the fade anyway) and now waits 1 s only',
      'docs: ADR-0078 (proposed, review pending; refines ADR-0077); product K5 / K6 / K9 / K16 built with the provisional details marked; slice table 12b in review; backlog PANIC built, two engine items; iPhone checklist "STOP ALL and the stop keys"',
    ],
  },
  {
    version: '3.0.182',
    date: '2026-10-08',
    items: [
      'feat(keys): keys play pads (Slice 12a, ADR-0077) — in GAME on a board a key plays the pad that holds it in the deck shown, in All pads in the deck last selected (K3, K14); a second press while it plays changes nothing (K4); not while a text field has focus, with Ctrl / Alt / Cmd, for a held-down key or a reserved key (Enter, Numpad Enter, Numpad decimal, Space, Escape, Tab — 12b / 12d); one document listener started in main.tsx (src/state/keyControl.ts), keys as KeyboardEvent.code',
      'feat(pad-editor): the HOTKEY field takes a key — tap, then press it (K1); Escape cancels without closing the editor, Tab moves on; a key another pad of the deck holds shows "Key N1 is on …" with MOVE KEY HERE (owner decision 2026-10-08), setPlacementHotkey takes it from the other pad in the same write; a reserved key is refused with its reason; × removes the key',
      'feat(pads): the key shows short on the pad — N1 for the numpad 1, 1 for the main 1, A, N+ (K10, keyLabel in src/lib/padKeys.ts); the stored code stays',
      'test: unit padKeys (key → pad per deck, numpad vs main 1, holder, labels, reserved / modifier keys), keyControl (GAME only, K4, K14, unknown / reserved / held / modified keys, text fields vs buttons and sliders, stop), boardModel (a taken key moves over, other keys and decks stay); E2E pad-keys in Chromium and WebKit (assign, short label after reload, MOVE KEY HERE, Escape keeps the editor, reserved key, ×, GAME takes the key and SETUP not); every new test counter-checked (each rule removed → its test red); backup.spec expects the V1 key as N1 (owner approval); the key badge has no test ID — specs count pads by the pad-grid-cell- prefix (BACKLOG "Role-based E2E locators")',
      'docs: ADR-0077 (refines ADR-0048); product K1–K16 with the owner decisions of 2026-10-08 (K5 with the pad fade-out, K6 = STOP ALL in two stages, K16 2.5 s, K13 to Slice 13); slice table 12a–12e; backlog key capture / conflict partly built; iPhone checklist "Numpad plays pads"',
    ],
  },
  {
    version: '3.0.181',
    date: '2026-10-08',
    items: [
      'ci: the ruleset protect-main also requires a pull request and the five tests.yml checks (unit-build-lint, e2e-smoke, e2e-mobile, e2e-full, e2e-prod), the branch up to date, no bypass — a red or pending pull request cannot be merged, direct pushes to main end (owner decision 2026-10-08; set via gh api and read back)',
      'docs: ADR-0076 "Required checks on main" refines ADR-0051; CLAUDE.md workflow rule 7a (main only through pull requests)',
    ],
  },
  {
    version: '3.0.180',
    date: '2026-10-08',
    items: [
      'chore(deps): development patch updates — vite 8.3.2, @types/node 24.19.1 (stays on Node 24 like .nvmrc); supersedes Dependabot #51, whose checks ran on a main before 3.0.175',
      'docs(backlog): the runner image change is done — the full test workflow ran green on ubuntu-26.04 (probe PR #56, run 37792184261, no flaky test); new items "Visual tests miss low-contrast changes" and "macOS baselines after cloud sessions" (both found with PR #57)',
    ],
  },
  {
    version: '3.0.179',
    date: '2026-10-08',
    items: [
      'test(e2e): the pad-size test "on a short window …" waits until the grid shows 4 columns after the deck list folds (expect.poll, as the other tests of the spec) — it measured while PadGrid still counted its columns after the resize and read old and new rows mixed: red in 11 of 30 local runs on main, hidden in CI by its retries; found by the pre-push gate. After the fix 50 of 50 green; counter-checked: rows of 20px (pads overlap) → red with "the second row starts below the first"',
      'test(visual): the macOS baselines of the start screen (UPDATE button, 3.0.175), the board in SETUP and the deck rail (PAD SIZE slider, pads flow into the columns, 3.0.177/3.0.178) follow main again — #52–#55 came from a cloud session that cannot run the macOS visual tests, so the pre-push gate failed on every local push; each new picture checked by eye before the update',
    ],
  },
  {
    version: '3.0.178',
    date: '2026-10-06',
    items: [
      'feat(board): one pad size per board instead of per deck (owner decision 2026-10-06, ADR-0075 amendment) — the PAD SIZE slider sets every deck and All pads, whichever of them it is moved in; it now also shows in All pads (SETUP), which used the default size before',
      "feat(model): Board.padSize (px) replaces gridConfig.padSize; boards stored before take their first deck's size (lowest order; an old word or no deck → the default; owner decision) — in the database (version 10, in place, migrateBoard) and in a backup import (parseBoard), both through migratePadSize in src/lib/padSize.ts; setBoardPadSize replaces setDeckPadSize; new boards and the V1 import start at the default",
      "test: unit migratePadSize (first deck by order, old word / no size / no deck → default, the board's own size wins, steps and limits), setBoardPadSize, parseBoard of a board before 3.0.178 and a wrong board padSize, DB upgrade to v10 from v8 and v9 (counter-checked: first deck by array position, no v10 step, no board padSize check — each red); E2E pad-size: the slider moved in Deck 1 sets Deck 2 and All pads, moved in All pads sets Deck 1 (counter-checked: All pads at the default size — red); the v9 upgrade test became the v10 one; fixtures carry the board size",
      'docs: ADR-0075 amendment (one size per board) and ADR-0048 amendment; pad.md zoom per board; iPhone checklist "Pads per row and PAD SIZE"; CLAUDE.md UI rule',
    ],
  },
  {
    version: '3.0.177',
    date: '2026-10-06',
    items: [
      "feat(board): the pads flow into as many columns as the window allows (owner decision 2026-10-06, ADR-0075) — the fewest columns that keep every pad at or below the deck's pad size (padColumns in src/lib/padSize.ts; PadGrid measures its width and sets --grid-cols); places are read in reading order (row × cols + col, as padDnd already did), so the order is the same on every screen and the stored data does not change; no horizontal scrolling, the grid scrolls down; the shrinking to fit the window height (3.0.175) is gone; the --pad-size token and src/lib/padFit.ts are gone",
      "feat(deck-rail): a PAD SIZE slider per deck, at the top of the deck rail, in SETUP only (as in V1) — 44 to 160px in steps of 4, 88 by default; the grid follows it live, the size is stored once when the move ends; the PAD editor's slider became the shared SliderRow (src/components/SliderRow.tsx), and its label now also names the slider for screen readers",
      'fix(deck-rail): the rail scrolls when its entries are taller than the window — an entry no longer shrinks to a sliver (layout-reach found a deck entry at 13 of 44px once the slider made the rail taller on a 300px window)',
      'feat(model): gridConfig.padSize is a size in px (was a word nothing used) — converted in the database (version 9, in place, migrateBoard) and in a backup import (parseBoard); setDeckPadSize; ADR-0048 amendment',
      'test: unit padSize (limits, columns, old decks), setDeckPadSize, parseBoard with an old word, DB upgrade to v9 (counter-checked: no v9 step — red); E2E pad-size rewritten for the new behavior — 4 per row on a phone and more on a wide window with the order kept; a row fills the width and nothing is cut off at 390, 768 and 1280px with the list open and folded; the slider gives fewer, larger pads and keeps the size after reopening; the slider only in SETUP; a short window scrolls down without overlap (counter-checked: fixed columns, the size not stored, the slider in GAME — each red). The height-fit tests of 3.0.175 went with the behavior; the boardModel validator case for padSize now uses a wrong type (true), as a number is valid; eslint assertFunctionNames lists assertRowFillsWidth',
      'docs: ADR-0075; pad.md (zoom by slider decided, + / − and mouse wheel parked, PQ1); V1/V2 inventory; BACKLOG V1 display settings partly built; iPhone checklist "Pads per row and PAD SIZE"; CLAUDE.md UI rule',
    ],
  },
  {
    version: '3.0.176',
    date: '2026-10-05',
    items: [
      "feat(editor): the PAD editor opens full screen on every screen size, the board's top bar included (owner decision 2026-10-05) — a modal dialog on sb-overlay (ADR-0074): role dialog, focus moves in, the board behind is inert (src/lib/inertOutside.ts), Escape closes it unless the icon list or the type confirmation on top is open, focus returns to the pad; the fields scroll in one column, at most 40rem wide and centered on a wide window (sb-pad-editor); sb-overlay-header got a small gap",
      'test: E2E pad-editor-fullscreen (covers the window at 390 and 1280px, top bar included; board behind out of reach by pointer and Tab; Escape closes and focus returns; Escape in the icon list closes only the list — counter-checked: no inert, no nested guard, no focus return, the code of 3.0.175 — each red), unit inertOutside; 7 specs that tapped ADD PAD, a pad or a deck tab behind the open editor close it first through the new helper closePadEditor (addNamedPad does it itself); pad-editing "a name typed just before the next pad opens is kept" became "… before the editor is closed is kept" — switching pads with the editor open no longer exists, the check is the same',
      'fix(dialogs): every dialog closes on Escape through one hook, useEscapeKey (src/lib/escapeKey.ts) — the listener is added in a layout effect, before the dialog is painted, and reads the handler and whether it is active when the key is pressed. Two races from listeners added or removed in passive effects (they run after the paint) showed in CI on this change: Escape right after the icon list opened closed the PAD editor too, and after a first fix the icon list sometimes heard no Escape (1 of 15 local runs; 0 of 40 with the hook). The PAD editor, the icon list, the type confirmation and the creation popover use it; codeGuards allows no other keydown listener (counter-checked: hook on a passive effect — unit tests red; a probe listener — guard red)',
      'test(pad-size): the folded-list check waits for the pads to grow (expect.poll) — they grow a frame after the fold, once the grid has measured its width; CI measured the frame before (30.5px). The expectation is unchanged; 20 of 20 runs green',
      'docs: ADR-0074 full-screen modal dialogs (with the icon list and What\'s new as a dated exception, BACKLOG "Full-screen dialogs per ADR-0074"); design-notes known limitation updated; BACKLOG B7 note; product README; iPhone checklist "PAD editor full screen"; CLAUDE.md UI rule',
    ],
  },
  {
    version: '3.0.175',
    date: '2026-10-05',
    items: [
      "fix(pads): pads shrink to be seen whole on every display (owner decision 2026-10-05; the owner found pads cut off at the right edge on a phone in 3.0.174) — src/lib/padFit.ts returns the side at which all columns fit the width and, down to the 44px touch target, all rows fit the height; PadGrid measures its panel (ResizeObserver) and sets --pad-fit; the columns are minmax(0, min(--pad-size, --pad-fit)), the cells are squares (aspect-ratio 1) and the auto rows are max-content, so the square decides the row — with min-height 0 on the cells the rows would only share the free height of the panel and pads would overlap; inside the grid the pad and the empty slot take min-width / min-height 0 against the global 44px minimum of [role='button']; --pad-size (88px) stays the largest size; below the touch target in height the grid scrolls",
      'feat(deck-rail): the deck list starts folded on every screen size (owner decision 2026-10-05), not only below 40rem — the toggle opens it; E2E helpers createBoardAndNavigate and reopenFirstBoard unfold it for specs that are not about folding',
      'test: unit padFit; E2E pad-size (standard size on a wide window; touch-sized squares inside a phone window; no pad cut off with the list open; the whole grid fits a short window; touch size, no overlap and scrolling on a very short one) and deck-rail-fold (starts folded on a wide window), layout-reach window height 300 (counter-checked against 3.0.174: cut-off pads, default-open list and the fit — red)',
      'feat(update): an UPDATE button on the start screen checks for a new version at once (owner decision 2026-10-05; V1 had a way to update by hand) — src/lib/updateCheck.ts runs registration.update() and says in plain words how it went: new version found, newest version (with its number), offline, no service worker in this window, no answer from the server; switching stays with the update prompt and RELOAD (ADR-0066 amendment), and a version put off with LATER is offered again (signal updatePromptRequests, read by UpdatePrompt); the result line has the class sb-start-status and role status',
      'test: unit updateCheck (every result, offline asks nothing, a waiting version brings the prompt back); E2E update-check (no service worker — blocked by the test itself, as e2e-prod runs it against the production build where one is registered; offline) and pwa.spec against the production build (newest version; simulated deploy found; LATER, then UPDATE again — counter-checked: result always found, prompt not brought back — red); iPhone checklist "UPDATE button"',
      'docs(backlog): "E2E tests check what the app does, not how its menus are built" (owner decision 2026-10-05) — records where 3.0.175 tied tests to the deck rail (helpers that unfold it for every spec, the fixed window height in layout-reach, a width ratio and a test-id locator in deck-rail-fold, 65 rail locators in 8 specs) and the plan: task-named helpers, role locators, preconditions the test builds itself',
    ],
  },
  {
    version: '3.0.174',
    date: '2026-10-05',
    items: [
      'feat(board): the deck rail folds to its ◀ / ▶ button; on a narrow screen (max-width 40rem) it starts folded, on a wide one open (owner decision 2026-10-05)',
      'feat(board): pads are squares of one size, token --pad-size 5.5rem (88px), instead of scaling with the window; the grid scrolls in both directions where it does not fit; a pad name is one line ending in … (owner decision 2026-10-05, pad.md PQ1 decided for now)',
      'test: mobile board-flow "the deck list starts folded on a phone and unfolds and folds with its button" (counter-checked: starting open — red); E2E helper createDeck unfolds the rail first; visual baselines of the board (GAME, SETUP) and the deck rail renewed after review of the new screenshots',
    ],
  },
  {
    version: '3.0.173',
    date: '2026-10-04',
    items: [
      'feat(game): the screen stays on in GAME on a board (docs/product/README.md K11; built early from Slice 12 for a game night, owner decision 2026-10-04) — Screen Wake Lock API as in V1 and the Chrome guide: requested in try/catch, taken again on visibilitychange, released in SETUP and off the board; not switchable; the status bar shows SCREEN ON. src/lib/wakeLock.ts (screen keeper with the API passed in), App wires it to currentScreen and currentMode',
      'test: unit tests for the screen keeper (held, released, taken again after the page was hidden, refused, no API, released when GAME ends during the request); E2E wake-lock with a recorded navigator.wakeLock in Chromium and WebKit (counter-checked: lock kept in SETUP — red; no re-request after hidden — red); iPhone checklist "Screen stays on in GAME"',
    ],
  },
  {
    version: '3.0.172',
    date: '2026-10-04',
    items: [
      'docs: American spelling everywhere (owner decision 2026-10-04, ADR-0073) — 265 British forms in 76 files replaced by script from one word list (case kept), history and old release notes included; kept: Claude Design downloads, the icon catalog search words (deliberate synonyms), V1 icon ids, third-party license texts; two measured mentions of the old forms marked off for Vale; one local variable renamed, no CSS class, token or file name changed',
      'test(guards): the word list .vale/styles/SoS/AmericanSpelling.yml is a Vale rule for Markdown (now also on the historical files) and codeGuards "American spelling outside Markdown" for every other tracked file (counter-checked: planted forms in an active doc, an ADR, a code comment and a workflow file — red; restored green)',
    ],
  },
  {
    version: '3.0.171',
    date: '2026-10-04',
    items: [
      "refactor(icons): the 24 UI icons are the IconifyJSON set sos-ui (owner decision 2026-10-04, step 15d-4) — one path per icon like the pad icon packs instead of one rect per pixel; license LicenseRef-Proprietary (All Rights Reserved), not in the picker's loader, the catalog or third-party-licenses.txt; PixelIcon keeps its API, its names are the set's icon names; iconPath in src/lib/iconSet.ts shared by picker, placeholders and UI icons (ADR-0072)",
      'test: iconGuards tell own sets from third-party packs (loader and catalog hold only the packs); pwa.spec checks that the own set is not in the notices (counter-checked: own set in the loader — red; own set in the notices — red). Pixel-exact comparison before/after: start, board list, board, PAD editor and picker screens and each start-screen icon identical in Chromium and WebKit',
    ],
  },
  {
    version: '3.0.170',
    date: '2026-10-04',
    items: [
      'feat(icons): the icon picker draws only the visible rows of its grids (owner decision 2026-10-04) — every match of a search is listed (the limit of 240 is gone); one @tanstack/virtual-core virtualizer per grid on the overlay scroll area (scrollMargin), columns and row gap read from the CSS layout, rows measured once drawn; role grid with aria-rowcount / aria-colcount / aria-rowindex; APG keys with Home and End, a key to a row not drawn yet scrolls it in and focuses it, keys typed before that move on from it (ADR-0071)',
      'test: pad-icons "a short search lists every match but draws only the visible rows; arrow keys reach the rows below" at phone width, incl. five keys in one go (counter-checked: everything drawn — red; keys moving on from the old icon — 4 of 5 lost, red); unit tests for src/lib/iconGrid.ts',
      'build(deps): @tanstack/virtual-core ^3.17.11 (MIT)',
    ],
  },
  {
    version: '3.0.169',
    date: '2026-10-04',
    items: [
      'fix(picker): an open category no longer covers the category headers below it — the sections of the scrolling overlay body (flex column; sb-col sets min-height 0) shrank to a sliver once the content was taller than the overlay; .sb-overlay-body > * keeps every child at full height (live since 3.0.168, found while building the virtualized picker)',
      'test(e2e): layout-reach "in the icon picker, each category can be reached and opened while others are open" — on a short window each header below an open category is reached by the wheel and opened; plus a check that no child of a scrolling flex column is shorter than its content (counter-checked: without the rule both parts fail)',
    ],
  },
  {
    version: '3.0.168',
    date: '2026-10-04',
    items: [
      'feat(icons): a collection of 2,151 pixel icons the owner chose from five free packs (Nikoichu, Kenney 1-Bit, pixelarticons, Kacper Woźniak; brand logos out, Urizen set aside) — IconifyJSON sets with keys set:name, 17 categories, English search words per icon, generated by npm run build:icons; checks for scheme, categories, catalog, no drawing twice and no brand names (ADR-0070, Slice 15d)',
      'feat(editor): up to 4 icons per pad (V1 scope) — four slots in the PAD editor and an icon picker with search over names and search words, categories that open and close, names on request and arrow keys; the pad shows its icons in V1 arrangement or the placeholder of its type — collection icons chosen by the owner: a circle for Single, an infinity sign for Loop, a double circle for Combo; build:icons copies their drawings into the start bundle (src/icons/placeholders.json, checked against the collection by iconGuards), so a board draws them without loading a pack',
      "fix(import): the V1 import brings each pad's icons (up to 4) — it read only strings, but V1 stored {b: id}, so no icon of a real V1 backup came over; uploaded and unknown icons are counted in the summary",
      'feat(db): pads hold icons (keys) instead of iconRef; database version 8 converts the stored boards in place (V1 ids through src/icons/v1-map.json)',
      'build: icon data loads on demand from assets/icons/ with its own size budget; third-party-licenses.txt gets a section Icons with the MIT text of pixelarticons',
    ],
  },
  {
    version: '3.0.167',
    date: '2026-10-04',
    items: [
      'fix(hooks): the pre-commit lint runs ESLint where its config lives — lint-staged called it from the root with --config v3/eslint.config.js, so ESLint matched its file patterns against the root, none matched under v3/ and most rules never ran at commit time (a lint error in a unit test passed the hook, exit 0; CI caught it later). Now v3/.lintstagedrc.json lints v3/ with its tasks running in v3/ (lint-staged README, monorepos), the root config formats the rest; the hook runs `npx --prefix v3 lint-staged` from the root (v3 tools for both configs). Verified with probes: lint error blocked (exit 1), Markdown outside v3/ still formatted, clean run exit 0; sync-steps shows npx --prefix in the step table',
      'test(guards): testGuards "lint-staged runs ESLint where its config lives" — every lint-staged config with an ESLint task sits next to eslint.config.js and passes no --config; the hook lets lint-staged find its configs (counter-checked: 3 planted errors)',
    ],
  },
  {
    version: '3.0.166',
    date: '2026-10-04',
    items: [
      'feat(editor): REPEAT — a Loop plays 1–999 times or until stopped (∞); the PAD editor has a ∞ button and a count field, a typed value lands in range (Slice 15c, ADR-0069, owner decision: every Loop)',
      'feat(audio): a Loop with a count plays its region N times in one buffer source (start duration = N × region, gapless) and stops by itself; a Loop with several files ends after N passes through its list; a combo Loop child with a count stops after its passes (engine change approved by the owner)',
      'feat(import): the V1 loopCount becomes the repeat count (capped at 999); the "loop count dropped" import note is removed',
      'test: engine repeat cases, parseBoard range, padBaseOf, V1 import, E2E repeat field; all counter-checked',
    ],
  },
  {
    version: '3.0.165',
    date: '2026-10-04',
    items: [
      'fix(save): a waiting auto-save counts as a running save from the moment it is scheduled (debouncedSave → pendingSaves), so RELOAD in the update prompt and the E2E save marker wait for it — a reload half a second after an edit cut the last save off (owner decision; ubuntu-26.04 probe: the combo test lost its wait value 1 run in 3, with blur and with Tab alike)',
      'test(e2e): the specs wait for the saves instead of a fixed time (pad-editing, combo-editor, pad-pool); debouncedSave counting counter-checked',
    ],
  },
  {
    version: '3.0.164',
    date: '2026-10-04',
    items: [
      'fix(scripts): vale-install copies the binary instead of renaming it — on ubuntu-26.04 runners /tmp is another file system and rename failed with EXDEV, which broke npm ci; found by a probe run before ubuntu-latest moves to Ubuntu 26 (actions/runner-images#14748)',
    ],
  },
  {
    version: '3.0.163',
    date: '2026-10-03',
    items: [
      'feat(pad-editor): Slice 15b — file list for Single / Loop pads: select a file for the waveform editor and the preview, ▲ / ▼ to move it (WCAG 2.5.7), ✕ with a second tap to remove it, in order / shuffled; the library picker adds several ticked files at once',
      'feat(model): each file of a pad has its own trim — files: PadFile[] with hash, trimStart, trimEnd; the pad-wide trim is gone (ADR-0068, owner decision)',
      'feat(db): database version 7 converts the stored boards in place — never a clear; older backups and the V1 import convert by the same rule (migratePad), keeping how each pad sounded',
      'fix(audio): a Loop with several files plays each file within its own trim, standalone and in a combo — engine change approved by the owner (V1 played every playlist file whole)',
      'feat(sort): the length sort counts each file with its trimmed length',
      'test: migratePad with a property test, file list operations, IDB upgrade v6 → v7 and v5 → v7, older backups, V1 playlist trims, engine trims per file, pad-files E2E in Chromium and WebKit — all counter-checked',
    ],
  },
  {
    version: '3.0.162',
    date: '2026-10-03',
    items: [
      'docs(api): the API list in CLAUDE.md is generated — scripts/sync-api.ts writes every exported function of idb.ts, upload.ts, audio/index.ts and preview.ts with its signature and TSDoc (part of sync:docs; owner decision, industry practice: generated API reports)',
      "docs: notes only the hand list had moved into the TSDoc; corrected on the way — boardGet is used to show the stored board after a failed save (not 'optimistic reads'), the boardPut trade-off points to ADR-0010 (the cited design-notes section does not exist), the idb.ts header names version DB_VERSION and the keyval store",
      'test(guards): the guard on the hand-typed API list is replaced by the generator and the CI sync check (counter-checked: a doc change reaches the list)',
    ],
  },
  {
    version: '3.0.161',
    date: '2026-10-03',
    items: [
      'feat(whats-new): every version of the early development is listed — one generated entry per version before 3.0.135 without a hand-written one, its changes under Details (withEarlyVersions; ADR-0063 amendment, owner decision)',
      'test(whats-new): every changelog version shows exactly once, nothing is generated from 3.0.135 on (counter-checked); E2E opens the details of the oldest version; region names matched exactly ("Version 3.0.1" also matched 3.0.10 …)',
    ],
  },
  {
    version: '3.0.160',
    date: '2026-10-03',
    items: [
      'build(licenses): the license notices cover the service worker too — after vite-plugin-pwa builds it, the workbox:<name> markers of sw.js / workbox-*.js add their packages (workbox-precaching, -routing, -strategies were missing; ADR-0057 amendment, owner approval)',
      'test(pwa): the expected Workbox packages are derived from the markers of the shipped worker files (counter-checked)',
    ],
  },
  {
    version: '3.0.159',
    date: '2026-10-03',
    items: [
      'feat(pwa): update prompt — a new version waits until RELOAD (after running saves) or LATER, registerType prompt without skipWaiting / clientsClaim, hourly check while online (ADR-0066; owner report: the phone showed an old version until the second reload)',
      'build(licenses): third-party-licenses.txt is read from the bundle plus the runtime dependencies of each bundled package, not from package.json (ADR-0057 amendment) — covers workbox-window (dev dependency, shipped through the virtual module) and the workbox-core inside it',
      'feat(ui): browser gestures off on every element — no double-tap or pinch zoom, no selection, long-press menu, drag or tap flash (ADR-0067, owner decisions; pinch zoom and selection in text fields are recorded exceptions)',
      'fix(library): the search field has 16 px text — iOS zoomed into it on focus',
      "feat(whats-new): every version from 3.0.135 has an entry, the missing ten under 'Behind the scenes'; each version folds out its developer changelog under Details (ADR-0063 amendment)",
      'refactor(ui): one toast base (sb-toast) for the undo toast and the update prompt',
      "test: update prompt against the production build (simulated deploy), gestures on five screens in Chromium and WebKit, every version in What's new, Details in E2E, whenSaved — all counter-checked",
    ],
  },
  {
    version: '3.0.158',
    date: '2026-10-03',
    items: [
      'feat(pad-editor): Slice 15a — waveform editor with trim start / end and fade handles (WAI-ARIA sliders, Pointer Events drag, keyboard), trim number fields; the trim and fades always fit the file (src/lib/trimRange.ts)',
      'feat(pad-editor): preview ▶ / ⏸ / ⏹ through the engine under its own id (no pad glow); the playback position is a seek slider (WAI-ARIA APG Media Seek Slider), set by tap or keys',
      'fix(audio): a trimmed Loop repeats only its trimmed region (loopStart / loopEnd; start() counted the duration across loop passes) — engine change approved by the owner; a Loop preview can start mid-region',
      'feat(library): 256 waveform peaks per entry, lists draw 30; entries stored before are backfilled once, one decode at a time (ADR-0065)',
      'test(guards): values inserted into test IDs are checked by type — fixed values kebab-case, free values only at the end (ADR-0054 amendment)',
    ],
  },
  {
    version: '3.0.157',
    date: '2026-10-03',
    items: [
      'fix(audio): sound on iPhone with the ring/silent switch on — the unlock sets navigator.audioSession.type to playback (iOS 17+); before iOS 17 the silent clip loops (owner device test: pads ran silently; owner approved the engine change)',
      "fix(audio): the engine resumes WebKit's 'interrupted' context state too, on play and when the app becomes visible again",
      'fix(library): decoding on upload and import uses an OfflineAudioContext — no real AudioContext per file next to the engine',
      'feat(whats-new): the window names the running version and, if newer than the latest notes, the version with the latest visible changes',
    ],
  },
  {
    version: '3.0.156',
    date: '2026-10-03',
    items: [
      "docs: Slice 15 plan — steps 15a preview / waveform / trim / fades, 15b several files, 15c REPEAT, 15d icons from V1's pack once its license is confirmed; pad templates move to the library, Slice 16 (owner decisions)",
    ],
  },
  {
    version: '3.0.155',
    date: '2026-10-03',
    items: [
      'docs(backlog): test on a real Android device before the app is released to other people (no device at hand; Chromium is covered, phone memory is not)',
    ],
  },
  {
    version: '3.0.154',
    date: '2026-10-03',
    items: [
      'docs: correction — the owner tested the backup on a MacBook (Brave), not on an iPhone; Slices 9 and 10 stay open until the manual iPhone checklist is done (Chromium on macOS, WebKit on iOS); Slice 11 stays complete',
    ],
  },
  {
    version: '3.0.153',
    date: '2026-10-03',
    items: [
      'docs: Slices 9, 10 and 11 marked complete after the owner test of the backup (V1 import, ZIP export, re-import) — recorded as an iPhone test by mistake, corrected in 3.0.154; README "Available now" and "Planned next" updated; stale review notes in the backlog closed',
    ],
  },
  {
    version: '3.0.152',
    date: '2026-10-03',
    items: [
      'docs(backlog): idea — built-in sample sounds with redistributable licenses (CC0) for the first launch, with Slice 17 (owner idea)',
    ],
  },
  {
    version: '3.0.151',
    date: '2026-10-03',
    items: [
      "docs: no document addresses the reader any more (owner decision) — What's new rewritten without personal address and without commands, 14 places in the docs and one changelog item neutral; quotations stay verbatim",
      'test(guards): docsGuards checks every Markdown document and whatsNew.test.ts every release note and changelog item for personal address (counter-checked)',
    ],
  },
  {
    version: '3.0.150',
    date: '2026-10-03',
    items: [
      'docs(testing): manual iPhone checklist — backup export / import steps for the ZIP format and a V1 import check, with the texts the app shows (they still said "Slice 7 — skip")',
    ],
  },
  {
    version: '3.0.149',
    date: '2026-10-03',
    items: [
      'fix(pads): the ADD PAD sheet on a narrow window says "Add Pad" — its cell name was wrong from the second row on ("E5" instead of "B1"); audit A16',
      'build(lint): knip reports unused files, exports and dependencies in pre-push and CI; eslint-config-prettier, installed but never used, now ends the ESLint config (audit A18)',
      'docs(adr): ADR-0064 §4 — code kept for a later slice is marked @reserved, never deleted (owner decision); seven reservations, guarded by codeGuards and knip, listed in the exception register',
      'docs: the foundation analysis of 2026-06-05 is a dated snapshot (audit A22); stale store comments fixed',
    ],
  },
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
      'feat(pads): a Loop with several files runs in the background of a combo and its list repeats; it glows like any loop; the old Playlist colors are gone (owner decisions on PR #36; engine change awaits the playback check)',
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
      'fix(pads): a new pad is Single unless another type is picked — no Loop guessed from long files; the suggested name follows the chosen file',
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
      'test: the start screen visual test hides the version footer (a longer version moved the centered line); review log: PRs #35/#36, Slice 9 structure review',
    ],
  },
  {
    version: '3.0.100',
    date: '2026-10-02',
    items: [
      'feat(model): three pad types — Single and Loop hold several files with an order, Playlist merges into Loop; a Single with several files plays the next one in turn or a random one; DB v5 (Slice 9d, ADR-0048)',
      'test: the start screen visual test hides the version footer — a longer version moved the centered line and failed it',
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
      'chore: remove the V1 reference copy (incl. third-party icons without license file) from the public repository; structure audit findings recorded',
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
      'fix(flame): sparks were drawn black (design color bug); frost no longer shows a light box',
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
      'feat: Waveform peak visualization computed at import, stored in IDB',
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
