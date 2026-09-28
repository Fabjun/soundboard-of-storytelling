# Product — Soundboard of Storytelling

> **Hub document** for the product concept: what the app is, how it is used, and what its
> parts mean. Structure and rules: [ADR-0047](../architecture/0047-documentation-architecture.md).
>
> **Status:** Skeleton — sections are filled in dialogue with the product owner.
> Until a section is filled, the previous sources remain authoritative
> (`V3_CONCEPT_BRIEF.md`, `BACKLOG.md`, `DESIGN_NOTES.md`).
>
> **Leaves:** [v1-v2-inventory.md](v1-v2-inventory.md) — prototype features vs. V3 status,
> decisions per feature. · [features/data-backup.md](features/data-backup.md) — export,
> import, V1 migration.

## Status legend

| Marker | Meaning |
|---|---|
| **Decided** | Confirmed by the product owner. Binding. |
| **Open** | Question not yet answered. Do not assume an answer. |
| **Parked** | Idea recorded for later. Not to be built without explicit go-ahead. |

---

## 1. Purpose & audience

_Pending — to be filled in dialogue._

## 2. A game session

_Pending — to be filled in dialogue._

## 3. App modes: GAME and SETUP

_Filled 2026-09-28 in dialogue with the product owner. "Not yet built" marks decided
behavior that the code does not implement yet._

The Board screen has exactly two modes, switched by a dedicated mode toggle. In code they
are `AppMode = 'play' | 'edit'`; in the UI and in all docs they are **GAME** and **SETUP**.

| Statement | Status |
|---|---|
| **GAME** is for playing sounds during a game session. | **Decided** |
| **SETUP** is for arranging and configuring pads. | **Decided** |
| The **Library** is not a mode. It is file management (audio import, rename, delete), separate from GAME / SETUP. | **Decided** |

### Behavior per mode

