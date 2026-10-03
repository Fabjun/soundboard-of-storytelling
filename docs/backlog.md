# Backlog — Soundboard of Storytelling

All open work items, deferred decisions, and known limitations in one place.
Items land here when they are explicitly deferred during a slice or design session.
Items that are hypothetical or undocumented are not included.

**Maintenance:** At each slice completion, before the final commit — review this file,
mark completed items `✅ Done (commit SHA)`, and add any new deferred items surfaced
during the slice. This is the only defence against backlog drift.

---

## Table of Contents

1. [Features (Slice-bound)](#1-features-slice-bound)
   - [Slice 5 — Scene Switching](#slice-5--scene-switching)
   - [Slice 6 — Sets + Quick Access](#slice-6--sets--quick-access)
   - [Slice 7 — Template Export/Import](#slice-7--template-exportimport)
   - [Slice 8 — Settings, Themes, Polish](#slice-8--settings-themes-polish)
   - [PAD Editor (Polish)](#pad-editor-polish)
   - [Audio Engine (Deferred from Slice 4)](#audio-engine-deferred-from-slice-4)
   - [Library (Deferred from Slice 2/3)](#library-deferred-from-slice-23)

- [Design & Feature Clarification Session — 2026-06-04](#design--feature-clarification-session--2026-06-04)

2. [Documentation Debt](#2-documentation-debt)
3. [Deferred Design Decisions](#3-deferred-design-decisions)
4. [Deferred Infrastructure](#4-deferred-infrastructure)
5. [CSS Class Discipline](#5-css-class-discipline-complete)
6. [Known Limitations](#6-known-limitations)
7. [Manual Verification Reference](#7-manual-verification-reference)

---

## 1. Features (Slice-bound)

### Deck reorder (drag & drop) — feature not built

Found 2026-09-29 (T3): DeckRail has no reorder at all, although Slice 3 docs and the V1/V2
inventory claimed it. **Decided** by the product owner: decks are reordered by **drag & drop,
with mouse and touch** (Pointer Events, never HTML5 DnD); alternatives remain open. E2E test 9 in
`deck-crud.spec.ts` is quarantined (`test.fixme`) until the feature lands.
**When:** the adaptive layout in Slice 13 (not part of step 9e, whose scope ADR-0048 §5 fixes:
All pads, remove vs delete, deck checklist).

### All pads view: creating pads there ✅ Done (PR #34)

Decided by the owner 2026-10-02: ADD PAD and a library drop (or long press) in All pads create a
pad that sits in no deck. Squash-merged to main with PR #34 (2026-10-03). The `A` key named in the
decision was removed later the same day — the app has no keyboard shortcuts (product K15).

### Combo by dropping one pad onto another — idea (Open)

Owner idea 2026-10-02: drag a pad onto another pad to create a Combo of both; the pads' icons
could merge into the Combo's icon. Precedent: on the iPhone Home Screen, dragging an app onto
another app creates a folder ([Apple Support](https://support.apple.com/guide/iphone/organize-your-apps-in-folders-iph822ece7dd/ios)).
**Open questions:** a drop on a pad swaps the two today (pad DnD, `v3/src/lib/padDnd.ts`) —
which gesture or drop zone creates a Combo instead; do both pads stay in the deck; what the
Combo's steps are (both in one step, or one after the other); pads have no icons yet, so
merged icons need an icon concept first. Minimal-first: the Combo editor (Slice 11) comes
first, gestures later.
**When:** after Slice 11, discussed with the owner before any plan.

### Built-in sample sounds — idea (Open)

Owner idea 2026-10-03: the app ships a small set of sample sounds, so a new installation can
create and play pads at once (first launch, onboarding). Prompted by the first device test of the
backup: with an empty library no pad could be created.
**Constraints:** the repository is public, so every shipped file is published — each sound needs a
licence that allows redistribution (CC0 preferred) and a recorded source; the owner's own V1
library is not shipped (provenance per file unknown, about 227 MB). The owner believes the sounds
and icons used so far are licence-free — to be confirmed file by file before any of them ships;
V1's icon set most likely comes from Nikoichu's CC0 "1-bit Pixel Icons" pack (structure audit
A1, 2026-09-30). Size matters: sample sounds are precached for offline use (ADR-0057), so the set
stays small (a few MB).
**Open questions:** which sounds; loaded on first launch or offered as a button ("add sample
sounds"); a licence register (file, source, licence) next to `third-party-licenses.txt`.
**When:** with Slice 17 (help & onboarding), discussed with the owner before any plan.

### Test on a real Android device

Android Chrome 100+ is a supported platform (CLAUDE.md "Supported Platforms"), but no test runs on
an Android device: Chrome on Android uses the same engine (Chromium) as the desktop and E2E runs,
and the `mobile-chromium` project emulates a phone's viewport and touch — not its memory. The
risk left is a low-memory phone during a large import (the 227 MB V1 library) or with many
decoded loops. The owner has no Android device (2026-10-03); options: a real-device cloud
(e.g. BrowserStack, paid) or a borrowed phone, walking through
`docs/development/manual-iphone-checklist.md`.
**When:** before the app is released to other people.

### App gestures

The browser's own gestures are off (ADR-0067), so the app can use them. Owner idea 2026-10-03:
two fingers on the pad overview set the size of the pads (pad zoom, `docs/design/components/pad.md`);
further candidates: double tap or long press on a pad. Every gesture needs a non-gesture way too
(WCAG 2.5.1 Pointer Gestures) and is built with Pointer Events. Pad zoom also gives back part of
what the pinch-zoom exception of ADR-0067 takes.
**When:** discussed with the owner with Slice 13 (owner decision 2026-10-03).

### Text fields with selection off

ADR-0067 switches text selection off in text fields too (owner decision). WebKit has known faults
where `user-select: none` keeps a field from taking input (bugs 82692, 156518). If the iPhone
check of 3.0.159 shows a field that takes no typing, selection comes back for text fields
(`input, textarea { user-select: text }`).
**When:** the owner's first iPhone check of 3.0.159.

### Reload right after an edit

RELOAD in the update prompt (ADR-0066) waits for running saves, but an edit typed less than half a
second before still waits in the PAD editor's auto-save; it is written when the page is hidden,
and the browser does not promise that a write started during unload finishes. Option: the
editor's pending save registers with the save counter, so RELOAD waits for it too.
**When:** with Slice 12 (live control) or when a lost edit is seen.

### GitHub runner image change

CI annotation 2026-10-03: "The ubuntu-latest label will migrate to Ubuntu 26 beginning October
19, 2026" (actions/runner-images#14748). Check the CI runs on the new image (browsers, fonts).
**When:** at the next structure review, before 2026-10-19.

### License notices of the service worker

`third-party-licenses.txt` is read from the app bundle (ADR-0057 amendment). The service worker
runtime that vite-plugin-pwa builds separately (`dist/workbox-*.js`) ships workbox-precaching,
workbox-routing and workbox-strategies (measured by their `workbox:<name>:` markers, 2026-10-03);
their licenses are not in the notices — a gap that existed before the change. Option: after the
build, read the markers of the generated file and add those packages.
**When:** waits for the owner's approval (proposed 2026-10-03).

### Backup reminder threshold as a setting

Owner decision B5 (2026-10-02): the board list reminds after seven days without a backup
(`BACKUP_REMINDER_DAYS` in `v3/src/lib/backupExport.ts`); the number becomes a setting.
**When:** Slice 14 (Settings screen).

### Import: date added and original file name from a backup

An import adds each audio file with today's date and the backup's display name: a V3 entry's
`addedAt` and a V1 entry's `added` and `origName` are not restored (tags are — owner decision B9).
Sort by date added (All pads) and the original filename (V1 library feature, P8) would use them.
The V3 library has no field for the original name yet.
**When:** Slice 16 (Library), with the original-filename feature; decided with the owner.

> **Slice numbers in this section refer to the May plan** (Slices 5–8, superseded 2026-09-28).
> Mapping to the new plan (Slices 9–14): `CLAUDE.md §Slice progress`. Items are re-triaged when
> the respective new slice is planned.

### Slice 5 — Scene Switching

### Scene navigation

Switch between multiple scenes on a board during play. The primary GAME-time interaction
after Slice 4 audio playback is live.
**Why deferred:** Slice 5 in the plan; scene data model and CRUD are complete (Slice 3).
**When:** Slice 5.
**Source:** docs/architecture/concept-brief.md §5.1, CLAUDE.md Slice Progress table.
**Session 2026-06-04:** Audio-during-switch explicitly confirmed as the correct behavior — no
code change needed. → [Design Session 2026-06-04](#design--feature-clarification-session--2026-06-04).

---

### Slice 6 — Sets + Quick Access

### PadSet model + Quick-Access strip

### Set CRUD (create / rename / duplicate / delete)

### Set composition and layout

### Set reorder DnD

### Open UX question: Quick Access strip scope

→ all five entries moved to [product/README.md §5 Board, decks & quick access](product/README.md#board-decks--quick-access) (2026-09-28). Revised there: **pad sets are dropped**; the quick-access bar is board-wide, freely assignable, with fixed board-wide keys. Remaining work: see §3 "Board pad pool (data model)".

---

### Slice 7 — Template Export/Import

### V1-compatible template export/import

→ moved to [docs/product/features/data-backup.md](product/features/data-backup.md) (2026-09-28), D5 + import rules. Revised there: the V1-readable export is **dropped**. **When:** Slice 10 (new plan).

### Stream-based export/import (V1 lessons warning)

Must stream one library entry at a time — never JSON-load the entire library at once (iOS
memory safety; 150–300 MB string would OOM older iPhones). **V1 had memory-related crashes
on import/export that were solved by streaming.** V3 must port the V1 streaming pattern, not
re-invent it. Read `v1-reference/index.html` export/import code before designing Slice 7 —
same discipline as reading the V1 audio engine before Slice 4.
**Built on main (Slice 10, ADR-0061 Accepted 2026-10-03):** import reads the file as a stream
(one library entry in memory at a time, two passes, audio first and boards last); export writes a
ZIP archive one audio file at a time (owner decision B1). V1 itself still read imports whole
(`file.text()` + `JSON.parse`) — V3 does not port that part.
**Why deferred:** Same as above.
**When:** Slice 7.
**Correction (2026-09-28):** only V1's _export_ streamed. V1's _import_ reads the whole file and parses it at once (`v1-reference/index.html:5795` `decompressData(...)`, `:5799` `JSON.parse(jsonStr)`) — V3 needs a genuinely piecewise import (data-backup.md D6); there is no V1 pattern to port for it.
**Source:** CLAUDE.md §iPhone/iOS memory rules, banned pattern #4; docs/development/manual-iphone-checklist.md §Section 2.

---

### Slice 8 — Settings, Themes, Polish

> **Note:** Slice 8 currently accumulates 20+ polish items across UI, Grid/Layout, PAD Editor,
> and Audio. When Slice 8 planning starts, the first task will likely be prioritizing or
> splitting into sub-slices (8a/8b/8c) rather than building everything at once.

#### UI / Appearance

### Theme switcher (Crimson, Verdant, Neon)

CSS-class on root element (trivial per ADR-0022); legacy-alias scope bug already fixed in
Slice 1+2 audit.
**Why deferred:** Polish; base functionality comes first.
**When:** Slice 8.
**Source:** docs/architecture/concept-brief.md §5.1, ADR-0022, ADR-0023.

### Per-theme pad color overrides

Crimson gets a COMBO color override (rose-magenta sits next to `--blood` red — not a hard
conflict, but a missed opportunity). Verdant COMBO holds — the fairy-tale tone fits.
**When:** Slice 8 (after themes land).
**Source:** docs/design/design-notes.md §Theme integration.

### Theme-conditional clock variants

Verdant Mushroom Clock is designed; Crimson candle-clock + Neon CRT-burn display are design
explorations (~30 min each). Worth shipping if themes get a real release pass.
**When:** Slice 8 (after themes land).
**Source:** docs/design/design-notes.md §Theme integration.

### `is-deep` as user-configurable setting

Settings → Display → "High quality pad visuals" toggle. Currently always-on for the DepthPad.
**When:** Slice 8.
**Source:** ADR-0025, docs/design/design-notes.md §DepthPad/pad rendering.

### Mode-awareness cues

One of four alternatives to reinforce SETUP/GAME distinction beyond the current toggle and
is-setup pad treatment. Evaluation order: (1) Atmosphere — SETUP shows grid; GAME adds
AmbientEmbers + hearth-glow (highest impact, reuses v8 infrastructure). (2) Status chip —
bold full-fill mode badge in status-bar left slot. (3) Edge tint — 2 px inset outline in
active mode colour. (4) Spine saturation — pad type-spines dim to 45% opacity in SETUP
(lowest priority; risks conflating mode and type semantics).
Ship one, optionally two if they hit different screen regions and don't compete.
**When:** Slice 8.
**Source:** docs/design/design-notes.md §Slice 8 — Mode-awareness cues.

### Pad Appearance settings persistence

"APPLY TO ALL PADS" writes to project state system-wide, not per-pad. Per-pad override is
a separate future feature.
**When:** Slice 8.
**Source:** docs/design/design-notes.md §Settings & system polish.

### Settings search across submenus

Typing filters all rows across all submenus, jumps to first match, highlights the term.
**When:** Slice 8.
**Source:** docs/design/design-notes.md §Settings & system polish.

### Mode-toggle SFX preview

Settings → Controls "Mode toggle SFX" file slot: preview the chosen sound at current MASTER
volume. Reuse the pad PREVIEW button code path — no separate "test sound" feature.
**When:** Slice 8.
**Source:** docs/design/design-notes.md §Settings & system polish.

### View Transitions API (optional polish)

iOS 18+ only; never a hard dependency. Progressively enhance scene/screen transitions if
available.
**When:** Slice 8 (only if iOS 18+ has reached the minimum-supported threshold by then).
**Source:** ADR-0006.

### PANIC / fade-all button

Global fade button alongside the hard STOP. `fadeOutAll(duration)` is already implemented and
exported — pure UI work; no audio changes needed. See [Design Session 2026-06-04](#design--feature-clarification-session--2026-06-04) for full context
(engine file refs: `engine.ts:375–412`, `index.ts:83–85`).
**Note:** Not the scene-to-scene crossfade stub (→ [Real crossfade stub](#real-crossfade)).
**When:** Slice 8.

### Glanceable loop state

Breathing aura (v8 §5) + loop-spine animation (v8 §6) — designed in `design-sources/2026-05-25/`,
not yet implemented. CSS animation + new `is-*` classes. On top of this design: One-Shot-Spark
(see [Design Session 2026-06-04](#design--feature-clarification-session--2026-06-04) → Parked Candidates; not yet designed).
**When:** Slice 8.

#### Grid / Layout

### Grid configurability (gridConfig popover)

Expose cols × rows in a popover. Mobile hard cap: 5×4 (no 6×4 or 6×6 in the mobile popover
— avoids "tooltip warning the user not to do the thing the UI offers").
**Why deferred:** Grid is currently hardcoded 4×4. Slice 3 decision to defer.
**When:** Slice 8.
**Source:** ADR-0032, docs/design/design-notes.md §Slice 8 — A4 Mobile preset ceiling.

### Cell-size setting

Global preference in Settings → Display (compact / normal / spacious). Per-scene cell-size
multiplies the variation space without much real benefit.
**When:** Slice 8.
**Source:** docs/design/design-notes.md §Slice 8 — A4 Cell-size.

### Default new-scene grid as user preference

Currently hardcoded 4×4 for every new scene. Expose an override in Settings → Display.
Then 4×4 becomes the default until it is changed once.
**When:** Slice 8.
**Source:** docs/design/design-notes.md §Slice 8 — A4 Default new-scene grid.

### Unplaced pads remember desired position

When shrinking a grid pushes pads off, they retain their wanted (col, row). Enlarging the
grid re-places them automatically if the slot is still free.
**When:** Slice 8.
**Source:** ADR-0009, docs/design/design-notes.md §Slice 8 — A4 Unplaced pads.

### Mobile layout adaptation

Make SceneRail collapsible or overlay at narrow viewports (≤ 390 px). Make inspector panels
(PadEditorPanel, LibraryPanel) slide over the pad grid rather than pushing it, or use a
tab-based layout. Minimum viable target: pad grid center area ≥ 44 px in all three SETUP
states at 390 px.
**Why deferred:** Adaptive layout implementation per ADR-0045 (two-axis model: narrow↔wide × touch↔pointer). Slice 8 brings layout fully into the model; Axis-1 breakpoints need empirical calibration on real devices first.
**When:** Slice 8.
**Source:** docs/design/design-notes.md §Known limitation: SETUP layout.

### Empty-SETUP affordance / placeholder

The empty-SETUP inspector placeholder ("Select a pad to edit or open the Library") was
removed in commit 402b4c2 as a side-effect of a test fix. What the empty SETUP state
should show — guidance text, a wider bare grid, or something else — is an open UX question.
Decide after real-use data is available, likely with Claude Design.
**When:** Slice 8, after real sessions.
**Source:** docs/design/design-notes.md §Known limitation: SETUP layout.

---

### PAD Editor (Polish)

Items below are PAD Editor interaction details deferred from Slice 3/4. They targeted the
superseded Slice 8; re-triaged 2026-10-02: the PAD editor at V1 scope is **Slice 15** (CLAUDE.md
slice table) — when planning it, decide for each item whether it belongs to it.

### Key Capture flow

KEY / MIDI / GAMEPAD fields enter a "listening" state (pulsing teal border, "press any key…")
on click. Escape cancels. Visual: reuse SETUP-mode hatch during the listening window.
**Source:** docs/design/design-notes.md §PAD Editor — Key Capture flow.

### Inline conflict feedback

Live ✓/⚠ hint under KEY field as a binding is chosen — don't wait for save.
**Scope:** conflicts are checked **per deck** (formerly "scene"), not per board — keys apply per deck ([docs/product/README.md §6](product/README.md#input-keyboard--numpad) K2, 2026-09-28). Quick-access keys are board-wide (K13) and conflict with every deck.
**Source:** docs/design/design-notes.md §PAD Editor — Inline conflict feedback.

### Snap-to-zero-crossing on waveform drag

Trim and loop markers snap to the nearest audio zero-crossing while dragging. Without it,
hard cuts produce audible clicks.
**Source:** docs/design/design-notes.md §PAD Editor — Snap-to-zero-crossing.

### Numeric scrubbing on M:SS labels

TRIM START / TRIM END / LOOP POINT readouts: Premiere-style click-drag to nudge ±0.1 s
per pixel; hold ⇧ for ±0.01 s.
**Source:** docs/design/design-notes.md §PAD Editor — Numeric scrubbing.

### Live preview that respects fades + trim

PREVIEW starts at trimStart with fades + loop applied. Playhead restarts at loopPoint for
LOOP-type pads so the user can hear the loop seam.
**Source:** docs/design/design-notes.md §PAD Editor — Live preview.

### Crossfade duration as inline control

Mini-slider (60–600 ms) or numeric scrubber. Gate visibility on loop mode = CROSSFADE.
**Source:** docs/design/design-notes.md §PAD Editor — Crossfade duration.

### Waveform zoom for long files

Zoom level (scroll wheel or ±/0 keys) + minimap strip; only relevant if files ≥ 60 s are
common in real use.
**Source:** docs/design/design-notes.md §PAD Editor — Waveform zoom.

### Pad-type change confirmation

Switching LOOP→SINGLE invalidates loop-point and crossfade. Show inline confirm before
discarding; don't silently wipe settings.
**Source:** docs/design/design-notes.md §PAD Editor — Pad-type change confirmation.

### Output bus inheritance hint

Faded one-line hint below OUTPUT BUS pills showing where the level baseline comes from.
**Source:** docs/design/design-notes.md §PAD Editor — Output bus inheritance hint.

### Hotkey conflict on duplicate

⌘D conflicts with the browser "Bookmark this page" in non-standalone PWA mode. Options:
use ⌘⇧D, or accept that duplicate is right-click / long-press only when running outside
standalone mode.
**Source:** docs/design/design-notes.md §A3 Scene CRUD open questions.

---

### Audio Engine (Deferred from Slice 4)

### Finite Loop Count (loopCount > 0)

Currently only infinite loops are supported. Add support for a fixed repeat count when
the need surfaces in real play sessions.
**Why deferred:** Infinite loops cover all known real-game use cases so far.
**When:** When missed in real use.
**Source:** CLAUDE.md Slice 4 deviations.

### Real crossfade

Currently a stub: `stop(from)` + `play(to)`. Implement proper crossfade in Slice 8.
**When:** Slice 8.
**Source:** CLAUDE.md Slice 4 deviations.

### `is-scheduled` pad state (combo + ducking)

A third visual state for pads that will fire on the next downbeat (combo scheduling, ducking
release). Softer outline in pad-type colour, no inset fill — distinct from idle and `is-hot`.
Hold until combo timing is real in the UI.
**When:** After combo scheduling lands (Slice 8+).
**Source:** docs/design/design-notes.md §Slice 4 — C1.

### `--pad-soft-outline` token family

Colour values for the `is-scheduled` visual. Hold until `is-scheduled` is approved — adding
tokens before the state has a use makes the §A cheat-sheet noisier without solving anything.
**When:** Same as `is-scheduled`.
**Source:** docs/design/design-notes.md §Slice 4 — C2.

### Per-pad level metering

The audio engine has analyser node infrastructure, but per-pad metering UI is deferred.
Adds CSS animation complexity and is a polish concern, not functional.
**When:** Slice 8 (Polish).
**Source:** Slice 4 plan, scope notes ("Nicht in Slice 4").

---

### Library (Deferred from Slice 2/3)

### Multi-file playlist UX

FileRow supports multiple files for playlist pads: drag to reorder, click to select primary,
⌘-click for bulk remove. The currently-selected file's waveform shows in the big canvas.
**When:** When playlist pads are in real use (Slice 4+).
**Source:** docs/design/design-notes.md §Audio file management.

### Per-file fade and trim for playlist pads

Each playlist entry gets its own fade-in / trim. Either per-file state or per-file JSON in
the project file. Decision deferred until playlist UX is built.
**When:** Same as multi-file playlist UX.
**Source:** docs/design/design-notes.md §Audio file management.

### Tag autocomplete with keyboard

Typing in the tag field surfaces matching tags from the project pool (case-insensitive, fuzzy
on substring). ↵ commits, ⌫ on empty input removes last chip. Chips render in pad-type colour
family if a semantic mapping exists.
**When:** Slice 8 or library polish pass.
**Source:** docs/design/design-notes.md §Tags & folders.

### Folder picker as a tree

The FOLDER field opens a narrow tree column inside the inspector, not a separate dialog. New
folder via a `+ NEW` row at the bottom.
**When:** Slice 8 or library polish pass.
**Source:** docs/design/design-notes.md §Tags & folders.

---

## Design & Feature Clarification Session — 2026-06-04

> **State of decisions from a clarification session, not a finished plan.** The feature list is
> explicitly open — additions and changes are expected. More stable directional decisions can
> change, but only as a deliberate change of course with a reason; provisional items are
> expected to move.

---

#### Guiding principle — technically-minded tinkerers

→ moved to [product/README.md §7](product/README.md#7-design-principles) (P2, P3; 2026-09-28). Revised there: "does not hold the user's hand" replaced by "well designed for its purpose, depth for those who want it". Applications of the principle: [C10](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture).

---

#### Architecture motto — "Think big, but don't rush"

_Engineering approach, not a product principle — moves to `docs/architecture/README.md` once it exists (ADR-0047). Open: tension between the anticipated settings hierarchy / sidebar shell and docs/product/README.md §7 P1 "minimal and functional first"._

The app is built on a deliberately chosen modular foundation — multi-level settings hierarchy, reusable building blocks such as the sidebar shell — a forward-looking anticipation of future extensibility, chosen consciously against a pure continuous-refactoring stance, with the trade-off explicitly named. This foundation is NOT set in stone: it emerges organically while practically building and testing the app, and even the underlying concept may be revised if real experience demands it. Concretely: only what the really existing cases need is implemented (the sidebar will simply be extended to the Pad Editor when that time comes); the full system is thought through in the design but NOT built on spec.

**Corollary on communication:** Complexity that is deliberately built in must stay visible — foreseeable downstream costs are named in advance. Complexity that only reveals itself later is flagged explicitly as a new realization, never quietly absorbed.

**Relationship to the tinkerer principle:** These are complementary, not competing. The tinkerer principle governs _what_ to build (user control, predictable mechanics); this motto governs _how_ to build it (forward-thinking architecture, incrementally, with explicit trade-offs named).
**Cross-references:** → [Guiding principle — technically-minded tinkerers](#guiding-principle--technically-minded-tinkerers) · [2d — Sidebar as reusable building block](#2d--sidebar-as-reusable-building-block) · [2e — Multi-level settings hierarchy](#2e--multi-level-settings-hierarchy).

---

#### Stable directions

### Audio continues during scene switch _(confirmed correct — Slice 5)_

Scenes are the Gamemaster's organisational layer; players perceive no scene boundary. Switching
is administrative, not dramatic — the audio experience must not change. Current code behaviour
is correct; no implementation change needed.
**Discarded:** Hard stop (disrupts player experience); crossfade = separate Slice 8 work
(→ [Real crossfade stub](#real-crossfade)).
**→ Slice 5:** [Scene navigation](#scene-navigation).

### Code is the authoritative truth; design library is archive

`design-sources/2026-05-25/` is the historical starting point, not a maintained living source.
**Claude Design is used only for new UI elements** — not to keep existing files current.
Design-code drift is NOT resolved by updating design files. Stale places (e.g., `v11-mobile`
shows 3 columns; 4-column grid is binding) remain as archive.

### Two-axis adaptive model

The app is **ONE adaptive application** — no separate "Desktop system," no version switch.
Presentation adapts along two independent axes:

**Axis 1 — Screen format** governs spatial layout (where things sit). Narrow/portrait →
dock bar at the bottom, thumb zone. Wide/landscape → side-rail, more visible simultaneously.
This is the responsive axis (CSS breakpoints). Crucially, dock-edge position depends on screen
FORMAT, not on input type — a phone driven by a mouse keeps its bar at the bottom because a
side-rail is awkward in portrait format, not because it is touch.

**Axis 2 — Input type** governs additive capabilities (what the input allows), WITHOUT changing the
spatial layout. Touch is always the base (works everywhere). When a mouse/keyboard is present,
ADDITIONAL capabilities layer on top: hover tooltips, right-click context menus, keyboard
shortcuts. Progressive enhancement, not a separate version.

The two axes are independent — all four combinations make sense (narrow+touch, narrow+mouse,
wide+touch, wide+mouse). The current mobile prototype is the "narrow + touch" region; the
existing app code is the "wide + mouse" region. Both are regions of ONE adaptive app.

**On density:** "denser targets" belongs to Axis 1 (screen size → larger screens afford denser
layout), NOT to Axis 2 (input type). The touch-minimum target size (~44 px) is the base for all
inputs. A mouse hits large targets fine; no input-driven density change is assumed. If denser
layouts are ever wanted, they belong on Axis 1, large-screen — not baked in as Axis-2 behaviour.

**What "mobile first" now means:** the "narrow + touch" region of the adaptive space is built
first. The existing app code already is the "wide + mouse" region. There is no separate "Desktop
system" to build as a later block — the goal is to bring both regions into ONE adaptive app.
The exact breakpoint thresholds (where the sidebar moves from bottom to side) are an
implementation detail to be tuned empirically on real devices; not decided now.

**Device-detection / version-switch problem — resolved:** Because there are no longer two
exclusive versions, there is nothing to "switch" and nothing to mis-detect. The app detects both
axes continuously: screen format via standard CSS breakpoints; input type via the
`pointer: coarse/fine` and `hover` media queries / Pointer Events API (the established, reliable
Web standard). Browser "Request Desktop Site" is NOT a usable switch — on iOS it only changes
the user-agent string, while the physical viewport and the `pointer` media query remain
unchanged. UA-based detection is unreliable and unnecessary under the adaptive model.

**4-column grid is binding across all screen formats**
(→ [Grid configurability](#grid-configurability-gridconfig-popover)).
**→ ADR:** [ADR-0045](architecture/0045-two-axis-adaptive-model.md) · **→ Boundary:**
Axis-1 frame-layout adaptation ≠ pad-grid column reflow
(→ [ADR-0032](architecture/0032-grid-4col-constant.md)).

---

#### Provisional / open decisions

### Night vision mode (modifier, not theme)

Night vision = a Settings-activatable modifier over the active theme: brightness damping,
red-shift, contrast reduction. Not a separate theme — ergonomics (not seeing too bright) and
mood (theme) are orthogonal; both must remain independently configurable.
**Status:** Freshly decided, not yet tested in practice. Disableable comfort feature; no hard
dependencies.
**When:** Slice 8.
**→ Slice 8:** [Theme switcher](#theme-switcher-crimson-verdant-neon) — night vision layers
over the active theme.

### Quick-Access content deferred _(pending real scene experience)_

Quick Access in any form is deferred until Slice 5 scene use reveals whether the need is
genuine and what shape fits. Four candidate shapes remain open:

- **Quick Access Strip** (v9 §2) — persistent pinned individual pads, always visible.
- **Cue Stack** (v9 §3) — sequential TAB-queue; pads fire in order.
- **Set-Switches** (Slice 6 concept) — switch entire Sets at once.
- **Cue Tray** — 2–3 armed pads, non-sequential fire-at-will.
  If any form is built: must be disableable.
  **→ Slice 6:** [PadSet model + Quick-Access strip](#padset-model--quick-access-strip) ·
  [Open UX question: Quick Access strip scope](#open-ux-question-quick-access-strip-scope) —
  deferral reason updated: "requires real scene experience" extends "requires Slice 5 in place."

### Summonable overlay contract _(pending; not yet finalized — refined after panel-fit check)_

A unifying interaction concept for secondary panels (Library, PadEditor, Quick-Pads, Mixer).
Originally conceived as a single unified mechanism; a subsequent panel-fit check (2026-06-04)
revealed this does not universally apply — the contract is **layered**, not monolithic.

#### Layer 1 — Resize _(base; broadly applicable)_

Applies to every **visible, resizable surface**. Prerequisite: surface is visible.

- **Seam handle:** a finger-friendly grab zone in a narrow seam groove between regions.
- **Drag = resize**, with detents (snap points) that enforce invariants: 4-column pad cells ≥ 44 px,
  panels ≥ min-width ~200 px.
- This layer alone does not confer open/close behaviour.

#### Layer 2 — Summon _(extension; only for summon-driven surfaces)_

Sits on top of Layer 1. Applies **only** to surfaces that are togglable (can be shown/hidden).
Prerequisite: surface is togglable — a stricter condition than Layer 1.

- **Tap seam = open / close.**
- **Hold seam = spring-loaded momentary** (surface open only while held) — optional, reserved
  exclusively for fire-and-forget surfaces (Quick-Pads). Not added to browse/edit surfaces.

**Hierarchy:** The layers are not orthogonal — they are stacked. Summon presupposes Resize
(whatever is summonable is also resizable when visible), but not vice versa (a visible surface
need not be summonable). Resize = base, Summon = extension built on top.

#### Closing gesture correction (Gesture 4)

The originally proposed variant **tap-outside = close does NOT work** on this layout. The panel-fit
check established: the pad grid occupies the entire remaining surface; every tap on it is already
claimed (GAME: fire pad; SETUP: select pad / open creation popover). There is no neutral "outside".

**Close instead via:** seam-tap again, or swipe-to-edge (both originate on the handle/panel —
origin-disambiguated). Applies to all summon-driven surfaces.

#### Per-surface assignment (from panel-fit check)

| Surface                              | Layer 1 Resize | Layer 2 Summon | Spring-loaded | Notes                                                                                                                                                                                                                                           |
| ------------------------------------ | :------------: | :------------: | :-----------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quick-Pads _(planned)_               |       ✅       |       ✅       |      ✅       | The design-canonical case of the full contract.                                                                                                                                                                                                 |
| LibraryPanel                         |       ✅       |       ✅       |       —       | Coexists with existing place-mode auto-close (long-press on library row sets panel to `'empty'`).                                                                                                                                               |
| Mixer _(planned, v8-atmosphere.jsx)_ |       ✅       |       ✅       |       —       | Same model as LibraryPanel.                                                                                                                                                                                                                     |
| PadEditorPanel                       |       ✅       |       —        |       —       | **Resize only.** Selection-driven (opens on pad select, closes on deselect) — not summon-driven. A summon handle would have no coherent state here. Editor retains its existing selection-driven open/close logic.                              |
| SceneRail                            |       —        |       —        |       —       | **No layer today** — permanently present; no toggle state in the code. Contract applies only if SceneRail becomes collapsible on mobile (see [Mobile layout adaptation](#mobile-layout-adaptation)). At that point Layer 2 becomes a candidate. |

#### Visual requirement _(for later elaboration)_

Layers must be visually distinguishable: a pure Resize handle (e.g., Editor) shows only the
drag glyph; a full Summon handle (e.g., Quick-Pads) additionally signals tap/open capability.
Narrow constraint: shared pixel-handle language for recognisability AND a visible extra on the
Summon handle so "sometimes tappable, sometimes not" does not confuse. Concrete visual solution
is a task for Claude Design.

**Status:** Preliminary/open, but now refined. Panel-fit check forced the layering — the
originally monolithic contract did not fit PadEditor (selection-driven) or SceneRail
(permanently present), and the tap-outside close gesture is ruled out by the dense layout.
This documents the decision as tested, not assumed. Source: Claude Design concept session +
panel-fit check 2026-06-04.

**→ Slice 8:** [Mobile layout adaptation](#mobile-layout-adaptation).

---

#### Design session round 2 — 2026-06-04 (continued)

> The following three blocks have **different status** and must not be mixed.
> A = proposed design input (not decided), B = decisions taken, C = architecture conflict
> (C10 resolved 2026-06-04). The difference in status is the core of these entries.

---

#### A — Claude Design layout input _(reviewed, NOT adopted as a decision)_

These proposals came from Claude Design and were discussed, but **not accepted as decisions**.
They are input for the upcoming visual design work, which will then be reviewed.

### A1 — Geometry observation and gesture-grammar idea

It follows from the (binding) 4-column grid that pads grow rather than multiply → the grid
becomes a tall vertical strip. Derived idea (proposal, not decided): this geometry suggests a
two-axis gesture grammar — vertical = within a scene, horizontal = between scenes. This idea
touches decision B8 (swipe-to-page) and conflict C10 (need to scroll).

### A2 — Three-band structure (proposal)

Rough division of the screen layout: top band = glanceable info / rarely touched; middle band
= pad grid (fills the main part); bottom band = thumb zone (scene switcher, master controls,
summon grips). Not yet laid out or implemented; a proposal for the visual design work.

### A3 — Grip vocabulary: rail vs. pull tab _(concerns the summonable overlay contract)_

Proposal for visually distinguishing the layers of the summonable overlay contract
(→ [Summonable overlay contract](#summonable-overlay-contract-pending-not-yet-finalized--refined-after-panel-fit-check)):
**Rail** ("slide me") = resize base layer; **pull tab** ("I open") = summon layer. The question
"does it have a tab?" would then be the visual distinguishing feature between the layers. The
concrete design is the job of the visual design work, not decided here.

### A4 — Three-gesture resolution (proposal)

Within one grip: movement threshold → resize; below threshold / tap time → summon toggle;
hold without movement → momentary. Each branch gets its own feedback. Proposal — the
thresholds and the form of feedback are not fixed.

### A5 — Adaptive docking rule (proposal)

Invariant: 4-column grid, cells grow with the viewport size. Variable: the docking edge rotates
with the form factor — narrow/portrait = bottom sheets, wide/landscape = side rail. An idea for
the layout work, not decided.
**Framing correction (2026-06-04):** the rule is driven by screen format (axis 1), not by
device or input type — the original "phone/tablet" wording was shorthand for "narrow/wide",
not the actual criterion.
→ [Two-axis adaptive model](#two-axis-adaptive-model).

### A6 — Screen sketches (proposal)

Four sketches of mode states: **Play** (grid in front, scene switcher at the bottom,
spring-loaded quick pads); **Setup** (clear mode shift, tap → editor, drag → reorder);
**Library** (both grip layers visible); **Editor** (resize layer only). No concrete
dimensions or pixel decisions yet — orientation images for the visual design work.

---

#### B — Decisions taken

These points were decided by the user, not only proposed.

### B7 — Closing the PadEditor = variant B (explicit close button)

**Decision:** the PadEditorPanel is closed with an explicit close button. Resize changes
**strictly only the size** — it can never close the editor. No summon layer, no swipe-away
gesture. Requirement: the close button is reachable in every resize state (a visible minimum
panel size exists).
This decision is consistent with the summonable overlay contract (PadEditor = layer 1 only,
selection-driven; → [Summonable overlay contract](#summonable-overlay-contract-pending-not-yet-finalized--refined-after-panel-fit-check)).

### B8 — Scene switching mechanism: tap switcher primary, swipe optional and GAME only

→ moved to [product/README.md §3](product/README.md#3-app-modes-game-and-setup) (2026-09-28). Revised there: swiping between decks (formerly "scenes") is now **Parked**; decks switch via classic controls only.

### B9 — Gap classification: three confirmations, two new candidates

Claude Design's five flagged gaps were classified:

**Three confirmations of known points (not new):**

- **Cross-scene active sounds** = the Slice 5 audio control problem. Claude Design's concrete
  form: a top band with quick-stop chips (≈ earlier option B).
  → [Audio continues during scene switch](#audio-continues-during-scene-switch-confirmed-correct--slice-5).
- **Panic/fade-all** = existing quick win (`fadeOutAll()` done). New addition: guard the
  trigger against accidental activation ("guarded").
  → [PANIC / fade-all button](#panic--fade-all-button).
- **Unambiguous mode signal** = v25 mode awareness + Stage Lock candidate.
  → [Stage Lock](#stage-lock).

**Two genuinely new candidates (added to the candidate pool):**

- **Audition vs. live output:** previewing a sound must not be audible in the room — needs
  separate audio routing plus a visual distinction (headphone icon or similar). New; no design,
  no implementation yet.
- **Overflow / scroll question:** unlimited pads per scene vs. a non-scrolling grid. This point
  grew into an architecture conflict → fully documented in C10.

---

#### C — Architecture conflict _(C10: concept resolved 2026-06-04; implementation pending Slice 8)_

### C10 — Variable grid, gap-preserving reflow, gesture-based scroll protection, settings architecture

**Starting situation:** The pad count per scene is unbounded (user requirement). The current code has a non-scrolling grid (`.sb-pad-grid`: no `overflow` set; `.sb-board-main`: `overflow: hidden`). These two requirements are incompatible — excess pads silently disappear behind `overflow: hidden`, unreachable and without any indication.

**Status: CONCEPT RESOLVED — IMPLEMENTATION PENDING (Slice 8).** The design is decided (see below). Code still has `overflow: hidden` on `.sb-board-main`; excess pads currently disappear. Implementation is Slice 8 work. Foundation: the [guiding principle](#guiding-principle--technically-minded-tinkerers) (predictable mechanics + full user control, sensible defaults).

#### Core design

1. **Two column modes (from V1):** `AUTO` — pad size + gap determine column count via `auto-fill` — OR fixed column count (user picks 2–6 or similar). Both modes selectable.

2. **Configurable pad display at full V1 scope:** pad size, gap/spacing, column mode, font/label size — all with live preview directly on the board, via the board side-menu in SETUP mode. Scope reduction possible later. Sensible default values apply (see guiding principle).

3. **Free placement with gaps allowed:** the user may arrange pads with empty slots. Gaps are a legitimate grouping device alongside scenes.

4. **Column change = hard-wrapping sequence:** when the column count changes, the linear pad sequence wraps hard (position N lands in row ⌈N / column count⌉). Gaps keep their place in the sequence. Nothing disappears, no "orphaning." The 2D pattern may shift (pads move to a different row) — this is deliberately accepted: predictable mechanics rather than pattern-preserving magic, which is logically impossible anyway.

5. **Data model `{col, row}` stays (ADR-0008 confirmed).** No rebuild to a linear array — gap preservation is exactly what requires the fixed positions.

6. **Free reordering with swap/insert:** dragging a pad onto another pad = swap; dragging a pad between two pads = insert. Already implemented (25% edge zone vs. center).

7. **Scroll protection with many pads** (target ~64 pads/scene; scrolling is the normal case): character-based gesture disambiguation — quick tap = fire pad (GAME) / select (SETUP); swipe motion (past a movement threshold) = scroll; longer hold without movement = pick up pad, then drag to reorder (SETUP only). Thresholds are app-global, adjustable in app settings. Follows the proven LibraryPanel pattern (350 ms hold, cancel at 8 px movement).

8. **Settings architecture — special case of the multi-level hierarchy (→ [2e](#2e--multi-level-settings-hierarchy)):** App level = app-wide (e.g. themes, gesture thresholds), set in the app settings menu. Board level = only for the current board (e.g. pad display), set in the board side-menu. These two levels correspond to Levels 1 and 2 in the general model (see [2e](#2e--multi-level-settings-hierarchy) for the full 3-level picture). The **no-duplication rule** — the same setting option must NOT appear on both levels — is the special case of the cross-cutting separation rule: elements within a level are also separate (Board settings ≠ Library settings, even though both are Level 2). Within a board: default/individual checkbox per scene AND for the quick-menu — chooses whether the scene/quick-menu follows the board default or has its own values. "Follows default" = live binding (a change to the board default propagates to all scenes set to "follow"), not a frozen copy. A save file stores all settings from all levels; an import brings them all along.

#### Assumption — ✅ Verified (code-check 2026-06-04): Library is structurally different

The column/size setting is **not** a generic class across all scrollable surfaces. Code-check (2026-06-04) confirmed: the Library is categorically different from the pad grid — a single-column list of horizontal table rows (`.sb-item-list` + `.sb-audio-row`), not a 2D tile matrix. No shared layout class exists between the two surfaces today. Of the four display settings, only font/label size is genuinely generic across both; column count, pad size, and gap are pad-grid-specific.

This is the same kind of structural difference as PadEditorPanel vs. the grid in the grip-contract analysis — analogous reasoning, same outcome.

**→ Full finding and per-setting breakdown:** [2a — Library display logic](#2a--library-display-logic).

#### Parked alternatives (opt-in in settings — NOT core design; build only on proven need)

- **Side scrollbar** as an alternative scroll model (instead of swipe-gesture scrolling).
- **Collapsing gaps** as an alternative column-change behavior (instead of gap preservation).

Both are exceptions for users who want it differently — consistent with the guiding principle (more choice = more control). Not part of the first build.

#### Explicitly discarded (earlier intermediate states — no longer apply)

- **Orphan warning on column reduction** — moot: the hard-wrapping sequence (point 4) discards nothing; no orphaning occurs.
- **Data model rebuild to a linear array** — moot: gap preservation requires the `{col, row}` model (point 5).

#### Open implementation question (clarify before Slice 8 — NOT now)

Before building: check interaction expectations for existing saved boards. The new gesture model (point 7) changes the current SETUP reorder, which starts immediately on `pointerdown` (new: long hold instead of immediate drag). A migration/compatibility question to keep in mind when building.

**→ Slice 8:** [Mobile layout adaptation](#mobile-layout-adaptation) · [Grid configurability](#grid-configurability-gridconfig-popover) · [Cell-size setting](#cell-size-setting).
**Cross-references:** Settings architecture (point 8) → full model in [2e — Multi-level settings hierarchy](#2e--multi-level-settings-hierarchy); display setting scope per surface → [2c — Modular display controls](#2c--modular-display-controls); quick-access/quick-menu display consistency → [Quick-Access content deferred](#quick-access-content-deferred-pending-real-scene-experience) and [B9](#b9--gap-classification-three-confirmations-two-new-candidates).

---

#### Code-check + architecture extension — 2026-06-04 (Library, sidebar, settings hierarchy)

> Follows the resolution of C10. A code-check verified C10's "assumption to verify" (generic display class across surfaces). The result reversed the assumption and anchored three architecture decisions. **Status labels:** _settled_ = user decision; _working assumption_ = to be reviewed on the real object; _verified finding_ = code/analysis evidence.

---

### 2a — Library display logic

_Verified finding — code-check 2026-06-04_

**Finding:** The Library is structurally **different** from the pad grid — categorically, not by degree. Same kind of difference as PadEditorPanel vs. the main grid in the grip-contract analysis.

| Surface       | Structure                                                                                   | CSS layout                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pad grid      | 2D tile matrix — `cols × rows` cells, each `1fr × 1fr`, position-addressed via `{col, row}` | `display:grid; grid-template-columns: repeat(var(--grid-cols), 1fr)` driven by `Scene.gridConfig`                                                                           |
| Library today | Single-column list of horizontal table rows                                                 | `.sb-item-list`: `flex-direction:column`. `.sb-audio-row`: `display:grid; grid-template-columns: 160px 1fr 70px 90px 44px` (name \| waveform \| duration \| size \| delete) |
| Library panel | Single-column item list with row-separator border-bottom                                    | `.sb-lib-panel-row`: `flex-direction:column`, name + waveform per row                                                                                                       |

**Of the four configurable display settings, only font/label size is genuinely generic across both surfaces:**

| Setting             | Pad grid                                                          | Library applicability                                                                                                                       |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Column count / mode | Number of tile columns in the 2D grid — core structural parameter | Meaningless — Library has one content column; no tile matrix                                                                                |
| Pad size            | Per-tile dimensions                                               | No equivalent — Library rows have `min-height: 44px`, not tile size                                                                         |
| Gap                 | Space between tiles                                               | Different concept — Library uses row spacing (`gap: var(--space-1)`, hardcoded); "row density" would be plausible but is a distinct setting |
| Font/label size     | Text size inside pad tiles                                        | **Genuinely generic** — text appears in both surfaces; both benefit equally                                                                 |

**Shared today:** `Waveform` component and design tokens (`--space-*`, `--font-*`) only. No shared layout class or sizing primitive between the two surfaces.

**Quick-menu:** Does not exist in code. Only `Board.settings.quickAccessLayout` + `PadSet` type defined (`src/types.ts:15–20, 39–44`); no component, screen, or CSS. Planned Slice 6.

**→ C10 assumption updated:** see [C10](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture) — updated from "to verify" to "verified: Library structurally different, system is pad-grid-specific."

---

### 2b — Library form

_Working assumption — to be reviewed after implementation, NOT a locked decision_

**Working assumption:** The Library will become a tile grid (same structural form as the pad grid), on the rationale that both overviews are about seeing an arrangement of items.

This is an explicit **working assumption to be reviewed on the real object** after implementation — not a locked decision. The Library is currently a row list; converting it to tiles is a significant structural change, and whether tiles actually serve library browsing better must be validated against real experience.

**Consequence to design at implementation time:** Each tile must handle detail info (waveform, duration, size) with dynamic stacking depending on display size. V1 used `@container(max-width: 67px)` for this; V3 supports container queries (iOS 16+) with media-query fallback on iOS 15. Users can additionally choose which details are shown at all.

**Open detail-question (flag for implementation — do NOT resolve now):** When the user enables a detail (e.g. "show waveform") but tiles are currently too small to display it, which wins — the user's choice or the size-driven auto-hide? Consistent with the tinkerer principle, the user's choice likely wins (opt-in detail should not silently disappear). Decide at implementation with real evidence.

---

### 2c — Modular display controls

_Settled_

The same display function (column count, size, gap) appears in multiple sidebars — e.g. the SETUP sidebar and the Library sidebar. It is the **same function/mechanic** but its **scope is local** to the sidebar it lives in:

- Configuring pad size in the SETUP sidebar affects only the scene's pad grid, not Library tiles.
- Configuring tile size in the Library sidebar affects only the Library, not the board's pads.

**Technically:** A generic, reusable control component (knows nothing about which surface it drives), bound locally to different data sources (SETUP sidebar → `Scene.gridConfig`; Library sidebar → its own config). The function (control code) is shared; the value is separate per surface. This is loose coupling: generic tool, local binding.

---

### 2d — Sidebar as reusable building block

_Settled — deliberate forward-looking exception per the [architecture motto](#architecture-motto--think-big-but-dont-rush)_

**Beschluss:** The sidebar is a reusable building block: a generic **shell + behavior** (a container docked to a window edge, openable/closable with a grip) that receives its **content** from the window it serves. The shell does not know its content — each window supplies its own context-specific options.

The sidebar IS a summonable panel from the overlay contract: bottom-sheet on narrow/portrait-format screens, side-rail on wide/landscape-format screens (Axis-1, screen-format-driven — not device-type or input-type driven; → [ADR-0045](architecture/0045-two-axis-adaptive-model.md)). Every sidebar instance has Layer 2 (Summon + Resize). **→ Cross-reference:** [Summonable overlay contract](#summonable-overlay-contract-pending-not-yet-finalized--refined-after-panel-fit-check) — the sidebar and the overlay contract describe the same mechanism from two angles: behavior (contract: layers, gestures, grip types) vs. structural reusability (this entry: generic shell, content injection per window).

**Deliberately chosen as a forward-looking exception to the continuous-refactoring principle** (per the [architecture motto](#architecture-motto--think-big-but-dont-rush)): multiple sidebar instances are known to be likely (Board SETUP sidebar, Library sidebar, potentially more). Building the generic shell up front is consciously justified — not spec-building, but preventing the obvious duplication that would otherwise be certain.

**Pad Editor sidebar — explicitly deferred:** The Pad Editor currently uses `PadEditorPanel` (280px, selection-driven, Layer 1 Resize only). The sidebar shell will be extended to the Pad Editor at the appropriate time, not now. No spec work.

---

### 2e — Multi-level settings hierarchy

_Settled architecture direction_

**This is the general model; C10 point 8's "two levels, no duplication" is a special case of it.** → [C10 — point 8](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture).

Settings levels follow the app's navigation structure:

**Level 1 — App** _(configured in Settings)_
App-wide: themes, gesture thresholds, accessibility modifiers (night-vision etc.), defaults for lower levels.

**Level 2 — Windows directly reachable from the main menu** _(Board, Library, …)_
Each is a **separate element** — Board settings ≠ Library settings, even on the same level. Different Board instances are also separate (Board A ≠ Board B). Note: Settings itself is not a Level-2 element — it IS the Level-1 configuration surface.

**Level 3 — Windows reachable only from within a Level-2 window** _(Pad Editor, Combo Editor — reached via Board)_
Each is a **separate element** — Pad Editor ≠ Combo Editor. Pad Editor on Board A ≠ Pad Editor on Board B.

**Cross-cutting separation rule (applies at every level):** Individual elements on the same level are separate from one another. This is the generalization of C10's "the same setting option must NOT appear on both levels" — extended to: options within a level do not cross-contaminate between elements (Board settings and Library settings are distinct even though both are Level 2).

**Default model — Lesart B (live binding):**

- Each element type has one shared default (all Pad Editor instances share one Pad Editor default; the Library has its own; each Board type has its own).
- Per instance: follow the type-default (live binding — changes to the default propagate immediately to all instances set to "follow") or override with an instance-specific value.
- "Follows default" = live binding, not a frozen copy. Consistent with the scene default/individual checkbox pattern already decided in C10 point 8.

**The sidebar represents this hierarchy:** it always shows the options of the currently active context; its scope is exactly that one context. Configuring pad display in the Board's SETUP sidebar affects only that Board's scenes (or the Board default); configuring tile display in the Library sidebar affects only the Library.

**→ Cross-references:** [C10 — point 8](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture) (special case preserved) · [2c — Modular display controls](#2c--modular-display-controls) · [2d — Sidebar as reusable building block](#2d--sidebar-as-reusable-building-block).

---

#### Parked candidates _(not committed; each has a stated problem it would solve)_

### Stage Lock

→ superseded by the Lock in [product/README.md §3](product/README.md#3-app-modes-game-and-setup) (2026-09-28): GAME has no edit gestures, so locking the mode switch covers this.

### Long-Press-Peek

Long press on a pad shows waveform / meta info (optionally: silent audio preview) WITHOUT
firing the sound.
**Problem:** No hover state on Touch; checking what a pad plays requires firing it. Live
misfiring is expensive.
**Status:** Long-press is free on board pads in both GAME and SETUP modes (verified
2026-06-04; established template: LibraryPanel 350 ms `setTimeout` pattern).
**Open question:** GAME mode only, or also SETUP? In SETUP, `onPointerDown` is already wired
to `startDrag()` — long-press needs a coexistence contract. First-pass scope: GAME mode only.
**→ §3:** [Long-press threshold (350 ms)](#long-press-threshold-350-ms).

### Hold-to-play (Momentary Pads)

Hold = plays; release = stops. For tension sounds, risers, stingers.
**Problem:** Tap-to-toggle is cumbersome for momentary sounds; "hold" maps to physical
intuition directly.
**Implementation note:** `pointerdown` → play, `pointerup` → stop; needs a new pad type.
**Status:** Parked.

### One-Shot-Spark

A brief visual spark animation when a one-shot fires, distinguishing it from a running loop.
(Loops get the breathing aura — see [Glanceable loop state (Slice 8)](#glanceable-loop-state).)
**Problem:** One-shots and loops currently produce identical visual feedback (none vs.
`is-hot`). Spark = flash animation on trigger / `onended`.
**Status:** Parked; no design or implementation started. Truly new — nothing analogous exists.

### Further candidates _(feasibility / scope unclear)_

Auto-duck on stinger (audio engine, non-trivial); Haptics (PWA/iOS Brave feasibility unclear);
Orientation-as-posture (may double layout work); Cue Tray / Recently-used Rail; Command
Palette (power-user escape hatch).
**Overarching principle:** → moved to [product/README.md §7](product/README.md#7-design-principles) (P3, P4; 2026-09-28).

---

#### Quick-wins _(engine work complete; UI-only remaining)_

### PANIC / fade-all button _(see also Slice 8)_

`fadeOutAll(duration)` is fully implemented and publicly exported:
`v3/src/audio/engine.ts:375–412` · `v3/src/audio/index.ts:83–85`
Only missing: a UI button alongside the hard STOP. Pure UI work; no audio changes needed.
**Note:** This is the global per-pad fade — not the scene-to-scene crossfade stub
(→ [Real crossfade stub](#real-crossfade)).
**→ Slice 8:** [PANIC / fade-all (Slice 8)](#panic--fade-all-button).

### Glanceable loop state _(see also Slice 8)_

Designed in `design-sources/2026-05-25/` (v8 §5–§6), not yet implemented:

- **Now-Playing breathing aura** — pad glows and breathes while looping (distinct from
  static `is-hot`).
- **Idle-Loop Breathing Spine** — type-color spine breathes continuously in loop state.
  Implementation: CSS animation + one new `is-*` class per state.
  New on top of this design: [One-Shot-Spark](#one-shot-spark) (not yet designed; truly new).
  **→ Slice 8:** [Glanceable loop state (Slice 8)](#glanceable-loop-state).

---

#### Implementation interface question

### Resize reflow performance

When dragging a panel edge to resize, the pad grid must NOT re-layout on every drag frame
(causes jank). Pattern: translucent ghost overlay while dragging; commit real layout only on
pointer release. Must be verified for compatibility with Preact + flat CSS class architecture
before the resize handle is built.
**Dependency:** Relevant only if the Summonable overlay contract (above) is adopted.
**When:** Resolve before implementing the resize handle.

---

#### Mobile Board design round 1 — Claude Design outcome

> **Context:** A "discuss-first" brief for the mobile Board (GAME + SETUP) was sent to Claude Design. The reply combined (a) critique within the decided scope — adopted as refinements — and (b) flagged feature candidates plus a grip-options plan. Build go for a clickable phone prototype was given after this session; the settled items flow into that prototype.
>
> **Status labels used below:** _settled refinement_ = critique within scope, adopted; _settled decision_ = user-decided; _confirmed_ = already-decided, re-affirmed; _parked candidate_ = idea, NOT to be built without an explicit go-ahead; _dropped idea_ = explicitly excluded.

---

#### Adopted refinements _(settled — flow into the prototype)_

These came from Claude Design's critique within already-decided scope and are accepted as refinements of the existing design.

### SETUP sheet-shrink during active tuning _(settled refinement)_

The SETUP live-preview sheet must not cover the grid it previews. On a phone, a bottom-sheet holding size/gap/columns/font controls covers 40–50% of the grid — columns would be tuned while only the top rows reflow in view. **Resolution:** while a control is actively being dragged, the sheet collapses to a single thin strip (just that control + its live value) so the grid is almost fully visible during the moment that matters; release → sheet returns. The SETUP sidebar is a partial sheet (grid visible behind) that further shrinks during active tuning.
**→ Cross-reference:** [C10](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture) (the column/size controls live in the SETUP sidebar; sheet behavior is the interaction layer on top of C10's display settings) · [2d — Sidebar as reusable building block](#2d--sidebar-as-reusable-building-block) (the sidebar shell that houses these controls).

### FLIP re-wrap animation for column-change _(settled refinement)_

Continuous column-change with ~64 pads must not be visually violent. Dragging the column slider re-wraps the whole sequence each step; 64 pads jumping is disorienting. **Resolution:** (i) animate the re-wrap with FLIP so pads visibly travel to their new slots (object permanence), not teleport; (ii) anchor the re-wrap on the pad currently at the top of the viewport so the scroll position doesn't leap mid-drag. C10 decided the _what_ (hard-wrapping sequence); this refinement is the _how it animates_.
**→ Cross-reference:** [C10 point 4](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture) (hard-wrapping sequence — the mechanism being animated).

### STOP ALL: dedicated, oversized, high-contrast real estate _(settled refinement)_

STOP ALL gets dedicated, oversized, high-contrast real estate (likely a fixed corner). It is the one control that must never be mis-hit or hard to find, in the dark, mid-performance. This constrains the whole bottom-band layout, so STOP's priority is explicit. Related: the expanded now-playing overlay (when 6–8 loops run) is a scrollable overlay, but STOP ALL stays reachable from the thumb zone regardless of that overlay's state — the user is never trapped scrolling a mixer to kill sound.
**→ Cross-reference:** [PANIC / fade-all button](#panic--fade-all-button) (engine already done; this refinement constrains its placement in the layout) · [Glanceable loop state](#glanceable-loop-state) (the now-playing overlay context where the scroll-vs-STOP conflict arises).

### Color-independent mode legibility _(settled refinement)_

Mode legibility must not lean on color alone. Since atmosphere is provisional, the mode read rests on gold↔teal + pad-face treatment + bottom-band swap. The solid-vs-dashed pad face is the load-bearing, color-independent channel (works for a deuteranope and with atmosphere off) — not decoration. Removing the atmosphere layer must cost nothing on legibility.
**→ Cross-reference:** [Mode-awareness cues (Slice 8)](#mode-awareness-cues) (atmosphere is the highest-impact option, but settled cues carry the mode without it).

---

#### Two decisions _(settled)_

### D1 — Gap creation in SETUP: empty slots are tappable cells _(settled decision)_

In **SETUP mode**, empty slots are visible, tappable cells: tapping an empty slot creates a pad there, exactly as the existing "Add PAD" button does — reusing the existing pad-creation mechanism, with the empty cell itself as the new trigger location. In **GAME mode**, an empty slot is simply empty space (not rendered as a cell). This makes "deliberately leaving a gap" well-defined: a gap is an unfilled slot; a tap on it fills it.
**→ Cross-reference:** [C10 point 3](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture) (free placement with gaps allowed — this decision gives gaps their creation mechanic).

### D2 — Swipe and mode-switch are two different interactions _(settled decision — consolidates B8)_

→ moved to [product/README.md §3](product/README.md#3-app-modes-game-and-setup) (2026-09-28). Revised there: swiping between decks (formerly "scenes") is now **Parked**.

---

#### Feature candidates _(parked — NOT to be built; each needs an explicit go-ahead; "think big, don't rush")_

These are ideas, each with a stated relation to already-decided things and a condition under which it would become relevant. **Do not build any of these without an explicit decision.**

### Performance Lock _(parked candidate — strong candidate, phone-specific)_

→ moved to [product/README.md §3](product/README.md#3-app-modes-game-and-setup) (2026-09-28), now **Decided** in simplified form (lock toggle in GAME, locks the mode switch only).

### Haptic gesture feedback _(parked candidate — verify iOS availability first)_

A distinct buzz on pickup-engage (fill-ring completes) and on fire; expresses "make gesture states feel natural" through touch.
**CRITICAL CAVEAT:** The web Vibration API is historically **NOT** supported on iOS Safari — since the primary target is iPhone + Brave, verify availability on the real device before considering this further (measure, don't guess). May be technically unavailable on the target.
**Build when:** iOS/Brave Vibration API availability confirmed on the real device AND a friction point in real use supports it.
**→ [Parked candidates](#parked-candidates-not-committed-each-has-a-stated-problem-it-would-solve).**

### Hold-to-audition in SETUP _(dropped idea — explicitly excluded for now)_

**Status: DROPPED.** The user knows their own sounds; auditioning solves a non-problem for this audience. Recorded as a conceptual idea only; not a deferred feature.
Two notes if ever revisited: (i) it would collide with the decided SETUP long-press (= pick up pad) and would need a different gesture or location; (ii) it overlaps the Pad Editor preview scope and the audition-vs-live-output routing question.
**→ Relation to existing:** [B9 — audition-vs-live-output candidate](#b9--gap-classification-three-confirmations-two-new-candidates) (B9-d is a separate concern about audio routing — dropping hold-to-audition does not close B9-d) · [Long-Press-Peek](#long-press-peek) (the only remaining long-press candidate in SETUP; its coexistence question is already documented there).

### Named display presets _(parked candidate — low priority)_

A recallable saved combo of size/gap/columns/font. **Reframed:** this is an EXTENSION of the existing default concept (one default per element-type → multiple named ones), NOT a new feature — it belongs with the multi-level settings hierarchy and deferred Display-Settings work. The most likely use case (different devices) may already be covered by per-device-separate settings already decided. Additionally: with per-surface settings, a preset would need to clarify whether it's per-surface or cross-surface.
**Build when:** a real need to switch between configurations on the same device is demonstrated.
**→ Cross-reference:** [2e — Multi-level settings hierarchy](#2e--multi-level-settings-hierarchy) (this would be an extension of the default/individual model, not a standalone feature).

---

#### Confirmed _(already-decided; re-affirmed in this session)_

### Atmosphere stays provisional _(confirmed)_

Hearth-glow/embers atmosphere is architected as a toggleable layer the mode distinction does NOT depend on; evaluated separately (incl. performance). The settled mode cues (gold↔teal, pad-face, bottom-band swap) carry mode on their own. Removing atmosphere must cost nothing on legibility.
**→ Cross-reference:** [Mode-awareness cues (Slice 8)](#mode-awareness-cues) · [Color-independent mode legibility](#color-independent-mode-legibility-settled-refinement) above.

### Fill-ring: scroll always wins _(confirmed)_

Fill-ring on long-hold is kept. Any movement past the scroll threshold cancels the ring instantly — scroll intent always wins over pickup. This is the LibraryPanel-pattern applied to pad pickup in SETUP.

### Grip options: three treatments, pending visual decision _(confirmed — review pending)_

Claude Design will show THREE treatments side-by-side: **A** (protrude+color), **B** (pictographic flush), **C** (raised vs. recessed) — each on phone bottom-seam AND tablet vertical-seam, in active AND dimmed states (dimmed is the real test). Winner propagates everywhere.
**Status:** No decision yet — options to be reviewed.
**→ Cross-reference:** [Summonable overlay contract](#summonable-overlay-contract-pending-not-yet-finalized--refined-after-panel-fit-check) (the grip is the visual face of the contract's seam handle) · [A3 — Grip-Vokabular: Rail vs. Pull-Tab](#a3--grip-vocabulary-rail-vs-pull-tab-concerns-the-summonable-overlay-contract).

---

## 2. Documentation Debt

### Documentation consolidation (ADR-0047) ⬜ In progress (started 2026-09-28)

Consolidate the scattered documentation into hub / leaf / template per area —
see [ADR-0047](architecture/0047-documentation-architecture.md). Incremental; old
documents stay authoritative until their content is transferred and confirmed.
**Phases:**

1. ⬜ `product/README.md` — skeleton ✅ (2026-09-28); fill sections in dialogue with the user.
2. ⬜ `docs/design/README.md` hub + component specs for the elements the mobile Board layout needs.
3. ⬜ Build the mobile Board layout (product work — not documentation).
4. ⬜ Further component specs as elements are touched; `docs/architecture/README.md` + `docs/development/README.md` hubs.
5. ⬜ Slim `CLAUDE.md`, re-point `sync:classes` / `sync:tokens` generators (scripts, hook, CI),
   move superseded documents to `docs/archive/`, reduce `docs/backlog.md` to open work.
   **Source:** Session 2026-09-28.

### Generate the API list in CLAUDE.md

The section "V3 audio/IDB API" in CLAUDE.md is typed by hand; a guard only checks that each
listed function is exported by `v3/src/db/idb.ts` or `v3/src/lib/upload.ts`. Owner decision
2026-10-03: a generator (run by `npm run sync:docs`) writes the section from the exports and their
TSDoc summaries of the named modules — `idb.ts`, `upload.ts`, `v3/src/audio/index.ts`,
`v3/src/lib/preview.ts` — like the other generated inventories (industry standard: generated API
reports, e.g. Microsoft API Extractor, https://api-extractor.com/). The PAD editor's preview
functions (Slice 15a) are listed only once the generator exists.
**When:** the next step after Slice 15a is pushed, before 15b.
**Source:** Slice 15a, guard "the API list in CLAUDE.md names real exports".

### docs/design/design-system.md §1–§5 write out

Sections §1–§5 currently exist but are stubs or placeholder content. Need to be filled with
actual system documentation.
**When:** As design documentation catch-up, likely before Slice 8.
**Source:** Referenced in multiple sessions as "not yet written."

### docs/design/design-system.md §5 — inset box-shadow exception undocumented

`§5 Token usage rules` (forbidden patterns) says `box-shadow` on clip-path elements (use `filter: drop-shadow()` instead).
This covers outer box-shadow only. Inset `box-shadow` renders inside the padding box, within the
clip region, and therefore remains visible on clip-path elements — it is explicitly allowed. See
v15 treatments D/F and the hot-pad inner glow as canonical examples. The nuance was recorded in
docs/design/design-notes.md (Drop-shadow vs Inset shadow RESOLVED entry), but the §8.8 where it was supposed
to land was never written. Current §5 reads as "no box-shadow at all on clip-path elements",
which is incorrect.
Fix: add one sentence to §5: "Inset `box-shadow` is explicitly allowed — it renders inside the
padding box, within the clip region, and therefore remains visible on clip-path elements."
**When:** Next docs/design/design-system.md write-out pass (Documentation Debt §1).
**Source:** docs/design/design-notes.md Drop-shadow vs Inset shadow RESOLVED; docs/analysis/foundation-analysis.md C8.

### ✅ End-of-Session-3 consolidation pass — COMPLETE (2026-05-31)

> **Completed 2026-05-31.** All five tasks done. See results below.

**Five tasks — outcomes:**

**1. ✅ @inventory-vs-CSS accuracy audit — PASS, no corrections needed**
127 @inventory comments reviewed across tokens.css + global.css. Zero genuine mismatches.
One initial false positive (sb-verdict-pill label names) resolved by direct source verification
— VERDICT_LABELS = {add:'ADDS', migrate:'MIGRATES', drop:'DROPS', lossy:'LOSSY', reset:'RESET'}
confirms @inventory was correct. Sub-token classes correctly annotated with "sub-token: deliberate"
justifications.

**2. ✅ CLAUDE.md descriptive-vs-prescriptive audit — identified, deferred to Slice 8**
No descriptive duplication found in 3f–3h additions. CLAUDE.md references class names without
repeating CSS values. Prescriptive rules correctly prescriptive.
Two phrasing items deferred to Slice 8: (a) line 233 "these primitives are created in Session 3"
→ past tense; (b) line 268 add post-migration baseline "0 violations (2026-05-31)" alongside
the pre-migration baseline.

**3. ✅ 1-use class consolidation review — 2 actions executed, 24 confirmed-justified**
Group A (7 FINALLY-LOST): all 7 confirmed-justified — no consolidation actions.
Group B (19 1-use from 3h): 17 confirmed-justified + 2 consolidation actions:

- **sb-topbar-board-name → sb-topbar-title.is-board** (three-step diagnosis: same function
  "truncating topbar title span" + intentional scale variation → Modifikator. Base: truncation
  only. `.is-app` = 22px/0.08em. `.is-board` = 16px/0.06em.)
- **sb-topbar-badge-wrap absorbed into sb-mode-badge** (single-property utility anti-pattern:
  `flex-shrink:0` only, same as eliminated sb-text-mute. flex-shrink:0 moved to sb-mode-badge.
  Wrapper div removed from TopBar.tsx.)
  Principles applied: (a) button variants use sb-btn-{variant} pattern (sb-btn-muted stays);
  (b) size modifiers use -sm suffix (sb-tab-sm stays); (c) §6 scanned for partners on all
  consolidation candidates — no additional partners found.
  **Final §6 count: 186 → 184** (commit SHA: see consolidation-pass commit).

**4. ✅ Sorte-2 bet resolution — confirmed correct, already closed at 994d2eb**
25 entries: 7 WON + 8 LOST-justified + 7 FINALLY-LOST + 3 SPECULATIVE = 25 ✓.
No OPEN bets. Index correctly closed; no corrections needed.

**5. ✅ Inter-document consistency — PASS**
BACKLOG "Session 3 COMPLETE" note (186 classes, 0 Path D) consistent with Bet Index.
Token-drift normalizations (3e/3f/3g/3h sub-token literals) correctly reflected in @inventory
comments with "sub-token: deliberate" justification notes.

**Outstanding (separate sessions):**

- ~~sb-menu-row pre-flat family restructuring~~ → ✅ Done (see consolidation-pass-part-2 commit)
- Slice 8 items: CLAUDE.md phrasing (tasks 2), sub-token tokenisation, sb-overlay family (#18–20)

**Source:** CLAUDE.md §13; Sorte-2 Bet Index; Sessions 3d–3h.

---

## 3. Deferred Design Decisions

### Playlist → Loop merge (data model)

Decided 2026-09-28 ([docs/product/README.md §5 Pads](product/README.md#pads)): three pad types — Single, Loop, Combo. Loop and Single accept several files (Loop: in order / shuffle; Single: random / in turn). Requires an ADR superseding the `PadType` part of ADR-0042, a migration of stored `playlist` pads, and engine/editor changes (engine change needs explicit approval).
✅ **Done (PR #36, squash-merged 2026-10-03 as `36ba75c`):** `Pad = Single | Loop | Combo`;
Single / Loop hold `files` + `order`; stored boards are cleared by DB v5 (ADR-0048 §3 — no
migration, only test data); `toEnginePad` in `v3/src/audio/index.ts` maps the new pads to the
engine's shapes. Owner decisions on #36: a Loop with several files glows like any loop and runs
in the background of a combo; the engine change passed the owner's playback check (2026-10-03).
Still open: choosing several files and their order in the PAD editor — Slice 15.
**When:** review of the Slice 9d PR; file list editing in Slice 11.

### Theme flames: Verdant, Neon, Crimson

Parked 2026-09-29. `design-sources/2026-09-28/Design_Soundboard_of_Storytelling/Flammen.html` designs four flame personalities (Hearth, Verdant, Neon, Crimson) on one canvas engine. Hearth's freeze/thaw is in the StartScreen flame (hybrid, `docs/design/imports/animated-flame.md`); the other three belong to the themes.
**When:** Slice 14 (settings & polish, themes).

### Settings: reduce motion (animated flame and other animations)

Parked 2026-09-29. The StartScreen flame animates continuously on purpose — users are meant to tap it and freeze it for fun; it does not honour `prefers-reduced-motion`. A Settings option to reduce or stop animations comes with the Settings screen. Record: `docs/design/imports/animated-flame.md`.
**When:** Slice 14 (settings & polish).

### Board pad pool (data model)

Decided 2026-09-28 ([docs/product/README.md §5](product/README.md#board-decks--quick-access)): pads belong to the board; decks (formerly "scenes") and the quick-access bar reference pads with their own position and key; "All pads" view; `PadSet` dropped. Today `Scene.pads: Pad[]` owns pads and `position` / `hotkey` sit on the pad (`types.ts`).
Requires an ADR (superseding the ownership parts of the current model) and a data migration. **Same change: rename Scene → Deck** in UI, code (`Scene`, `Board.scenes`, `SceneRail`, …) and stored data (docs/product/README.md Q1, 2026-09-28). **Do together with the Playlist → Loop merge above** — both reshape `types.ts` and stored boards.
**When:** Slice 9 (data model) — see `CLAUDE.md §Slice progress`.

Open questions surfaced during implementation but not yet resolved. Each needs a deliberate
decision before the relevant slice ships.

### Two-axis unification — existing code + mobile prototype into ONE adaptive app

The two-axis adaptive model (→ [Stable directions](#two-axis-adaptive-model)) establishes the governing model but does not yet close the implementation gap. The larger upcoming work: bring the existing desktop app code (the "wide + mouse" region) and the mobile prototype (the "narrow + touch" region) into ONE adaptive app. All previously-designed features will likely need to be re-examined through the two-axis lens — which axis governs each, and how each behaves across the four regions (narrow+touch, narrow+mouse, wide+touch, wide+mouse).
**When:** After the mobile prototype reaches a stable, verified state. Not started; recorded here so it isn't lost.
**→ Source:** Part 4 of the two-axis model revision, 2026-06-04.

### Axis-1 breakpoint thresholds — narrow↔wide layout switch ⬜ TBD (ADR-0045)

Exact breakpoint values at which the SceneRail dock moves from bottom-bar to side-rail are
explicitly not yet defined — empirical calibration on real devices is required (ref ADR-0045
§Consequences). Record here so this open decision is not lost.
**When:** Before or during Slice 8 layout work.
**Source:** ADR-0045.

### Empty-SETUP affordance

See Features → Slice 8 above. Duplicated here as a reminder that it is a design decision,
not just a feature.

### Delete-last-scene behaviour ✅ SETTLED (Slice 3)

Deleting the last scene leaves the board in zero-scenes (empty-board) state — the intended
behavior. Blocking was considered and rejected. Implemented unconditionally in
`SceneRail.tsx` `requestDelete()`: no guard on `scenes.length`; empty-board UI is live.
**Source:** docs/design/design-notes.md §A3 Scene CRUD; SceneRail.tsx.

### Scene rename: duplicate names ✅ Done (f69cba6, 1dda987)

**Decision:** Duplicate scene names should be prevented. The name-is-display-only argument was
considered; uniqueness was chosen to avoid user confusion.
**Code state:** Implemented. `findConflictingScene()` (`src/lib/sceneConflict.ts`; trimmed,
case-insensitive, self-excluding; 9 unit tests) drives a live conflict check on input in
`SceneRail.tsx`. `commitRename()` blocks on conflict: Enter keeps the editor open, blur
discards the edit. Conflict display via `is-conflict` + "Name already used by …" hint.
_(Entry updated 2026-09-28: previously listed as code task pending.)_
**Source:** docs/design/design-notes.md §A3 Scene CRUD; user decision 2026-06-06.

### Scene mobile reorder: stepwise vs. handle-based

No scene reorder mechanism exists in the code — `SceneRail.tsx` has no stepwise Move up/Down
and no drag handle, and no reorder setter exists in `state/store.ts`. The file-header comment
"Reorder (drag handle, pointer-events based)" is a planned-feature note, not shipped code.
Implement stepwise Move up/Down first (recommended); evaluate a handle-based reorder mode for
power users (≥6 scenes) later, based on real use once it exists.
**Source:** docs/design/design-notes.md §A3 Scene CRUD.
_(Entry corrected 2026-06-10: previously claimed stepwise reorder shipped in Slice 3.)_

### Long-press threshold (350 ms)

Fixed-with-accessibility-override is the cleanest. Or expose in Settings → Controls. Decide
in Slice 8 based on real-use feedback.
**Source:** docs/design/design-notes.md §A3 Scene CRUD.

### `--success` green: keep teal alias or migrate to real green?

`--success: #6DB5B8` is aliased to loop teal. `--fade: #6FA85F` introduced a real green for
the first time. If the palette warms up to greens, reconsider `--success`. Hold until one or
two design sessions with `--fade` in context.
**Source:** docs/design/design-notes.md §Open token/palette questions.

### A2 Path B: 5–10 s audio zone

Pad-type inference defaults to SINGLE in the ambiguous 5–10 s band. Re-evaluate if real audio
sets show many sub-loops in this zone.
**Source:** docs/design/design-notes.md §Slice 3 — A2 Path B.
→ superseded 2026-10-02: no type inference any more — a new pad is SINGLE unless the user picks
a type ([product/README.md §Pad types](product/README.md#pad-types--decided)).

### ModeToggle sparks — design-implementation divergence

The CSS class `sb-mode-toggle-sparks` was designed as a contained overflow element to hold
spark particles during mode-toggle animation. However, `ModeToggle.tsx` appends spark elements
directly to `document.body` instead of using this container.

**Open question:** Is the body-direct approach deliberate (e.g., for z-index isolation above
all overlays) or an oversight?

- If **deliberate:** document the rationale (ADR or DESIGN_NOTES) and remove the unused
  `.sb-mode-toggle-sparks` CSS.
- If **oversight:** wire sparks through the contained element to match the design intent.

**When:** Slice 8 (Polish), or earlier if mode-toggle animation needs revisiting for
z-index/overlay issues.
**Source:** Truth-check commit `e207a0b`; class marked `[unused-css]` in docs/design/design-system.md §6.

### Long-Press-Peek — GAME mode only, or SETUP coexistence?

Long-Press-Peek is a parked candidate (see [Design Session 2026-06-04](#design--feature-clarification-session--2026-06-04)). The design question
to resolve before implementation: **GAME mode only, or also SETUP?** In SETUP mode,
`onPointerDown` on pads is already wired to `startDrag()` — long-press (350 ms timer before
movement) would need a clear coexistence contract. First-pass recommendation: GAME mode only
(no coexistence issue; SETUP already has a tap-to-select interaction).
**When:** Decide before implementation starts.
**Source:** Design Session 2026-06-04; long-press availability on board pads verified
2026-06-04.

---

## 4. Deferred Infrastructure

### Relative units for sizes (structure step before Slice 13)

Measured 2026-10-02: `v3/src/styles/tokens.css` has 452 px values, 0 rem, no `clamp()` — font
sizes and spacing ignore the user's text-size setting (WCAG 2.2 SC 1.4.4: text resizable to 200 %
"without loss of content or functionality"; web.dev: rem / em so text "can respond to user
preferences"). Owner decision: switch before Slice 13 — an ADR fixes the scheme (rem for type and
spacing, `fr` / flex / `%` for layout, `clamp()` for fluid sizes, px only for borders, pixel-art
details and minimum touch targets — Apple HIG 44 pt, WCAG 2.5.8 24 px), tokens migrate, a guard
blocks new px values for type and spacing.
**When:** before Slice 13.

### Tab access and plain errors (audit of the existing screens)

Owner decision 2026-10-02 (CLAUDE.md UI rules): every control reachable with the Tab key and named
for screen readers; error messages in plain words with a next step. Found: the PAD editor's close
button had no accessible name (fixed 35c602d); BACKLOG "Role-based E2E locators" lists buttons
without accessible names in Chromium.
**When:** next structure review; checks: an accessibility lint rule or an axe scan in E2E.

### PAD editor: several files per pad cannot be edited yet

Found 2026-10-02 while preparing the #36 playback check: since Slice 9d a Single or Loop holds
several files, but the PAD editor's file choice replaces them with one (code comment pointed to
"Slice 11", which became the combo editor). Several files reach a pad only through the V1 import
today. V1 could edit them (playlist pads).
**When:** Slice 15 (PAD editor at V1 scope); fix the stale comment in
`v3/src/components/PadEditorPanel.tsx` with it. The "N files" line under the source is easy to miss
(the owner could not find it on 2026-10-02) — the file list replaces it.

### Assign a slice to every inventory feature still "Open" (P8) ✅ Done (owner decisions 2026-10-02)

Owner decision 2026-10-02 (docs/product/README.md §7 P8): everything V1 / V2 could do is built
unless deliberately rejected. On that day 22 features in `docs/product/v1-v2-inventory.md` had no
decision ("Open") — board duplicate and search, library preview / sort / groups, settings screen,
themes, onboarding, among others. Each needs a slice (or a deliberate **Rejected** with reason).
**When:** together with the owner, before Slice 15 is planned; then a docsGuards check that every
row not built names a slice, Parked or Rejected.

### Flaky smoke test: a new board vanished right after NEW BOARD (WebKit, 2026-10-02)

Seen once, in the pre-commit smoke run of a stack merge (`board-writes`): `mode-toggle.spec.ts`
in `smoke-webkit` — the board screen showed "Board not found." right after the board was created
and opened. Evidence: the error output and the page snapshot (the HTML report was overwritten by
a re-run — the procedure's step 1 was not fully kept). Not reproduced: 5 × the spec in WebKit,
30 × the flow in WebKit, 10 × in Chromium with 6× CPU throttling.
**Cause found in the code** (fixed on main): the stored boards were loaded after the first
render and replaced the store when the load finished — a board created before that vanished.
The state now loads before the first render (`v3/src/state/boot.ts`, guarded by `codeGuards`).
Whether this caused the one failure is **not proven**: a failed board save also removes the new
board (`createBoard` rollback on the stack).
A second rare failure the same day: `pad-dnd.spec.ts` test 20 (SWAP) in `full` during a
pre-push run — the dragged pad stayed on its cell; 8 quiet re-runs green. Both happened while
other heavy commands ran on the same machine (npm ci, unit tests in a second worktree).
**Gap closed (2026-10-02):** local runs never retried, so `trace: 'on-first-retry'` kept no
trace; local runs now use `retain-on-failure` (cost measured: 19 s instead of 18 s for 21 tests).
**Later the same day (afternoon):** a third gate failed with 8 timeouts across specs; the
machine was swapping hard (16 GB RAM; at 16:23 254 MB free and 6.9 GB compressed; load average about 380 on 10 cores right after the failed gate, 255 at 16:22, 175 at 16:35; macOS services relaunched in a loop). It eased on its own (1-minute load 4.3 when measured later that afternoon). The
earlier failures may have had the same cause — not proven. Gates now run only on a quiet machine
(load checked first) and never next to other heavy commands.
**CI (evening):** `full-webkit` flaked on main (2 of ~10 runs) and on 6 of 9 stack PRs — always
the `page.goto` right after the WebKit seed, which ended with `page.reload()`: "WebKit
encountered an internal error" or a 30 s timeout on the first click. Matches Playwright issue
microsoft/playwright#43070 (goto + reload crashes the WebKit content process on Linux since 1.60;
we run 1.63 since 2026-09-30, green for ~20 runs before). Mitigation: the seed no longer reloads
(every caller navigates next). Measure over the next ten CI runs; if it recurs, pin the WebKit
build that passes (the issue names 1.59) as an exception with this entry as trigger.
**When:** on the next occurrence — read the trace from `v3/test-results/` and note the load.

### Bug: combo "stop all" step stops the combo itself

Found 2026-09-29 by the T4 characterization tests. A combo step with `stopAll` calls
`stopAllInternal()` (`v3/src/audio/engine.ts:600-603`), which also stops the running combo
(`engine.ts:370-372`) — the next step never runs. V1 excluded the running combo (V1 changelog
v163). Impact: the owner's V1 "DAY" combo (stop all → rooster) would never play the rooster.
Pinned by `tests/unit/audio/engine.test.ts` (`test.fails` + a precise current-behaviour test).
**Fix = engine change → only under product-owner control (ADR-0048 §4).**
**When:** decided by the product owner — with Slice 9d (engine step) at the latest, before the
V1 import (Slice 10) makes real combos usable.

### Bug: combo step starts the next step twice when a child ends at once ✅ Done (ccd24f3)

Found 2026-10-01 by targeted tests for mutation testing (T11c). In `playComboStep`
(`v3/src/audio/engine.ts`) a child that finishes synchronously — a pad without an audio reference,
or an empty playlist — calls its "ended" callback inside the loop: `fgRem` drops to 0 and the next
step starts; after the loop the `fgRem === 0` branch starts it a second time. Impact: a combo step
holding such a pad plays the following step twice (double sound). Fix needs the owner's approval
(ADR-0048 §4: engine changes under product-owner control). Pinned by
`tests/unit/audio/engine.test.ts` (`test.fails` + a precise current-behaviour test).
Owner decision 2026-10-02 (O1): prepare the fix. **Fixed** (PR #35, squash-merged 2026-10-02):
children are counted while they start; an end only advances once all are started. Also fixes two
effects of the same cause — a sibling still playing was cut short, and the step's duration /
fade-out delay was skipped. The owner's playback check passed (a combo with an empty pad in step 1
plays step 2 once); the owner approved the engine change (ADR-0048 §4).

### Bug: board writes from an outdated board copy lose changes

Found 2026-10-01 (Slice 9e work). Two writers save a copy of the board taken some time earlier
and so overwrite every change made in between:

- **Deck undo** (`v3/src/components/DeckRail.tsx`, `undoDelete`) restores the whole board as it was
  when the deck was deleted — any pad or deck change during the 6 s undo window is lost.
- **PAD editor auto-save** (`v3/src/components/PadEditorPanel.tsx`) saves 500 ms after the last
  keystroke with the board of that render — a drag and drop, deck rename or new pad in those
  500 ms is lost. Fixed on the Slice 9e branch (PR #32) for this writer only.

Root cause: board changes are written as finished boards (`boardPut(updatedBoard)`) computed from
the `board` a component rendered with. Standard remedy: apply each change as a function to the
latest board at write time (the "updater function" pattern), through one save helper, and guard
that components do not call `boardPut` directly. A new scheme → proposed on its own branch.
✅ **Fixed (PR #33, squash-merged 2026-10-03 as `e341d7a`):** `v3/src/state/boardWrites.ts`
(`updateBoard`, `createBoard`) — all 16 writers use it; codeGuards forbids `boardPut` /
`upsertBoard` in components and screens. Owner decision 2026-10-02: show at once, then save; a
failed save shows the stored board again. Further instances of the class found and fixed there:
the A key listener read the mode of an older render (an A right after switching to SETUP was
ignored — the reason E2E tests called the shortcut "racy"); two quick A presses put two pads in
one cell; a new deck after a delete took a number and name still in use.
**When:** review with the Slice 9 PRs.

### Major dependency updates (one at a time)

Status 2026-09-30 (owner approval of the plan; each major measured in a throwaway worktree first,
then applied with the full gate):

- ✅ vitest / @vitest/coverage-v8 / @vitest/ui 4 → 5 (2c2447d)
- ✅ size-limit / @size-limit/file 12 → 14 (01f2e21) — gate counter-checked (10 KB limit → exit 1)
- ✅ jsdom 29 → 30 (f9da34f)
- ⏸ @types/node stays on the Node runtime major (`.nvmrc` 24) — Dependabot ignores its majors;
  testGuards keeps both in step. **Trigger:** raise together with `.nvmrc`.
- ⏸ TypeScript 6 → 7 — blocked: typescript-eslint supports only `<6.1.0` (peer). Dependabot
  ignores TypeScript majors. **Trigger:** a typescript-eslint release supporting TypeScript 7.
- ✅ Preact 10 → 11 (owner-approved plan) — step 1–3 on Preact 10 first (c5ae371): a type-checker
  guard for unitless lengths in `style` (10 places fixed, visual regression unchanged),
  `PixelIcon` style type; then the upgrade itself: `CSSProperties` is a top-level export of
  `preact` in 11. Visual 9/9, all dev-server E2E 64/64, production-build E2E 36/36. **Owner
  check:** open the live app on the iPhone once after the deploy.

### Library audio as Blob — Safari Private Browsing (open question)

Found 2026-09-29 (T6): WebKit in an ephemeral context (Playwright; technically like Safari
Private Browsing) cannot store **Blobs** in IndexedDB — ArrayBuffers work. V3 stores library
audio as a Blob (`LibraryItem.blob`); V1 stored an ArrayBuffer (`entry.buf`). Likely effect: in
Private Browsing on iPhone, uploads fail with "could not save to library" (caught, no crash).
Trade-off before changing anything: a Blob is a lazy handle; an ArrayBuffer is fully
deserialized whenever the record is read — `libGetAllMeta` reads every record with a cursor,
which touches the iOS memory rules. **Open** — verify on a real iPhone (normal + private tab)
first (development/manual-iphone-checklist.md), then decide with the product owner.

### Test infrastructure — before Slice 9c (CLAUDE.md rule 15)

Decided 2026-09-29 after a test-setup analysis. Order is binding; Slice 9c/9d wait for it.

| Step | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Status                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| T1   | Guard test for E2E project membership, test port 5199, Node 24 (`.nvmrc`), visual tests in pre-push, flaky tests fail CI, docs/development/testing.md updated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ✅ Done (60a0f0c)                                                              |
| T2   | Unit tests for the serial upload pipeline (`upload.ts`, iOS memory rule)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | ✅ Done (see git log: "test: upload pipeline unit tests (T2)")                 |
| T3   | Skipped drag-and-drop E2E tests: found to be never-written TODO stubs, not flaky. Pad swap/insert + library drag written, counter-checked, 20× stable; deck reorder quarantined — feature not built                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ✅ Done (see git log: "test: drag-and-drop E2E tests written…(T3)")            |
| T4   | Characterization tests for the audio engine (dispatch, single/loop/playlist, stop/fade, combo, decode dedupe, bridge); `src/audio` in coverage (engine 75 %). Found a real engine bug (below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ✅ Done (see git log: "test: audio engine characterization tests (T4)")        |
| T10  | Lint rules against test traps (expect-expect, no-focused, no-skipped incl. fixme, valid-expect) for Vitest + Playwright; Playwright `forbidOnly`; counter-checked (10 lint errors + forbidOnly abort on planted traps)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | ✅ Done (see git log: "test: lock test traps…(T10)")                           |
| T5   | E2E against the production build (vite preview): smoke + full + new PWA tests (service worker, manifest, offline start, offline data) — in CI (job e2e-prod) and in pre-push; counter-checked (no SW registration → 3 PWA tests red)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ✅ Done (see git log: "test: E2E against the production build…(T5)")           |
| T6   | full-webkit project (board/deck/pad CRUD + drag & drop in the Safari engine; library seeded, playback stays Chromium); coverage floor in CI (69/71/61/67) — both counter-checked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ✅ Done (see git log: "test: full E2E subset in WebKit + coverage floor (T6)") |
| T7   | Guards in `testGuards.test.ts`: every logic module has a test file (4 justified exemptions; nanoid got a real test); every skip/fixme/todo/fails marker references an existing BACKLOG heading (found and fixed 3 missing/wrong references). docs/development/testing.md test inventory generated (`sync:tests`, part of `sync:docs`, pre-commit + CI). Slice-completion checklist: test review. All counter-checked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ✅ Done (see git log: "test: guards for module tests…(T7)")                    |
| T8a  | Security: `npm audit` 15 findings (9 high, 5 moderate, 1 low — all dev tooling incl. vite/rolldown, which build the shipped bundle) → 0 via `npm audit fix` + vitest trio 4.1.7 → 4.1.11 (GHSA-82fw-gwwq-j7x9); no major jumps, no runtime deps changed; full pipeline green, no visual change. Dependabot: minor/patch grouped, majors as separate PRs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done (a349d79)                                                              |
| T8b  | `npm audit --audit-level=high` blocking in CI (unit-build-lint) and pre-push; `scripts/*.ts` type-checked (`scripts/tsconfig.json`, `npm run typecheck:scripts`) in pre-commit and CI. Both counter-checked: planted `lodash@4.17.20` → audit exit 1; planted type error in a generator → exit 2. Linting `scripts/` is not included (the ESLint config covers `v3/` only) — later, together with T11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ✅ Done (see git log: "…(T8b)")                                                |
| T8c  | Weekly scheduled CI run (`weekly.yml`, Monday 06:00 UTC + manual): reuses `tests.yml` via `workflow_call` (full suite, cannot drift); `npm audit` (all levels) + `npm outdated` as run summary; Dependabot PRs open > 14 days fail the run (red = mail). Counter-checked: stale check finds #2/#3/#6 at 14 days, nothing at 100000 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | ✅ Done (see git log: "…(T8c)")                                                |
| T8d  | Deploy the **tested** build: `e2e-prod` keeps its tested `v3/dist` as artifact `pages-dist`; `deploy-pages.yml` downloads and publishes it, no rebuild (ADR-0049). Found and closed a gap: the deploy also fired after `pull_request` runs whose branch is named `main` (e.g. from a fork) and would have published that code — now push-only + same-repo guard; ADR-0040's contrary claim corrected (never exploited: 0 PR runs on a `main` branch). GitHub Actions to current majors (checkout/setup-node/upload-artifact v7, download-artifact v8, upload-pages-artifact v5, deploy-pages v5, configure-pages v6); superseded Dependabot PRs #2, #3, #6, #17, #18 closed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | ✅ Done (see git log: "…(T8d)")                                                |
| T8e  | Close the stale Dependabot PRs #15 (failing since 2026-08-03) and #16 — owner's go-ahead given; Dependabot recreated them with the new grouping (#19 dev-minor-patch, #20 prod-minor-patch ✅ green, #21–#28 majors). **Follow-up:** #19 is red only in `format:check` — Prettier 3.9.9 reformats `src/lib/libDnd.ts`; merge #19 together with that one-file reformat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ✅ Done (closed 2026-09-29)                                                    |
| —    | Documentation file naming (ADR-0050): docs moved into `docs/` in lowercase-kebab, hubs = `README.md`, design downloads in `design-sources/<YYYY-MM-DD>/`, `CHANGELOG.md` generated from `changelog.ts`, README update rule in the slice checklist; enforced by `docsGuards.test.ts` (all six rules counter-checked). Still open: renaming the local project folder (outside the repo)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | ✅ Done (see git log: "(1/3)"–"(3/3)", 2026-09-29)                             |
| T9   | GitHub security settings (ADR-0051), set via `gh api` and read back: Dependabot alerts + security updates, secret scanning + push protection, private vulnerability reporting (`.github/SECURITY.md`), ruleset `protect-main` (no force-push, no deletion, no bypass — counter-checked on a temporary probe ruleset/branch: both rejected with GH013, probe removed), GitHub-owned actions only, fork PR workflows need approval. Owner items (account level) done 2026-09-29, confirmed by the owner: two-factor authentication; e-mail for failed workflow runs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | ✅ Done (see git log: "…(T9)")                                                 |
| T11a | Edge-case checklist in `docs/development/testing.md` (ISTQB equivalence partitioning + boundary value analysis, project checklist); CLAUDE.md slice checklist 3a links it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ✅ Done                                                                        |
| T11b | Property-based tests with fast-check (`@fast-check/vitest`): grid positions, pad swap/insert invariants, audio LRU limit (iOS memory rule 7), colour blending, formatters and waveform peaks — each counter-checked with a planted bug (one survived at first and led to a stronger rule). Found a real display bug by boundary value analysis: `formatBytes` showed "1024 KB" for 1,048,064–1,048,575 bytes — fixed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ✅ Done                                                                        |
| T11c | Mutation testing with StrykerJS (ADR-0059): `npm run test:mutation`, weekly CI job `mutation`, break threshold 59 % (baseline 59.4 % without the EXEMPT files) — counter-checked with an always-passing test command (0 % → exit 1). Command runner, because `@stryker-mutator/vitest-runner` 10 runs no tests per mutant on Vitest 5 (stryker-js#6210). npm override `typed-rest-client > qs` for moderate advisories in Stryker's dependency tree. First CI run starved (89 of 134 mutants timed out, runner killed) — timeouts count as detected and inflate the score: unit tests now run in Node (jsdom opt-in), mutants with `vitest --maxWorkers=1`, `mutation:report` fails above 5 % timeouts. `padDnd.ts` 30 % → 91.6 % with drag-flow tests (boundaries: threshold, edge zones, grid borders). Runtime check: `mutation:report` fails from 70 % of the job's time limit (owner decision 2026-09-30: thresholds only rise, runtimes are watched). Two CI runs as one job were killed by the runner after 11–18 min (~2 h to go; memory suspected, now logged): the weekly job is a per-module matrix with `vitest related` (2–6 test files instead of 15 per mutant) and a summary job enforcing the threshold; locally Stryker uses 50 % of the cores, whole-codebase runs only in CI. A local full run was invalid (Mac asleep, 12 % timeouts — rejected by the 5 % check). Matrix run 36825054856: nine modules green in 0–6 min; `engine.ts` filled the 16 GB runner (memory log: +3.3 GB/min, mutants that loop and allocate) — fixed with a 512 MB heap cap per test process (locally 0.4–2 GB over 371 engine mutants); the summary job now fails when a module job failed or a report is missing (it had passed with nine of ten). First complete CI run 36827375932: 68.89 % over all ten modules (engine.ts 52.9 % in 15 min, no memory issue) → break threshold 68. **Next:** full re-measurement, new threshold, then `engine.ts` (53 %). **Triggers:** switch to the Vitest runner when stryker-js#6220 is released; remove the override when Stryker ships typed-rest-client >= 3.1.2 | ✅ Set up — follow-ups open                                                    |

### Structure clean-up — before Slice 9c (CLAUDE.md §Guiding priorities)

Decided 2026-09-29 after a structure audit (priority 2: structure and clarity). One plan and
approval per stage; guard tests keep each scheme from drifting back.

| Stage | Content                                                                                                                                                                                                                                                                                                                                                                                                                                          | Status                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| S1    | Remove unused Vite scaffold files (`src/app.css`, `src/index.css`, `src/assets/*`, `public/icons.svg`); one version number — package renamed `soundboard-of-storytelling`, `version` field removed (`APP_VERSION` is the only version)                                                                                                                                                                                                           | ✅ Done (see git log: "…(S1)")                |
| S2    | Code names (ADR-0052, sources cited): `TopBarV2`/`StatusBarV2`/`BoardTopBarV3` → `TopBar`/`StatusBar`/`BoardTopBar`, `src/chrome/` dissolved into `components/`, `app.tsx` → `App.tsx`; unused CSS removed (`.touch-target`, `.pixel-icon`, `@keyframes sb-flicker`), `.theme-*` → `.sb-theme-*`, `has-*` allowed; generator scripts named after their npm scripts; guard `codeGuards.test.ts`                                                   | ✅ Done (see git log: "…(S2)")                |
| S3    | Exception scheme (ADR-0053, sources cited): permanent = rule + reason, temporary = + `BACKLOG "…"`; ESLint `require-description` / `no-unlimited-disable` / unused directives = error; prettier-ignore and to-do markers guarded in `testGuards`; config files linted, unnecessary `*.config` Prettier exclusion removed; ADR `## Exceptions` tables; generated register `docs/development/exceptions.md` (35 entries)                           | ✅ Done (see git log: "…(S3)")                |
| S4    | Test locators and IDs (ADR-0054, sources cited; supersedes ADR-0038): role/label/text first, test IDs as fallback, never CSS classes (≈30 class locators/assertions replaced); state via `aria-pressed` (pads in GAME, pad type buttons); test ID scheme `<component>-<element>-<kind>` applied to all 35+ IDs; spec files without folder prefix, `helpers.ts`, visual baselines moved (not regenerated); guards in `codeGuards` / `e2eProjects` | ✅ Done (see git log: "…(S4)")                |
| S5    | English only: tool/hook/CI messages, generator texts, ADR categories and template, `testing.md` (stale facts corrected), CLAUDE.md, backlog/design/analysis passages, all ADRs 0001–0045 translated faithfully (fidelity check: code spans, links, headings identical except renamed section references); uniform ADR headers; guards in `docsGuards` (ADR header order + category, no German words — threshold calibrated to 1)                 | ✅ Done (see git log: "…(S5 1/4)"–"(S5 4/4)") |
| S6    | Commit message convention (ADR-0060, **Accepted** 2026-10-02): Conventional Commits checked by commitlint in a `commit-msg` hook and for pull requests in CI; `subject-case` off (proper nouns). PR #30                                                                                                                                                                                                                                          | ✅ Squash-merged                              |

**Deferred to Slice 13:** re-evaluate the ADR-0028 exception for the two top bars (`TopBar` on
Library/Board list, `BoardTopBar` on Board — deliberately separate per ADR-0026) and merge them
into one component with variants if the mobile layout allows; both are rebuilt there anyway.

### Documentation freshness automation (T13)

Found 2026-09-30 during S5: stale facts and dead references were found only by chance.

- ✅ **Links and anchors across files** — `link:check` now runs `remark-validate-links` instead of
  `markdown-link-check`, which validated anchors only within the same file and slugged the raw
  heading text. The switch found 9 real broken anchors at once (headings with `_(…)_` get
  GitHub anchors without underscores) — fixed. See git log "…(T13 1/2)".
- ✅ **Section references are links** (ADR-0056 decision 6) — all active references (~100 incl.
  in-file ones and code comments) converted to anchored links / `path.md#anchor`; docsGuards
  bans free-text references and resolves anchors with `github-slugger`. Found on the way: a
  reference to a non-existent cheatsheet §3, `v3/src/types.ts` naming the brief as source of truth
  (the brief names types.ts), two pseudo-headings in CLAUDE.md (now real headings). Historical
  docs (~310 references) keep free text by design.
- ✅ **Superseded terms** — Vale on active docs (ADR-0056): pinned 3.23.0, SHA-256 verified install
  (`scripts/vale-install.ts`), weekly version report; historical docs/passages excluded with reasons
  (exception register). Found and fixed stale "Scene"/"Sets store"/`SceneRail.tsx` statements.
- ✅ **Paths in code spans exist** (docsGuards) — ambiguous short names (`tokens.css` ×3,
  `HANDOFF.md` ×3) replaced by full paths; a false "moved" claim about HANDOFF.md corrected.
- ✅ **Project-wide structure audit** (owner request 2026-09-30) — run; findings and status in
  "Structure audit 2026-09-30" below. Already fixed systematically before it: **local verification took a different path than CI** (link probe
  on case-insensitive macOS, Prettier check with the exclusion active, `prepare` script never run
  locally → CI red on a0c1962) → pre-push now runs `npm ci` in a fresh worktree whenever install
  files change. Owner action: 11 root-owned entries in `~/.npm` (from an old `sudo npm`) —
  `sudo chown -R $(id -u):$(id -g) ~/.npm`.
- ✅ **Derivable facts from code** — hard-coded test counts in `testing.md` / CLAUDE.md removed
  (the generated inventory is the only place); CLAUDE.md's pre-commit list said "six gates" but
  the hook has seven (Vale was missing), CI tree in testing.md lacked Vale and the inline-style
  audit — fixed. Remaining pattern for the structure audit: hook/CI step lists in the docs are
  still hand-maintained copies of `.husky/*` and `tests.yml` — candidate for generation.

### Structure audit 2026-09-30

Owner decisions 2026-09-30: A1–A3 as recommended.

- ✅ **A1 Public third-party assets** — `v1-reference/` (V1 source, a composed 1-bit icon set
  of 2,971 files, 5 font files, no license or credits file) removed from the public repo; a
  complete snapshot is in the local archive (`~/dev/archive/v1-reference/`), V1 itself in
  `~/dev/archive/botc-soundboard/`. The icon set most likely comes from Nikoichu's CC0 pack
  (V1 commit 3548bdf: "1476 icons from 1-bit Pixel Icons pack"), so the git history is not
  rewritten. `HANDOFF.md` references now point to the identical
  `design-sources/2026-05-25/HANDOFF.md`.
- ✅ **A2 Fonts from Google's CDN** (ADR-0057) — `v3/src/styles/global.css` loads the fonts from
  fonts.googleapis.com: not in the offline cache (service worker globs have no woff2), and the
  public site sends every visitor's IP to Google (LG München I, 3 O 17493/20). Decision:
  self-host (OFL) with license notices. Done: `@fontsource/*`, woff2 precached,
  `third-party-licenses.txt` generated per build, three pwa-spec tests (counter-checked). Follow-up:
  link the license notices from the app (Slice 14 settings / about).
- ✅ **A3 Formatter and linter cover only `v3/`** (ADR-0058) — scripts moved to `v3/scripts/`
  (linted, type-checked, no `paths`/`NODE_PATH` workarounds); Prettier and lint-staged config at
  the root; the whole repository formatted. The first plain Prettier run changed the content of
  seven Markdown files (bare `*`, `|` in table cells, indented continuation lines) — so Markdown
  is now formatted only through `format:md`, which fails on any content change, generators escape
  table cells, and a docs guard checks every table row. CI follow-up: the first, parser-based
  table guard timed out in CI under coverage (2.1 s locally) — replaced by a line scan (7 ms),
  which also found a table GitHub rendered as plain text (delimiter row with one cell too many). Follow-up: move to npm workspaces with a
  root `package.json` when a second package appears.
- ✅ **A4 Hook step lists typed three times** — generated now: `npm run sync:steps` writes the CI
  jobs/steps (from `tests.yml`, parsed with `yaml`) and the pre-commit / pre-push steps (from the
  hooks' "Pre-…:" messages) into `testing.md`; CLAUDE.md links there. The generator fails if a
  hook step runs more than one command (a step without its own message would be undocumented) —
  counter-checked. Hand counts removed ("six gates", "seven places", "two projects").
- ✅ **A5 Exception register misses config-level rule switches** — `no-unused-vars` off, justified
  by tsc, now one `TSC_COVERED` switch with an inline reason, listed in the exception register;
  testGuards requires a reason on every config switch and checks that the reason holds. That check
  found a real gap: the unit and E2E tsconfigs turned `noUnusedLocals`/`noUnusedParameters` off, so
  unused code in tests was reported by nothing — flags inherited again, 3 unused declarations
  removed. The unused `no-explicit-any` off for tests is gone (probe: `any` reported again).
- ✅ **A6 Dependabot splits package families** — the vitest 5 PR fails `npm ci` because
  `@vitest/coverage-v8` stays on 4.x (peer conflict). Lockstep families (vitest,
  typescript-eslint, size-limit, fontsource) are grouped incl. majors, listed before the
  minor/patch groups; testGuards checks that every exact peer pin between direct dependencies
  shares a group (counter-checked). Also guarded now: guard files number their header rules
  1..n (drifted twice).
- ✅ **A7 Vale skips code blocks** — docsGuards checks code blocks of active docs against Vale's
  term list (single source) and that every function in CLAUDE.md's API list is exported by
  `idb.ts` / `upload.ts`; the stale "Scenes" comments and the `SceneCard` sample are fixed.
- ✅ **A8 Small drift** — one `.gitignore` for the repository (the ignored set was verified
  identical before/after); the stale ESLint comment fixed earlier.
- ✅ **A10 Local run ≠ CI run (pattern, again)** — the table guard passed locally (0.7 s) and timed
  out in CI (>5 s, coverage + slower runner). Unit tests now have a local budget of 500 ms against
  5 s in CI (`v3/vitest.config.ts`), counter-checked with a 700 ms test.
- ✅ **A9 Own measurement errors (pattern)** — twice a zsh quirk made a measurement vacuous
  (option+value in one variable; unquoted `--include=*.ts`). Rule for the agent: measurements
  run via bash with quoted globs; "0 hits" counts only after a positive probe.

### Structure audit 2026-10-03

Owner request 2026-10-02 ("check what we can design better in general"), run after the release
notes (ADR-0063) and the code comments (ADR-0064), with the review stack #31–#40 on main.
Fixed by agreed rules, open items await the owner's decision.

- ✅ **A11 Code comments** — ADR-0064: TSDoc on every export, one file overview form, lint and
  guard (114 missing doc comments, 34 TSDoc syntax errors, four header forms measured before).
- ✅ **A12 Comments naming the superseded May plan** — seven statements ("deferred to Slice 8",
  "Slice 4 playback stub", "4×4 grid") were stale; rewritten to today's slices, and `codeGuards`
  rejects Slices 5–8 in `src/` and `scripts/` (counter-checked).
- ✅ **A13 Two section divider forms** — 26 boxes of `// ----` lines in 7 files next to 215
  one-line `// ── Title ──` dividers; converted, guarded (counter-checked).
- ✅ **A14 One check written twice** — testGuards and the exception register each scanned test
  files for quarantine markers; the new block-comment headers made both count a marker named in a
  comment. Both use `v3/scripts/lib/test-markers.ts` now (counter-checked: break → both red).
- ✅ **A15 Coverage floors** — raised to the measured values (three identical runs).
- ✅ **A16 Bug: cell name in the narrow-window ADD PAD sheet** — the sheet title computed
  `String.fromCharCode(64 + index)` with 4 columns fixed: the first cell of the second row read
  "E5", not "B1". Owner decision 2026-10-03: the title is "Add Pad" without a cell name, like the
  wide-window popover; the popover no longer takes the cell position at all.
- ✅ **A17 Code nothing uses** — `activeTheme`, `masterVolume`, the `crossfade` stub, and
  `padTypeGlow` / `setPlacementHotkey` (only their tests use them). Recommended was removal; the
  **owner decided to keep code a later implementation may need** (2026-10-03) — it is marked
  `@reserved Slice N — …` / `@reserved Parked — …` instead (ADR-0064 §4), and so are `stopAll` and
  `fadeOutAll` (Slice 12), which knip found. Stale comments fixed on the way (`masterVolume` did not
  mirror the master gain; `store.ts` asked for `boardPut` after every board change).
- ✅ **A18 Unused code found by a tool** — knip adopted (owner decision 2026-10-03):
  `npm run knip` in pre-push and CI, default mode (tests count as users) and production mode (the
  app alone; a `@reserved` tag on code the app uses fails). Ignores in `v3/knip.config.ts` with
  reasons, listed in the exception register. Its first run found an ESLint config package that was
  installed in May but never wired in (`eslint-config-prettier`, now last in the config as
  Prettier's docs advise). Counter-checked: an unused export, a removed `@reserved` and a stale
  `@reserved` each fail.
- ✅ **A19 npm cache owned by root** — 5 entries in `~/.npm` belonged to root; `npm install` and
  `npm outdated` failed unless a private cache was passed (hit three times on 2026-10-03, once
  silently: an outdated report came back empty). Fixed by the owner on 2026-10-03 with
  `sudo chown -R $(id -u):$(id -g) ~/.npm`; no entry belongs to root any more (measured).
- **A20 Mutation testing covers 25 modules from the next weekly run** (15 new on main since
  2026-10-03) — runtime and `thresholds.break` to be read after the run. **When:** weekly run
  2026-10-05.
- **A21 TypeScript 7 and @types/node 26 (Parked)** — new majors; TypeScript 7 is the native
  compiler. **When:** an upgrade spike after Slice 12, not before the first game night.
- ✅ **A22 `docs/analysis/foundation-analysis.md`** — marked "Living document", but its analysis is
  dated 2026-06-05. Owner decision 2026-10-03: a dated snapshot, not maintained; the docs index no
  longer calls it a source of truth.
- **A23 Slice completion checklists 9, 10, 11 (iPhone part open)** — owner test on 2026-10-03 on a
  **MacBook (Brave)**: the V1 backup with its full library imported, the boards exported as ZIP
  and that ZIP imported again — all working. README "Available now" updated, stale "review
  pending" passages in this backlog closed, Slice 11 complete (it touches neither `src/audio` nor
  `src/db`). **Still open for Slices 9 and 10:** the manual iPhone checklist
  (`docs/development/manual-iphone-checklist.md`) — Brave on macOS runs Chromium, on iOS WebKit,
  and the iPhone-only risks are untested: the memory limit during the 227 MB V1 import (V1's iOS
  crash) and the share sheet / download on EXPORT; the WebKit E2E projects cannot cover the
  import (headless WebKit decodes no audio). Correction: an earlier version of this entry and of
  the 3.0.153 changelog said "iPhone" — an assumption, not what the owner reported.
  **When:** before the first game night (Slice 12).

### Role-based E2E locators

Temporary exception from ADR-0054: many E2E tests still locate controls by test ID although a
role + accessible name is the standard. Most icon-only controls have no accessible name yet.
**When:** Slice 13 — give every control an accessible name while rebuilding the layout, then
switch those locators to `getByRole` and drop the exception from ADR-0054.

Found 2026-10-01 (Slice 9c): the SETUP toolbar button **ADD PAD** has no accessible name in Chromium
(the accessibility tree shows a nameless `button`), so `getByRole('button', { name: 'ADD PAD' })`
finds nothing; `deck-crud.spec.ts` test 12 locates it by text for now.
Slice 9e: `pad-pool.spec.ts` does the same; the new **All pads** entry of the deck rail is a `div`
without a role, like every deck tab (located by test id).

### Type-check every TypeScript file (T12)

Found 2026-09-30 during S4: unit tests, E2E tests and two tool configs were never type-checked
(Vitest and Playwright do not check types) — 7 hidden errors (6 unit-test fixtures not matching
the `Pad` union, 1 E2E config). **Done:** `v3/tsconfig.json` references every project, so `tsc -b`
in `npm run build` checks everything; `strict` explicit; fixtures typed; guard that every
`.ts`/`.tsx` file belongs to a checked project (ADR-0055). **Status:** ✅ Done (see git log: "…(T12)").

### Re-enable mobile layout tests

`touch-targets.spec.ts` and `overflow.spec.ts` have FIXME markers because the
desktop-first layout fails them at 390 px (layout geometry is broken by design until Slice 8).
Re-enable once the Slice 8 mobile adaptation is in place.
**When:** Slice 8 completion.
**Source:** CLAUDE.md commit notes a37dd26, docs/design/design-notes.md §Known limitation.

### Re-enable DnD E2E tests

Tests 9, 14, 20, 21 in `pad-dnd.spec.ts` are `test.skip` (Scene reorder, Library drag Path B,
Pad SWAP, Pad INSERT). Need a stable Pointer Events drag sequence in Playwright.
**When:** When a reliable `dragByPointer()` helper is established in Playwright (Phase 3).
**Source:** docs/development/testing.md §Known pitfalls #5.

### Board persistence optimisation

`boardPut()` rewrites the full ~50 KB Board document on every pad/scene edit. Acceptable at
5×16 pads; may be a bottleneck at larger board sizes. If profiling shows it's slow: split
scenes into a separate IDB store.
**When:** Only if measured as a bottleneck. Do not optimise prematurely.
**Source:** ADR-0010, idb.ts inline comment.

### Pre-commit hook runtime watch

Pre-commit hook currently runs in ~16 s (sync:docs + build + lint-staged + 102 unit tests +
10 smoke E2E + link:check). Below the 20 s pain threshold. If runtime grows uncomfortable:
smoke E2E is the first candidate to move to CI-only (it's the most expensive gate, and CI
runs it anyway; removing it from the pre-commit saves ~6 s locally with no CI coverage gap).
**When:** When the hook exceeds ~25 s in practice.
**Source:** docs/development/testing.md §CI integration; empirical measure.

### Cheatsheet state-vocab quick-ref: consider generating from §3 (drift risk)

`docs/design/design-system-cheatsheet.md` §state vocab is a hand-maintained 13-entry subset of the
authoritative §3 table in `docs/design/design-system.md`. Every general-purpose `is-*` addition must
be manually synced to the Cheatsheet (as done for `is-conflict`). Consider generating this
quick-ref from §3 instead — eliminates the drift risk entirely.
**When:** Before the first general-purpose `is-*` class is missed from the Cheatsheet.
**Source:** docs/analysis/foundation-analysis.md §6 coupling map; observed during `is-conflict` registration (2026-06-15).

### I18n infrastructure

Structure code so a future i18n pass is feasible (texts in named constants, not hardcoded in
JSX). Currently English-only; no timeline.
**When:** Only if a localisation need is confirmed.
**Source:** docs/architecture/concept-brief.md §4.11, ADR-0041.

### Reduced-motion fallback for ModeToggle — resolved, cleanup pending

The `sb-mode-toggle-flash` class is CSS-defined as a brightness-flash fallback for users
with `prefers-reduced-motion: reduce`, but `ModeToggle.tsx` skips the animation entirely
rather than applying the fallback class. Behavior is correct (no animation = honoring
reduced-motion), but the CSS rule for `.sb-mode-toggle-flash` is confirmed dead code.

**Action:** Remove `.sb-mode-toggle-flash` from `v3/src/styles/tokens.css` when next
touching that file (e.g., during Slice 8 polish).
**When:** Slice 8, or opportunistically when tokens.css is edited.
**Source:** Truth-check commit `e207a0b`; class marked `[unused-css]` in docs/design/design-system.md §6.

### ✅ Dead CSS: `sb-creation-popover-section` — Resolved (4210405)

~~The class was designed as a padded, bordered section divider inside the creation popover.
`PadCreationPopover.tsx` was implemented using direct inline styles for every section instead.~~

**Resolved in Session 3d** (commit 4210405): Class was redefined (border-top instead of
border-bottom, column layout added, padding corrected to var(--space-2)) and applied to
the name+type section. The [unused-css] marker was removed. See cross-reference in
§5 CSS Class Discipline sub-session plan.

### Verify `--pix-bg-layer` removal in `.sb-pix` / `.sb-pad.is-deep`

The token `--pix-bg-layer` was removed from `v3/src/styles/tokens.css` during V3 development.
The `.sb-pix` rule uses it with a CSS fallback:
`var(--pix-bg-layer, linear-gradient(var(--pix-bg), var(--pix-bg)) padding-box)`.
The fallback likely makes the removal transparent for most cases, but `.sb-pad.is-deep` may
reference `--pix-bg-layer` directly (without a fallback). Visually confirm that the `.is-deep`
depth treatment renders correctly, and confirm no explicit `--pix-bg-layer` references without
fallbacks remain in `tokens.css`.
**When:** When `tokens.css`, `.sb-pix`, or `.sb-pad.is-deep` CSS is next touched.
**Source:** Session 0 tokens.css diff, 2026-05-29.

### shellcheck in pre-commit hook — evaluate first

Two `set -e` bugs in the BACKLOG drift reminder (grep exit 1, git log exit 128)
reached commits before being caught. `shellcheck` is a standard linter that knows
exactly this class of bug and would have flagged both at write time — an Ebene-1
"make the error impossible" measure rather than relying on review.

**Evaluate before adopting — do NOT just add it:**

- Does it meaningfully slow the pre-commit hook? (The hook is already ~16s, near the
  ~20s comfort threshold. Measure shellcheck's runtime on `.husky/*` before adding.)
- Is the hook the right place, or should it be CI-only / an editor integration? A blocking
  shellcheck gate that fires on style-nitpicks would be annoying; configure severity so it
  catches real bugs (like the set -e traps) without noise.
- It only covers shell scripts (`.husky/*` and `scripts/*.sh` if any) — small surface, but
  the surface where the recent bugs lived.

**Why deferred:** Meta-tooling; the CSS Class Discipline migration (Sessions 2–3) takes
priority. Worth doing eventually because the set -e class bit us twice.
**Source:** Conversation 2026-05-29 — "how to prevent things being overlooked."

### Review checklist — evaluate, keep minimal

During Session 1, most overlooked issues were caught by recurring review questions, not
by a mechanism. Codifying those questions as a short checklist would make the catching
less dependent on in-the-moment attentiveness. The recurring questions that actually
caught bugs:

- Was this number/claim measured, or estimated? (caught the 60–80 miscount)
- Which file/source does this actually read? (caught sync:tokens wrong-file)
- What happens in the error / edge case? (caught the set -e traps)
- Will the thing we built actually be found/used? (caught the iPhone-checklist gap)
- Does this only sound plausible, or is it backed by evidence? (the underlying pattern)

**Evaluate before adopting — and keep it SHORT:**

- A checklist only helps if it's used. A long one gets skipped. Five questions max; if it
  grows, it has failed.
- It must NOT become "always plan / always test everything" — selective vigilance is what
  works; a reflexive checklist on every trivial edit dulls attention and defeats itself.
- Decide where it lives: a short section in CLAUDE.md, or a standalone REVIEW_CHECKLIST.md
  referenced from the slice-completion routine. (Note: it's a checklist for the human
  reviewing plans, not for Claude Code — placement should reflect that.)

**Why deferred:** Process improvement, not blocking. The questions already work informally;
this just makes them durable. Low priority but cheap.
**Source:** Conversation 2026-05-29 — "how to prevent things being overlooked."

### Import-gate script + @layout-primitive tagging

Two deferred code tasks, related enough to batch:

**1. Import-gate script** (`scripts/import-gate.sh` or similar): formalise the 5 import-gate
checks from ADR-0046 as grep commands in a runnable script. Inputs: a path glob of files
to check (e.g. the freshly imported JSX). Outputs: per-check hit lists, exit 0 if clean,
exit 1 with a summary if violations found. Integrate as `npm run import:gate`.
Optional extension: auto-generate a one-session spec snapshot from live §5a + §3 +
tokens.css as a diff-checkable artifact.

**2. @layout-primitive CSS tagging** (referenced in `docs/design/design-system.md §5a` process note):
add `/* @layout-primitive: <purpose> */` annotation to each layout-primitive class in
`v3/src/styles/tokens.css`; extend sync tooling to detect unregistered primitives and flag
removals. Until implemented, §5a process note + manual update are the guard.

**Why deferred:** Greps are currently manual but functional; import gate is a new workflow
(ADR-0046, 2026-06-11) — prove the workflow first, then script it.

---

## 5. CSS Class Discipline (complete)

_Plan authored: 2026-05-29_

Four sequential sessions to establish and enforce stronger discipline around CSS class usage
versus inline styles. Motivated by a pattern identified on 2026-05-29: inline styles are
used for static structural values (e.g., `sb-creation-popover-section` bypassed in favour of
`style={{ padding: '8px', borderTop: ... }}`), bypassing the design-system class system and
creating drift that the `sync:classes` audit cannot detect.

### Session 0 — Documentation organization ✅ Done (5298705)

_Purpose:_ Clarify the roles and hierarchy of all design-related documentation loci before
any new convention rules are written. Without this, new rules risk landing in the wrong file
and going unread.

**Deliverables:**

- Define the role of every design doc locus: `docs/design/design-system.md`, `docs/design/design-system-cheatsheet.md`,
  `design-sources/2026-05-25/` (jsx files + tokens.css), `Responsive_Strategy_V3.html`,
  `docs/design/design-notes.md`. Each must have a one-sentence "this is for X, source of truth for Y"
  definition.
- Resolve the `tokens.css` duplication: `design-sources/2026-05-25/tokens.css` vs.
  `v3/src/styles/tokens.css`. Pick one of three options deliberately: (a) both stay with
  explicit headers explaining the split, (b) design snapshot moves to an archive location,
  (c) design snapshot is removed entirely.
- Define explicitly where workflow rules for code conventions live (so Session 1 knows where
  to write the new class-vs-inline rule).
- Expand the planned scope of `docs/design/design-system.md §1` from "Nomenclature (CSS)" to
  "Naming Conventions (project-wide)" — covering CSS classes, tokens, components/files,
  signals, ADRs, `data-testid`, etc. Include a TODO checklist of these sub-topics inside
  the §1 placeholder.
- Add a header note to `docs/design/design-system.md` at the top defining its hierarchy ("source of
  truth; cheatsheet is the short form; conflicts → this file wins").
- Add a header note to `docs/design/design-system-cheatsheet.md` referencing back to `docs/design/design-system.md`
  as the long form.

**When:** Next session, before any other CSS-discipline work.
**Source:** Conversation 2026-05-29 — six gaps identified during critical review of the
multi-session plan.

---

### Session 1 — Workflow rule + audit tooling + sync:classes warning ✅ Done (3b1ae06)

_Purpose:_ Establish the rule that prevents inline-style drift, build the tooling that
measures it, and tighten the existing `sync:classes` generator to warn on undocumented
new classes.

**Deliverables:**

1. **Workflow rule** (location decided in Session 0) covering three paths:
   - **Path A:** Use an existing `sb-*` class from `docs/design/design-system.md §6` whenever one fits.
     Consulting §6 before adding a new class is mandatory.
   - **Path B:** Create a new `sb-*` class if no existing one fits and the value is structural
     and reusable. New class must follow naming conventions (per §1) and use design tokens.
     Before creating: check §6 for similar function — if a similar class exists, extend it
     (e.g., with `is-*` variant) instead of duplicating. If unsure whether duplication risk
     exists, raise the question rather than silently creating.
   - **Path C:** `style={}` is legitimate only for dynamic values (computed from data,
     animations, drag positions, runtime calculations). Static values — including those using
     `var(--token)` — belong in classes, not inline. Inline-with-token is just as much a
     Path-D violation as inline-with-literal when the value is static.
   - **Forbidden (Path D):** Inline styles for static structural values, with or without tokens.

2. **Audit script** (`scripts/sync-inline-styles-audit.ts` or similar): scans
   `v3/src/**/*.tsx`, finds all `style={}` props, classifies them heuristically as
   "likely-static" (no template literals, no function calls, no variable references — just
   object literals with string/number values) vs. "likely-dynamic". Reports counts per file
   and a baseline total. Integrated into npm scripts (`audit:inline-styles`) and ideally
   into CI as informational (not blocking).

3. **`sync:classes` warning:** When `sync:classes` finds a class without `@inventory`, output
   a warning (not an error). Distinct from `[unused-css]` markers — those are intentional.
   The warning is for new classes that haven't been described yet.

4. **BACKLOG drift reminder** (non-blocking): a pre-commit or CI hint that surfaces when
   docs/backlog.md hasn't been touched in a while despite ongoing commits — e.g. "Last BACKLOG
   edit was N commits ago; consider updating." This is a reminder to reflect, NOT automatic
   item-closing (semantic completion can't be reliably automated). Same mechanism family as
   the sync:classes warning. Tune the threshold (commit count or days) during implementation.
   **Source:** Conversation 2026-05-29 — discussed alongside "should the backlog auto-update?"

5. **Fix `sync:tokens` source — read from canonical file, verify all generators consistent:**
   `sync:tokens` currently reads from `design-sources/2026-05-25/tokens.css` (the design handoff
   origin, now explicitly marked non-canonical). As a result, `docs/design/design-system.md §A` — which
   should be the source of truth — is generated from the wrong file: it is missing 9 tokens
   added during V3 development (`--flame-soft`, `--flame-aura`, `--grid-cols/gap/rows`,
   `--spark-duration/dx/dy`, `--undo-duration`) and still lists `--pix-bg-layer` which was
   removed. This is exactly the class of documentation drift Session 0 was designed to
   surface — one layer deeper into tooling.

   **Concrete fix:** Change `scripts/sync-tokens.ts` to read from
   `v3/src/styles/tokens.css` instead of `design-sources/2026-05-25/tokens.css`. Regenerate §A —
   should show 9 new tokens and correctly exclude `--pix-bg-layer`.

   **Broader verification (do at the same time):** Confirm that all `sync:*` generators read
   from the same canonical source. `sync:classes` reads from `v3/src/styles/tokens.css`
   (confirmed — `@inventory` comments live there and §6 reflects them correctly). The question
   to answer: are all three generators (`sync:adr`, `sync:classes`, `sync:tokens`) consistent
   in their canonical source, or is `sync:tokens` the only outlier? Report in the commit
   message.
   **Source:** Session 0 diff analysis, 2026-05-29.

**Alignment note (pre-work for Session 1):** Before writing the new class-vs-inline rule in
CLAUDE.md, verify that `docs/design/design-system-cheatsheet.md`'s decision tree (specifically the
inline-style and class-creation branches) aligns with the Path A/B/C/D logic. If the existing
tree says something different, Session 1 must resolve the conflict — not just add a
cross-reference sentence, but ensure both documents say the same thing.
**Source:** Session 0 review, 2026-05-29.

**When:** After Session 0 completes.
**Source:** Conversation 2026-05-29.

---

### Session 2 — Stage-3 plan, scoped by Session 1 baseline measurement ✅ Done (eda7458)

_Purpose:_ Decide the shape of the migration work based on actual measurement, not estimation.

**Delivered (2026-05-29):** Concrete 3a–3h migration roadmap from the verified baseline.
Per-file breakdown table (column sums exact: 177 violations, 13 pure-layout, 164 struct+mixed,
20 dynamic-with-static, 2 unclassified). Layout primitive specification (5 classes). Gap
normalization decision (6px → `var(--space-2)`). Sub-session sizing with audit-checkable DoDs.

**Source:** Conversation 2026-05-29.

---

### Session 3 — Migration of inline-styles to classes (8 sub-sessions) ✅ Done (994d2eb)

_Purpose:_ Convert all 177 Path-D violations + 20 dynamic-with-static + 2 unclassified blocks
into proper class usage. New classes created per 4-path rule; explicit anti-duplication
discipline throughout.

**Baseline to beat:** `cd v3 && npm run audit:inline-styles` → 177 violations / 20 d-w-s / 2 unclassified.  
**Target:** all three reach 0. (The 4 legitimate blocks — 2 pure-dynamic, 2 custom-setter-only — remain.)

---

#### Layout Primitives (Session 3a creates these in `v3/src/styles/tokens.css`)

| Class         | CSS                                                                    | Purpose                      |
| ------------- | ---------------------------------------------------------------------- | ---------------------------- |
| `sb-row`      | `display: flex; align-items: center; gap: var(--space-2)`              | horizontal flex row, 8px gap |
| `sb-row-sm`   | `display: flex; align-items: center; gap: var(--space-1)`              | horizontal flex row, 4px gap |
| `sb-flex-1`   | `flex: 1`                                                              | flex-fill spacer             |
| `sb-row-wrap` | `display: flex; flex-wrap: wrap; gap: var(--space-1)`                  | wrapping flex row            |
| `sb-row-fill` | `display: flex; flex: 1; align-items: center; justify-content: center` | fill + centered row          |

**Gap normalization:** `gap: 6` (5 blocks across the codebase) → `var(--space-2)` (8px).
The token scale is deliberately coarse; 2px difference is visually imperceptible.
If any block renders noticeably wrong after normalization, report before committing.

---

#### Sub-session Plan

Violation counts are **post-3a** (after 3a removes the 13 pure-layout blocks).  
DoD for each file session: `audit:inline-styles` → 0 violations for that file.

| Session                  | Files                                                                                                                                                    | violations (post-3a)                           | d-w-s                            | unclassified                     | DoD                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3a** ✅ Done           | All files — pure-layout only; create 5 primitives (+sb-hidden)                                                                                           | 12 of 13 fully resolved; 1 residual (see note) | 0                                | 0                                | audit → 1 pure-layout (BoardListScreen:237 `flexShrink:0` residual, assigned to 3f — roadmap prediction of "reclassify as d-w-s" was wrong, it stays pure-layout); 6 new classes (+5 primitives +sb-hidden); 63 total in §6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **3b** ✅ Done (172c695) | `PadEditorPanel.tsx`                                                                                                                                     | 23                                             | 4                                | 0                                | 0 violations, 0 d-w-s. 22 new classes (§6: 63→85). 11 flagged for 3d Path A. 3 Sorte-2 bets (see note below). sb-range-input: native `<input type="range">`, distinct from sb-slider custom div-track, 3 DOM renders — confirmed ≥2 uses.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **3c** ✅ Done (24b6977) | `LibraryScreen.tsx`                                                                                                                                      | 20                                             | 3                                | 0                                | 0 violations, 0 d-w-s. 19 new classes + 2 existing-class fixes (sb-tab button resets, sb-search-input 11px→var(--fs-xs) drift). §6: 85→104. Path A rate 5% (expected: LibraryScreen structurally distinct from PadEditorPanel). 0 Sorte-2 bets from 3b resolved. 8 Sorte-2 bets created for 3g/3e (see note below). sb-col added as new layout primitive.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **3d** ✅ Done (4210405) | `PadCreationPopover.tsx`                                                                                                                                 | 15                                             | 6                                | 0                                | 0 violations, 0 d-w-s. 8 new classes (sb-source-tabs, sb-tab-sm, sb-scroll-fill, sb-creation-popover-actions, sb-btn-muted, sb-sheet-header, sb-creation-popover-backdrop, sb-source-item). §6: 104→112. Resolution: 3 delete / 1 compose / 3 path-A unchanged / 4 path-A updated / 1 modifier / 9 new-class entries = 8 unique new classes. Reuse rate 45% (5/11 of 3b's flagged classes; leaf-level classes generalize, container-structure classes are component-specific — no re-planning of 3e–3h). 3b bet sb-type-btn WON. Plan deviation: planned sb-btn-sm min-height:36px rejected at spot-check — sb-btn-sm is used across 9 files including navigation buttons; 44px iOS touch-target floor via global rule is correct there. §4 Dead CSS sb-creation-popover-section resolved.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **3e** ✅ Done (96ae78d) | `StartScreen.tsx`                                                                                                                                        | 19                                             | 0                                | 0                                | 0 violations, 0 d-w-s. 18 new classes (sb-overlay family, sb-changelog family, sb-flame-icon, `sb-start-*` family, sb-btn-unlock, sb-version-link). §6: 112→130. Resolution: 1 Path A / 1 A+B / 1 0+B / 1 Primitiv+B / 15 new-class = 19. Reuse rate 10.5% — StartScreen is a centered splash with no tab bar and no empty state; all 3c bets (sb-screen, sb-screen-empty, sb-tab-bar) FAILED (inapplicable — not promoted, not cleaned up — each is still in active use on its own screen). Token normalization: 10 off-token values aligned (all ≤4px drift). New Sorte-2 bets for 3e (Verfallsbedingung: Slice 8): sb-overlay, sb-overlay-header, sb-overlay-body flagged for promotion if settings/future overlays appear. Changelog-family classes (`sb-changelog-*`) to demote if changelog component is removed. Opportunistic 3b-bet test: sb-panel-title evaluated against ChangelogOverlay's "CHANGELOG" heading — rejected (sb-panel-title is font-mono/fs-xs/flex:1; overlay title needs font-ui/fs-lg). Does not change sb-panel-title's bet status: its declared target is 3g (LibraryPanel), not 3e; this was a side test only — status remains PENDING.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **3f** ✅ Done (b46fb44) | `BoardScreen.tsx` + `BoardListScreen.tsx`                                                                                                                | 31 (BS: 17, BLS: 14)                           | 1 (BLS:161 d-w-s → sb-board-row) | 0                                | 0 violations, 0 d-w-s. §6: 130→145 (+15 new sb-\* classes). Audit total: 88→57. Resolution breakdown: DELETE 1 / Path A §6 7 / intra-session 1 / cross-file intra-session 3 / CSS extension 1 / new modifier 3 / new class 15 = 31. Reuse rate 35% (11/31). 3a residual (BLS:238 flexShrink:0) resolved via flat sb-row-actions class applied at element level — flat model maintained throughout. sb-screen: **WON** (3 uses: BS×2 + BLS×1). sb-tab-bar: still PARTIALLY-FAILED (3g pending). sb-section-header-row: not found in 3f files, moves to 3g. New 3f bets: sb-row-rename-input, sb-row-actions, sb-btn-icon-sm (all pending 3g — AudioRow scope). Token normalizations: 13px→--fs-xs (1px drift), fontSize:22px=--fs-xl exact, 11px sb-hint-text→10px (1px drift), padding 10px/14px→8px/12px (2px drift each). Off-token literals: 6px×3 (sb-place-banner, sb-setup-toolbar, sb-btn-icon-sm), 56px×1 (sb-board-row minHeight), 60px×1 (is-loose padding) — see §5 BACKLOG note below. Architecture: flat model invariant formally stated; sb-menu-row pre-flat legacy noted and left for dedicated consolidation pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **3g** ✅ Done (12fbbc0) | `SceneRail.tsx` + `LibraryPanel.tsx` + `AudioRow.tsx`                                                                                                    | 9 + 11 + 8 = 28                                | 0+0+2 = 2                        | 0                                | 0 violations, 0 d-w-s. §6: 145→159 (+14 new classes). Audit total: 57→29. Resolution: 1 DELETE / 14 Path-A §6 / 2 intra-session / 13 new class = 30 resolutions for 28 violations (+2 from d-w-s dual split). Reuse rate 57% overall (73% LibraryPanel — thesis confirmed for screen→panel siblings; 50% AudioRow). 0 new literal 11px values — SR-2 and AR-9 normalized to var(--fs-xs). 4 existing class updates: sb-row (min-width:0), sb-scroll-fill (overscroll-behavior:contain), sb-count-text (flex-shrink:0), sb-hint-text (truncation triplet). Bet outcomes: #3 WON (sb-panel-title on Library span), #5 WON (sb-search-field LP-3), #6 WON (sb-btn-clear LP-5), #12 WON (sb-scroll-fill LP-7); #4 PARTIAL (sb-search-bar → sb-lib-panel-search-bar sibling); #7 FAILED (sb-item-list wrong structure), #10 FINAL-FAILED→screen-local (sb-tab-bar, LibraryPanel has no tab bar), #11 FAILED (sb-filter-rail), #21 FAILED (sb-row-rename-input: wrong font scale for filenames), #22 FAILED (sb-row-actions: AudioRow uses grid, not flex+actions), #23 FAILED (sb-btn-icon-sm: 36px fits neither 28px SceneRail nor 44px AudioRow).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **3h** ✅ Done (994d2eb) | `PadTypeConfirmDialog.tsx` + `TopBar.tsx` + `BoardTopBar.tsx` + `PadGridCell.tsx` + `UndoToast.tsx` + `StatusBar.tsx` + `Waveform.tsx` + `PixelIcon.tsx` | 13+5+4+4+2+1+0+0 = 29                          | 1+1+1+0+0+0+2+0 = 5              | 1(PTD ternary)+1(Pix spread) = 2 | 0 violations, 0 d-w-s. §6: 159→186 (+27 new sb-\* classes). Audit total: 29→0 (project-wide Total=0 confirmed — Session 3 migration COMPLETE). Resolution breakdown: 1 DELETE / 4 pre-flat-family extensions (.sb-pad family: is-deep height+touch-action, pad-title fs unify, new pad-type-label + pad-drag-handle descendants) / 5 d-w-s splits (TopBar:85 cursor, BoardTopBar:59 maxWidth, PadTypeConfirmDialog:117 verdict-pill bg, Waveform:23 height+opacity, Waveform:37 height+background) / 19 Path B new classes. Near-miss merge: sb-topbar-breadcrumb(V2) + sb-topbar-scene-name(V3) → sb-topbar-secondary (cross-topbar 2-use, same function, 1px size normalization, color intrinsic). Anti-utility ruling: sb-text-dim/sb-text-mute rejected as standalone utilities; colors absorbed into semantic element classes (sb-type-change-from/-arrow, sb-undo-message, sb-topbar-secondary). PixelIcon: sb-pixel-icon hardcoded as base class in component; DOM-verified all 4 SVGs hasBase=true. Visual: TopBar + BoardTopBar (sb-topbar-secondary font-mono/12px/text-mute confirmed), StatusBar, PixelIcon verified headlessly. PadGridCell/PadTypeConfirmDialog/UndoToast/Waveform: CSS audit (0 Path-D) + build confirm migration; NOT laufzeit-verifiziert headlessly (ADD PAD disabled without audio fixture — pre-existing constraint). Confirm at the next use with loaded audio files: PadTypeConfirmDialog (FROM/ARROW/TO colours, verdict pill background, field label colour), waveform bars, PadGridCell (type badge / drag handle), UndoToast (message dim + UNDO + progress bar). Bet settlement: all 8 open bets closed (see §5 Sorte-2 Bet Index below); final scorecard: WON 7 / LOST-justified 8 / FINALLY-LOST-consolidation 7 / SPECULATIVE-Slice8 3. |

**Arithmetic verification:** 12+23+20+15+19+31+28+29 = 177 ✓ | d-w-s: 4+3+6+0+0+2+5 = 20 ✓ | unclassified: 2 ✓
_(3a resolves 12 fully + 1 residual deferred to 3f; 3f scope is 31 = 17+14. Total closes to 177.)_

**3b Sorte-2 bets** (created on expectation of 3d/3c reuse; cleanup candidates if not used as Path A):

- `sb-type-btn` — **WON (3d)**: PadCreationPopover type pills use it directly. Class updated (added fontFamily, textTransform, cursor, minHeight:28px).
- `sb-section-header-row` — **FINALLY LOST → screen-local (3h)**: Not found in 3d, 3f, 3g, or 3h. Stays on PadEditorPanel. Consolidation-pass candidate.
- `sb-panel-title` — **WON (3g)**: Applied to `<span>Library</span>` in LibraryPanel header. flex:1 pushes close button right without marginLeft:auto. 2 uses: PadEditorPanel "Pad Editor" + LibraryPanel "Library". Bet fully resolved.

**3c Sorte-2 bets** (1-use in 3c, created on expectation of 3g/3e reuse; cleanup candidates if not used as Path A):
High-confidence (3g is LibraryPanel — same library surface):

- `sb-search-bar` — **PARTIAL (3g)**: LibraryPanel has a search bar but the values differ (padding 6/8 vs 10/14, border-soft vs border). Created `sb-lib-panel-search-bar` as a sibling class (NOT a modifier of sb-search-bar — standalone, named for component context). The structural concept is confirmed; exact reuse was not possible.
- `sb-search-field` — **WON (3g)**: LibraryPanel uses it as Path A (LP-3). 2px gap drift (6→8) within tolerance. 2 uses: LibraryScreen + LibraryPanel. Bet fully resolved.
- `sb-btn-clear` — **WON (3g)**: LibraryPanel uses it as Path A (LP-5). 1px padding drift within tolerance. 2 uses: LibraryScreen + LibraryPanel. Bet fully resolved.
- `sb-item-list` — **FAILED (3g)**: sb-item-list uses padding + flex-column + gap (card-style list). LibraryPanel uses border-bottom separators without inner padding/gap. LibraryPanel list uses sb-scroll-fill instead. Class stays — in active use on LibraryScreen. Downgrade to screen-local.

Moderate-confidence:

- `sb-screen` — **WON (3f)**: BoardScreen root×2 + BoardListScreen root — all full-height column-layout app screen roots. 3 confirmed uses across 3 screens (LibraryScreen + BoardScreen + BoardListScreen). Bet fully resolved.
- `sb-screen-empty` — **FAILED (3e)**: StartScreen has no empty state; inapplicable. Class stays — in active use on LibraryScreen. ⚠️ Retroactively registered: this bet was implicit at 3c close (LibraryScreen empty-state class, expected that other screens might inherit the centered-empty-state pattern) but was not formally listed at the time; the omission was identified when the 3e entry referenced it as a 3c bet. Corrected here to make the 3c count accurate (7→8).
- `sb-tab-bar` — **FINAL FAILED → screen-local**: 3e failed (StartScreen no tab bar), 3f failed (BoardScreen/BLS no tab bar), 3g final test failed (LibraryPanel has no tab bar). Class stays — in active use on LibraryScreen. Downgraded from expected multi-screen to screen-local.
- `sb-filter-rail` — **FAILED (3g)**: LibraryPanel has no filter rail (it is a panel, not a 2-col screen layout). Class stays — in active use on LibraryScreen. Downgrade to screen-local.

**3d Sorte-2 bets** (created on expectation of 3e–3h reuse; cleanup candidates if not confirmed):

- `sb-scroll-fill` — **WON (3g)**: LibraryPanel item list uses it as Path A (LP-7). Updated with overscroll-behavior:contain. 2+ uses: PadCreationPopover + LibraryPanel. Bet resolved.
- `sb-sheet-header` — **FINALLY LOST → screen-local (3h)**: Structurally incompatible with PadTypeConfirmDialog (split header) + letterSpacing drift. Stays on PadCreationPopover. Consolidation-pass candidate.
- `sb-creation-popover-actions` — **FINALLY LOST → screen-local (3h)**: PadTypeConfirmDialog needs 3× larger padding + justify-content:flex-end. Stays on PadCreationPopover. Consolidation-pass candidate.
- `sb-btn-muted` — **FINALLY LOST → screen-local (3h)**: No recessive button in any 3h file. Stays on PadCreationPopover. Consolidation-pass candidate.
- `sb-tab-sm` — **FINALLY LOST → screen-local (3h)**: No tabs in any 3h file. Stays on PadCreationPopover. Consolidation-pass candidate.
- `sb-source-tabs` — **FINALLY LOST → screen-local (3h)**: No source tab row in any 3h file. Stays on PadCreationPopover. Consolidation-pass candidate.

---

### Sorte-2 Bet Index (consolidated)

> **Canonical status source.** Future sessions (3f–3h, Slice 8) update this table — not their individual session entries. Session entries remain as historical context; when a bet is won or lost, mark it here first. If a session entry says "PENDING" and this table says "OPEN-pending-3g", they mean the same thing — the table wording is authoritative. Do not create new per-session bet sections; extend this index instead.

**Six status categories:**

- **WON** — target session used the class as Path A; confirmed ≥2-use. No further action.
- **LOST — cleanup candidate** — target session did not use it; no other justification. Merge or remove the class.
- **LOST — but class justified** — cross-session bet failed; class is legitimately used on its origin screen. No cleanup; downgrade expectation from "multi-screen" to "screen-local."
- **PARTIALLY-FAILED** — tested in one target session and failed; remaining target sessions still pending. Class is active on its origin screen regardless of outcome.
- **OPEN — pending session X** — target session has not run; bet stands.
- **SPECULATIVE — far** — target is a distant or unplanned slice (e.g. Slice 8); accepted 1-use class with a vague future hope, not a near-term testable bet.

| #   | Class                         | Origin | Remaining target | Status                          | Verfallsbedingung                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------- | ------ | ---------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `sb-type-btn`                 | 3b     | —                | **WON (3d)**                    | Confirmed ≥2-use. No action.                                                                                                                                                                                                                                                                             |
| 2   | `sb-section-header-row`       | 3b     | 3h               | **FINALLY LOST → screen-local** | No 3h file has a space-between section header row. Stays on PadEditorPanel. Consolidation-pass candidate.                                                                                                                                                                                                |
| 3   | `sb-panel-title`              | 3b     | —                | **WON (3g)**                    | Applied to LibraryPanel "Library" span. 2 uses: PadEditorPanel + LibraryPanel. Bet resolved.                                                                                                                                                                                                             |
| 4   | `sb-search-bar`               | 3c     | —                | **LOST — but class justified**  | LibraryPanel needs sb-lib-panel-search-bar (different padding/border for 280px panel). sb-search-bar stays in use on LibraryScreen. Concept confirmed, exact reuse not possible.                                                                                                                         |
| 5   | `sb-search-field`             | 3c     | —                | **WON (3g)**                    | LibraryPanel LP-3 uses it as Path A. 2 uses: LibraryScreen + LibraryPanel.                                                                                                                                                                                                                               |
| 6   | `sb-btn-clear`                | 3c     | —                | **WON (3g)**                    | LibraryPanel LP-5 uses it as Path A. 2 uses: LibraryScreen + LibraryPanel.                                                                                                                                                                                                                               |
| 7   | `sb-item-list`                | 3c     | —                | **LOST — but class justified**  | LibraryPanel uses sb-scroll-fill (row-based list, not card-style). sb-item-list stays in use on LibraryScreen.                                                                                                                                                                                           |
| 8   | `sb-screen`                   | 3c     | 3f               | **WON (3f)**                    | Used on BS root×2 + BLS root×1 — all full-height column-layout app screen roots. Confirmed ≥3-use. No action.                                                                                                                                                                                            |
| 9   | `sb-screen-empty`             | 3c     | 3e               | **LOST — but class justified**  | Failed in 3e (StartScreen has no empty state). In active use on LibraryScreen. No cleanup.                                                                                                                                                                                                               |
| 10  | `sb-tab-bar`                  | 3c     | —                | **FINAL FAILED → screen-local** | 3e, 3f, 3g all failed (none have a tab bar). In active use on LibraryScreen — no cleanup. Downgraded to screen-local.                                                                                                                                                                                    |
| 11  | `sb-filter-rail`              | 3c     | —                | **LOST — but class justified**  | LibraryPanel has no filter rail. In active use on LibraryScreen. Downgrade to screen-local.                                                                                                                                                                                                              |
| 12  | `sb-scroll-fill`              | 3d     | —                | **WON (3g)**                    | LibraryPanel LP-7 uses it as Path A. Updated with overscroll-behavior:contain. ≥2 uses.                                                                                                                                                                                                                  |
| 13  | `sb-sheet-header`             | 3d     | 3h               | **FINALLY LOST → screen-local** | PadTypeConfirmDialog structurally incompatible: header is split (container div + title div + arrow row); applying sb-sheet-header to the container would bleed its typography to all children. Also letterSpacing differs (0.10em vs 0.08em). Stays on PadCreationPopover. Consolidation-pass candidate. |
| 14  | `sb-creation-popover-actions` | 3d     | 3h               | **FINALLY LOST → screen-local** | PadTypeConfirmDialog footer needs padding 3× larger (space-3/space-4 vs space-1/space-2) + justify-content:flex-end (absent). New class sb-dialog-actions created. Stays on PadCreationPopover. Consolidation-pass candidate.                                                                            |
| 15  | `sb-btn-muted`                | 3d     | 3h               | **FINALLY LOST → screen-local** | No 3h file has a visually recessive de-emphasized button. Stays on PadCreationPopover. Consolidation-pass candidate.                                                                                                                                                                                     |
| 16  | `sb-tab-sm`                   | 3d     | 3h               | **FINALLY LOST → screen-local** | No 3h file has tabs. Stays on PadCreationPopover. Consolidation-pass candidate.                                                                                                                                                                                                                          |
| 17  | `sb-source-tabs`              | 3d     | 3h               | **FINALLY LOST → screen-local** | No 3h file has a source tab row. Stays on PadCreationPopover. Consolidation-pass candidate.                                                                                                                                                                                                              |
| 18  | `sb-overlay`                  | 3e     | Slice 8          | **SPECULATIVE — far**           | Promote to confirmed multi-use if settings screen or future overlays appear in Slice 8.                                                                                                                                                                                                                  |
| 19  | `sb-overlay-header`           | 3e     | Slice 8          | **SPECULATIVE — far**           | Same as `sb-overlay`.                                                                                                                                                                                                                                                                                    |
| 20  | `sb-overlay-body`             | 3e     | Slice 8          | **SPECULATIVE — far**           | Same as `sb-overlay`.                                                                                                                                                                                                                                                                                    |
| 21  | `sb-row-rename-input`         | 3f     | —                | **LOST — but class justified**  | AudioRow rename uses font-ui fs-sm/14px, no uppercase — fundamentally different typography from board names (fs-lg/18px, 0.08em, uppercase). Created sb-audio-row-rename. sb-row-rename-input stays in use on BLS BoardRow.                                                                              |
| 22  | `sb-row-actions`              | 3f     | —                | **LOST — but class justified**  | AudioRow uses 5-column CSS Grid (not flex with trailing action group). No trailing action group wrapper. sb-row-actions stays in BLS BoardRow.                                                                                                                                                           |
| 23  | `sb-btn-icon-sm`              | 3f     | —                | **LOST — but class justified**  | SceneRail action buttons = 28px (uses sb-btn-icon). AudioRow delete = 44px (iOS touch target). 36px fits neither. sb-btn-icon-sm stays in BLS BoardRow (2-use).                                                                                                                                          |
| 24  | `sb-flex-trunc`               | 3g     | 3h               | **FINALLY LOST → screen-local** | BoardTopBar board name is in a column flex context (not row fill) with a dynamic maxWidth constraint — flex:1/min-width:0 don't apply. Stays on SceneRail (1-use). Consolidation-pass candidate (1-use class).                                                                                           |
| 25  | `sb-panel-empty`              | 3g     | 3h               | **WON (3g, 2-use)**             | 2-use intra-session (SceneRail + LibraryPanel). No 3h file has panel empty states; WON confirmed in 3g.                                                                                                                                                                                                  |

**Count check (final — all 25 closed):** WON: 7 (#1,3,5,6,8,12,25) · LOST-justified: 8 (#4,7,9,10,11,21,22,23) · FINALLY-LOST→consolidation: 7 (#2,13,14,15,16,17,24) · SPECULATIVE-Slice8: 3 (#18,19,20) = 7+8+7+3 = 25 ✓. No OPEN or PARTIALLY-FAILED bets remain. Index closed (2026-05-31, 994d2eb).

---

#### Bets 3g tested ✅ Done (12fbbc0)

3g covered `SceneRail.tsx` + `LibraryPanel.tsx` + `AudioRow.tsx`. All 13 bets resolved:

| Bet | Class                 | Result                    | Key finding                                                                                                                    |
| --- | --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| #3  | sb-panel-title        | **WON**                   | Library span in LibraryPanel — exact same function as PadEditorPanel "Pad Editor"                                              |
| #4  | sb-search-bar         | **PARTIAL → new sibling** | LibraryPanel has the structural role but needs sb-lib-panel-search-bar (6/8 vs 10/14 padding; panel context)                   |
| #5  | sb-search-field       | **WON**                   | LP-3 Path A; 2px gap drift acceptable                                                                                          |
| #6  | sb-btn-clear          | **WON**                   | LP-5 Path A; 1px padding drift acceptable                                                                                      |
| #7  | sb-item-list          | **FAILED**                | Card-style list (padding+gap) ≠ row-separator list (border-bottom)                                                             |
| #10 | sb-tab-bar            | **FINAL FAILED**          | LibraryPanel has no tab bar; downgraded to screen-local                                                                        |
| #11 | sb-filter-rail        | **FAILED**                | LibraryPanel is a panel, not a 2-col screen with a filter sidebar                                                              |
| #12 | sb-scroll-fill        | **WON**                   | LP-7 Path A; updated with overscroll-behavior:contain                                                                          |
| #16 | sb-tab-sm             | **NOT FOUND**             | No compact tabs in 3g files; passes to 3h                                                                                      |
| #2  | sb-section-header-row | **NOT FOUND**             | No space-between section headers in 3g files; passes to 3h                                                                     |
| #21 | sb-row-rename-input   | **FAILED**                | AudioRow uses fs-sm/14px/normal-case; class is fs-lg/18px/uppercase — different typographic scale for filenames vs board names |
| #22 | sb-row-actions        | **FAILED**                | AudioRow uses 5-column CSS Grid, not flex with trailing action group                                                           |
| #23 | sb-btn-icon-sm        | **FAILED**                | 36px fits neither SceneRail (28px) nor AudioRow (44px iOS touch target)                                                        |

**Strategic finding:** The thesis holds for screen→panel siblings (LibraryPanel 73% reuse — 3c's classes snapped in). It fails for component→component predictions (AudioRow 50%, 3f bets all failed) when the components have structurally different layouts (grid vs. flex+actions). Honest failed bets are real results; they map the boundary of the strategy.

#### Bets 3h settled ✅ Done (994d2eb)

3h covered `PadTypeConfirmDialog.tsx` + `TopBar.tsx` + `BoardTopBar.tsx` + `PadGridCell.tsx` + `UndoToast.tsx` + `StatusBar.tsx` + `Waveform.tsx` + `PixelIcon.tsx`. All 8 open bets closed:

| Bet | Class                       | Result                          | Key finding                                                                                                                                                                                                               |
| --- | --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #2  | sb-section-header-row       | **FINALLY LOST → screen-local** | No 3h file has a space-between section header row. Consolidation-pass candidate.                                                                                                                                          |
| #13 | sb-sheet-header             | **FINALLY LOST → screen-local** | PadTypeConfirmDialog header is split into 3 nested elements (container + title + arrow-row); applying sb-sheet-header to container would inherit typography to all children. Additionally letterSpacing 0.10em vs 0.08em. |
| #14 | sb-creation-popover-actions | **FINALLY LOST → screen-local** | PadTypeConfirmDialog footer: padding 3× larger (space-3/space-4 vs space-1/space-2) + justify-content:flex-end absent. New class sb-dialog-actions created.                                                               |
| #15 | sb-btn-muted                | **FINALLY LOST → screen-local** | No de-emphasized recessive button in any 3h file.                                                                                                                                                                         |
| #16 | sb-tab-sm                   | **FINALLY LOST → screen-local** | No tabs in any 3h file.                                                                                                                                                                                                   |
| #17 | sb-source-tabs              | **FINALLY LOST → screen-local** | No source tab row in any 3h file.                                                                                                                                                                                         |
| #24 | sb-flex-trunc               | **FINALLY LOST → screen-local** | BoardTopBar board name is in a column flex (not row fill) with dynamic maxWidth — flex:1/min-width:0 don't apply. Column context makes the class inapplicable.                                                            |
| #25 | sb-panel-empty              | **WON (3g, confirmed)**         | Already WON at 2-use intra-session in 3g; no 3h file has panel empty states. Status closes as WON.                                                                                                                        |

**Near-miss finding (3h):** sb-topbar-breadcrumb (V2, mono/12px/text-mute/nowrap) and sb-topbar-scene-name (V3, mono/11px/text-mute/truncating) share the same function ("secondary muted mono text in topbar context"). Merged into sb-topbar-secondary (cross-topbar 2-use). 1px size normalization (11→12px, both off-ladder), truncation added to V2 breadcrumb (improvement — parent has min-width:0, was overflowing without it). Color is intrinsic to the class (anti-utility ruling: separate sb-text-mute class rejected).

**Anti-utility ruling (3h):** sb-text-dim and sb-text-mute as standalone color utilities were rejected — same anti-pattern as the sb-truncate rejection in 3g. Colors absorbed into semantic element classes where they belong semantically. No standalone color utility classes exist in §6.

**Ordering rationale (load-bearing):**

- 3a first — layout primitives are a dependency for all subsequent sessions
- 3b (PadEditorPanel) **before** 3d (PadCreationPopover) — both have form-section patterns;
  3b establishes shared classes, 3d uses them as Path A. **Swapping this order risks duplicate classes.**
- 3c (LibraryScreen) **before** 3g (LibraryPanel) — same reason: shared list/metadata patterns
- 3e (StartScreen) anywhere in the middle — isolated, no structural sharing
- 3g and 3h last — consume patterns from screen sessions; maximizes Path-A reuse

---

#### Per-sub-session required first step (mandatory for 3b–3h)

At the start of each file session, **before touching any code:**

1. **Read §6 in full** — run `npm run sync:classes` first to ensure it reflects the previous
   session's new classes.
2. **Batch-scan the file's violations by category** — categorize each block as pure-structural,
   mixed, or dynamic-with-static. The global audit reports per-file totals, not per-file category
   breakdown; derive this split locally, because it informs the migration approach: mixed blocks
   require combining a layout primitive + structural class; pure-structural blocks need only one class.
3. **Batch Path A/B decisions for every violation at once** — do not decide one-by-one while
   editing. Context collapses when reading and writing alternate.
4. **For each Path B class:** grep §6 for similar function before creating. If the same structural
   need appears multiple times in the file, create ONE class used N times.

**At sub-session end:**

- Add `/* @inventory: … */` to all new classes → run `npm run sync:classes` → verify §6 updated
- Report: Path A vs Path B split, new-class count
- Commit before starting the next sub-session (so the next session inherits an up-to-date §6)

#### Class-quality rules (apply in every sub-session 3d–3h)

The user's criterion (clarified during 3c): class COUNT is not a concern. §6 growing
to 150+ classes is fine **provided** every class is individual, duplication-free, and
serves a specialized function. The metric that matters is not "how many classes" but
"how many class-pairs are too similar." Two rules operationalize this:

**Rule 1 — No duplication (the near-miss test):**
When a proposed new class has similar CSS to an existing class, decide:

- Is the difference a genuine semantic role? → both classes are correct, keep both.
  (Example from 3c: sb-search-field "active search entry" vs sb-readonly-field
  "read-only display" — same structure, different function, both kept.)
- Is the difference just drift / off-token values? → it's ONE function with drift,
  not two. Unify them.
  (Example from 3c: sb-search-input 11px vs sb-search-input-lg 13px — neither value
  on the token ladder (--fs-xs=12, --fs-sm=14), so both were ±1px drift from the same
  target. Unified to var(--fs-xs); the second class eliminated.)
  The decisive check: do the two classes' differences land on token-ladder values? If
  not, it's drift to unify, not a distinction to preserve.

**Rule 2 — No over-splitting (modifier before full class):**
When a proposed class overlaps ~80%+ with an existing class and the rest is a variation,
check whether a modifier (`is-*` / `has-*`) on the existing class is cleaner than a new
full class. Prevents the `sb-row` / `sb-row-bordered` / `sb-row-tight` proliferation.
(Example from 3c: sb-rail-section + .has-divider, not two separate section classes.)

**Per-sub-session application:** in the anti-duplication self-check, for each new class
ask explicitly: (a) does an existing class serve a similar function — if so, semantic
role (keep both) or drift (unify)? (b) is this a variation that a modifier would express
better than a new full class? Report the answer in the self-check.

**After 3d:** brief check — did these two rules hold? 3d is the first real test of the
load-bearing strategy (it inherits 3b's 11 flagged classes). Not a count check — a
duplication check: did 3d reuse 3b's classes as Path A, or duplicate them?

---

**When:** Per the 3a–3h ordering above.  
**Source:** Conversation 2026-05-29.

---

**Cross-references:**

- `sb-creation-popover-section` (§4 Deferred Infrastructure — canonical example of
  inline-style drift)
- `sb-mode-toggle-sparks` (§3 Deferred Design Decisions — design-implementation divergence)
- ADR-0021 (CSS naming), ADR-0022 (tokens), ADR-0027 (semantic pad-type colors)

---

### Color-literal audit — investigate Stylelint first

ADR-0022 forbids color literals (hex, rgb(), named colors) in favour of design
tokens (`var(--token)`). There is currently no automated check that this holds.
A measurement of where literals slipped in would be useful — same idea as the
inline-style audit.

**Important — check the right tool first:** Before building a custom audit script,
investigate whether Stylelint (or an existing ESLint plugin) already covers this.
There are standard rules for "no color literals / enforce custom properties." If a
lint rule exists, use that (it runs in-editor and can gate pre-commit) rather than
writing and maintaining a custom script. A custom audit is only justified if no
lint rule fits AND we specifically want a count/baseline rather than a pass/fail gate.

**Why deferred:** Not urgent; the inline-style discipline work (CSS Class Discipline
Sessions 1–3) takes priority. Color-token discipline appears largely followed already
(the tokens-inventory generator runs cleanly), so drift here is likely small.

**When:** After CSS Class Discipline Sessions 1–3 are complete. Low priority.

**Source:** Conversation 2026-05-29 — "should we use audit scripts elsewhere?"

---

### Sub-token font-size pattern: off-ladder sizes below `--fs-xs`

Two classes now deliberately use font-sizes below `--fs-xs` (12px):

- `sb-hint-text`: `10px` — added in Session 3b; annotated "consider --fs-xxs in Session 8"
- `sb-btn-muted`: `11px` — added in Session 3d (recessive secondary-action button)

These are **not independent drift** but a design pattern for recessive UI text.
Rule 1 check: do 10px and 11px land on a token-ladder step? No — no sub-xs token exists.
Both stay as literals for now (consistent with how sb-hint-text was handled in 3b).

**Action:** Session 8 must decide: one `--fs-xxs` token (one value for both?), two tokens
(`--fs-xxs` + `--fs-xxxs`?), or keep as named literals. Do not add further literal
sub-xs font-sizes without consulting this note first — the next literal would make
three separate values and force a decision anyway.

**Session 3g update:** SR-2 (`sb-scene-num-badge`, was 11px) and AR-9 (`sb-audio-col-size`,
was 11px) normalized to `var(--fs-xs)` — zero new literal 11px values introduced in 3g.
The deliberate 11px literals remain only in `sb-count-text` and `sb-btn-muted`.

**When:** Session 8 (typography/polish). **Source:** Session 3d, 2026-05-30; updated 3g, 2026-05-31.

---

### Sub-token padding `6px`: off-ladder size between `--space-1` (4px) and `--space-2` (8px)

Three classes from Session 3f use `6px` as a padding literal:

- `sb-place-banner`: `padding: 6px var(--space-3)` — notification banner vertical padding
- `sb-setup-toolbar`: `padding: 6px var(--space-3)` — SETUP toolbar vertical padding
- `sb-btn-icon-sm`: `padding: 0 6px` — compact icon button horizontal padding

`6px` is not on the token ladder (--space-1=4, --space-2=8). All three carry the same
value, which is not coincidence — they represent the same visual density target (tighter
than --space-2=8 but less dense than --space-1=4). **Do not add further 6px literals**
without consulting this note first; the next instance would make four total and force
a tokenization decision.

**Action:** Session 8 decides: add `--space-1-5: 6px` (or similar), or keep named literals.
**When:** Session 8. **Source:** Session 3f, 2026-05-31.

---

### Sub-token literals introduced Session 3h

Session 3h introduced several deliberate off-ladder literals in new classes. All are
retained as named literals (same rationale as 3f/3d precedents). Session 8 consolidates.

**Font sizes below --fs-xs (12px):**

- `sb-pad-type-label`: `9px` — deliberately tiny type badge inside a pad cell
- `sb-pad-drag-handle`: `10px` — small drag indicator (also: `bottom: 4px; right: 6px` pixel literals for corner positioning)
- `sb-undo-message`: `13px` — between --fs-xs (12) and --fs-sm (14); toast message context
- `sb-topbar-secondary`: `12px` — normalized from 11px (BoardTopBar scene name) and 12px (TopBar breadcrumb); now consistently 12px = --fs-xs but kept as literal since it's also the token value

**Sub-token padding:**

- `sb-verdict-pill`: `padding: 2px 10px` — tight pill sizing (2px top/bottom, 10px sides)
- `sb-field-chip`: `padding: 1px 6px` — compact tag chip (1px top/bottom, 6px sides — adds to the 6px note above)
- `sb-undo-btn`: `padding: 2px var(--space-3)` — tight button vertical (2px top/bottom)

**Pixel literals (absolute positioning):**

- `sb-pad-drag-handle`: `bottom: 4px; right: 6px` — no token for these corner values; same tight-corner pattern as `sb-pad-key` (top: 6px, right: 6px established in Session 3a/legacy)

**TopBar fixed dimensions (no tokens):**

- `sb-topbar`: `padding: 10px 16px; height: 48px` — 10px is between space-2 (8px) and space-3 (12px); 48px topbar height matches BoardTopBar but no --topbar-height token exists

**Font sizes above --fs-xs used as literals:**

- `sb-topbar-title`: `22px` — display title, no fs-\* token at this size
- `sb-topbar-board-name`: `16px` — compact board title, no fs-\* token at this size

All these literals are documented in the @inventory comments in tokens.css.
**Action:** Session 8 (typography/polish pass) decides which earn tokens.
**When:** Session 8. **Source:** Session 3h, 2026-05-31.

---

### ✅ Session 3 CSS Class Discipline Migration — COMPLETE (2026-05-31)

All 177 inline-style Path D violations across all app files have been migrated.
Project-wide audit Total Path D = 0 (confirmed headlessly, 994d2eb).

**Final §6 class count after consolidation pass: 184 `sb-*` classes** (186 post-migration → 184
after consolidation pass; 2 merged: sb-topbar-board-name → sb-topbar-title.is-board,
sb-topbar-badge-wrap absorbed into sb-mode-badge).

**Consolidation pass:** ✅ COMPLETE (2026-05-31). All five tasks done. See §2 → "End-of-Session-3
consolidation pass" for full results. 24 of 26 candidate classes confirmed-justified, 2 merged.

**What remains pending (Session 8):** Sub-token literal tokenization, the sb-overlay
family (SPECULATIVE #18–20), visual regression check of PadGridCell/PadTypeConfirmDialog/
UndoToast/Waveform with real audio data (not headlessly testable without audio fixtures),
CLAUDE.md phrasing items (line 268 post-migration baseline).

**Separate session (sb-menu-row restructuring):** Pre-flat family flattening — dedicated
session after consolidation pass, structural work mode.

---

### Flat CSS model invariant (established Session 3f, completed Session 3 consolidation pass)

All sb-\* classes follow a **flat model**: one class per element, composition via multiple
classes on the same element. No descendant selectors inside any class.

**Exception resolved:** `sb-menu-row` pre-flat legacy descendant rules (`.sb-menu-row .sb-icon`,
`.sb-menu-row .sb-row-title`, `.sb-menu-row .sb-row-sub`) flattened in consolidation pass.
The three child classes are now standalone flat rules. `is-active` + `is-active::after` removed
(dead code — no TSX ever set `is-active`; `currentBoardId` only serves navigation, not an
active highlight in the BoardRow). §6 = 187. **No pre-flat families remain.**

**Note:** No active-board highlight exists in BoardListScreen (the row that was last opened has
no visual indicator). If this feature is wanted in a future slice, `is-active` + `currentBoardId`
comparison in BoardRow JSX is the natural implementation point.

**Rule:** No new descendant selectors. Context-specific behavior via flat modifier at the element.
**Source:** Session 3f 2026-05-31; flattened consolidation pass 2026-05-31.

---

### AudioRow grid overflow on iPhone 13 Pro (390px viewport) — Slice 8 responsive

`sb-audio-row` (Session 3g) has `grid-template-columns: 160px 1fr 70px 90px 44px`.
Fixed widths: 160+70+90+44 = 364px. Gaps: 4 × var(--space-3) = 4 × 12px = 48px.
Minimum before the 1fr column: **412px** — 22px wider than the 390px CSS viewport.

The LibraryScreen content column at 390px (after the 220px filter rail) is ~170px.
AudioRow rows would overflow this column on every use — **it happens in normal use as soon
as the library contains files** (an empty library hides it in tests).

**Status:** PRE-EXISTING — this grid was in the original inline style before Session 3g.
Session 3g faithfully migrated the values to `sb-audio-row` without changing the layout
behavior. Not a regression from 3g; the commit that introduced the grid was in Slice 2.

**Action:** Slice 8 Responsive pass — AudioRow needs a narrow-viewport layout:

- Option A: Replace fixed columns with fractional or smaller fixed values that fit 170px
- Option B: Different layout structure on narrow viewports (stack rows instead of grid)
- Option C: The LibraryScreen 2-column layout itself may need to collapse on mobile
  (sb-screen-layout's 220px filter rail + 1fr is already a problem at 390px)
- Priority: HIGH — this is the Library's core audio-file list on the primary target device

**Verify:** Upload audio files on iPhone 13 Pro to confirm the overflow is visible in practice.
**When:** Slice 8 (responsive/polish). **Source:** Session 3g spot-check, 2026-05-31.
Measured: content column = 170px, grid minimum = 412px, deficit = 242px.

---

### UI text inconsistency: `EmptyHint` in BROWSE tab vs RECENT tab

When the audio library is empty, the BROWSE tab shows "No matches." while the RECENT tab
shows "No audio in library yet." — both correct by code logic, but inconsistent in tone.
Both use `EmptyHint` with different message strings; a user with no library sees
"No matches." in BROWSE even without typing a search query.

**Action:** Decide whether to unify ("No audio in library yet." for empty-library state
regardless of tab) or deliberately differentiate (BROWSE is always search-mode, so
"No matches." is acceptable). Small fix in `PadCreationPopover.tsx`.

**When:** Session 8+ or opportunistically. Pre-existing; not introduced by 3d.

---

### SceneRail action buttons: pre-existing Path D violation (`minHeight:28`)

✅ **Resolved in Session 3g (12fbbc0).** Migrated to `sb-btn-icon` (Path A, exact match: min-width:28px; min-height:28px; padding:0 4px). All three scene action buttons (rename/copy/delete) now use `class="sb-btn sb-btn-sm sb-btn-icon …"` without inline styles.

**Source:** Observed during 3d spot-check, 2026-05-30. Resolved 2026-05-31.

---

### Single-source design values + descriptive/prescriptive split (Session 8 — design-system consolidation)

**Background:** During Session 3d, a planned `sb-btn-sm` `min-height:36px` addition was
rejected after measurement showed it would silently push 20 buttons across 9 files from
44px to 36px — violating the 44px iOS touch-target guideline in CLAUDE.md. The change was
only recognizable as a regression because that guideline existed. This surfaced a layered
architectural question: where should design values and design rules live?

The diagnosis has three layers:

**Value layer:** `min-height: 44px` appears as a bare literal in `global.css` AND as
"44px" in CLAUDE.md's guideline — the same value for the same reason written
independently in two places. If one changes, the other silently doesn't. The token ladder
already solves this for font-sizes (`--fs-xs` instead of `12px`); heights and touch-targets
do not yet have consistent token discipline.

**Description layer:** Any prose in CLAUDE.md that repeats a class value (e.g.
"sb-btn-sm is 36px") duplicates §6 (generated from the classes). Duplication that can
drift. Prescriptive rules ("primary touch targets ≥44px because iOS; secondary may be
smaller") belong in prose — they live nowhere else. Descriptive repetitions do not.

**Rule layer:** A guideline is prescriptive — the criterion classes should meet. The
3d decision was possible only because the rule existed. Well-placed prescriptive rules
earn their place; descriptive repetition does not.

---

**Part A — token-ify recurring height/touch-target values (INVESTIGATE first):**

Check whether recurring height values already have tokens in `tokens.css`. They may simply
not be referenced consistently. Verify before tokenizing.

If values like 44px (iOS primary touch-target floor) are still scattered literals used
across multiple classes/files: lift them into a token (e.g. `--touch-target-min`, name
TBD) so the global `button { min-height }` and the CLAUDE.md guideline reference the same
single source and cannot silently diverge.

Guardrail — do not tokenize everything:

- One-offs (e.g. `sb-source-item gap: 2px` — single consumer, no general concept) stay
  as literals. The test is "does this number mean a concept used in more than one place?"
- Only values that carry a recurring concept warrant a token.

**Part B — descriptive-vs-prescriptive audit of CLAUDE.md (INVESTIGATE first):**

Classify each design-related statement: does it DESCRIBE a class value ("sb-btn-sm is
36px") or PRESCRIBE a criterion ("primary touch targets ≥44px")?

- Descriptive repetitions of class values → remove (single source of truth is the
  class/token; generated view is §6)
- Prescriptive rules → keep (they live nowhere else)

Not verified that CLAUDE.md contains descriptive duplications — check, don't assume.
If it is already cleanly prescriptive, nothing needs removing.

**Part C — evaluate making prescriptive rules checkable (open question, NOT a committed build):**

Where a rule can be operationalized, consider converting it from prose into an executable
check — e.g. a touch-target lint asserting no button class sets `min-height` below
`--touch-target-min` except those explicitly marked compact (like sb-btn-icon). Same idea
as the inline-style audit operationalizing the four-path rule.

Dependency: this only becomes clean if Part A is done first. A lint that asserts `44`
hardcoded just relocates the drift. Session 8 decides whether to build Part C; do not
build it because it is listed.

**The coherent goal of A+B+C:** each design fact lives in exactly one place, referenced
everywhere else, never repeated as a literal that can drift.

**Action:** Investigate Parts A and B during Session 8 (design-system / polish). Part C
is an open question — evaluate and decide in the same session.

**When:** Session 8 (design-system consolidation).
**Cross-reference:** sb-btn-sm touch-target question, Session 3d (the 36px addition was
rejected because of the 44px guideline; the full-radius grep revealed 20 buttons across
9 files would have been affected). 3d decision is closed; this is the architectural
follow-up.
**Source:** Session 3d, 2026-05-30.

---

## 6. Known Limitations

Documented, accepted constraints. Will not be fixed until the triggering platform or slice
changes.

### Ringer Switch (physical mute)

When the iOS physical Ringer Switch is set to silent, the app produces no sound — same
behaviour as V1. This is an iOS platform limit: the AVAudioSession silent-WAV trick cannot
override the hardware switch. The silent-WAV still serves its purpose (consistent
`AudioContext.resume()` after interruptions and tab-switches). Deliberate; not a bug.
**Source:** docs/design/design-notes.md §iOS Plattform-Grenzen.

### Populated-SETUP layout at 390 px viewport

SceneRail (220 px fixed) + open inspector panel (280 px fixed) = 500 px combined minimum,
which exceeds a 390 px viewport. The center pad grid is pushed to 0 px. Expected for the
current desktop-first layout. Fix deferred to Slice 8 mobile adaptation.
**Source:** docs/design/design-notes.md §Known limitation: SETUP layout.

### HTML5 DnD silently broken on iOS

`draggable` / `ondragstart` / `ondrop` are not supported on iOS Safari/Brave. All DnD must
use Pointer Events. Canonical patterns: `src/lib/padDnd.ts` (pad-to-pad) and
`src/lib/libDnd.ts` (library-to-grid). Any future DnD interaction must follow these patterns.
**Source:** CLAUDE.md §Supported Platforms, docs/design/design-notes.md §Slice 3/Lessons.

### WebKit headless: no audio codec support

Playwright's headless WebKit build cannot decode audio (`decodeAudioData()` fails). As a
workaround, audio-dependent mobile tests run on Chromium with the iPhone 13 Pro device
profile. Audio-free mobile specs continue on WebKit.
**Source:** docs/development/testing.md §Known pitfalls #7.

### `boardPut()` full-document rewrite

Any pad or scene edit rewrites the entire ~50 KB Board document. Acceptable at current board
sizes. See the infrastructure item above for the optimisation path.
**Source:** ADR-0010.

---

## 7. Manual Verification Reference

`development/manual-iphone-checklist.md` must be run before every release and after any commit
that touches audio code (`src/audio/`), the IDB layer (`src/db/`), or file-handling
(import/export). It covers items that cannot be automated in Playwright:

- File upload via iOS native picker (bypassed by `setInputFiles()`)
- Actual audio output
- Ringer Switch behaviour
- Tab-switch / backgrounding lifecycle
- Backup import/export via iOS Files app

See `docs/development/testing.md §Mobile testing` for the full rationale.
