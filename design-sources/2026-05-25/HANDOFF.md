# Soundboard of Storytelling — Design Handoff

This is a complete design system + screen library for the Soundboard of
Storytelling PWA. It is **not application code** — there is no audio
engine, no storage layer, no service worker. Everything in this folder
is the **visual + interaction blueprint** for Claude Code (or any
developer) to implement against.

The design lives in two forms:

1. **Tokens & assets** — drop-in CSS variables, pixel-art SVG icon
   data, keyframe animations. Copy these into your PWA verbatim.
2. **Reference components** — React JSX showing how every screen and
   component composes. **Port these to your stack** (Vanilla JS, Lit,
   Alpine, whatever). Do **not** import the JSX directly into your PWA.

---

## 1 · WHAT'S IN THIS PROJECT

### Drop-in (copy verbatim)

| File | Use |
|---|---|
| `tokens.css` | The complete token system — colors, type, spacing, pixel-frame styles, all 4 theme variants. **Import into your global CSS.** |

The token file gives you:

- Five-level surface hierarchy (`--night` → `--deep` → `--surface` →
  `--raised` → `--top`)
- WCAG AA text contrast (every text token's ratio annotated inline)
- PAD type palette (`--pad-single`, `--pad-loop`, `--pad-playlist`,
  `--pad-combo`)
- SETUP / GAME mode colors (`--mode-setup`, `--mode-game`)
- Theme overrides (`.theme-verdant`, `.theme-neon`, `.theme-crimson`)
- Pixel-frame base styles (`.sb-pad`, `.sb-card`, `.sb-btn`, etc.)
- Animation keyframes for hearth glow, embers, breathing pads, pendulum,
  flame flicker, etc.

### Reference (port to your stack)

| File | What it shows |
|---|---|
| `foundations.jsx` | Pixel-icon library (25+ icons as SVG `<rect>` coordinates). Port the `PIXEL_ICONS` dictionary directly — the data is reusable. |
| `decorations.jsx` | `<SectionLabel>`, `<PixelDivider>`, `<CornerBrackets>`, `<ArcaneSigil>`, `<PixelPanel>` — small reusable ornament components. |
| `components.jsx` | The kit — `<MenuRow>`, `<Pad>`, `<Pill>`, `<LabelSlider>`, `<ToggleRow>`, `<Tabs>`, `<TopBar>`, `<MixerStrip>`. |
| `screens.jsx` | Original Home / Board / Library / Settings layouts. Superseded by v2 below; keep for reference. |
| `v2-screens.jsx` | **Primary screen reference.** Start, Board (GAME + SETUP), Library, PAD Editor, Combo Editor with pro-tool chrome (`TopBarV2`, `StatusBarV2`, `PanelHeaderV2`, `KvRow`). |
| `v4-library.jsx` | Faithful Library rebuild (4 tabs: AUDIO / PADS / BOARDS / ICONS) plus refined variants with inline waveforms, type pills, usage indicators. |
| `v5-settings.jsx` | Settings split into 6 sub-menus on a left rail (CONTROLS / AUDIO / DISPLAY / BEHAVIOR / DATA / ABOUT). |
| `v6-tips-about.jsx` | Tips & Tricks (cheat-sheet cards, pixel `<KeyCap>` components) and About (hero + manifesto + PAD type cards). |
| `v7-pad-editor.jsx` | PAD Editor with sticky toolbar (SAVE / CANCEL / DELETE always visible) + 3-column workspace. |
| `v8-atmosphere.jsx` | 10 cozy decorations: `<AmbientEmbers>`, `<HearthGlow>`, `<StageFrame>`, `<ChapterHeader>`, `<SceneRune>`, `<Candle>`, `<MasterHeartbeat>`, etc. |
| `v9-functional-ideas.jsx` | 10 organisation features prioritised A/B/C — Command Palette, Quick Access strip, Cue Stack, Keyboard Map, Session Timeline, Smart Groups, Bulk Select, Workspace Presets, Scene Notes, Scene Transitions. |
| `v10-clock-themes.jsx` | Four clock styles (Pocket Watch, Standing Clock, Digital, Gothic Pendulum) with live + countdown modes. Theme-aware decoration vocabulary. |
| `v11-mobile.jsx` | Phone-portrait + landscape versions of every key screen with 44 px hit targets and bottom-sheet editors. |
| `v12-clock-magic.jsx` | Easter eggs (tap counter) + countdown-zero cinematic moments + Display settings toggle. |
| `v13-animated-flame.jsx` | `<AnimatedFlame>` — real animated pixel-fire that freezes blue when tapped. Used in IntroScreen + HomeScreen. |
| `v14-combo-editor.jsx` | Combo-PAD editor matching your actual UI model (parallel pads inside steps, sequential steps, ∞-loops as background sounds). |
| `v15-pad-depth.jsx` | Six PAD depth treatments + recommended full-stack (brighter face + bevel + edge-relief + chunky pixel shadow). |
| `v16-mushroom-clock.jsx` | Mushroom clock variant for the Verdant theme. |

### Browser

| File | Use |
|---|---|
| `Design System.html` | Loads everything into a pan/zoom design canvas. Open this to **browse** the design system. Not for production. |
| `design-canvas.jsx` | The canvas wrapper. Not part of your app. |
| `app.jsx` | Composes all artboards. Not part of your app. |

---

## 2 · WHAT THIS DESIGN DOES NOT INCLUDE

Claude Code must build these from scratch:

- **Audio engine** — Web Audio API. Play/Stop/Loop/Fade-in/Fade-out per
  pad, crossfade between scenes, master + bus volumes, ducking.
- **Storage layer** — IndexedDB. Pads, boards, audio files, icons.
  Backup/restore via JSON export. The UI for this exists; the data
  doesn't.
- **Service worker** — Cache strategies for audio files + app shell.
- **Manifest + install prompt** — Standard PWA boilerplate.
- **Drag and drop** — The UI shows drag handles + drop targets, but
  the actual DnD logic (HTML5 DnD or pointer events) is yours.
- **Keyboard event handling** — Hotkey capture in PAD Editor, the global
  shortcuts in Settings → Controls. The UI tells you where; the logic
  is yours.
- **Routing** — The screens exist; how the user navigates between them
  is your call (hash-router / history API / single-page state).

---

## 3 · RECOMMENDED IMPLEMENTATION PHASES

The design has a natural build order. Each phase is self-contained — you
can ship a working version of the app after Phase 3.

### Phase 1 · Foundations (1–2 days)

- Copy `tokens.css` into your project. Import it once in your root HTML.
- Pick a JS framework (or none — vanilla works). Set up your build.
- Port `PIXEL_ICONS` from `foundations.jsx` to a small icon library
  in your stack. A `<PixelIcon name="flame" size={N} />` equivalent is
  ~30 lines of code.
- Apply the `.sb` base class to your root container so the tokens flow.

**Done when:** your existing app renders in the new color palette
without any layout changes.

### Phase 2 · Board · GAME mode (3–4 days)

Reference: `v2-screens.jsx → BoardV2` + `v15-pad-depth.jsx → DepthPad`.

- Build the pad grid using the full-stack depth treatment (brighter
  face + bevel + edge-relief + chunky pixel shadow).
- Wire up the audio engine to pad-click events.
- Implement the type-color spine (left-edge 3 px bar in
  `var(--pad-single)`, `var(--pad-loop)`, etc.) — this is the **single
  most important** PAD visual.
- Add the right-rail mixer with type-colored sliders per bus.
- Add the persistent status bar at the bottom.

**Done when:** clicking pads plays sounds, the user can see what's
playing, and the master volume slider works.

### Phase 3 · Board · SETUP mode + PAD Editor (3–4 days)

Reference: `v2-screens.jsx → BoardV2 mode="setup"` +
`v7-pad-editor.jsx → PadEditRefined`.

- Add the SETUP / GAME mode toggle in the top bar. Visual cues for
  SETUP: dashed pad borders, drag-handle dots, layout grid background.
- Implement drag-to-rearrange. Multi-cue mode differentiation is in
  `v2-artboards.jsx → ModesArtboard`.
- Build the PAD Editor as a separate screen (desktop) or bottom-sheet
  (mobile). **Critical**: the sticky toolbar with SAVE / CANCEL /
  DELETE always visible.
- 3-column layout: identity + behavior + visual (left) · sound +
  waveform (center) · audio inspector (right).

**Done when:** users can create, edit, and delete pads.

### Phase 4 · Library (2–3 days)

Reference: `v4-library.jsx → LibraryAudioRefined` etc.

- 4 tabs (AUDIO / PADS / BOARDS / ICONS) with persistent count badges.
- AUDIO tab: list rows with inline 22 px waveform thumbnails + usage
  pills.
- PADS tab: type-colored pill per pad.
- BOARDS tab: pad-type mosaic thumbnails.
- ICONS tab: built-in grid + dropzone for custom SVG uploads.

### Phase 5 · Settings (1–2 days)

Reference: `v5-settings.jsx → SettingsRefined`.

- Left-rail navigation: 6 sub-menus.
- Three-column setting rows: label · description · control.
- Theme picker in Display sub-menu.
- Backup status in Data sub-menu with overdue banner.

### Phase 6 · Polish (ongoing)

Pick from the v8 atmosphere kit, v9 functional ideas, v10 clocks, v12
easter eggs, v13 animated flame. Each is independently shippable.

**Recommended polish order:**

1. **Animated flame** (`v13`) — small, big impact. Reuse on Intro and
   Home screens.
2. **Hearth glow + ambient embers** (`v8`) — pure CSS, two lines of
   markup per screen.
3. **Now-playing aura** (`v8`) — CSS keyframes only; no JS changes.
4. **Command palette** (`v9`) — biggest functional win. Ship before
   anything else from v9.
5. **Pocket-watch + countdown** (`v10`) — adds a real GM utility.
6. **Combo Editor** (`v14`) — only if you have combo pads in scope.

---

## 4 · KEY DESIGN DECISIONS — WHY IT IS THIS WAY

A few choices that look opinionated and aren't accidental:

### 4.1 · Pixel frames via `clip-path`, not `border-radius`

The chunky stepped corners on every container come from a `clip-path`
polygon, not from rounded borders. This is what gives the pixel-art
feel. **Side effects:**

- `box-shadow` does not work — `clip-path` clips it. Use
  `filter: drop-shadow(...)` everywhere instead.
- `overflow: hidden` on a clipped element is redundant.

### 4.2 · Five-level surface hierarchy

`--night → --deep → --surface → --raised → --top` are visibly distinct
on every theme. Use them in order:

- `--night` is the canvas behind everything.
- `--deep` is for persistent chrome (toolbars, status bar).
- `--surface` is the page inside the window.
- `--raised` is anything sitting **inside** `--surface` (cards, inputs).
- `--top` is reserved for transient state (hover, selected row).

Do not skip levels. Do not use a sixth.

### 4.3 · PAD type color is sacred

The four PAD type colors are the most important semantic in the app:

- **SINGLE** → `--pad-single` (warm gold)
- **LOOP** → `--pad-loop` (teal)
- **PLAYLIST** → `--pad-playlist` (violet)
- **COMBO** → `--pad-combo` (copper)

They appear as the left-edge spine on every pad, the type pill, the
mixer-strip border, the icon color, the bulk-select highlight. Once you
learn the colors, the entire UI parses faster. **Don't reuse these
colors for anything else.**

### 4.4 · SETUP vs GAME is multi-cue

Mode is signalled by color **and** four other cues:

- Mode badge (hatched teal vs solid gold)
- Pad border (dashed vs solid stepped)
- Background (visible layout grid vs scanline vignette)
- Right rail content (Inspector vs Now-Playing)
- Status bar first segment ("EDIT" vs "LIVE")

This makes the mode unambiguous even at a glance, in mono, or in a
screenshot review. Don't drop the secondary cues.

### 4.5 · Atmosphere is opt-in, not default

Embers, hearth glow, breathing pads, candles, master heartbeat — every
atmosphere effect is opt-in via Settings → Display. Default state ships
with three on (embers + hearth glow + now-playing aura) and the rest
off. Users can always add more; they should not have to remove things
to make the app calm.

### 4.6 · Fonts

- **Press Start 2P** — hero titles only (28–40 px). Don't use below
  24 px; legibility falls off.
- **VT323** — UI labels, buttons, menu rows, tabs. Uppercase, with
  `letter-spacing: 0.10em`.
- **Share Tech Mono** — body copy, inputs, captions, code.

Load with `@import url('https://fonts.googleapis.com/css2?family=...')`
or, better, self-host the WOFF2 files.

---

## 5 · WHAT WE EXPLICITLY DECIDED NOT TO BUILD

So you don't waste cycles second-guessing:

- **Soft blur shadows** anywhere — fights the pixel-art voice.
- **Generative AI ambience** — undermines GM authorship; not what this
  tool is for.
- **Cloud sync between devices** — IndexedDB + export is enough.
- **Multi-user mode** — one GM controls everything by design.
- **Real-time pitch / time-stretch UI** — that's a DAW, this is a live
  tool.
- **Voice / hot-word trigger** — too unreliable during live
  conversation.
- **Combo Editor on mobile** — leave combo building for desktop.

---

## 6 · GETTING STARTED WITH CLAUDE CODE

Recommended first prompt:

> I have a complete pixel-art design system in a folder. Read these
> files in order:
>
> 1. `HANDOFF.md` — start here, has the roadmap
> 2. `tokens.css` — the token system, copy this verbatim
> 3. `v2-screens.jsx` — the primary screen reference
> 4. `foundations.jsx` — the pixel icon library
>
> My existing app is at: [your repo path]. The stack is: [your stack].
>
> Start with Phase 1 from HANDOFF.md: copy `tokens.css` into my project,
> port the pixel icon library to my framework, and apply the `.sb` base
> class to my root. Don't touch anything else yet.

After Phase 1 lands, ask Claude Code to proceed phase by phase. **Don't
ask for "everything at once"** — the design is too large to land in one
shot and each phase has good shipping value alone.

---

## 7 · QUESTIONS WORTH ANSWERING BEFORE YOU START

These will save you reroutes during implementation:

1. **What's the default theme?** Hearth is the suggested default;
   Verdant / Neon / Crimson are user-pickable in Settings → Display.
2. **Mobile-first or desktop-first?** The PAD type spine and depth
   stack work on both. Pick which screen size you'll polish first.
3. **Audio file size cap?** The Library shows storage used out of a
   500 MB cap in mockups — you'll need a real number.
4. **Which Phase 6 polish ships at v1?** Recommend: animated flame +
   hearth glow + now-playing aura + command palette. Everything else
   can wait.
5. **Combo-PAD in v1?** If you don't use combo pads today, skip v14
   entirely — adds 1–2 weeks of work for a feature you may not need.

---

## 8 · FILE MAP — TL;DR

```
Design System.html        ← browse the design (NOT for production)
tokens.css                ← COPY VERBATIM into your app
HANDOFF.md                ← this file

foundations.jsx           ← icon library (port the data, not the JSX)
decorations.jsx           ← ornament components (port)
components.jsx            ← the kit (port)

screens.jsx               ← v1 screens (reference only; superseded)
v2-screens.jsx            ← v2 screens (primary reference)
v2-artboards.jsx          ← surface hierarchy, pad-types, modes, pro-tool chrome

v3-variety.jsx            ← PAD variety study (style choices for type identity)
v4-library.jsx            ← Library — 4 tabs, faithful + refined
v5-settings.jsx           ← Settings — 6 sub-menus
v6-tips-about.jsx         ← Tips & About — refined cards + keyboard caps
v7-pad-editor.jsx         ← PAD Editor — sticky toolbar + 3-column workspace
v8-atmosphere.jsx         ← 10 cozy decorations (embers, hearth glow, etc.)
v9-functional-ideas.jsx   ← 10 organisation features (Cmd-K palette, cue stack, etc.)
v10-clock-themes.jsx      ← 4 clock styles per theme
v11-mobile.jsx            ← phone portrait + landscape variants
v12-clock-magic.jsx       ← easter eggs + countdown-zero moments
v13-animated-flame.jsx    ← real animated pixel-fire (intro + home)
v14-combo-editor.jsx      ← Combo-PAD editor (parallel pads, sequential steps)
v15-pad-depth.jsx         ← 6 PAD depth treatments + recommended stack
v16-mushroom-clock.jsx    ← Mushroom clock variant for Verdant theme

themes.jsx                ← theme comparison artboard
responsive.jsx            ← v1 tablet + phone layouts (superseded by v11)
```

---

Good luck. Ship Phase 2 first; everything else is polish.