| | GAME | SETUP | Status |
|---|---|---|---|
| Tap on a pad | Plays / stops the sound | Opens the PAD editor; plays nothing | **Decided** |
| Listening to a sound | By playing the pad | PREVIEW inside the PAD editor — _not yet built_ ([BACKLOG: Live preview](../../BACKLOG.md#live-preview-that-respects-fades--trim)) | **Decided** |
| Switching scenes | Classic controls (tabs, dropdown or similar); usable on desktop and smartphone | same | **Decided** |
| Concrete form of the scene switcher | — | — | **Open** — settled with the mobile Board layout |

### Switching modes

| Statement | Status |
|---|---|
| Modes are switched **only** via the mode toggle — never by a gesture. | **Decided** |
| Switching modes stops all playing sounds. _Not yet built._ | **Decided** |
| The app starts in GAME. | **Decided** |

### Lock

Protects a running game session against an accidental switch into SETUP.

| Statement | Status |
|---|---|
| A separate toggle with a lock icon, shown in GAME only. | **Decided** — _not yet built_ |
| Off by default; off again after every reload. | **Decided** — _not yet built_ |
| One tap locks, one tap unlocks. | **Decided** — _not yet built_ |
| Locks **only** the mode switch. Scenes can still be switched while locked. | **Decided** — _not yet built_ |

### Parked

Not to be built without explicit go-ahead. The settings options follow the principle that
cheap-to-build alternative behaviors become user options in Settings (Settings does not
exist yet).

- Scene switching by swipe gesture (previously planned as a GAME-only accelerator,
  BACKLOG B8 / D2). Dropped for now: too complex; classic controls first.
- Unlocking the Lock by press-and-hold.
- Setting: sounds keep playing across a mode switch. Side effects to resolve first: a
  playing pad could be edited or deleted in SETUP, and PREVIEW would mix with live sound.
- Setting: remember the Lock state across reloads.
- Setting: start in the last-used mode instead of GAME.

### Open

- Previewing a sound must not be audible in the room (separate audio routing). See
  [BACKLOG B9](../../BACKLOG.md#b9--gap-einordnung-drei-bestätigungen-zwei-neue-kandidaten)
  ("Audition vs. live output").

**Not covered here:** visual mode cues (colors, pad borders, backgrounds) → DESIGN.md;
empty-slot behavior in SETUP (BACKLOG D1) → Pad-grid component spec.

## 4. Screens & navigation

_Pending — to be filled in dialogue._

## 5. Core concepts

### Board, scenes & quick access

_Filled 2026-09-28 in dialogue with the product owner ("model B"). Nothing below is built
yet except scene CRUD; it changes the data model (BACKLOG §3 "Board pad pool")._

| Statement | Status |
|---|---|
| A **board** is the top-level grouping (e.g. one per game or campaign). | **Decided** |
| **Pad pool:** all pads belong to the board, not to a scene. | **Decided** |
| **All pads** is a view of the whole pool, not tied to any scene. Building-block pads (used only inside combos) live here without being in a scene. | **Decided** |
| A **scene** is a hand-picked, fixed selection of pads from the pool with its own grid arrangement and its own keys (§6 K2). The same pad can appear in several scenes, at different positions. | **Decided** |
| Editing a pad changes it everywhere it appears. | **Decided** |
| Two different removals: **remove from this scene** and **delete the pad** (from the pool, everywhere). | **Decided** |
| **Search and sort** are always available and apply to the current view only (All pads or the current scene). Sort by name or by last edited, ascending or descending; search and sort combine. | **Decided** |
| Search or sort rearrange a scene only temporarily; with the search field empty and no sort active, the scene returns to its saved arrangement. | **Decided** |
| Pads can be moved (SETUP) only while no search or sort is active. | **Decided** |
| **Quick-access bar:** board-wide, identical in every scene, freely assignable with pads from the pool (e.g. DAY, NIGHT). Its pads have fixed board-wide keys (§6 K13). | **Decided** |
| **STOP** and **Play/Pause** are fixed GAME controls, separate from the quick-access bar — they can never be removed or moved by accident. | **Decided** |
| **Pad sets** (earlier concept) are dropped: scenes and the quick-access bar cover them. | **Decided** |
| Rule-based scenes (e.g. "all pads tagged Night"). | **Parked** |
| Where all of this sits on a phone screen. | **Open** — mobile layout |
| Whether "Scene" is still the right name for a hand-picked view (Q1). | **Open** — revisit now that the concept is settled |

### Library

The **Library** is file management (audio import, rename, delete), separate from board
organization and not a mode (§3). **Decided.** Further content: _pending_.

### Pads

_Filled 2026-09-28 in dialogue with the product owner, informed by the V1 backup (1 board,
31 pads; 6 combos drive the game flow: DAY, NIGHT, Kill, Clocktower, Anklage, WIN)._

#### Pad types — **Decided**

| Type | Behavior | Status |
|---|---|---|
| **Single** | Plays once. With several files, each trigger plays one of them — random or in turn (variation, e.g. three different sword hits). | **Decided** — multi-file _not yet built_ |
| **Loop** | Runs until stopped. One file repeats seamlessly; several files play one after another, **in order or shuffled** (both options are essential — e.g. background music). | **Decided** — multi-file _not yet built_ |
| **Combo** | Triggers other pads in steps (see below). | **Decided** |

The former **Playlist** type merges into Loop (resolves Q2). This changes the data model
(`PadType`, ADR-0042): a superseding ADR and a migration of existing playlist pads are
required before implementation (BACKLOG §3).

#### Playing pads

| Statement | Status |
|---|---|
| A single tap starts a pad; a single tap on a playing pad stops it. | **Decided** (built) |
| Double-tap to stop (single tap on a playing pad does nothing) as a Settings option. | **Parked** |

#### Combos — **Decided**

- Combos are **building blocks**: a combo can use pads and other combos from **any scene of
  the board**, and combos can be nested inside longer combos. Nesting needs protection
  against cycles.
- The **combo editor** is a central control. It may become complex and extensive (§7 P1).
  - First version (minimal): a list of steps; per step the pads that start together, the
    wait until the next step, and "stop everything first".
  - Target: at least everything V1 could, and more — drag & drop of pads between steps and
    step reordering, foreground / background, "fade out all" as a step, volume and fade per
    pad within a combo.

#### Pad options

| Statement | Status |
|---|---|
| Per-pad volume, fade in, fade out. | **Decided** (built) |
| PREVIEW in the PAD editor. | **Decided** (§3) — _not yet built_ |
| Trim start / end in the PAD editor (engine support exists). | **Decided** — low priority, _not yet built_ |
| Audio ducking, master volume, crossfade between pads, level meter, quick volume via long-press. | **Parked** |

#### Open

- **Building-block pads:** pads that exist only as combo ingredients (in V1, 15 of 31 pads
  have no key; several are used only inside combos). Do they stay pads in the grid, or can combos use Library audio directly?
- **Alternative raised by the product owner:** scenes as closed rooms, with pads shown or
  hidden via filters or markers — building-block pads would then not appear in GAME or in
  specific scenes. To be discussed together with the question above.
- **Which sounds are currently playing** — needs a visible place; decided with the layout.

## 6. Platforms & input

### Platforms

_Pending — to be filled in dialogue._

### Input: keyboard & numpad

_Filled 2026-09-28 in dialogue with the product owner._ A Bluetooth numpad turns the app into
a mechanical soundboard: the game master triggers sounds with physical keys without looking
at the screen. V1 proved this in real game sessions. None of it is built in V3 yet
(inventory: [v1-v2-inventory.md §2](v1-v2-inventory.md#2-controls--numpad)).

| # | Statement | Status |
|---|---|---|
| K1 | A key can be assigned to each pad in the PAD editor (focus the field, press the key). Numpad keys and main-keyboard keys are distinct (numpad "1" ≠ "1"). | **Decided** — _not yet built_ |
| K2 | Key assignments apply **per scene**: the same key can trigger different pads in different scenes. Each scene is a "page" of the numpad. Scene keys must not collide with quick-access keys (K13). | **Decided** — _not yet built_ |
| K3 | Keys trigger pads **in GAME only**. In SETUP they do nothing. | **Decided** — _not yet built_ |
| K4 | A key press plays its pad. Pressing it again while the sound runs does **not** stop it (live safety, P6). | **Decided** — _not yet built_ |
| K5 | **Enter** stops the most recently started sound; repeated presses stop the remaining sounds in reverse order. | **Decided** — _not yet built_ |
| K6 | **Numpad decimal** stops all sounds. | **Decided** — _not yet built_. Verify on the device which code the numpad's decimal key sends (`NumpadDecimal` vs `Period`); in the V1 backup a pad ("WIN") is bound to `Period`. |
| K7 | **Space** pauses all sounds (e.g. to talk at the table) and resumes them on the next press. | **Decided** — _not yet built_ |
| K8 | While paused, any sound action (pad tap or key) resumes everything and plays the new sound. Stop actions end the paused sounds. A clearly visible **PAUSED** indicator is shown. | **Decided** — _not yet built_. Needs an audio-engine change (the engine auto-resumes on play and on returning to the app); requires separate approval when built. |
| K9 | An on-screen **STOP ALL** button exists for use without a numpad. | **Decided** — _not yet built_ |
| K10 | The assigned key is shown on the pad. | **Decided** — _not yet built_ |
| K11 | **Screen Wake Lock** in GAME keeps the screen on so the numpad keeps working. On by default. | **Decided** — _not yet built_ |
| K12 | Key assignments and control behavior (including the special keys above) become configurable in Settings. Until Settings exists, the defaults above apply. | **Decided** — _needs Settings_ |
| K13 | Pads in the **quick-access bar** have fixed, board-wide keys that work in every scene. | **Decided** — _not yet built_ |
| K14 | In **All pads** and while a search is active, the keys of the **last selected scene** stay active, so numpad control never drops out. | **Decided** — _not yet built_ |

**Parked** (not to be built without explicit go-ahead):

- Switching scenes by key (wanted in principle; built when the effort fits).
- Key test screen and keymap overview.
- Cue stack (queue pads, fire the next with a key).
- Configurable long-press action in GAME.
- Auto-stop after inactivity.
- Command palette (Ctrl/Cmd+K).
- Custom sound on mode switch.

**Open:**

- A fade-all button next to STOP ALL (`fadeOutAll` already exists in the engine).
- Other input devices: MIDI controllers, gamepads (mentioned in design notes, never discussed).

## 7. Design principles

_Filled 2026-09-28 in dialogue with the product owner._

### Philosophy — **Decided**

Like a tabletop RPG such as D&D: clear, even complex mechanical rules, and through their
interaction something unique emerges — there a story, here a soundscape. The audience
enjoys technical and complex things and wants to create something beautiful from the
interplay of many elements. The app gives them well-defined building blocks, not a
finished experience.

### Principles

| # | Principle | Status |
|---|---|---|
| P1 | **Minimal and functional first.** Classic, uncomplicated controls (tabs, menus, taps) that work on desktop and smartphone. Gestures and elaborate interactions come later. Minimalism anchors the core concepts first; the system then grows from there. It is a starting point, not a ceiling — central controls such as the combo editor may become complex and extensive. | **Decided** |
| P2 | **Sensible defaults, alternatives in Settings.** The app is usable immediately without configuration. Alternative behaviors become user options in Settings wherever they are not technically demanding. | **Decided** |
| P3 | **Well designed for its purpose, depth for those who want it.** The basics work without explanation; the mechanics underneath are predictable and can be combined and configured. Comfort and automation features are opt-in and can be disabled. | **Decided** |
| P4 | **The pad grid is the instrument.** In GAME the pad grid has priority; anything competing for its space must justify itself. | **Decided** |
| P5 | **Emergence over features.** Few, well-defined building blocks (pad types, scenes, the two modes) that combine into rich results. The GAME / SETUP split is itself an example: simple, yet it makes complexity manageable. For a new feature, ask first: does it emerge from existing blocks? Does it need a new *general* block? Only then consider a special case. | **Decided** |
| P6 | **Safe in live use.** During a running session nothing may surprise the game master or break irreversibly (e.g. the Lock, §3; two-tap delete). Depth belongs in SETUP, not in the heat of play. | **Decided** |
| P7 | **Learn from the prototypes, don't copy them.** V1 and V2 are sources for behavior, features and lessons. V3 re-implements in its own idiom (class system, tokens, components). Exception: the audio engine, ported unchanged by design. | **Decided** |

Engineering approach ("Think big, but don't rush") is not a product principle — it stays
in `BACKLOG.md` until `ARCHITECTURE.md` exists.

## 8. Out of scope

_Pending — to be filled in dialogue._

## 9. Glossary

_Pending — to be filled in dialogue._

## 10. Open questions

| # | Question | Status | Notes |
|---|---|---|---|
| Q1 | Is "Scene" the right user-facing term for the board-level pad arrangement? | **Open** | Raised 2026-09-28: the term feels misleading. "Category" collides with the Library's existing CATEGORY filter. Candidates: Tab, Page, Section, Group. A UI-only rename (code keeps `Scene`) would be cheap; a full code + data rename requires an IDB migration. Decision for now: keep "Scene". |
| Q2 | Rename the "Playlist" pad type to "List"? Are three pad types (Single, Loop, Combo) enough, or does List stay as a fourth? | **Decided** | Raised 2026-09-28. Playlist is built (Slice 4). V2 already labelled it "LIST ☰". To be revisited once the product owner has re-familiarised with the project. **Resolved 2026-09-28:** three types — Single, Loop, Combo; Playlist merges into Loop (§5 Pads). |
