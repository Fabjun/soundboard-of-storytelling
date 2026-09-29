# Soundboard of Storytelling — Design Notes

> **Open backlog items live in `docs/backlog.md`** (repo root). This file documents
> design-detail decisions, RESOLVED entries, and slice-specific notes — not the
> living backlog of deferred work. When an item graduates from "design decision"
> to "deferred feature or known limitation", move it to docs/backlog.md.

> **Architektur-Entscheidungen** (Datenmodell, Persistenz, Cross-Cutting-Pattern,
> Plattform-Annahmen) leben in `docs/architecture/` als ADRs. Diese Datei
> dokumentiert Design-Detail-Entscheidungen, offene Slice-Fragen und
> RESOLVED-Einträge zu konkreten Refactoring-Schritten.

> Captured design ideas that came up during design sessions but were not
> implemented in the explorations. Entries get pulled into V3 implementation when
> relevant.
>
> Not a system / not a spec — these are decisions still pending review.
> Each entry: one-line summary, one short paragraph of detail. If something
> hardens into a convention, it migrates to `docs/design/design-system.md`. If it grows
> into a real feature, it gets its own design artboard.

---

## Slice 3 — to decide at implementation time

> These are "how exactly" questions surfaced during Slice-3 design (A2
> PAD Creation Flow). All four ship as concepts; what's open is the
> exact threshold / default / phrasing. The pre-dispositions below are
> soft defaults from the GM's gut — final decision happens when the
> Slice-3 plan is concrete and the build context is fresh.

### A2 · Path B audio-duration → pad-type inference
Audio dropped from Library auto-creates a pad with type inferred from
duration: `<5 s → SINGLE`, `≥10 s → LOOP`, multi-file drop → `PLAYLIST`.
The 5–10 s zone is ambiguous.
**Pre-disposition · SINGLE default in the 5–10 s zone, type-flip allowed.**
Clean and predictable; rare enough that an explicit flip on the pad costs
nothing. Re-evaluate if real audio sets show many sub-loops in this band.
*(Implemented: threshold as recommended — SINGLE below 10 s, `padUtils.ts:57–59`. Type-flip:
in-flow only in Path A via type pills (`PadCreationPopover.tsx:193`); Path B creates
immediately with no in-flow override; post-creation change always available via Pad Editor
(`PadEditorPanel.tsx:379` + `PadTypeConfirmDialog.tsx`). Whether Path B needs an in-flow
flip is a future UX question — not re-opened here.)*

### A2 · Path C "next available slot" scan order
+ ADD PAD on save lands the new pad on a free slot. Row-major top-left
vs. near-focused-slot.
**Pre-disposition · row-major top-left.** Predictable beats smart for an
operation the user rarely triggers consciously. Smart-near-focus is the
kind of thing that mysteriously breaks one in twenty workflows.
**RESOLVED** — `padUtils.ts:22–26`: outer loop = row, inner = col → row-major top-left.

### A2 · Path A audio-source picker shape
Inline popover for slot-tap creation needs an audio source picker.
**Pre-disposition · 3-way segmented inside the popover: RECENT LIBRARY ·
BROWSE · DROP HERE.** Keeps the popover small, covers the three real
ways audio arrives. If RECENT LIBRARY's row count overflows the popover
height in real data, segment the popover differently — but only then.
*(RECENT LIBRARY and BROWSE live (`PadCreationPopover.tsx:7–9`); DROP HERE deferred to Slice 8 — placeholder shown.)*

### A2 · Path A → Path C handoff link
Inline popover should offer a "graduate to full editor" path so users
don't retype when they hit the popover's ceiling.
**Pre-disposition · "More options →" link bottom-right of the popover.**
Standard convention; opens the full PAD editor pre-populated with the
in-progress data. No data loss, no surprise.
**RESOLVED** — `PadCreationPopover.tsx:213`: "More options →" exists.

### A4 · grid stays 4-col on every viewport (no portrait reflow)
Mobile-portrait at the Slice-3 default 4×4 keeps **4 columns**, with
cells ~78 px wide at 360 px viewport — above the 44 px touch minimum.
**Decision: no reflow to 3-col on portrait.** Reasons:
- pad `position.col` must mean the same thing on every viewport (data
  model integrity);
- the F1-F4 / F5-F8 / F9-F12 / Q-W-E-R hotkey row mapping depends on
  4-col rows;
