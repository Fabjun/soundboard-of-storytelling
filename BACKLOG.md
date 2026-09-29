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
**When:** with the deck work in Slice 9e or the adaptive layout in Slice 13.

> **Slice numbers in this section refer to the May plan** (Slices 5–8, superseded 2026-09-28).
> Mapping to the new plan (Slices 9–14): `CLAUDE.md §Slice progress`. Items are re-triaged when
> the respective new slice is planned.

### Slice 5 — Scene Switching

### Scene navigation
Switch between multiple scenes on a board during play. The primary GAME-time interaction
after Slice 4 audio playback is live.
**Why deferred:** Slice 5 in the plan; scene data model and CRUD are complete (Slice 3).
**When:** Slice 5.
**Source:** V3_CONCEPT_BRIEF.md §5.1, CLAUDE.md Slice Progress table.
**Session 2026-06-04:** Audio-during-switch explicitly confirmed as the correct behavior — no
code change needed. → [Design Session 2026-06-04](#design--feature-clarification-session--2026-06-04).

---

### Slice 6 — Sets + Quick Access

### PadSet model + Quick-Access strip
### Set CRUD (create / rename / duplicate / delete)
### Set composition and layout
### Set reorder DnD
### Open UX question: Quick Access strip scope
→ all five entries moved to [docs/product/PRODUCT.md §5 Board, decks & quick access](docs/product/PRODUCT.md#board-decks--quick-access) (2026-09-28). Revised there: **pad sets are dropped**; the quick-access bar is board-wide, freely assignable, with fixed board-wide keys. Remaining work: see §3 "Board pad pool (data model)".

---

### Slice 7 — Template Export/Import

### V1-compatible template export/import
→ moved to [docs/product/features/data-backup.md](docs/product/features/data-backup.md) (2026-09-28), D5 + import rules. Revised there: the V1-readable export is **dropped**. **When:** Slice 10 (new plan).

### Stream-based export/import (V1 lessons warning)
Must stream one library entry at a time — never JSON-load the entire library at once (iOS
memory safety; 150–300 MB string would OOM older iPhones). **V1 had memory-related crashes
on import/export that were solved by streaming.** V3 must port the V1 streaming pattern, not
re-invent it. Read `v1-reference/index.html` export/import code before designing Slice 7 —
same discipline as reading the V1 audio engine before Slice 4.
**Why deferred:** Same as above.
**When:** Slice 7.
**Correction (2026-09-28):** only V1's *export* streamed. V1's *import* reads the whole file and parses it at once (`v1-reference/index.html:5795` `decompressData(...)`, `:5799` `JSON.parse(jsonStr)`) — V3 needs a genuinely piecewise import (data-backup.md D6); there is no V1 pattern to port for it.
**Source:** CLAUDE.md §iPhone/iOS memory rules, banned pattern #4; MANUAL_IPHONE_CHECKLIST.md §Section 2.

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
**Source:** V3_CONCEPT_BRIEF.md §5.1, ADR-0022, ADR-0023.

### Per-theme pad color overrides
Crimson gets a COMBO color override (rose-magenta sits next to `--blood` red — not a hard
conflict, but a missed opportunity). Verdant COMBO holds — the fairy-tale tone fits.
**When:** Slice 8 (after themes land).
**Source:** DESIGN_NOTES.md §Theme integration.

### Theme-conditional clock variants
Verdant Mushroom Clock is designed; Crimson candle-clock + Neon CRT-burn display are design
explorations (~30 min each). Worth shipping if themes get a real release pass.
**When:** Slice 8 (after themes land).
**Source:** DESIGN_NOTES.md §Theme integration.

### `is-deep` as user-configurable setting
Settings → Display → "High quality pad visuals" toggle. Currently always-on for the DepthPad.
**When:** Slice 8.
**Source:** ADR-0025, DESIGN_NOTES.md §DepthPad/pad rendering.

### Mode-awareness cues
One of four alternatives to reinforce SETUP/GAME distinction beyond the current toggle and
is-setup pad treatment. Evaluation order: (1) Atmosphere — SETUP shows grid; GAME adds
AmbientEmbers + hearth-glow (highest impact, reuses v8 infrastructure). (2) Status chip —
bold full-fill mode badge in status-bar left slot. (3) Edge tint — 2 px inset outline in
active mode colour. (4) Spine saturation — pad type-spines dim to 45% opacity in SETUP
(lowest priority; risks conflating mode and type semantics).
Ship one, optionally two if they hit different screen regions and don't compete.
**When:** Slice 8.
**Source:** DESIGN_NOTES.md §Slice 8 — Mode-awareness cues.

### Pad Appearance settings persistence
"APPLY TO ALL PADS" writes to project state system-wide, not per-pad. Per-pad override is
a separate future feature.
**When:** Slice 8.
**Source:** DESIGN_NOTES.md §Settings & system polish.

### Settings search across submenus
Typing filters all rows across all submenus, jumps to first match, highlights the term.
**When:** Slice 8.
**Source:** DESIGN_NOTES.md §Settings & system polish.

### Mode-toggle SFX preview
Settings → Controls "Mode toggle SFX" file slot: preview the chosen sound at current MASTER
volume. Reuse the pad PREVIEW button code path — no separate "test sound" feature.
**When:** Slice 8.
**Source:** DESIGN_NOTES.md §Settings & system polish.

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

Breathing aura (v8 §5) + loop-spine animation (v8 §6) — designed in `SoS_DESIGN_25052026/`,
not yet implemented. CSS animation + new `is-*` classes. On top of this design: One-Shot-Spark
(see [Design Session 2026-06-04](#design--feature-clarification-session--2026-06-04) → Parked Candidates; not yet designed).
**When:** Slice 8.

#### Grid / Layout

### Grid configurability (gridConfig popover)
Expose cols × rows in a popover. Mobile hard cap: 5×4 (no 6×4 or 6×6 in the mobile popover
— avoids "tooltip warning the user not to do the thing the UI offers").
**Why deferred:** Grid is currently hardcoded 4×4. Slice 3 decision to defer.
**When:** Slice 8.
**Source:** ADR-0032, DESIGN_NOTES.md §Slice 8 — A4 Mobile preset ceiling.

### Cell-size setting
Global preference in Settings → Display (compact / normal / spacious). Per-scene cell-size
multiplies the variation space without much real benefit.
**When:** Slice 8.
**Source:** DESIGN_NOTES.md §Slice 8 — A4 Cell-size.

### Default new-scene grid as user preference
Currently hardcoded 4×4 for every new scene. Expose an override in Settings → Display.
Then 4×4 becomes "default until you change it once."
**When:** Slice 8.
**Source:** DESIGN_NOTES.md §Slice 8 — A4 Default new-scene grid.

### Unplaced pads remember desired position
When shrinking a grid pushes pads off, they retain their wanted (col, row). Enlarging the
grid re-places them automatically if the slot is still free.
**When:** Slice 8.
**Source:** ADR-0009, DESIGN_NOTES.md §Slice 8 — A4 Unplaced pads.

### Mobile layout adaptation
Make SceneRail collapsible or overlay at narrow viewports (≤ 390 px). Make inspector panels
(PadEditorPanel, LibraryPanel) slide over the pad grid rather than pushing it, or use a
tab-based layout. Minimum viable target: pad grid center area ≥ 44 px in all three SETUP
states at 390 px.
**Why deferred:** Adaptive layout implementation per ADR-0045 (two-axis model: narrow↔wide × touch↔pointer). Slice 8 brings layout fully into the model; Axis-1 breakpoints need empirical calibration on real devices first.
**When:** Slice 8.
**Source:** DESIGN_NOTES.md §Known limitation: SETUP layout.

### Empty-SETUP affordance / placeholder
The empty-SETUP inspector placeholder ("Select a pad to edit or open the Library") was
removed in commit 402b4c2 as a side-effect of a test fix. What the empty SETUP state
should show — guidance text, a wider bare grid, or something else — is an open UX question.
Decide after real-use data is available, likely with Claude Design.
**When:** Slice 8, after real sessions.
**Source:** DESIGN_NOTES.md §Known limitation: SETUP layout.

---

### PAD Editor (Polish)

Items below are PAD Editor interaction details deferred from Slice 3/4. All target Slice 8
or a dedicated editor polish pass.

### Key Capture flow
KEY / MIDI / GAMEPAD fields enter a "listening" state (pulsing teal border, "press any key…")
on click. Escape cancels. Visual: reuse SETUP-mode hatch during the listening window.
**Source:** DESIGN_NOTES.md §PAD Editor — Key Capture flow.

### Inline conflict feedback
Live ✓/⚠ hint under KEY field as a binding is chosen — don't wait for save.
**Scope:** conflicts are checked **per deck** (formerly "scene"), not per board — keys apply per deck ([PRODUCT.md §6](docs/product/PRODUCT.md#input-keyboard--numpad) K2, 2026-09-28). Quick-access keys are board-wide (K13) and conflict with every deck.
**Source:** DESIGN_NOTES.md §PAD Editor — Inline conflict feedback.

### Snap-to-zero-crossing on waveform drag
Trim and loop markers snap to the nearest audio zero-crossing while dragging. Without it,
hard cuts produce audible clicks.
**Source:** DESIGN_NOTES.md §PAD Editor — Snap-to-zero-crossing.

### Numeric scrubbing on M:SS labels
TRIM START / TRIM END / LOOP POINT readouts: Premiere-style click-drag to nudge ±0.1 s
per pixel; hold ⇧ for ±0.01 s.
**Source:** DESIGN_NOTES.md §PAD Editor — Numeric scrubbing.

### Live preview that respects fades + trim
PREVIEW starts at trimStart with fades + loop applied. Playhead restarts at loopPoint for
LOOP-type pads so the user can hear the loop seam.
**Source:** DESIGN_NOTES.md §PAD Editor — Live preview.

### Crossfade duration as inline control
Mini-slider (60–600 ms) or numeric scrubber. Gate visibility on loop mode = CROSSFADE.
**Source:** DESIGN_NOTES.md §PAD Editor — Crossfade duration.

### Waveform zoom for long files
Zoom level (scroll wheel or ±/0 keys) + minimap strip; only relevant if files ≥ 60 s are
common in real use.
**Source:** DESIGN_NOTES.md §PAD Editor — Waveform zoom.

### Pad-type change confirmation
Switching LOOP→SINGLE invalidates loop-point and crossfade. Show inline confirm before
discarding; don't silently wipe settings.
**Source:** DESIGN_NOTES.md §PAD Editor — Pad-type change confirmation.

### Output bus inheritance hint
Faded one-line hint below OUTPUT BUS pills showing where the level baseline comes from.
**Source:** DESIGN_NOTES.md §PAD Editor — Output bus inheritance hint.

### Hotkey conflict on duplicate
⌘D conflicts with the browser "Bookmark this page" in non-standalone PWA mode. Options:
use ⌘⇧D, or accept that duplicate is right-click / long-press only when running outside
standalone mode.
**Source:** DESIGN_NOTES.md §A3 Scene CRUD open questions.

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
**Source:** DESIGN_NOTES.md §Slice 4 — C1.

### `--pad-soft-outline` token family
Colour values for the `is-scheduled` visual. Hold until `is-scheduled` is approved — adding
tokens before the state has a use makes the §A cheat-sheet noisier without solving anything.
**When:** Same as `is-scheduled`.
**Source:** DESIGN_NOTES.md §Slice 4 — C2.

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
**Source:** DESIGN_NOTES.md §Audio file management.

### Per-file fade and trim for playlist pads
Each playlist entry gets its own fade-in / trim. Either per-file state or per-file JSON in
the project file. Decision deferred until playlist UX is built.
**When:** Same as multi-file playlist UX.
**Source:** DESIGN_NOTES.md §Audio file management.

### Tag autocomplete with keyboard
Typing in the tag field surfaces matching tags from the project pool (case-insensitive, fuzzy
on substring). ↵ commits, ⌫ on empty input removes last chip. Chips render in pad-type colour
family if a semantic mapping exists.
**When:** Slice 8 or library polish pass.
**Source:** DESIGN_NOTES.md §Tags & folders.

### Folder picker as a tree
The FOLDER field opens a narrow tree column inside the inspector, not a separate dialog. New
folder via a `+ NEW` row at the bottom.
**When:** Slice 8 or library polish pass.
**Source:** DESIGN_NOTES.md §Tags & folders.

---

## Design & Feature Clarification Session — 2026-06-04

> **Beschlussstand einer Klärungssession, kein abgeschlossener Plan.** Die Feature-Liste ist
> ausdrücklich offen — Ergänzungen und Änderungen sind erwartet. Stabilere
> Richtungsentscheidungen können sich ändern, aber nur als bewusste Kursänderung mit Begründung;
> vorläufige Posten sind erwartungsgemäß in Bewegung.

---

#### Guiding principle — technically-minded tinkerers

→ moved to [docs/product/PRODUCT.md §7](docs/product/PRODUCT.md#7-design-principles) (P2, P3; 2026-09-28). Revised there: "does not hold the user's hand" replaced by "well designed for its purpose, depth for those who want it". Applications of the principle: [C10](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture).

---

#### Architecture motto — "Think big, but don't rush"

_Engineering approach, not a product principle — moves to `ARCHITECTURE.md` once it exists (ADR-0047). Open: tension between the anticipated settings hierarchy / sidebar shell and PRODUCT.md §7 P1 "minimal and functional first"._

The app is built on a deliberately chosen modular foundation — multi-level settings hierarchy, reusable building blocks such as the sidebar shell — a forward-looking anticipation of future extensibility, chosen consciously against a pure continuous-refactoring stance, with the trade-off explicitly named. This foundation is NOT set in stone: it emerges organically while practically building and testing the app, and even the underlying concept may be revised if real experience demands it. Concretely: only what the really existing cases need is implemented (the sidebar will simply be extended to the Pad Editor when that time comes); the full system is thought through in the design but NOT built on spec.

**Corollary on communication:** Complexity that is deliberately built in must stay visible — foreseeable downstream costs are named in advance. Complexity that only reveals itself later is flagged explicitly as a new realization, never quietly absorbed.

**Relationship to the tinkerer principle:** These are complementary, not competing. The tinkerer principle governs *what* to build (user control, predictable mechanics); this motto governs *how* to build it (forward-thinking architecture, incrementally, with explicit trade-offs named).
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

`SoS_DESIGN_25052026/` is the historical starting point, not a maintained living source.
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

**Axis 2 — Input type** governs additive capabilities (what you can do), WITHOUT changing the
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
**→ ADR:** [ADR-0045](docs/architecture/0045-two-axis-adaptive-model.md) · **→ Boundary:**
Axis-1 frame-layout adaptation ≠ pad-grid column reflow
(→ [ADR-0032](docs/architecture/0032-grid-4col-constant.md)).

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

| Surface | Layer 1 Resize | Layer 2 Summon | Spring-loaded | Notes |
|---------|:--------------:|:--------------:|:-------------:|-------|
| Quick-Pads _(planned)_ | ✅ | ✅ | ✅ | The design-canonical case of the full contract. |
| LibraryPanel | ✅ | ✅ | — | Coexists with existing place-mode auto-close (long-press on library row sets panel to `'empty'`). |
| Mixer _(planned, v8-atmosphere.jsx)_ | ✅ | ✅ | — | Same model as LibraryPanel. |
| PadEditorPanel | ✅ | — | — | **Resize only.** Selection-driven (opens on pad select, closes on deselect) — not summon-driven. A summon handle would have no coherent state here. Editor retains its existing selection-driven open/close logic. |
| SceneRail | — | — | — | **No layer today** — permanently present; no toggle state in the code. Contract applies only if SceneRail becomes collapsible on mobile (see [Mobile layout adaptation](#mobile-layout-adaptation)). At that point Layer 2 becomes a candidate. |

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

> Die folgenden drei Blöcke haben **unterschiedlichen Status** und dürfen nicht vermischt werden.
> A = vorgeschlagener Design-Input (nicht beschlossen), B = getroffene Beschlüsse, C = Architektur-Konflikt
> (C10 resolved 2026-06-04). Der Statusunterschied ist der Kern dieser Einträge.

---

#### A — Claude Design layout input _(gesichtet, NICHT als Beschluss übernommen)_

Diese Vorschläge kamen von Claude Design und wurden besprochen, aber **nicht als Entscheidungen
angenommen**. Sie sind Input für die kommende visuelle Ausarbeitung, die dann geprüft wird.

### A1 — Geometrie-Beobachtung und Gesten-Grammatik-Idee

Aus dem (bindenden) 4-Spalten-Grid folgt: Pads wachsen statt sich zu vermehren → das Grid wird
ein hoher vertikaler Streifen. Abgeleitete Idee (Vorschlag, nicht beschlossen): diese Geometrie
nahegelegt eine zweiachsige Gesten-Grammatik — vertikal = innerhalb einer Szene, horizontal =
zwischen Szenen. Diese Idee berührt Beschluss B8 (Swipe-to-page) und Konflikt C10 (Scroll-Bedarf).

### A2 — Drei-Band-Struktur (Vorschlag)

Grobgliederung des Screen-Layouts: oberes Band = Glanceable-Infos / selten berührt; mittleres Band
= Pad-Grid (füllt den Hauptteil); unteres Band = Daumenzone (Szenen-Switcher, Master-Controls,
Summon-Grips). Noch nicht layoutiert oder implementiert; Vorschlag für die visuelle Ausarbeitung.

### A3 — Grip-Vokabular: Rail vs. Pull-Tab _(betrifft Summonable-Overlay-Vertrag)_

Vorschlag zur visuellen Schichten-Unterscheidung des Summonable-Overlay-Vertrags
(→ [Summonable overlay contract](#summonable-overlay-contract-_pending-not-yet-finalized--refined-after-panel-fit-check_)):
**Rail** (Schiene, „schieb mich") = Resize-Basis-Schicht; **Pull-Tab** (Lasche, „ich öffne") =
Summon-Schicht. Die Frage „hat es eine Lasche?" wäre dann das visuelle Unterscheidungs-Merkmal
zwischen den Schichten. Konkrete Ausgestaltung ist Aufgabe der visuellen Ausarbeitung, nicht hier
entschieden.

### A4 — Drei-Gesten-Auflösung (Vorschlag)

Innerhalb eines Griffs: Bewegungsschwelle → Resize; unter Schwelle / Tap-Zeit → Summon-Toggle;
Hold ohne Bewegung → Momentary. Jeder Zweig bekommt eigenes Feedback. Vorschlag — die
Schwellenwerte und Feedback-Form sind nicht festgelegt.

### A5 — Adaptive Andock-Regel (Vorschlag)

Invariante: 4-Spalten-Grid, Zellen wachsen mit Viewport-Größe. Variable: Andock-Kante rotiert
nach Formfaktor — schmal/Hochformat = Bottom-Sheets, breit/Querformat = Side-Rail. Idee für
die Layout-Ausarbeitung, nicht beschlossen.
**Framing-Korrektur (2026-06-04):** Die Regel ist screen-format-getrieben (Axis 1), nicht
geräte- oder eingabetyp-getrieben — die ursprüngliche "Phone/Tablet"-Formulierung war ein
Kurzname für "schmal/breit", nicht das eigentliche Kriterium.
→ [Two-axis adaptive model](#two-axis-adaptive-model).

### A6 — Screen-Skizzen (Vorschlag)

Vier Skizzen zu Modi-Zuständen: **Play** (Grid im Vordergrund, Szenen-Switcher unten,
spring-loaded Quick-Pads); **Setup** (deutlicher Mode-Shift, Tap → Editor, Drag → Reorder);
**Library** (beide Grip-Schichten sichtbar); **Editor** (nur Resize-Schicht). Noch keine
konkreten Maße oder Pixel-Entscheidungen — Orientierungsbilder für die visuelle Ausarbeitung.

---

#### B — Getroffene Beschlüsse

Diese Punkte sind vom User entschieden, nicht nur vorgeschlagen.

### B7 — PadEditor-Schließen = Variante B (expliziter Close-Button)

**Beschluss:** Der PadEditorPanel wird durch einen expliziten Close-Button geschlossen. Resize
ändert **strikt nur die Größe** — er kann den Editor nie schließen. Keine Summon-Schicht, keine
Wegzieh-Geste. Vorgabe: Close-Button ist in allen Resize-Zuständen erreichbar (sichtbare
Mindestgröße des Panels existiert).
Dieser Beschluss ist konsistent mit dem Summonable-Overlay-Vertrag (PadEditor = Layer 1 only,
selektions-getrieben; → [Summonable overlay contract](#summonable-overlay-contract-_pending-not-yet-finalized--refined-after-panel-fit-check_)).

### B8 — Szenenwechsel-Mechanismus: Tap-Switcher primär, Swipe optional und GAME-only

→ moved to [docs/product/PRODUCT.md §3](docs/product/PRODUCT.md#3-app-modes-game-and-setup) (2026-09-28). Revised there: swiping between decks (formerly "scenes") is now **Parked**; decks switch via classic controls only.

### B9 — Gap-Einordnung: drei Bestätigungen, zwei neue Kandidaten

Claude Designs fünf geflagte Gaps wurden eingeordnet:

**Drei Bestätigungen bekannter Punkte (nicht neu):**
- **Cross-scene active sounds** = das Slice-5-Audio-Kontroll-Problem. Claude Designs konkrete Form:
  Top-Band mit Quick-Stop-Chips (≈ frühere Option B).
  → [Audio continues during scene switch](#audio-continues-during-scene-switch-_confirmed-correct--slice-5_).
- **Panic/Fade-all** = bestehender Quick-Win (`fadeOutAll()` fertig). Neuer Zusatz: Auslösung
  gegen versehentliches Aktivieren sichern („guarded").
  → [PANIC / fade-all button](#panic--fade-all-button).
- **Unmissverständliches Mode-Signal** = v25-Mode-awareness + Stage-Lock-Kandidat.
  → [Stage Lock](#stage-lock).

**Zwei wirklich neue Kandidaten (in den Kandidaten-Pool aufgenommen):**
- **Audition vs. live output:** Vorhören eines Sounds darf nicht in den Raum hörbar sein — braucht
  getrenntes Audio-Routing plus visuelle Unterscheidung (Kopfhörer-Icon o.ä.). Neu; noch kein
  Design, keine Implementierung.
- **Überlauf-/Scroll-Frage:** Unbegrenzte Pad-Zahl pro Szene vs. nicht scrollendes Grid. Dieser
  Punkt hat sich zu einem Architektur-Konflikt ausgeweitet → vollständig in C10 dokumentiert.

---

#### C — Architektur-Konflikt _(C10: concept resolved 2026-06-04; implementation pending Slice 8)_

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
**Cross-references:** Settings architecture (point 8) → full model in [2e — Multi-level settings hierarchy](#2e--multi-level-settings-hierarchy); display setting scope per surface → [2c — Modular display controls](#2c--modular-display-controls); quick-access/quick-menu display consistency → [Quick-Access content deferred](#quick-access-content-deferred-_pending-real-scene-experience_) and [B9](#b9--gap-einordnung-drei-bestätigungen-zwei-neue-kandidaten).

---

#### Code-check + architecture extension — 2026-06-04 (Library, sidebar, settings hierarchy)

> Follows the resolution of C10. A code-check verified C10's "assumption to verify" (generic display class across surfaces). The result reversed the assumption and anchored three architecture decisions. **Status labels:** _settled_ = user decision; _working assumption_ = to be reviewed on the real object; _verified finding_ = code/analysis evidence.

---

### 2a — Library display logic

_Verified finding — code-check 2026-06-04_

**Finding:** The Library is structurally **different** from the pad grid — categorically, not by degree. Same kind of difference as PadEditorPanel vs. the main grid in the grip-contract analysis.

| Surface | Structure | CSS layout |
|---------|-----------|------------|
| Pad grid | 2D tile matrix — `cols × rows` cells, each `1fr × 1fr`, position-addressed via `{col, row}` | `display:grid; grid-template-columns: repeat(var(--grid-cols), 1fr)` driven by `Scene.gridConfig` |
| Library today | Single-column list of horizontal table rows | `.sb-item-list`: `flex-direction:column`. `.sb-audio-row`: `display:grid; grid-template-columns: 160px 1fr 70px 90px 44px` (name \| waveform \| duration \| size \| delete) |
| Library panel | Single-column item list with row-separator border-bottom | `.sb-lib-panel-row`: `flex-direction:column`, name + waveform per row |

**Of the four configurable display settings, only font/label size is genuinely generic across both surfaces:**

| Setting | Pad grid | Library applicability |
|---------|----------|-----------------------|
| Column count / mode | Number of tile columns in the 2D grid — core structural parameter | Meaningless — Library has one content column; no tile matrix |
| Pad size | Per-tile dimensions | No equivalent — Library rows have `min-height: 44px`, not tile size |
| Gap | Space between tiles | Different concept — Library uses row spacing (`gap: var(--space-1)`, hardcoded); "row density" would be plausible but is a distinct setting |
| Font/label size | Text size inside pad tiles | **Genuinely generic** — text appears in both surfaces; both benefit equally |

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

The sidebar IS a summonable panel from the overlay contract: bottom-sheet on narrow/portrait-format screens, side-rail on wide/landscape-format screens (Axis-1, screen-format-driven — not device-type or input-type driven; → [ADR-0045](docs/architecture/0045-two-axis-adaptive-model.md)). Every sidebar instance has Layer 2 (Summon + Resize). **→ Cross-reference:** [Summonable overlay contract](#summonable-overlay-contract-_pending-not-yet-finalized--refined-after-panel-fit-check_) — the sidebar and the overlay contract describe the same mechanism from two angles: behavior (contract: layers, gestures, grip types) vs. structural reusability (this entry: generic shell, content injection per window).

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

→ superseded by the Lock in [docs/product/PRODUCT.md §3](docs/product/PRODUCT.md#3-app-modes-game-and-setup) (2026-09-28): GAME has no edit gestures, so locking the mode switch covers this.

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
**Overarching principle:** → moved to [docs/product/PRODUCT.md §7](docs/product/PRODUCT.md#7-design-principles) (P3, P4; 2026-09-28).

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

Designed in `SoS_DESIGN_25052026/` (v8 §5–§6), not yet implemented:
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

The SETUP live-preview sheet must not cover the grid it previews. On a phone, a bottom-sheet holding size/gap/columns/font controls covers 40–50% of the grid — you'd tune columns while seeing only the top rows reflow. **Resolution:** while a control is actively being dragged, the sheet collapses to a single thin strip (just that control + its live value) so the grid is almost fully visible during the moment that matters; release → sheet returns. The SETUP sidebar is a partial sheet (grid visible behind) that further shrinks during active tuning.
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

In **SETUP mode**, empty slots are visible, tappable cells: tapping an empty slot creates a pad there, exactly as the existing "Add PAD" button does — reusing the existing pad-creation mechanism, with the empty cell itself as the new trigger location. In **GAME mode**, an empty slot is simply empty space (not rendered as a cell). This makes "deliberately leaving a gap" well-defined: a gap is an unfilled slot; you fill it by tapping it.
**→ Cross-reference:** [C10 point 3](#c10--variable-grid-gap-preserving-reflow-gesture-based-scroll-protection-settings-architecture) (free placement with gaps allowed — this decision gives gaps their creation mechanic).

### D2 — Swipe and mode-switch are two different interactions _(settled decision — consolidates B8)_

→ moved to [docs/product/PRODUCT.md §3](docs/product/PRODUCT.md#3-app-modes-game-and-setup) (2026-09-28). Revised there: swiping between decks (formerly "scenes") is now **Parked**.

---

#### Feature candidates _(parked — NOT to be built; each needs an explicit go-ahead; "think big, don't rush")_

These are ideas, each with a stated relation to already-decided things and a condition under which it would become relevant. **Do not build any of these without an explicit decision.**

### Performance Lock _(parked candidate — strong candidate, phone-specific)_

→ moved to [docs/product/PRODUCT.md §3](docs/product/PRODUCT.md#3-app-modes-game-and-setup) (2026-09-28), now **Decided** in simplified form (lock toggle in GAME, locks the mode switch only).

### Haptic gesture feedback _(parked candidate — verify iOS availability first)_

A distinct buzz on pickup-engage (fill-ring completes) and on fire; expresses "make gesture states feel natural" through touch.
**CRITICAL CAVEAT:** The web Vibration API is historically **NOT** supported on iOS Safari — since the primary target is iPhone + Brave, verify availability on the real device before considering this further (measure, don't guess). May be technically unavailable on the target.
**Build when:** iOS/Brave Vibration API availability confirmed on the real device AND a friction point in real use supports it.
**→ [Parked candidates](#parked-candidates-_not-committed-each-has-a-stated-problem-it-would-solve_).**

### Hold-to-audition in SETUP _(dropped idea — explicitly excluded for now)_

**Status: DROPPED.** The user knows their own sounds; auditioning solves a non-problem for this audience. Recorded as a conceptual idea only; not a deferred feature.
Two notes if ever revisited: (i) it would collide with the decided SETUP long-press (= pick up pad) and would need a different gesture or location; (ii) it overlaps the Pad Editor preview scope and the audition-vs-live-output routing question.
**→ Relation to existing:** [B9 — audition-vs-live-output candidate](#b9--gap-einordnung-drei-bestätigungen-zwei-neue-kandidaten) (B9-d is a separate concern about audio routing — dropping hold-to-audition does not close B9-d) · [Long-Press-Peek](#long-press-peek) (the only remaining long-press candidate in SETUP; its coexistence question is already documented there).

### Named display presets _(parked candidate — low priority)_

A recallable saved combo of size/gap/columns/font. **Reframed:** this is an EXTENSION of the existing default concept (one default per element-type → multiple named ones), NOT a new feature — it belongs with the multi-level settings hierarchy and deferred Display-Settings work. The most likely use case (different devices) may already be covered by per-device-separate settings already decided. Additionally: with per-surface settings, a preset would need to clarify whether it's per-surface or cross-surface.
**Build when:** a real need to switch between configurations on the same device is demonstrated.
**→ Cross-reference:** [2e — Multi-level settings hierarchy](#2e--multi-level-settings-hierarchy) (this would be an extension of the default/individual model, not a standalone feature).

---

#### Confirmed _(already-decided; re-affirmed in this session)_

### Atmosphere stays provisional _(confirmed)_

Hearth-glow/embers atmosphere is architected as a toggleable layer the mode distinction does NOT depend on; evaluated separately (incl. performance). The settled mode cues (gold↔teal, pad-face, bottom-band swap) carry mode on their own. Removing atmosphere must cost nothing on legibility.
**→ Cross-reference:** [Mode-awareness cues (Slice 8)](#mode-awareness-cues) · [Color-independent mode legibility](#color-independent-mode-legibility-_settled-refinement_) above.

### Fill-ring: scroll always wins _(confirmed)_

Fill-ring on long-hold is kept. Any movement past the scroll threshold cancels the ring instantly — scroll intent always wins over pickup. This is the LibraryPanel-pattern applied to pad pickup in SETUP.

### Grip options: three treatments, pending visual decision _(confirmed — review pending)_

Claude Design will show THREE treatments side-by-side: **A** (protrude+color), **B** (pictographic flush), **C** (raised vs. recessed) — each on phone bottom-seam AND tablet vertical-seam, in active AND dimmed states (dimmed is the real test). Winner propagates everywhere.
**Status:** No decision yet — options to be reviewed.
**→ Cross-reference:** [Summonable overlay contract](#summonable-overlay-contract-_pending-not-yet-finalized--refined-after-panel-fit-check_) (the grip is the visual face of the contract's seam handle) · [A3 — Grip-Vokabular: Rail vs. Pull-Tab](#a3--grip-vokabular-rail-vs-pull-tab-_betrifft-summonable-overlay-vertrag_).

---

## 2. Documentation Debt

### Documentation consolidation (ADR-0047) ⬜ In progress (started 2026-09-28)
Consolidate the scattered documentation into hub / leaf / template per area —
see [ADR-0047](docs/architecture/0047-documentation-architecture.md). Incremental; old
documents stay authoritative until their content is transferred and confirmed.
**Phases:**
1. ⬜ `docs/product/PRODUCT.md` — skeleton ✅ (2026-09-28); fill sections in dialogue with the user.
2. ⬜ `docs/design/DESIGN.md` hub + component specs for the elements the mobile Board layout needs.
3. ⬜ Build the mobile Board layout (product work — not documentation).
4. ⬜ Further component specs as elements are touched; `ARCHITECTURE.md` + `DEVELOPMENT.md` hubs.
5. ⬜ Slim `CLAUDE.md`, re-point `sync:classes` / `sync:tokens` generators (scripts, hook, CI),
   move superseded documents to `docs/archive/`, reduce `BACKLOG.md` to open work.
**Source:** Session 2026-09-28.

### DESIGN_SYSTEM.md §1–§5 write out
Sections §1–§5 currently exist but are stubs or placeholder content. Need to be filled with
actual system documentation.
**When:** As design documentation catch-up, likely before Slice 8.
**Source:** Referenced in multiple sessions as "not yet written."

### DESIGN_SYSTEM.md §5 — inset box-shadow exception undocumented
`§5 Verbotene Muster` says `box-shadow auf clip-path-Elementen (stattdessen filter: drop-shadow())`.
This covers outer box-shadow only. Inset `box-shadow` renders inside the padding box, within the
clip region, and therefore remains visible on clip-path elements — it is explicitly allowed. See
v15 treatments D/F and the hot-pad inner glow as canonical examples. The nuance was recorded in
DESIGN_NOTES.md (Drop-shadow vs Inset shadow RESOLVED entry), but the §8.8 where it was supposed
to land was never written. Current §5 reads as "no box-shadow at all on clip-path elements",
which is incorrect.
Fix: add one sentence to §5: "Inset `box-shadow` is explicitly allowed — it renders inside the
padding box, within the clip region, and therefore remains visible on clip-path elements."
**When:** Next DESIGN_SYSTEM.md write-out pass (Documentation Debt §1).
**Source:** DESIGN_NOTES.md Drop-shadow vs Inset shadow RESOLVED; FOUNDATION_ANALYSIS.md C8.

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
  Wrapper div removed from TopBarV2.tsx.)
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
Decided 2026-09-28 ([PRODUCT.md §5 Pads](docs/product/PRODUCT.md#pads)): three pad types — Single, Loop, Combo. Loop and Single accept several files (Loop: in order / shuffle; Single: random / in turn). Requires an ADR superseding the `PadType` part of ADR-0042, a migration of stored `playlist` pads, and engine/editor changes (engine change needs explicit approval).
**When:** Slice 9 (data model), together with the board pad pool below.

### Theme flames: Verdant, Neon, Crimson
Parked 2026-09-29. `SoS_DESIGN_28092026/Design_Soundboard_of_Storytelling/Flammen.html` designs four flame personalities (Hearth, Verdant, Neon, Crimson) on one canvas engine. Hearth's freeze/thaw is in the StartScreen flame (hybrid, `docs/design/imports/animated-flame.md`); the other three belong to the themes.
**When:** Slice 14 (settings & polish, themes).

### Settings: reduce motion (animated flame and other animations)
Parked 2026-09-29. The StartScreen flame animates continuously on purpose — users are meant to tap it and freeze it for fun; it does not honour `prefers-reduced-motion`. A Settings option to reduce or stop animations comes with the Settings screen. Record: `docs/design/imports/animated-flame.md`.
**When:** Slice 14 (settings & polish).

### Board pad pool (data model)
Decided 2026-09-28 ([PRODUCT.md §5](docs/product/PRODUCT.md#board-decks--quick-access)): pads belong to the board; decks (formerly "scenes") and the quick-access bar reference pads with their own position and key; "All pads" view; `PadSet` dropped. Today `Scene.pads: Pad[]` owns pads and `position` / `hotkey` sit on the pad (`types.ts`).
Requires an ADR (superseding the ownership parts of the current model) and a data migration. **Same change: rename Scene → Deck** in UI, code (`Scene`, `Board.scenes`, `SceneRail`, …) and stored data (PRODUCT.md Q1, 2026-09-28). **Do together with the Playlist → Loop merge above** — both reshape `types.ts` and stored boards.
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
**Source:** DESIGN_NOTES.md §A3 Scene CRUD; SceneRail.tsx.

### Scene rename: duplicate names ✅ Done (f69cba6, 1dda987)
**Decision:** Duplicate scene names should be prevented. The name-is-display-only argument was
considered; uniqueness was chosen to avoid user confusion.
**Code state:** Implemented. `findConflictingScene()` (`src/lib/sceneConflict.ts`; trimmed,
case-insensitive, self-excluding; 9 unit tests) drives a live conflict check on input in
`SceneRail.tsx`. `commitRename()` blocks on conflict: Enter keeps the editor open, blur
discards the edit. Conflict display via `is-conflict` + "Name already used by …" hint.
*(Entry updated 2026-09-28: previously listed as code task pending.)*
**Source:** DESIGN_NOTES.md §A3 Scene CRUD; user decision 2026-06-06.

### Scene mobile reorder: stepwise vs. handle-based
No scene reorder mechanism exists in the code — `SceneRail.tsx` has no stepwise Move up/Down
and no drag handle, and no reorder setter exists in `state/store.ts`. The file-header comment
"Reorder (drag handle, pointer-events based)" is a planned-feature note, not shipped code.
Implement stepwise Move up/Down first (recommended); evaluate a handle-based reorder mode for
power users (≥6 scenes) later, based on real use once it exists.
**Source:** DESIGN_NOTES.md §A3 Scene CRUD.
*(Entry corrected 2026-06-10: previously claimed stepwise reorder shipped in Slice 3.)*

### Long-press threshold (350 ms)
Fixed-with-accessibility-override is the cleanest. Or expose in Settings → Controls. Decide
in Slice 8 based on real-use feedback.
**Source:** DESIGN_NOTES.md §A3 Scene CRUD.

### `--success` green: keep teal alias or migrate to real green?
`--success: #6DB5B8` is aliased to loop teal. `--fade: #6FA85F` introduced a real green for
the first time. If the palette warms up to greens, reconsider `--success`. Hold until one or
two design sessions with `--fade` in context.
**Source:** DESIGN_NOTES.md §Open token/palette questions.

### A2 Path B: 5–10 s audio zone
Pad-type inference defaults to SINGLE in the ambiguous 5–10 s band. Re-evaluate if real audio
sets show many sub-loops in this zone.
**Source:** DESIGN_NOTES.md §Slice 3 — A2 Path B.

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
**Source:** Truth-check commit `e207a0b`; class marked `[unused-css]` in DESIGN_SYSTEM.md §6.

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

### Bug: combo "stop all" step stops the combo itself
Found 2026-09-29 by the T4 characterization tests. A combo step with `stopAll` calls
`stopAllInternal()` (`v3/src/audio/engine.ts:600-603`), which also stops the running combo
(`engine.ts:370-372`) — the next step never runs. V1 excluded the running combo (V1 changelog
v163). Impact: the owner's V1 "DAY" combo (stop all → rooster) would never play the rooster.
Pinned by `tests/unit/audio/engine.test.ts` (`test.fails` + a precise current-behaviour test).
**Fix = engine change → only under product-owner control (ADR-0048 §4).**
**When:** decided by the product owner — with Slice 9d (engine step) at the latest, before the
V1 import (Slice 10) makes real combos usable.

### Major dependency updates (one at a time)
Pending since 2026-08 (Dependabot PR #15, which failed CI because they were bundled):
TypeScript 6.0.3 → 7.0.2 (largest — own plan), jsdom 29 → 30, size-limit / @size-limit/file 12 → 13,
@types/node 24 → 26. Each gets its own step with plan, approval and the full pipeline;
with the new Dependabot grouping each arrives as a separate PR.

### Library audio as Blob — Safari Private Browsing (open question)
Found 2026-09-29 (T6): WebKit in an ephemeral context (Playwright; technically like Safari
Private Browsing) cannot store **Blobs** in IndexedDB — ArrayBuffers work. V3 stores library
audio as a Blob (`LibraryItem.blob`); V1 stored an ArrayBuffer (`entry.buf`). Likely effect: in
Private Browsing on iPhone, uploads fail with "could not save to library" (caught, no crash).
Trade-off before changing anything: a Blob is a lazy handle; an ArrayBuffer is fully
deserialized whenever the record is read — `libGetAllMeta` reads every record with a cursor,
which touches the iOS memory rules. **Open** — verify on a real iPhone (normal + private tab)
first (docs/MANUAL_IPHONE_CHECKLIST.md), then decide with the product owner.

### Test infrastructure — before Slice 9c (CLAUDE.md rule 15)
Decided 2026-09-29 after a test-setup analysis. Order is binding; Slice 9c/9d wait for it.

| Step | Content | Status |
|---|---|---|
| T1 | Guard test for E2E project membership, test port 5199, Node 24 (`.nvmrc`), visual tests in pre-push, flaky tests fail CI, TESTING.md updated | ✅ Done (60a0f0c) |
| T2 | Unit tests for the serial upload pipeline (`upload.ts`, iOS memory rule) | ✅ Done (see git log: "test: upload pipeline unit tests (T2)") |
| T3 | Skipped drag-and-drop E2E tests: found to be never-written TODO stubs, not flaky. Pad swap/insert + library drag written, counter-checked, 20× stable; deck reorder quarantined — feature not built | ✅ Done (see git log: "test: drag-and-drop E2E tests written…(T3)") |
| T4 | Characterization tests for the audio engine (dispatch, single/loop/playlist, stop/fade, combo, decode dedupe, bridge); `src/audio` in coverage (engine 75 %). Found a real engine bug (below) | ✅ Done (see git log: "test: audio engine characterization tests (T4)") |
| T10 | Lint rules against test traps (expect-expect, no-focused, no-skipped incl. fixme, valid-expect) for Vitest + Playwright; Playwright `forbidOnly`; counter-checked (10 lint errors + forbidOnly abort on planted traps) | ✅ Done (see git log: "test: lock test traps…(T10)") |
| T5 | E2E against the production build (vite preview): smoke + full + new PWA tests (service worker, manifest, offline start, offline data) — in CI (job e2e-prod) and in pre-push; counter-checked (no SW registration → 3 PWA tests red) | ✅ Done (see git log: "test: E2E against the production build…(T5)") |
| T6 | full-webkit project (board/deck/pad CRUD + drag & drop in the Safari engine; library seeded, playback stays Chromium); coverage floor in CI (69/71/61/67) — both counter-checked | ✅ Done (see git log: "test: full E2E subset in WebKit + coverage floor (T6)") |
| T7 | Guards in `testGuards.test.ts`: every logic module has a test file (4 justified exemptions; nanoid got a real test); every skip/fixme/todo/fails marker references an existing BACKLOG heading (found and fixed 3 missing/wrong references). TESTING.md test inventory generated (`sync:tests`, part of `sync:docs`, pre-commit + CI). Slice-completion checklist: test review. All counter-checked | ✅ Done (see git log: "test: guards for module tests…(T7)") |
| T8a | Security: `npm audit` 15 findings (9 high, 5 moderate, 1 low — all dev tooling incl. vite/rolldown, which build the shipped bundle) → 0 via `npm audit fix` + vitest trio 4.1.7 → 4.1.11 (GHSA-82fw-gwwq-j7x9); no major jumps, no runtime deps changed; full pipeline green, no visual change. Dependabot: minor/patch grouped, majors as separate PRs | ✅ Done (a349d79) |
| T8b | `npm audit --audit-level=high` blocking in CI (unit-build-lint) and pre-push; `scripts/*.ts` type-checked (`scripts/tsconfig.json`, `npm run typecheck:scripts`) in pre-commit and CI. Both counter-checked: planted `lodash@4.17.20` → audit exit 1; planted type error in a generator → exit 2. Linting `scripts/` is not included (the ESLint config covers `v3/` only) — later, together with T11 | ✅ Done (see git log: "…(T8b)") |
| T8c | Weekly scheduled CI run on main: full test suite, `npm audit`, `npm outdated` report, warn about Dependabot PRs older than 14 days | open |
| T8d | Deploy the **tested** build artifact instead of rebuilding in deploy-pages.yml. Together with the GitHub Actions updates (Dependabot, open): #17 checkout 4→7, #18 setup-node 4→7, #2 upload-artifact 4→7, #3 upload-pages-artifact 3→5, #6 deploy-pages 4→5 (#1/#4 were superseded by #17/#18). CI already warns: checkout@v4/setup-node@v4 run on the deprecated Node 20 | open |
| T8e | Close the stale Dependabot PRs #15 (failing since 2026-08-03) and #16 — owner's go-ahead given; Dependabot recreated them with the new grouping (#19 dev-minor-patch, #20 prod-minor-patch ✅ green, #21–#28 majors). **Follow-up:** #19 is red only in `format:check` — Prettier 3.9.9 reformats `src/lib/libDnd.ts`; merge #19 together with that one-file reformat | ✅ Done (closed 2026-09-29) |
| T9 | GitHub settings by the owner: secret scanning + push protection, Dependabot alerts (instructions from Claude) | open |

### Re-enable mobile layout tests
`mobile-touch-targets.spec.ts` and `mobile-overflow.spec.ts` have FIXME markers because the
desktop-first layout fails them at 390 px (layout geometry is broken by design until Slice 8).
Re-enable once the Slice 8 mobile adaptation is in place.
**When:** Slice 8 completion.
**Source:** CLAUDE.md commit notes a37dd26, DESIGN_NOTES.md §Known limitation.

### Re-enable DnD E2E tests
Tests 9, 14, 20, 21 in `pad-dnd.spec.ts` are `test.skip` (Scene reorder, Library drag Path B,
Pad SWAP, Pad INSERT). Need a stable Pointer Events drag sequence in Playwright.
**When:** When a reliable `dragByPointer()` helper is established in Playwright (Phase 3).
**Source:** TESTING.md §Bekannte Fallstricke #5.

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
**Source:** TESTING.md §CI-Integration; empirical measure.

### Cheatsheet state-vocab quick-ref: consider generating from §3 (drift risk)
`DESIGN_SYSTEM_CHEATSHEET.md` §state vocab is a hand-maintained 13-entry subset of the
authoritative §3 table in `DESIGN_SYSTEM.md`. Every general-purpose `is-*` addition must
be manually synced to the Cheatsheet (as done for `is-conflict`). Consider generating this
quick-ref from §3 instead — eliminates the drift risk entirely.
**When:** Before the first general-purpose `is-*` class is missed from the Cheatsheet.
**Source:** FOUNDATION_ANALYSIS.md §6 coupling map; observed during `is-conflict` registration (2026-06-15).

### I18n infrastructure
Structure code so a future i18n pass is feasible (texts in named constants, not hardcoded in
JSX). Currently English-only; no timeline.
**When:** Only if a localisation need is confirmed.
**Source:** V3_CONCEPT_BRIEF.md §4.11, ADR-0041.

### Reduced-motion fallback for ModeToggle — resolved, cleanup pending
The `sb-mode-toggle-flash` class is CSS-defined as a brightness-flash fallback for users
with `prefers-reduced-motion: reduce`, but `ModeToggle.tsx` skips the animation entirely
rather than applying the fallback class. Behavior is correct (no animation = honoring
reduced-motion), but the CSS rule for `.sb-mode-toggle-flash` is confirmed dead code.

**Action:** Remove `.sb-mode-toggle-flash` from `v3/src/styles/tokens.css` when next
touching that file (e.g., during Slice 8 polish).
**When:** Slice 8, or opportunistically when tokens.css is edited.
**Source:** Truth-check commit `e207a0b`; class marked `[unused-css]` in DESIGN_SYSTEM.md §6.

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

**2. @layout-primitive CSS tagging** (referenced in `DESIGN_SYSTEM.md §5a` process note):
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
- Define the role of every design doc locus: `DESIGN_SYSTEM.md`, `DESIGN_SYSTEM_CHEATSHEET.md`,
  `SoS_DESIGN_25052026/` (jsx files + tokens.css), `Responsive_Strategy_V3.html`,
  `DESIGN_NOTES.md`. Each must have a one-sentence "this is for X, source of truth for Y"
  definition.
- Resolve the `tokens.css` duplication: `SoS_DESIGN_25052026/tokens.css` vs.
  `v3/src/styles/tokens.css`. Pick one of three options deliberately: (a) both stay with
  explicit headers explaining the split, (b) design snapshot moves to an archive location,
  (c) design snapshot is removed entirely.
- Define explicitly where workflow rules for code conventions live (so Session 1 knows where
  to write the new class-vs-inline rule).
- Expand the planned scope of `DESIGN_SYSTEM.md §1` from "Nomenclature (CSS)" to
  "Naming Conventions (project-wide)" — covering CSS classes, tokens, components/files,
  signals, ADRs, `data-testid`, etc. Include a TODO checklist of these sub-topics inside
  the §1 placeholder.
- Add a header note to `DESIGN_SYSTEM.md` at the top defining its hierarchy ("source of
  truth; cheatsheet is the short form; conflicts → this file wins").
- Add a header note to `DESIGN_SYSTEM_CHEATSHEET.md` referencing back to `DESIGN_SYSTEM.md`
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
   - **Path A:** Use an existing `sb-*` class from `DESIGN_SYSTEM.md §6` whenever one fits.
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
   BACKLOG.md hasn't been touched in a while despite ongoing commits — e.g. "Last BACKLOG
   edit was N commits ago; consider updating." This is a reminder to reflect, NOT automatic
   item-closing (semantic completion can't be reliably automated). Same mechanism family as
   the sync:classes warning. Tune the threshold (commit count or days) during implementation.
   **Source:** Conversation 2026-05-29 — discussed alongside "should the backlog auto-update?"

5. **Fix `sync:tokens` source — read from canonical file, verify all generators consistent:**
   `sync:tokens` currently reads from `SoS_DESIGN_25052026/tokens.css` (the design handoff
   origin, now explicitly marked non-canonical). As a result, `DESIGN_SYSTEM.md §A` — which
   should be the source of truth — is generated from the wrong file: it is missing 9 tokens
   added during V3 development (`--flame-soft`, `--flame-aura`, `--grid-cols/gap/rows`,
   `--spark-duration/dx/dy`, `--undo-duration`) and still lists `--pix-bg-layer` which was
   removed. This is exactly the class of documentation drift Session 0 was designed to
   surface — one layer deeper into tooling.

   **Concrete fix:** Change `scripts/sync-tokens-inventory.ts` to read from
   `v3/src/styles/tokens.css` instead of `SoS_DESIGN_25052026/tokens.css`. Regenerate §A —
   should show 9 new tokens and correctly exclude `--pix-bg-layer`.

   **Broader verification (do at the same time):** Confirm that all `sync:*` generators read
   from the same canonical source. `sync:classes` reads from `v3/src/styles/tokens.css`
   (confirmed — `@inventory` comments live there and §6 reflects them correctly). The question
   to answer: are all three generators (`sync:adr`, `sync:classes`, `sync:tokens`) consistent
   in their canonical source, or is `sync:tokens` the only outlier? Report in the commit
   message.
   **Source:** Session 0 diff analysis, 2026-05-29.

**Alignment note (pre-work for Session 1):** Before writing the new class-vs-inline rule in
CLAUDE.md, verify that `DESIGN_SYSTEM_CHEATSHEET.md`'s decision tree (specifically the
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

| Class | CSS | Purpose |
|-------|-----|---------|
| `sb-row` | `display: flex; align-items: center; gap: var(--space-2)` | horizontal flex row, 8px gap |
| `sb-row-sm` | `display: flex; align-items: center; gap: var(--space-1)` | horizontal flex row, 4px gap |
| `sb-flex-1` | `flex: 1` | flex-fill spacer |
| `sb-row-wrap` | `display: flex; flex-wrap: wrap; gap: var(--space-1)` | wrapping flex row |
| `sb-row-fill` | `display: flex; flex: 1; align-items: center; justify-content: center` | fill + centered row |

**Gap normalization:** `gap: 6` (5 blocks across the codebase) → `var(--space-2)` (8px).
The token scale is deliberately coarse; 2px difference is visually imperceptible.
If any block renders noticeably wrong after normalization, report before committing.

---

#### Sub-session Plan

Violation counts are **post-3a** (after 3a removes the 13 pure-layout blocks).  
DoD for each file session: `audit:inline-styles` → 0 violations for that file.

| Session | Files | violations (post-3a) | d-w-s | unclassified | DoD |
|---------|-------|----------------------|-------|--------------|-----|
| **3a** ✅ Done | All files — pure-layout only; create 5 primitives (+sb-hidden) | 12 of 13 fully resolved; 1 residual (see note) | 0 | 0 | audit → 1 pure-layout (BoardListScreen:237 `flexShrink:0` residual, assigned to 3f — roadmap prediction of "reclassify as d-w-s" was wrong, it stays pure-layout); 6 new classes (+5 primitives +sb-hidden); 63 total in §6 |
| **3b** ✅ Done (172c695) | `PadEditorPanel.tsx` | 23 | 4 | 0 | 0 violations, 0 d-w-s. 22 new classes (§6: 63→85). 11 flagged for 3d Path A. 3 Sorte-2 bets (see note below). sb-range-input: native `<input type="range">`, distinct from sb-slider custom div-track, 3 DOM renders — confirmed ≥2 uses. |
| **3c** ✅ Done (24b6977) | `LibraryScreen.tsx` | 20 | 3 | 0 | 0 violations, 0 d-w-s. 19 new classes + 2 existing-class fixes (sb-tab button resets, sb-search-input 11px→var(--fs-xs) drift). §6: 85→104. Path A rate 5% (expected: LibraryScreen structurally distinct from PadEditorPanel). 0 Sorte-2 bets from 3b resolved. 8 Sorte-2 bets created for 3g/3e (see note below). sb-col added as new layout primitive. |
| **3d** ✅ Done (4210405) | `PadCreationPopover.tsx` | 15 | 6 | 0 | 0 violations, 0 d-w-s. 8 new classes (sb-source-tabs, sb-tab-sm, sb-scroll-fill, sb-creation-popover-actions, sb-btn-muted, sb-sheet-header, sb-creation-popover-backdrop, sb-source-item). §6: 104→112. Resolution: 3 delete / 1 compose / 3 path-A unchanged / 4 path-A updated / 1 modifier / 9 new-class entries = 8 unique new classes. Reuse rate 45% (5/11 of 3b's flagged classes; leaf-level classes generalize, container-structure classes are component-specific — no re-planning of 3e–3h). 3b bet sb-type-btn WON. Plan deviation: planned sb-btn-sm min-height:36px rejected at spot-check — sb-btn-sm is used across 9 files including navigation buttons; 44px iOS touch-target floor via global rule is correct there. §4 Dead CSS sb-creation-popover-section resolved. |
| **3e** ✅ Done (96ae78d) | `StartScreen.tsx` | 19 | 0 | 0 | 0 violations, 0 d-w-s. 18 new classes (sb-overlay family, sb-changelog family, sb-flame-icon, sb-start-* family, sb-btn-unlock, sb-version-link). §6: 112→130. Resolution: 1 Path A / 1 A+B / 1 0+B / 1 Primitiv+B / 15 new-class = 19. Reuse rate 10.5% — StartScreen is a centered splash with no tab bar and no empty state; all 3c bets (sb-screen, sb-screen-empty, sb-tab-bar) FAILED (inapplicable — not promoted, not cleaned up — each is still in active use on its own screen). Token normalization: 10 off-token values aligned (all ≤4px drift). New Sorte-2 bets for 3e (Verfallsbedingung: Slice 8): sb-overlay, sb-overlay-header, sb-overlay-body flagged for promotion if settings/future overlays appear. Changelog-family classes (sb-changelog-*) to demote if changelog component is removed. Opportunistic 3b-bet test: sb-panel-title evaluated against ChangelogOverlay's "CHANGELOG" heading — rejected (sb-panel-title is font-mono/fs-xs/flex:1; overlay title needs font-ui/fs-lg). Does not change sb-panel-title's bet status: its declared target is 3g (LibraryPanel), not 3e; this was a side test only — status remains PENDING. |
| **3f** ✅ Done (b46fb44) | `BoardScreen.tsx` + `BoardListScreen.tsx` | 31 (BS: 17, BLS: 14) | 1 (BLS:161 d-w-s → sb-board-row) | 0 | 0 violations, 0 d-w-s. §6: 130→145 (+15 new sb-* classes). Audit total: 88→57. Resolution breakdown: DELETE 1 / Path A §6 7 / intra-session 1 / cross-file intra-session 3 / CSS extension 1 / new modifier 3 / new class 15 = 31. Reuse rate 35% (11/31). 3a residual (BLS:238 flexShrink:0) resolved via flat sb-row-actions class applied at element level — flat model maintained throughout. sb-screen: **WON** (3 uses: BS×2 + BLS×1). sb-tab-bar: still PARTIALLY-FAILED (3g pending). sb-section-header-row: not found in 3f files, moves to 3g. New 3f bets: sb-row-rename-input, sb-row-actions, sb-btn-icon-sm (all pending 3g — AudioRow scope). Token normalizations: 13px→--fs-xs (1px drift), fontSize:22px=--fs-xl exact, 11px sb-hint-text→10px (1px drift), padding 10px/14px→8px/12px (2px drift each). Off-token literals: 6px×3 (sb-place-banner, sb-setup-toolbar, sb-btn-icon-sm), 56px×1 (sb-board-row minHeight), 60px×1 (is-loose padding) — see §5 BACKLOG note below. Architecture: flat model invariant formally stated; sb-menu-row pre-flat legacy noted and left for dedicated consolidation pass. |
| **3g** ✅ Done (12fbbc0) | `SceneRail.tsx` + `LibraryPanel.tsx` + `AudioRow.tsx` | 9 + 11 + 8 = 28 | 0+0+2 = 2 | 0 | 0 violations, 0 d-w-s. §6: 145→159 (+14 new classes). Audit total: 57→29. Resolution: 1 DELETE / 14 Path-A §6 / 2 intra-session / 13 new class = 30 resolutions for 28 violations (+2 from d-w-s dual split). Reuse rate 57% overall (73% LibraryPanel — thesis confirmed for screen→panel siblings; 50% AudioRow). 0 new literal 11px values — SR-2 and AR-9 normalized to var(--fs-xs). 4 existing class updates: sb-row (min-width:0), sb-scroll-fill (overscroll-behavior:contain), sb-count-text (flex-shrink:0), sb-hint-text (truncation triplet). Bet outcomes: #3 WON (sb-panel-title on Library span), #5 WON (sb-search-field LP-3), #6 WON (sb-btn-clear LP-5), #12 WON (sb-scroll-fill LP-7); #4 PARTIAL (sb-search-bar → sb-lib-panel-search-bar sibling); #7 FAILED (sb-item-list wrong structure), #10 FINAL-FAILED→screen-local (sb-tab-bar, LibraryPanel has no tab bar), #11 FAILED (sb-filter-rail), #21 FAILED (sb-row-rename-input: wrong font scale for filenames), #22 FAILED (sb-row-actions: AudioRow uses grid, not flex+actions), #23 FAILED (sb-btn-icon-sm: 36px fits neither 28px SceneRail nor 44px AudioRow). |
| **3h** ✅ Done (994d2eb) | `PadTypeConfirmDialog.tsx` + `TopBarV2.tsx` + `BoardTopBarV3.tsx` + `PadGridCell.tsx` + `UndoToast.tsx` + `StatusBarV2.tsx` + `Waveform.tsx` + `PixelIcon.tsx` | 13+5+4+4+2+1+0+0 = 29 | 1+1+1+0+0+0+2+0 = 5 | 1(PTD ternary)+1(Pix spread) = 2 | 0 violations, 0 d-w-s. §6: 159→186 (+27 new sb-* classes). Audit total: 29→0 (project-wide Total=0 confirmed — Session 3 migration COMPLETE). Resolution breakdown: 1 DELETE / 4 pre-flat-family extensions (.sb-pad family: is-deep height+touch-action, pad-title fs unify, new pad-type-label + pad-drag-handle descendants) / 5 d-w-s splits (TopBarV2:85 cursor, BoardTopBarV3:59 maxWidth, PadTypeConfirmDialog:117 verdict-pill bg, Waveform:23 height+opacity, Waveform:37 height+background) / 19 Path B new classes. Near-miss merge: sb-topbar-breadcrumb(V2) + sb-topbar-scene-name(V3) → sb-topbar-secondary (cross-topbar 2-use, same function, 1px size normalization, color intrinsic). Anti-utility ruling: sb-text-dim/sb-text-mute rejected as standalone utilities; colors absorbed into semantic element classes (sb-type-change-from/-arrow, sb-undo-message, sb-topbar-secondary). PixelIcon: sb-pixel-icon hardcoded as base class in component; DOM-verified all 4 SVGs hasBase=true. Visual: TopBarV2 + BoardTopBarV3 (sb-topbar-secondary font-mono/12px/text-mute confirmed), StatusBarV2, PixelIcon verified headlessly. PadGridCell/PadTypeConfirmDialog/UndoToast/Waveform: CSS audit (0 Path-D) + build confirm migration; NOT laufzeit-verifiziert headlessly (ADD PAD disabled without audio fixture — pre-existing constraint). Beim nächsten Einsatz mit geladenen Audio-Dateien bestätigen: PadTypeConfirmDialog (FROM/ARROW/TO-Farben, Verdict-Pill-Hintergrund, Field-Label-Farbe), Waveform-Balken, PadGridCell (Type-Badge/Drag-Handle), UndoToast (message dim + UNDO + Progressbar). Bet settlement: all 8 open bets closed (see §5 Sorte-2 Bet Index below); final scorecard: WON 7 / LOST-justified 8 / FINALLY-LOST-consolidation 7 / SPECULATIVE-Slice8 3. |

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

| # | Class | Origin | Remaining target | Status | Verfallsbedingung |
|---|-------|--------|------------------|--------|--------------------|
| 1 | `sb-type-btn` | 3b | — | **WON (3d)** | Confirmed ≥2-use. No action. |
| 2 | `sb-section-header-row` | 3b | 3h | **FINALLY LOST → screen-local** | No 3h file has a space-between section header row. Stays on PadEditorPanel. Consolidation-pass candidate. |
| 3 | `sb-panel-title` | 3b | — | **WON (3g)** | Applied to LibraryPanel "Library" span. 2 uses: PadEditorPanel + LibraryPanel. Bet resolved. |
| 4 | `sb-search-bar` | 3c | — | **LOST — but class justified** | LibraryPanel needs sb-lib-panel-search-bar (different padding/border for 280px panel). sb-search-bar stays in use on LibraryScreen. Concept confirmed, exact reuse not possible. |
| 5 | `sb-search-field` | 3c | — | **WON (3g)** | LibraryPanel LP-3 uses it as Path A. 2 uses: LibraryScreen + LibraryPanel. |
| 6 | `sb-btn-clear` | 3c | — | **WON (3g)** | LibraryPanel LP-5 uses it as Path A. 2 uses: LibraryScreen + LibraryPanel. |
| 7 | `sb-item-list` | 3c | — | **LOST — but class justified** | LibraryPanel uses sb-scroll-fill (row-based list, not card-style). sb-item-list stays in use on LibraryScreen. |
| 8 | `sb-screen` | 3c | 3f | **WON (3f)** | Used on BS root×2 + BLS root×1 — all full-height column-layout app screen roots. Confirmed ≥3-use. No action. |
| 9 | `sb-screen-empty` | 3c | 3e | **LOST — but class justified** | Failed in 3e (StartScreen has no empty state). In active use on LibraryScreen. No cleanup. |
| 10 | `sb-tab-bar` | 3c | — | **FINAL FAILED → screen-local** | 3e, 3f, 3g all failed (none have a tab bar). In active use on LibraryScreen — no cleanup. Downgraded to screen-local. |
| 11 | `sb-filter-rail` | 3c | — | **LOST — but class justified** | LibraryPanel has no filter rail. In active use on LibraryScreen. Downgrade to screen-local. |
| 12 | `sb-scroll-fill` | 3d | — | **WON (3g)** | LibraryPanel LP-7 uses it as Path A. Updated with overscroll-behavior:contain. ≥2 uses. |
| 13 | `sb-sheet-header` | 3d | 3h | **FINALLY LOST → screen-local** | PadTypeConfirmDialog structurally incompatible: header is split (container div + title div + arrow row); applying sb-sheet-header to the container would bleed its typography to all children. Also letterSpacing differs (0.10em vs 0.08em). Stays on PadCreationPopover. Consolidation-pass candidate. |
| 14 | `sb-creation-popover-actions` | 3d | 3h | **FINALLY LOST → screen-local** | PadTypeConfirmDialog footer needs padding 3× larger (space-3/space-4 vs space-1/space-2) + justify-content:flex-end (absent). New class sb-dialog-actions created. Stays on PadCreationPopover. Consolidation-pass candidate. |
| 15 | `sb-btn-muted` | 3d | 3h | **FINALLY LOST → screen-local** | No 3h file has a visually recessive de-emphasized button. Stays on PadCreationPopover. Consolidation-pass candidate. |
| 16 | `sb-tab-sm` | 3d | 3h | **FINALLY LOST → screen-local** | No 3h file has tabs. Stays on PadCreationPopover. Consolidation-pass candidate. |
| 17 | `sb-source-tabs` | 3d | 3h | **FINALLY LOST → screen-local** | No 3h file has a source tab row. Stays on PadCreationPopover. Consolidation-pass candidate. |
| 18 | `sb-overlay` | 3e | Slice 8 | **SPECULATIVE — far** | Promote to confirmed multi-use if settings screen or future overlays appear in Slice 8. |
| 19 | `sb-overlay-header` | 3e | Slice 8 | **SPECULATIVE — far** | Same as `sb-overlay`. |
| 20 | `sb-overlay-body` | 3e | Slice 8 | **SPECULATIVE — far** | Same as `sb-overlay`. |
| 21 | `sb-row-rename-input` | 3f | — | **LOST — but class justified** | AudioRow rename uses font-ui fs-sm/14px, no uppercase — fundamentally different typography from board names (fs-lg/18px, 0.08em, uppercase). Created sb-audio-row-rename. sb-row-rename-input stays in use on BLS BoardRow. |
| 22 | `sb-row-actions` | 3f | — | **LOST — but class justified** | AudioRow uses 5-column CSS Grid (not flex with trailing action group). No trailing action group wrapper. sb-row-actions stays in BLS BoardRow. |
| 23 | `sb-btn-icon-sm` | 3f | — | **LOST — but class justified** | SceneRail action buttons = 28px (uses sb-btn-icon). AudioRow delete = 44px (iOS touch target). 36px fits neither. sb-btn-icon-sm stays in BLS BoardRow (2-use). |
| 24 | `sb-flex-trunc` | 3g | 3h | **FINALLY LOST → screen-local** | BoardTopBarV3 board name is in a column flex context (not row fill) with a dynamic maxWidth constraint — flex:1/min-width:0 don't apply. Stays on SceneRail (1-use). Consolidation-pass candidate (1-use class). |
| 25 | `sb-panel-empty` | 3g | 3h | **WON (3g, 2-use)** | 2-use intra-session (SceneRail + LibraryPanel). No 3h file has panel empty states; WON confirmed in 3g. |

**Count check (final — all 25 closed):** WON: 7 (#1,3,5,6,8,12,25) · LOST-justified: 8 (#4,7,9,10,11,21,22,23) · FINALLY-LOST→consolidation: 7 (#2,13,14,15,16,17,24) · SPECULATIVE-Slice8: 3 (#18,19,20) = 7+8+7+3 = 25 ✓. No OPEN or PARTIALLY-FAILED bets remain. Index closed (2026-05-31, 994d2eb).

---

#### Bets 3g tested ✅ Done (12fbbc0)

3g covered `SceneRail.tsx` + `LibraryPanel.tsx` + `AudioRow.tsx`. All 13 bets resolved:

| Bet | Class | Result | Key finding |
|-----|-------|--------|-------------|
| #3 | sb-panel-title | **WON** | Library span in LibraryPanel — exact same function as PadEditorPanel "Pad Editor" |
| #4 | sb-search-bar | **PARTIAL → new sibling** | LibraryPanel has the structural role but needs sb-lib-panel-search-bar (6/8 vs 10/14 padding; panel context) |
| #5 | sb-search-field | **WON** | LP-3 Path A; 2px gap drift acceptable |
| #6 | sb-btn-clear | **WON** | LP-5 Path A; 1px padding drift acceptable |
| #7 | sb-item-list | **FAILED** | Card-style list (padding+gap) ≠ row-separator list (border-bottom) |
| #10 | sb-tab-bar | **FINAL FAILED** | LibraryPanel has no tab bar; downgraded to screen-local |
| #11 | sb-filter-rail | **FAILED** | LibraryPanel is a panel, not a 2-col screen with a filter sidebar |
| #12 | sb-scroll-fill | **WON** | LP-7 Path A; updated with overscroll-behavior:contain |
| #16 | sb-tab-sm | **NOT FOUND** | No compact tabs in 3g files; passes to 3h |
| #2 | sb-section-header-row | **NOT FOUND** | No space-between section headers in 3g files; passes to 3h |
| #21 | sb-row-rename-input | **FAILED** | AudioRow uses fs-sm/14px/normal-case; class is fs-lg/18px/uppercase — different typographic scale for filenames vs board names |
| #22 | sb-row-actions | **FAILED** | AudioRow uses 5-column CSS Grid, not flex with trailing action group |
| #23 | sb-btn-icon-sm | **FAILED** | 36px fits neither SceneRail (28px) nor AudioRow (44px iOS touch target) |

**Strategic finding:** The thesis holds for screen→panel siblings (LibraryPanel 73% reuse — 3c's classes snapped in). It fails for component→component predictions (AudioRow 50%, 3f bets all failed) when the components have structurally different layouts (grid vs. flex+actions). Honest failed bets are real results; they map the boundary of the strategy.

#### Bets 3h settled ✅ Done (994d2eb)

3h covered `PadTypeConfirmDialog.tsx` + `TopBarV2.tsx` + `BoardTopBarV3.tsx` + `PadGridCell.tsx` + `UndoToast.tsx` + `StatusBarV2.tsx` + `Waveform.tsx` + `PixelIcon.tsx`. All 8 open bets closed:

| Bet | Class | Result | Key finding |
|-----|-------|--------|-------------|
| #2 | sb-section-header-row | **FINALLY LOST → screen-local** | No 3h file has a space-between section header row. Consolidation-pass candidate. |
| #13 | sb-sheet-header | **FINALLY LOST → screen-local** | PadTypeConfirmDialog header is split into 3 nested elements (container + title + arrow-row); applying sb-sheet-header to container would inherit typography to all children. Additionally letterSpacing 0.10em vs 0.08em. |
| #14 | sb-creation-popover-actions | **FINALLY LOST → screen-local** | PadTypeConfirmDialog footer: padding 3× larger (space-3/space-4 vs space-1/space-2) + justify-content:flex-end absent. New class sb-dialog-actions created. |
| #15 | sb-btn-muted | **FINALLY LOST → screen-local** | No de-emphasized recessive button in any 3h file. |
| #16 | sb-tab-sm | **FINALLY LOST → screen-local** | No tabs in any 3h file. |
| #17 | sb-source-tabs | **FINALLY LOST → screen-local** | No source tab row in any 3h file. |
| #24 | sb-flex-trunc | **FINALLY LOST → screen-local** | BoardTopBarV3 board name is in a column flex (not row fill) with dynamic maxWidth — flex:1/min-width:0 don't apply. Column context makes the class inapplicable. |
| #25 | sb-panel-empty | **WON (3g, confirmed)** | Already WON at 2-use intra-session in 3g; no 3h file has panel empty states. Status closes as WON. |

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
   editing. Context collapses when you alternate between reading and writing.
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
- `sb-topbar-secondary`: `12px` — normalized from 11px (BoardTopBarV3 scene name) and 12px (TopBarV2 breadcrumb); now consistently 12px = --fs-xs but kept as literal since it's also the token value

**Sub-token padding:**
- `sb-verdict-pill`: `padding: 2px 10px` — tight pill sizing (2px top/bottom, 10px sides)
- `sb-field-chip`: `padding: 1px 6px` — compact tag chip (1px top/bottom, 6px sides — adds to the 6px note above)
- `sb-undo-btn`: `padding: 2px var(--space-3)` — tight button vertical (2px top/bottom)

**Pixel literals (absolute positioning):**
- `sb-pad-drag-handle`: `bottom: 4px; right: 6px` — no token for these corner values; same tight-corner pattern as `sb-pad-key` (top: 6px, right: 6px established in Session 3a/legacy)

**TopBarV2 fixed dimensions (no tokens):**
- `sb-topbar`: `padding: 10px 16px; height: 48px` — 10px is between space-2 (8px) and space-3 (12px); 48px topbar height matches BoardTopBarV3 but no --topbar-height token exists

**Font sizes above --fs-xs used as literals:**
- `sb-topbar-title`: `22px` — display title, no fs-* token at this size
- `sb-topbar-board-name`: `16px` — compact board title, no fs-* token at this size

All these literals are documented in the @inventory comments in tokens.css.
**Action:** Session 8 (typography/polish pass) decides which earn tokens.
**When:** Session 8. **Source:** Session 3h, 2026-05-31.

---

### ✅ Session 3 CSS Class Discipline Migration — COMPLETE (2026-05-31)

All 177 inline-style Path D violations across all app files have been migrated.
Project-wide audit Total Path D = 0 (confirmed headlessly, 994d2eb).

**Final §6 class count after consolidation pass: 184 sb-* classes** (186 post-migration → 184
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

All sb-* classes follow a **flat model**: one class per element, composition via multiple
classes on the same element. No descendant selectors inside any class.

**Exception resolved:** `sb-menu-row` pre-flat legacy descendant rules (`.sb-menu-row .sb-icon`,
`.sb-menu-row .sb-row-title`, `.sb-menu-row .sb-row-sub`) flattened in consolidation pass.
The three child classes are now standalone flat rules. `is-active` + `is-active::after` removed
(dead code — kein TSX hat je `is-active` gesetzt; `currentBoardId` dient nur der Navigation,
nicht der Aktiv-Hervorhebung in der BoardRow). §6 = 187. **No pre-flat families remain.**

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
AudioRow rows would overflow this column on every use — **tritt im Normalbetrieb auf,
sobald die Bibliothek Dateien enthält** (leere Bibliothek verdeckt es in Tests).

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
**Source:** DESIGN_NOTES.md §iOS Plattform-Grenzen.

### Populated-SETUP layout at 390 px viewport
SceneRail (220 px fixed) + open inspector panel (280 px fixed) = 500 px combined minimum,
which exceeds a 390 px viewport. The center pad grid is pushed to 0 px. Expected for the
current desktop-first layout. Fix deferred to Slice 8 mobile adaptation.
**Source:** DESIGN_NOTES.md §Known limitation: SETUP layout.

### HTML5 DnD silently broken on iOS
`draggable` / `ondragstart` / `ondrop` are not supported on iOS Safari/Brave. All DnD must
use Pointer Events. Canonical patterns: `src/lib/padDnd.ts` (pad-to-pad) and
`src/lib/libDnd.ts` (library-to-grid). Any future DnD interaction must follow these patterns.
**Source:** CLAUDE.md §Supported Platforms, DESIGN_NOTES.md §Slice 3/Lessons.

### WebKit headless: no audio codec support
Playwright's headless WebKit build cannot decode audio (`decodeAudioData()` fails). As a
workaround, audio-dependent mobile tests run on Chromium with the iPhone 13 Pro device
profile. Audio-free mobile specs continue on WebKit.
**Source:** TESTING.md §Bekannte Fallstricke #7.

### `boardPut()` full-document rewrite
Any pad or scene edit rewrites the entire ~50 KB Board document. Acceptable at current board
sizes. See the infrastructure item above for the optimisation path.
**Source:** ADR-0010.

---

## 7. Manual Verification Reference

`docs/MANUAL_IPHONE_CHECKLIST.md` must be run before every release and after any commit
that touches audio code (`src/audio/`), the IDB layer (`src/db/`), or file-handling
(import/export). It covers items that cannot be automated in Playwright:
- File upload via iOS native picker (bypassed by `setInputFiles()`)
- Actual audio output
- Ringer Switch behaviour
- Tab-switch / backgrounding lifecycle
- Backup import/export via iOS Files app

See `TESTING.md §Mobile Testing` for the full rationale.
