# Product — Soundboard of Storytelling

> **Hub document** for the product concept: what the app is, how it is used, and what its
> parts mean. Structure and rules: [ADR-0047](../architecture/0047-documentation-architecture.md).
>
> **Status:** Skeleton — sections are filled in dialogue with the product owner.
> Until a section is filled, the previous sources remain authoritative
> (`V3_CONCEPT_BRIEF.md`, `BACKLOG.md`, `DESIGN_NOTES.md`).

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

_Pending — to be filled in dialogue._

## 6. Platforms & input

_Pending — to be filled in dialogue._

## 7. Design principles

_Pending — to be filled in dialogue._

## 8. Out of scope

_Pending — to be filled in dialogue._

## 9. Glossary

_Pending — to be filled in dialogue._

## 10. Open questions

| # | Question | Status | Notes |
|---|---|---|---|
| Q1 | Is "Scene" the right user-facing term for the board-level pad arrangement? | **Open** | Raised 2026-09-28: the term feels misleading. "Category" collides with the Library's existing CATEGORY filter. Candidates: Tab, Page, Section, Group. A UI-only rename (code keeps `Scene`) would be cheap; a full code + data rename requires an IDB migration. Decision for now: keep "Scene". |