- visual layout-sprung between desktop and phone is learning cost for
  zero functional benefit.
v19 Empty-Scene mobile updated from a teaching 3×4 hint to the real
4×4 grid so the design pack is consistent.
*(Per ADR-0032: 4-col is the default; the ban is on AUTO-reflow of the column count. Manual
display-dependent column choice (Slice 8 `gridConfig`) is compatible — no contradiction.)*

---

## Slice 3 / Lessons — DnD pattern for future slices

During Slice 3, Path B (Library → Grid drag) was initially implemented with
HTML5 DnD (`draggable`, `ondragstart`, `ondrop`). This worked on desktop
Brave but was silently broken on the primary target (iPhone + Brave) because
iOS WebKit does not support HTML5 DnD.

**What to use for every DnD interaction going forward:**

Pointer Events. Two canonical reference implementations exist:

- `v3/src/lib/padDnd.ts` — Pad-to-pad drag (SWAP + INSERT, ghost, cellRef registry)
- `v3/src/lib/libDnd.ts` — Library-to-grid drag (drop only, ghost, elementFromPoint)

Key patterns:
1. `element.setPointerCapture(e.pointerId)` on `pointerdown`
2. `document.addEventListener('pointermove', ...)` for tracking
3. `document.addEventListener('pointerup', ...)` for drop detection
4. Ghost element: `position: fixed; pointer-events: none` — allows
   `document.elementFromPoint` to see through to the grid cell beneath
5. `touch-action: none` on draggable elements — prevents scroll from
   capturing the pointer before the drag starts
6. Threshold: 8px movement before entering drag mode (prevents accidental drags)
7. Separate module-level state per DnD type — never share state between
   `padDnd.ts` and `libDnd.ts` to avoid conflicts

**Plan-deviation lesson:** If a Slice plan says "Pointer Events" and you
implement HTML5 DnD instead, that's a deviation — declare it explicitly in the
Slice summary with a rationale. Undeclared drift causes bugs that are hard to
trace later (e.g., "why doesn't drag work on iPhone?").

Future slices requiring DnD (Slice 6 Set reorder, Slice 8 Scene rail touch):
use the patterns above, build a new isolated module if needed.

---

## Slice 8 — to decide at implementation time

> Open questions surfaced during A4 (gridConfig popover). All non-
> blocking for Slice 3. Pre-dispositions are the user's gut defaults
> from session m0058 / m0064 — final calls happen when Slice 8 is on
> the table.

### A4 · Cell-size · global vs per-scene
The gridConfig popover currently exposes only (cols × rows). Cell size
(compact / normal / spacious) is a second axis.
**Pre-disposition · global preference in Settings → Display.** Per-scene
cell-size multiplies the variation space without much real benefit. One
setting, every board.

### A4 · "Default new-scene grid" as user preference
Slice-3 hardcodes 4×4 for every new scene. In Slice 8, a Settings
→ Display option lets the user change this default.
**Pre-disposition · yes, expose the override.** Then 4×4 becomes
"default until you change it once". Power users with consistent
session styles (always 6×4 wide-screen) shouldn't have to retype.

### A4 · Unplaced pads remember their desired position
When shrinking unplaces N pads, the unplaced pads can either lose their
(col, row) entirely (clean slate on re-place) or remember it for
snap-back when the grid is enlarged.
**Pre-disposition · remember.** Pads carry their wanted position even
while unplaced. Enlarging the grid re-places them automatically if
the slot is still free.

### A4 · Mobile preset ceiling
Touch targets get tight past 5 cols on a 360 px viewport.
**Pre-disposition · hard cap at 5×4 on mobile.** No 6×4, no 6×6 in the
mobile popover. Desktop keeps the full range. Avoids the "tooltip
warning the user not to do the thing the UI offers" anti-pattern.

### Mode-awareness cues — pick one at build time
Four optional peripheral cues explored in `v25-mode-awareness.jsx` for
reinforcing the SETUP / GAME distinction beyond what the v24 toggle and
the existing `is-setup` pad treatment already carry. Slice-3 ships
without any of them — v24 plus the existing pad treatment is enough.

The four cues are **alternatives**, not a quartet to ship together. At
Slice-8 build time, pick one (optionally two if they hit different
screen regions and don't compete).

**Recommended evaluation order:**

1. **Atmosphere** — SETUP shows the layout grid; GAME adds the v8
   `AmbientEmbers` field + a hearth-glow gradient at the bottom of the
   canvas. Highest standalone impact; reuses existing v8 infrastructure
   (no new code surface to speak of); already aligned with v3 atmosphere
   conventions. Start here.
2. **Status chip** — bold full-fill mode badge in the status-bar left
   slot (`EDIT MODE` / `LIVE MODE`), replacing the current plain
   `EDIT` / `LIVE` text. Cheap polish, anchors the bottom of the
   screen. Skip only if the status bar is being redesigned anyway.
3. **Edge tint** — 2 px inset outline on the workspace in the active
   mode colour. Pure peripheral cue, ambient. Pair with #1 or #2 if the
   mode still feels under-communicated.
4. **Spine saturation** — pad type-spines dim to 45% opacity in SETUP.
   **Risk: the spine already carries pad TYPE colour.** Layering mode
   dimming onto a pixel-region that already encodes a different
   semantic invites confusion ("why is my Loop pad pale?"). Ship last,
   only if the first three are not enough.

Settings exposure: each cue is an independent toggle in Settings →
Display → Mode awareness, matching the `<SettingRow>` pattern used in
v5 / v17. The integration mock is the second artboard in the v25
section. Settings values persist per user.

The four artboards stay in the design canvas as a ready-to-build
reference. No `sb-*` classes ship in `tokens.css` until the build
slice — keeping the system inventory honest about what's actually
shipping vs. what's still in exploration.

---

## Slice 4 — to decide at implementation time

> Audio-state vocabulary surfaces when the audio engine is real.
> Speculative tokens / states would be cruft until then.
>
> *(Slice 4 complete 2026-05-28. C1 and C2 were NOT implemented — the scheduling
> lifecycle was not exposed in Slice 4, confirming the "speculative cruft" concern.
> Both remain open.)*

### C1 · `is-scheduled` pad state (combo + ducking)
A pad that will fire on the next downbeat (combo scheduling, ducking
release window) needs a third visual state distinct from idle and
`is-hot`. Today `hot` is a single boolean.
**Suggestion · `is-scheduled` state in §3.** Visual: a softer outline
in the pad-type colour without the inset fill that `is-hot` carries.
**Open until Slice 4 lands and we can see real combo timing in the
UI.** Speculative tokens are cruft; revisit when the audio engine
surfaces the scheduling lifecycle for real.

### C2 · `--pad-soft-outline` token family (depends on C1)
The `is-scheduled` visual needs a colour value that's softer than the
existing `--pad-*-glow` family — outline only, no fill. Would land as
`--pad-single-soft-outline`, `--pad-loop-soft-outline`, etc. **Hold
until C1 is approved.** Adding the token before the state has a use
makes the §A cheat-sheet noisier without solving a real problem.

---

## Slice 6 — capacity questions

### Sets management UI — does Quick Access suffice?
v9-functional-ideas.jsx has a "Quick Access strip" sketch for sets
— a horizontal row of one-tap set switches above the board. Sufficient
for set-switching at GAME-time, but Slice 6 also needs Set CRUD
(create / rename / duplicate / delete), Set composition (which pads
go into the set), and Set layout (tabs vs stack vs floating panel).
**Open · is the Quick Access strip enough, or does Slice 6 need its
own dedicated Sets-management artboards?** Mirror of the Scene-CRUD
work (A3) but on the Set axis. Revisit when Slice 5 (multi-scene) is
implemented and we can see real cross-scene set usage.

---

### A3 · Scene CRUD — open questions *(Slice-3 content — misplaced under Slice 6, left in place)*
Surface during A3; final calls happen at implementation:
- **Delete-last-scene behaviour** — drop back to Empty Board (recommended)
  vs. block. Recommendation argues from the data-model angle: zero scenes
  is a legal Board state, and Empty Board UX is already good.
  *(SETTLED — recommendation implemented: `SceneRail.tsx` `requestDelete()` has no guard on
  `scenes.length`. See docs/backlog.md: Delete-last-scene behaviour ✅ SETTLED (Slice 3).)*
- **Rename name conflicts** — allow duplicates (scenes are ID-referenced,
  name is display-only) vs. enforce unique. Strict-unique adds friction
  without benefit.
  *(BACKLOG user decision 2026-06-06 supersedes this recommendation: duplicate names are to
  be prevented. `SceneRail.tsx` `commitRename()` currently allows duplicates — code task
  pending. See docs/backlog.md: Scene rename: duplicate names ⬜ DECIDED.)*
- **Hotkey conflicts on duplicate** — duplicated pads carry their hotkeys,
  creating intra-board collisions. Resolve via the planned inline-
  conflict-feedback UI (already in DESIGN_NOTES, "PAD Editor"). Open:
  is that flow Slice-3 or Slice-4? Side note: the proposed `⌘D` Duplicate
  shortcut conflicts with the browser's "Bookmark this page" in non-
  standalone PWA mode — pick a different chord (`⌘⇧D`?) or accept that
  duplicate is right-click / long-press only when running outside
  standalone.
- **Mobile reorder** — stepwise Move up / Move down in the action sheet
  vs. dedicated reorder-mode with handles on every tab. Stepwise is the
  reliable touch-friendly default; reorder-mode is for power users with
  ≥6 scenes.
  *(No reorder mechanism in code — `SceneRail.tsx` has no Move up/Down and no drag handle;
  `state/store.ts` has no reorder setter. Deferred; see docs/backlog.md §3 Scene mobile reorder.)*
- **Long-press threshold** — 350 ms default. Settings-configurable, or
  fixed? Fixed-with-accessibility-override is the cleanest.
  *(Deferred per BACKLOG (Slice 8). 350 ms is established as the project long-press constant in
  `LibraryPanel.tsx:145`. Scene-context question is open until scene reorder exists.)*

---

## PAD Editor — interaction polish

### Key Capture flow
The `KEY` / `MIDI` / `GAMEPAD` fields in both editors show static values
right now. Real interaction: click `CAPTURE`, the field enters a "listening"
state (pulsing teal border, label "press any key…"), the next key/MIDI/pad
press fills the slot, Escape cancels. Visual: re-use the SETUP-mode hatch
during the listening window so it reads as a transient edit.

### Inline conflict feedback
Under the `KEY` field, show `✓ no conflicts on this board` in
`--success` (teal) or `⚠ F2 already bound to Wolf Howl` in `--blood-bright`
the moment a binding is chosen. Don't wait for save. The check is fast and
the consequence (silent overwrite) is high enough to warrant inline hint.

### Snap-to-zero-crossing on waveform drag
Trim and loop markers should snap to the nearest audio zero-crossing while
dragging — without it, hard cuts produce audible clicks. Visual hint:
during drag, the marker line is a hair brighter when snapped. Implementation:
the audio engine exposes zero-crossings as a sparse array; the drag handler
quantises within ±20 px.

### Numeric scrubbing on M:SS labels
The `TRIM START` / `TRIM END` / `LOOP POINT` numeric readouts (`sb-num`)
should be Premiere-style scrubbers: click-and-drag on the number to nudge
±0.1 s per pixel, hold ⇧ for ±0.01 s. Lets the user place markers with
frame-level precision without leaving the inspector.

### Live preview that respects fades + trim
The `PREVIEW` button should start playback at `trimStart` with fades + loop
applied — what the user would actually hear in GAME mode. Currently the
button is a placeholder. The playhead at `trimEnd` should automatically
restart at `loopPoint` (for LOOP-type pads) so the user can hear the loop
seam.

### Crossfade duration as inline control
`KvRow label="CROSSFADE" right="200ms"` is hardcoded. Should be either a
mini-slider (60–600 ms range) or a numeric scrubber. Only relevant when
loop mode is `CROSSFADE` — gate visibility on that.

### Waveform zoom for long files
For files longer than ~2 minutes, setting precise trim/loop points at the
current resolution is hard. A zoom level (scroll wheel on waveform, or
±/0 keys) with a small minimap strip above showing the full file + viewport
window. Out of scope for the editor mockups; in scope for V3 if files
≥ 60 s are common.

### Pad-type change confirmation
Switching from `LOOP` to `SINGLE` invalidates `LOOP POINT`, `LOOP MODE`,
`CROSSFADE`. Should show an inline confirm: "Changing to SINGLE removes:
loop-point, crossfade. Continue?" Either undo or apply. Don't silently
discard.

### Output bus inheritance hint
Below the `OUTPUT BUS` pills, show a one-line hint like
`AMB · default 45 % from Settings`. Tells the user where the level baseline
comes from. Faded `--text-mute` mono.

---

## Tags & folders

### Tag autocomplete with keyboard
Typing in the tag field surfaces matching existing tags from the project's
tag pool (case-insensitive, fuzzy on substring). `↵` commits, `⌫` on empty
input removes the last chip. Chips render as `sb-pill` in the pad type's
colour family if a known semantic mapping exists (`rain` → loop teal etc.),
otherwise default pill grey.

### Folder picker is a tree
The `FOLDER` dropdown is shown as `Ambient ▾` placeholder. Real UX: opens a
narrow tree column inside the inspector, not a separate dialog — keeps the
edit context visible. Single-select. New folder via a `+ NEW` row at the
bottom of the tree.

---

## Audio file management

### Multi-file playlist UX
`FileRow` (v2 PAD editor) supports multiple files for playlist pads. Drag
to reorder, click to select primary, `⌘`-click to multi-select for bulk
remove. The currently-selected file's waveform shows in the big canvas.
Mockup is single-file only.

### Per-file fade and trim
For playlist pads, each entry might want its own fade-in / trim. The
inspector should follow the selected `FileRow`. Either: per-file state
(complex), or: per-file persistent JSON in the project file (simpler,
single source of truth).

---

## Theme integration

### Crimson theme COMBO override
Default `--pad-combo` is rose-magenta. In the Crimson theme that sits next
to dominant `--blood` red — not a hard conflict, but a missed opportunity.
A theme-specific override (`.theme-crimson { --pad-combo: <something
cooler>; }`) would let COMBO act as the kontrapunkt to blood. Candidate:
desaturated cyan (#5A9FB0) for an icy "spell" feel; or violet (closer to
playlist, risky). Decide when Crimson reaches sign-off.

### Verdant theme COMBO override
Same situation: rose-magenta inherits from root. In the moss/gold Verdant
palette this reads as fairy-tale "wild magic" — actually fits the
storytelling tone. Hold; revisit only if a real conflict surfaces.

### Theme-conditional clock variants
v16 added the Mushroom Clock for Verdant. Same hook for the other themes:
Crimson could get a candle-clock with dripping wax, Neon a CRT-burn
seven-segment display. Each is a 30-min visual design exercise. Worth
exploring if themes get a real release pass.

---

## DepthPad / pad rendering

### ~~Migrate v15 DepthPad to use `className="sb-pad"`~~ — RESOLVED

Landed via the `.sb-pad.is-deep` opt-in state. The migration also forced
four small system changes, all on the same commit as the state:

- `--pix-bg-layer` escape hatch on the `sb-pix`-family background (allows
  multi-layer gradients without breaking the solid-colour `--pix-bg`
  contract — fully backwards-compatible) *(token subsequently removed from tokens.css)*
- `--pad-filter-base` plumbing on `sb-pad` so `is-hot`'s glow stacks
  onto whatever base filter `is-deep` (or any future treatment) sets,
  instead of clobbering it
- new tokens `--pad-edge-light`, `--pad-edge-dark` (inset relief +
  bevel gradient stops), `--shadow-pad-lift` (chunky pixel drop-shadow)
- docs/design/design-system.md §3 (new `is-deep` state), ~~§8.8~~ *(§8.8 was never written;
  escape-hatch content is moot — `--pix-bg-layer` removed; box-shadow rule lives in §5)*,
  §A (Pad surface row + Elevation token added)

v18-pad-depth-migration.jsx is kept as the design-history artefact
showing what the contract carried and what it didn't.

### Glow tokens for "currently scheduled" vs "currently playing"
Right now `hot` is a single boolean. In real use there's a third state:
"this pad will fire on the next downbeat" (combo scheduling, ducking
release). Suggests a second softer glow — say a 2-pixel outline in
`--pad-*-soft` without the inset fill. Worth adding when combo scheduling
lands.

---

## Settings & system polish

### Pad Appearance settings persistence
v17 settings work locally inside the artboard; in V3 the `APPLY TO ALL
PADS` button should write to project state (one place, applies system-wide)
rather than per-pad. Per-pad override is a different feature ("custom
look for this pad only") — separate UX, separate inspector row, decide
later if needed.

### Settings search across submenus
The "Search settings…" field in v5-settings is a placeholder. Real UX:
typing filters all rows across all submenus, jumps to the first match,
highlights the term in label + description. Matches Settings UX from
macOS Sequoia / iOS, which the user is already familiar with.

### Mode-toggle SFX preview
Settings → Controls has a "Mode toggle SFX" file slot. Should preview the
chosen sound at the current MASTER volume — same code path as the pad
PREVIEW button. Don't add a separate "test sound" feature.

---

## Open token / palette questions

### `--success` is teal because the dark-fantasy palette refused greens
`--success: #6DB5B8` aliased to loop teal. Newly added `--fade: #6FA85F`
introduces a real green for the first time at root level. If the system
warms up to greens, we could reconsider:
- `--success` back to a real moss-green (would tighten semantic reading)
- A second green tier for the "scheduled / pending" pad state
Hold for one or two design sessions before deciding; the experiment with
`--fade` will tell us how green sits next to the rest.

### Drop-shadow vs Inset shadow on `sb-pix`-family — RESOLVED
*(§8.8 was never written. The outer box-shadow rule lives in docs/design/design-system.md §5.
The inset-is-allowed nuance is a documented gap — see docs/backlog.md §2 Documentation Debt.)*  
`docs/design/design-system.md` ~~§8.8~~ has been refined: the rule is now about **outer**
`box-shadow` only — that's what `clip-path` fails to follow (the shadow
hugs the bounding box, not the stepped silhouette), so the workaround is
`filter: drop-shadow(...)`. Inset `box-shadow` renders inside the padding
box and is clipped along with everything else, so it's explicitly
allowed. v15 treatments D / F and the hot-pad inner glow are documented
as the canonical examples of the allowed inset variant.

### Mode toggle as interactive screen header (v24) — RESOLVED

Landed via `sb-mode-toggle` — a new chrome block, board-only, in the
title-slot of a 3-column `BoardTopBarV3` (left flame+breadcrumb, center
toggle, right help/fullscreen). Replaces the small `sb-mode-badge` in
that one position; `sb-mode-badge` stays for compact/secondary surfaces.
State flip triggers a directional pixel-spark animation
(SETUP→GAME = gold sparks left-to-right, GAME→SETUP = teal sparks
right-to-left, ~420 ms total, ~10 sparks staggered). Honours
`prefers-reduced-motion` with a 220 ms drop-shadow flash instead of
flying particles. Mobile uses `is-compact` modifier (smaller font, 6
sparks).

The migration introduced two new tokens to close a long-standing
symmetry gap:

- `--mode-setup-glow: rgba(141, 213, 216, 0.55)` — bright teal at 0.55 α
- `--mode-game-glow:  rgba(245, 213, 122, 0.55)` — bright gold at 0.55 α

Pad-type tokens had the `-soft` + `-glow` alpha pair (`--pad-loop-soft`,
`--pad-loop-glow`, etc.); mode tokens only had `-soft` (0.05–0.06 α,
used for page wash). Without a `-glow` tier, any text-shadow / drop-shadow
needing the mode hue would either reach for the wrong-alpha `-soft`
token or commit a new color literal (`rgba(109, 181, 184, 0.45)` was the
in-flight workaround during the v24 build). The new tier closes that
gap with values intentionally mirroring `--pad-loop-glow` /
`--pad-single-glow` — SETUP shares the loop hue family, GAME shares the
single hue family, so the visual identity is correct.

Same-commit updates:

- `tokens.css` §MODE — both new tokens with a comment block explaining
  the three-tier (base / -soft / -glow) pattern
- `docs/design/design-system.md` §A — Mode row now lists both `-soft` and `-glow`
- `docs/design/design-system.md` §6 — new `sb-mode-toggle` row under Chrome,
  pointing at `v24-mode-toggle.jsx`
- `docs/design/design-system.md` §3 — `is-setup` / `is-game` rows now list
  `sb-mode-toggle` alongside `sb-mode-badge`

`v24-mode-toggle.jsx` ships the component, the `BoardTopBarV3` wrapper,
five artboards (idle · mid-flight · reduced-motion · live playground ·
notes), and the keyframes (`sb-mode-spark-fly`, the two `-ignite`
animations, and the two `-flash` reduced-motion fallbacks).

---

*Maintenance: when an item here lands in V3 code, delete it. When a
design session generates a new "noted but not built" idea, add it. Keep
entries short — one paragraph max, link out for longer rationale.*

---

## RESOLVED — Slice 1+2 Audit-Pass (2026-05-27)

Token-Drift zwischen `v3/src/styles/tokens.css` und `design-sources/2026-05-25/tokens.css`
vollständig beseitigt. Betroffene Dateien:

**`v3/src/styles/tokens.css`**
- Neue Tokens: `--pad-edge-light`, `--pad-edge-dark` (v18 Depth-Stack),
  `--shadow-pad-lift` (v18), `--mode-setup-glow`, `--mode-game-glow` (v24
  Mode-Toggle), `--fade`, `--fade-soft`, `--flame-soft`, `--flame-aura`
- Wert-Updates: `--blood-bright` #D04545→#EF7575 (Legibility-Fix),
  `--danger` →`var(--blood-bright)`, `--pad-combo` Kupfer→Rose Magenta
  (#C9529D, user-confirmed — hue ~325° klar getrennt von Gold/Teal/Blood)
- Legacy-Alias-Scope-Bug gefixt: `--sb-*` Aliase jetzt auf
  `:root, .theme-verdant, .theme-neon, .theme-crimson` (vorher nur `:root` —
  hätte Theme-Switching in Slice 8 gebrochen)
- `--sb-danger` →`var(--blood-bright)` (konsistent mit --danger-Korrektur)
- Theme-Overrides vervollständigt: `.theme-verdant` (pad-single, pad-playlist),
  `.theme-crimson` (pad-single, pad-combo)

**`v3/src/screens/StartScreen.tsx`**
- FlameLogo filter →`var(--glow-flame)` (war hardcoded rgba)
- Hintergrund-Gradient →`var(--flame-soft)`, Glow-Ring →`var(--flame-aura)`

**`v3/src/chrome/TopBarV2.tsx`**
- Titel-Span: Inline-Styling →`class="sb-display-vt"` + fontSize 22px
  (war 16px + var(--text); Design-Referenz: VT323 22px gold-bright mit Glow)

---

## iOS Plattform-Grenzen

### Ringer-Switch (physischer Stummschalter)

Ringer-Switch (iOS): App ist stummgeschaltet, wenn der physische Schalter auf
lautlos steht — wie V1. Der AVAudioSession-Silent-WAV-Trick kann den physischen
Schalter nicht überstimmen (iOS-Plattformgrenze), dient aber weiterhin
konsistentem `resume()` nach Interruptions/Tab-Wechsel. Bewusst akzeptiert,
kein toter Code.

---

## Known limitation: SETUP layout on narrow viewports

Measured geometry at 390px viewport (Playwright diagnostic, 2026-05-28):

| SETUP state | SceneRail | Right panel | Center `<main>` (pad grid) |
|---|---|---|---|
| No panel open | 220px (fixed) | — | 170px ✓ |
| Pad selected (PadEditorPanel) | 220px (fixed) | 280px (fixed) | 0px ✗ |
| Library open (LibraryPanel) | 220px (fixed) | 280px (fixed) | 0px ✗ |

Both SceneRail and the inspector panels use `flex-shrink: 0` with fixed widths.
At 390px their combined minimum (220 + 280 = 500px) exceeds the viewport, pushing
the center `<main>` to 0px. This is expected for the current desktop-first layout
and is deferred to the dedicated mobile adaptation phase (Slice 8).

**Inspector placeholder removal (commit 402b4c2):** The empty-SETUP inspector
placeholder ("Select a pad to edit or open the Library") was removed as a
side-effect of a test fix. Whether the empty SETUP state should show guidance
(the removed affordance), a wider bare grid, or a different solution is an open
desktop-UX question. There is currently no usage data to inform this — the app
has only been developed, not yet used in real sessions. To be decided deliberately
once the app sees real use, likely with Claude Design.

**Backlog for Slice 8 / mobile adaptation phase:**
- Make SceneRail collapsible or overlay at narrow viewports
- Make inspector panels (PadEditorPanel, LibraryPanel) slide over the pad grid
  rather than pushing it, or use a tab-based layout
- Revisit the empty-SETUP affordance question (see placeholder note above)
- Re-enable `mobile-touch-targets.spec.ts` and `mobile-overflow.spec.ts` once
  the responsive layout is in place
- Minimum viable threshold: pad grid center area ≥ 44px in all three SETUP states
  at 390px
