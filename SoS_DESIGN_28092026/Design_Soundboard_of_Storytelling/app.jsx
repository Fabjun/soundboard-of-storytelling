// app.jsx — Compose every artboard into one design canvas.
// v2 sections live above v1 so opening the file lands on the refined work.

function App() {
  return (
    <DesignCanvas>

      {/* ═══════════════════════════════════════════════════════════
         v2 — REFINED
         New tokens, AA contrast, PAD type system, SETUP/GAME modes,
         pro-tool chrome, new screens (Start, PAD Editor, Combo Editor).
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v2-foundations" title="v2 · Foundations" subtitle="Native variable names, WCAG AA contrast, expanded 5-level surface hierarchy.">
        <DCArtboard id="surfaces" label="Surface hierarchy"        width={880}  height={760}><SurfaceHierarchyArtboard /></DCArtboard>
        <DCArtboard id="color-v2" label="Color · tokens & ratios"  width={840}  height={760}><ColorPaletteArtboard /></DCArtboard>
        <DCArtboard id="type-v2"  label="Type · Press Start 2P + VT323 + Share Tech Mono" width={840} height={760}><TypeArtboard /></DCArtboard>
      </DCSection>

      <DCSection id="v2-systems" title="v2 · Systems" subtitle="PAD types and operator modes — the two cross-cutting systems.">
        <DCArtboard id="pad-types"   label="PAD types · 4 colours, idle/hot/setup" width={1080} height={920}><PadTypesArtboard /></DCArtboard>
        <DCArtboard id="modes"       label="SETUP vs GAME · multi-cue separation"  width={1100} height={1000}><ModesArtboard /></DCArtboard>
        <DCArtboard id="pro-tool"    label="Pro-tool chrome · header / status / inspector" width={820} height={820}><ProToolArtboard /></DCArtboard>
      </DCSection>

      <DCSection id="v2-screens" title="v2 · Screens" subtitle="1280 × 800 — full workspace mockups in the refined system.">
        <DCArtboard id="start"        label="Start · tap to unlock"            width={1280} height={800}><StartScreen /></DCArtboard>
        <DCArtboard id="board-game"   label="Board · GAME mode (live)"         width={1280} height={800}><BoardV2 mode="game" /></DCArtboard>
        <DCArtboard id="board-setup"  label="Board · SETUP mode (arrange)"     width={1280} height={800}><BoardV2 mode="setup" /></DCArtboard>
        <DCArtboard id="library-v2"   label="Library · 4 tabs"                 width={1280} height={800}><LibraryV2 /></DCArtboard>
        <DCArtboard id="pad-editor"   label="PAD Editor · waveform + inspector" width={1280} height={800}><PadEditorScreen /></DCArtboard>
        <DCArtboard id="combo-editor" label="Combo Editor · chained sequence"  width={1280} height={800}><ComboEditorScreen /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v5 — SETTINGS (faithful + sub-menu refinement)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v5-settings" title="v5 · Settings — sub-menus" subtitle="Today's settings is one long scroll. Refined: six grouped sub-menus on a left rail, pro-tool conventions.">
        <DCArtboard id="settings-actual"  label="Current · one long scroll"        width={1280} height={800}><SettingsActual /></DCArtboard>
        <DCArtboard id="settings-ctrl"    label="Refined · CONTROLS submenu"       width={1280} height={800}><SettingsRefined active="controls" /></DCArtboard>
        <DCArtboard id="settings-audio"   label="Refined · AUDIO submenu"          width={1280} height={800}><SettingsRefined active="audio" /></DCArtboard>
        <DCArtboard id="settings-disp"    label="Refined · DISPLAY submenu"        width={1280} height={800}><SettingsRefined active="display" /></DCArtboard>
        <DCArtboard id="settings-behav"   label="Refined · BEHAVIOR submenu"       width={1280} height={800}><SettingsRefined active="behavior" /></DCArtboard>
        <DCArtboard id="settings-data"    label="Refined · DATA submenu"           width={1280} height={800}><SettingsRefined active="data" /></DCArtboard>
        <DCArtboard id="settings-about"   label="Refined · ABOUT (inside Settings)" width={1280} height={800}><SettingsRefined active="about" /></DCArtboard>
        <DCArtboard id="settings-notes"   label="What changed & why"                width={620}  height={800}><SettingsRefinementArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v6 — TIPS & TRICKS + ABOUT (faithful + refined)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v6-tips-about" title="v6 · Tips & About — refined" subtitle="Tips: cheat-sheet cards grouped by category, pixel key-caps in palette colours (no blue chips). About: hero + manifesto card + PAD type cards + right-rail credits.">
        <DCArtboard id="tips-actual"   label="Tips · current"   width={1280} height={800}><TipsActual /></DCArtboard>
        <DCArtboard id="tips-refined"  label="Tips · refined"   width={1280} height={900}><TipsRefined /></DCArtboard>
        <DCArtboard id="about-actual"  label="About · current"  width={1280} height={800}><AboutActual /></DCArtboard>
        <DCArtboard id="about-refined" label="About · refined"  width={1280} height={900}><AboutRefined /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v26 — PAD SHAPE · square (default) vs rectangular option
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v26-pad-shape" title="v26 · Pad shape — square (default) · rectangular option" subtitle="Pads default to 1:1 squares; a Settings → Display → Pad appearance control switches the whole board to the current V3 rectangular (grid-stretched, 110px tall) treatment. Implementation: --pad-aspect custom property on a .sb-pad-canvas wrapper. No per-pad markup change.">
        <DCArtboard id="pad-shape-compare"  label="Compare · square vs rectangular · both modes · density" width={1400} height={1500}><PadShapeCompareArtboard /></DCArtboard>
        <DCArtboard id="pad-shape-settings" label="Settings · Display · Pad appearance · shape control"  width={1400} height={900}><PadShapeSettingsArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v24 — MODE TOGGLE as interactive screen header (Board only)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v24-mode-toggle" title="v24 · Mode Toggle — interactive screen header" subtitle="The Board's title-slot is a SETUP⇄GAME toggle, not a static headline. Direction- and color-sensitive pixel-spark animation tells the state transition.">
        <DCArtboard id="mode-toggle-idle"      label="Idle states · desktop + mobile · both modes" width={1280} height={1080}><ModeToggleIdleArtboard /></DCArtboard>
        <DCArtboard id="mode-toggle-flight"    label="Animation mid-flight · both directions · frame sequence" width={1280} height={1100}><ModeToggleFlightArtboard /></DCArtboard>
        <DCArtboard id="mode-toggle-reduced"   label="Reduced-motion · flash variant" width={1280} height={820}><ModeToggleReducedArtboard /></DCArtboard>
        <DCArtboard id="mode-toggle-live"      label="Live playground · click to flip · variant toggles" width={1280} height={900}><ModeTogglePlaygroundArtboard /></DCArtboard>
        <DCArtboard id="mode-toggle-notes"     label="§6 row · class inventory · token rationale" width={760} height={1280}><ModeToggleNotesArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v23 — PAD TYPE CHANGE CONFIRM (A5 · field-by-field policy)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v23-pad-type-change" title="v23 · PAD type change — explicit confirm · field-by-field" subtitle="A5 from the Slice-3 plan. Option C (per-field policy) recommended. 4×4 cross-type transition matrix, five canonical confirm-dialog cases (one per verdict), mobile bottom-sheet, implementation rules, open questions for the Slice-3 ticket.">
        <DCArtboard id="pad-type-change" label="Matrix · 5 dialogs · mobile · rules" width={1280} height={3000}><PadTypeChangeArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v22 — gridConfig POPOVER (A4 · design only · ships in Slice 8)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v22-grid-config" title="v22 · gridConfig popover — design only · ships in Slice 8" subtitle="A4 from the Slice-3 plan. Slice 3 ships with a fixed 4×4 default. This popover (+ mobile bottom-sheet) lands in Slice 8. Designed now to reserve SETUP-toolbar real estate, lock the data model (position can be null = unplaced), and document the UNPLACED-pads vocabulary that protects user data when shrinking.">
        <DCArtboard id="grid-config" label="Popover · 3 states · mobile sheet · UNPLACED · Slice-3→8 handoff" width={1200} height={2800}><GridConfigArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v25 — MODE AWARENESS · design only · ships in Slice 8
         The v24 mode-toggle is enough for Slice 3 on its own. These
         four cues are exploratory candidates for ONE extra ambient
         mode-cue to be picked at Slice-8 build time — not a quartet
         to ship together.
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v25-mode-awareness" title="v25 · Mode awareness — design only · ships in Slice 8 · final selection at build time" subtitle="The v24 toggle is enough for Slice 3 on its own (prominent interactive headline + frame colour + hammer-strike animation + existing is-setup pad treatment + EDIT/LIVE status text). These four cues — edge tint · status chip · atmosphere · spine saturation — are exploratory candidates for ONE extra ambient mode-cue, to be picked at Slice-8 build time. Not a quartet to ship together. Recommended evaluation order in DESIGN_NOTES.md.">
        <DCArtboard id="mode-awareness-compare"  label="Compare · 4 cues isolated · baseline reference" width={1400} height={1480}><ModeAwarenessCompareArtboard /></DCArtboard>
        <DCArtboard id="mode-awareness-settings" label="Settings · Display · Mode awareness section (integration mock)" width={1400} height={900}><ModeAwarenessSettingsArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v21 — SCENE CRUD UI (A3 · rename · duplicate · reorder · delete)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v21-scene-crud" title="v21 · Scene CRUD — rename · duplicate · reorder · delete" subtitle="A3 from the Slice-3 plan. Desktop: hover-revealed inline action chips + right-click context menu. Mobile: long-press scene tab → bottom-sheet action menu. Destructive ops use inline confirms so surrounding scenes stay visible.">
        <DCArtboard id="scene-crud" label="4 operations · desktop · mobile · open questions" width={1320} height={2600}><SceneCrudArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v20 — PAD CREATION FLOW (A2 · three paths) — Slice 3
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v20-pad-creation-flow" title="v20 · PAD creation flow — three paths" subtitle="A2 from the Slice-3 plan. Tap-slot · drag-from-library · + ADD PAD toolbar — side by side, with mobile variant per path, recommendation, and a scenario-to-path table. All three ship; the call here is about visual prominence for first-time use.">
        <DCArtboard id="pad-creation-flow" label="3 paths · desktop + mobile · recommendation" width={1700} height={2400}><PadCreationFlowArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v19 — EMPTY STATES (A1 · Board · Scene · Library) — Slice 3
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v19-empty-states" title="v19 · Empty states — Board · Scene · Library" subtitle="A1 from the Slice-3 plan. The three cold-start surfaces the design pack didn't cover yet. Desktop + Mobile side-by-side per artboard. Same component, two variants — not a parallel design.">
        <DCArtboard id="empty-board"   label="Empty Board · no scenes"   width={1580} height={1000}><EmptyBoardArtboard /></DCArtboard>
        <DCArtboard id="empty-scene"   label="Empty Scene · no pads"     width={1580} height={1080}><EmptySceneArtboard /></DCArtboard>
        <DCArtboard id="empty-library" label="Empty Library · no items"  width={1580} height={1000}><EmptyLibraryArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v18 — PAD DEPTH · migration to sb-pad (B1 · system stress-test)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v18-depth-migration" title="v18 · PAD depth — migration to sb-pad · RESOLVED" subtitle="B1 from the Slice-3 plan. All four proposals from the stress-test landed in tokens.css and DESIGN_SYSTEM.md. Every v15 treatment now expresses through the contract; the recommended full stack collapses to className=&quot;sb-pad is-deep&quot;.">
        <DCArtboard id="depth-migration" label="Six treatments · BEFORE vs AFTER · what landed" width={1280} height={2400}><PadDepthMigrationArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v17 — PAD APPEARANCE · Settings page with live preview
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v17-pad-appearance" title="v17 · Pad Appearance · Settings + live preview" subtitle="Moves the v15 depth treatments and v15 glow tuning into Settings → Display. Sticky preview pad on the right updates as each control is touched. Interactive — try the segmented controls and sliders.">
        <DCArtboard id="pad-appearance" label="Settings · Display · Pad Appearance · live" width={1280} height={900}><PadAppearanceSettings /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v16 — MUSHROOM CLOCK · verdant-themed timepiece
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v16-mushroom" title="v16 · Mushroom clock for the Verdant theme" subtitle="Replaces the generic standing clock when the Verdant theme is active. Toadstool cap, clock-on-stem, mini-mushroom pendulum bob, mossy roots.">
        <DCArtboard id="mushroom-clock" label="Mushroom clock · comparison + verdant board" width={1280} height={1080}><MushroomClockArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v15 — PAD DEPTH · lifting pads off the canvas
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v15-depth" title="v15 · PAD depth — lifting them off the board" subtitle="Six techniques to add tactile dimensionality without breaking the pixel-art voice. Recommended stack on a deeper canvas at the end.">
        <DCArtboard id="depth-study" label="Six techniques · side by side · recommendation" width={1280} height={2200}><PadDepthArtboard /></DCArtboard>
        <DCArtboard id="depth-board" label="Board · full stack applied"                       width={1280} height={820}><FullBoardWithDepth /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v14 — COMBO-PAD EDITOR (rebuilt to match the actual UI model)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v14-combo" title="v14 · Combo-PAD editor" subtitle="Rebuilt to match the actual implementation: parallel pads inside steps, sequential steps, ∞ loops as background sounds, STOP ALL & FADE OUT ALL as drag-in pseudo-pads.">
        <DCArtboard id="combo-rebuilt" label="Combo-PAD · rebuilt in the design system" width={1280} height={900}><ComboEditorRebuilt /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v13 — ANIMATED FLAME · intro screen + home flame
         Real animated pixel-fire: tap to freeze (blue ice), idle to thaw.
         Warm = GAME mode color family · Frozen = SETUP mode family.
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v13-flame" title="v13 · Animated flame & Intro screen" subtitle="A real animated pixel-fire. Tap repeatedly to freeze; stop tapping to thaw. Warm flame = GAME mode, frozen ice = SETUP mode.">
        <DCArtboard id="intro-screen"  label="Intro · tap the flame"     width={920} height={780}><IntroScreen /></DCArtboard>
        <DCArtboard id="home-flame"    label="Home menu · same flame"    width={920} height={780}><HomeScreenWithFlame /></DCArtboard>
        <DCArtboard id="flame-tune"    label="Five stages + try-it · tuning notes" width={1240} height={1120}><FlameTuneArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v12 — CLOCK MAGIC (easter eggs, zero-moment, toggle)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v12-clock-magic" title="v12 · Clock magic" subtitle="Easter eggs unlocked by tap-count, a cinematic moment when countdowns hit zero, plus a full clock toggle in Display settings.">
        <DCArtboard id="clock-magic" label="Easter eggs · zero moment · settings toggle" width={1240} height={2200}><ClockMagicArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v11 — MOBILE (phone portrait + landscape)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v11-mobile" title="v11 · Mobile companion" subtitle="Honest answer: tokens & atmosphere work everywhere, but layouts need dedicated mobile versions. Here they are.">
        <DCArtboard id="mobile-answer" label="Mobile · answer + screens + landscape" width={1400} height={2400}><MobileAnswerArtboard /></DCArtboard>
        <DCArtboard id="mobile-game"   label="Phone · Board GAME"   width={375} height={812}><MobileBoardGame /></DCArtboard>
        <DCArtboard id="mobile-setup"  label="Phone · Board SETUP"  width={375} height={812}><MobileBoardSetup /></DCArtboard>
        <DCArtboard id="mobile-editor" label="Phone · PAD editor"   width={375} height={812}><MobilePadEditor /></DCArtboard>
        <DCArtboard id="mobile-lib"    label="Phone · Library"      width={375} height={812}><MobileLibrary /></DCArtboard>
        <DCArtboard id="mobile-set"    label="Phone · Settings"     width={375} height={812}><MobileSettings /></DCArtboard>
        <DCArtboard id="mobile-land"   label="Phone · landscape Board" width={812} height={375}><MobileBoardLandscape /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v10 — CLOCKS + THEMED ORNAMENTS
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v10-clock-themes" title="v10 · Clocks & themed ornaments" subtitle="A selectable clock decoration with countdown mode that fires a PAD on zero. Plus a custom ornament vocabulary per theme — no candles in sci-fi, no circuits in horror.">
        <DCArtboard id="clocks-and-themes" label="Four clocks · countdown UX · themed boards" width={1240} height={3400}><ClockAndThemesArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v9 — FUNCTIONAL IDEAS (organisation & clarity proposals)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v9-functional" title="v9 · Functional ideas — organisation & clarity" subtitle="Ten features beyond layout. Each solves a real GM workflow problem. Priorities marked A / B / C.">
        <DCArtboard id="functional-ideas" label="10 ideas · prioritised · with mockups" width={1100} height={2400}><FunctionalIdeasArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v8 — BOARD ATMOSPHERE (cozy decorations)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v8-atmosphere" title="v8 · Board Atmosphere — cozy decorations" subtitle="Ten optional pixel-art atmosphere effects, each scoped so you can mix freely. Designed to feel warm, not busy.">
        <DCArtboard id="cozy-board" label="Cozy Board · everything on, in moderation" width={1280} height={820}><CozyBoard /></DCArtboard>
        <DCArtboard id="atmos-showcase" label="Showcase · ten effects, each alone" width={1000} height={1700}><AtmosphereShowcaseArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v7 — PAD EDITOR (faithful + refined)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v7-pad-editor" title="v7 · PAD Editor — sticky toolbar + 3-column workspace" subtitle="Current editor scrolls forever and buries DELETE. Refined: SAVE / CANCEL / DELETE always visible, columns split by job.">
        <DCArtboard id="pad-edit-actual"  label="PAD Editor · current"  width={1280} height={900}><PadEditActual /></DCArtboard>
        <DCArtboard id="pad-edit-refined" label="PAD Editor · refined"  width={1280} height={800}><PadEditRefined /></DCArtboard>
        <DCArtboard id="pad-edit-notes"   label="What changed & why"    width={620}  height={800}><PadEditNotesArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v4 — LIBRARY (faithful rebuild + refinement)
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v4-library-actual" title="v4 · Library — your current design (faithful rebuild)" subtitle="Reproduced from the screenshots so the refinement diff is honest.">
        <DCArtboard id="lib-audio-a"   label="AUDIO · current"   width={1280} height={800}><LibraryAudioActual /></DCArtboard>
        <DCArtboard id="lib-pads-a"    label="PADS · current"    width={1280} height={800}><LibraryPadsActual /></DCArtboard>
        <DCArtboard id="lib-boards-a"  label="BOARDS · current"  width={1280} height={800}><LibraryBoardsActual /></DCArtboard>
        <DCArtboard id="lib-icons-a"   label="ICONS · current"   width={1280} height={800}><LibraryIconsActual /></DCArtboard>
      </DCSection>

      <DCSection id="v4-library-refined" title="v4 · Library — refined" subtitle="Same 4 tabs, same flows. Tighter rows, persistent breadcrumb, inline waveforms, type facets with dots, status-bar backup chip.">
        <DCArtboard id="lib-audio-r"   label="AUDIO · refined"   width={1280} height={800}><LibraryAudioRefined /></DCArtboard>
        <DCArtboard id="lib-pads-r"    label="PADS · refined"    width={1280} height={800}><LibraryPadsRefined /></DCArtboard>
        <DCArtboard id="lib-boards-r"  label="BOARDS · refined"  width={1280} height={800}><LibraryBoardsRefined /></DCArtboard>
        <DCArtboard id="lib-icons-r"   label="ICONS · refined"   width={1280} height={800}><LibraryIconsRefined /></DCArtboard>
        <DCArtboard id="lib-notes"     label="What changed & why" width={620}  height={800}><RefinementNotesArtboard /></DCArtboard>
      </DCSection>

      {/* ═══════════════════════════════════════════════════════════
         v3 — PAD VARIETY study
         ═══════════════════════════════════════════════════════════ */}

      <DCSection id="v3-variety" title="v3 · PAD variety study" subtitle="Reconstructs your actual board (monotone) and proposes four strategies for adding type identity without competing with mode.">
        <DCArtboard id="board-actual-game"  label="Your board · GAME mode (rebuilt)"  width={1380} height={780}><LibraryActualScreen mode="game" /></DCArtboard>
        <DCArtboard id="board-actual-setup" label="Your board · SETUP mode (rebuilt)" width={1380} height={780}><LibraryActualScreen mode="setup" /></DCArtboard>
        <DCArtboard id="variety-options"    label="4 strategies + recommendation"     width={1320} height={1240}><PadVarietyArtboard /></DCArtboard>
      </DCSection>

      <DCSection id="foundations" title="v1 · Foundations" subtitle="Original token scaffolding — first pass.">
        <DCArtboard id="spacing" label="Spacing · radius · elevation" width={620} height={760}><SpacingArtboard /></DCArtboard>
        <DCArtboard id="icons"   label="Iconography · pixel grid"     width={640} height={840}><IconsArtboard /></DCArtboard>
      </DCSection>

      <DCSection id="components" title="v1 · Components" subtitle="The kit + the decoration set introduced in the pixel-art pass.">
        <DCArtboard id="kit"         label="The kit"                       width={1000} height={920}><ComponentsArtboard /></DCArtboard>
        <DCArtboard id="decorations" label="Decorations · pixel ornaments" width={780}  height={920}><DecorationsArtboard /></DCArtboard>
      </DCSection>

      <DCSection id="hierarchy" title="v1 · Menu hierarchy" subtitle="Site map for orientation. Two levels deep, on purpose.">
        <DCArtboard id="sitemap" label="Information hierarchy" width={1100} height={680}><HierarchyArtboard /></DCArtboard>
      </DCSection>

      <DCSection id="desktop" title="v1 · Desktop screens" subtitle="The first-pass mockups — kept for comparison.">
        <DCArtboard id="home"      label="Home"     width={1280} height={800}><HomeScreen /></DCArtboard>
        <DCArtboard id="board-v1"  label="Board (v1)" width={1280} height={800}><BoardScreen /></DCArtboard>
        <DCArtboard id="library"   label="Library (v1)" width={1280} height={800}><LibraryScreen /></DCArtboard>
        <DCArtboard id="settings"  label="Settings (v1)" width={1280} height={800}><SettingsScreen /></DCArtboard>
      </DCSection>

      <DCSection id="responsive" title="v1 · Responsive" subtitle="Same atoms re-laid for smaller surfaces.">
        <DCArtboard id="tablet-board" label="Tablet · Board"  width={834}  height={1112}><TabletBoardScreen /></DCArtboard>
        <DCArtboard id="phone-home"   label="Phone · Home"    width={375}  height={812}><PhoneHomeScreen /></DCArtboard>
        <DCArtboard id="phone-board"  label="Phone · Board"   width={375}  height={812}><PhoneBoardScreen /></DCArtboard>
      </DCSection>

      <DCSection id="themes" title="Themes" subtitle="One design system, four moods. Apply by setting a theme-* class on a wrapper.">
        <DCArtboard id="theme-grid"    label="Palette comparison"     width={1100} height={620}><ThemesComparisonArtboard /></DCArtboard>
        <DCArtboard id="theme-hearth"  label="Hearth · default"       width={760}  height={680}><ThemedScreen theme=""        screen="home-compact" /></DCArtboard>
        <DCArtboard id="theme-verdant" label="Verdant · D&D fantasy"  width={760}  height={680}><ThemedScreen theme="verdant" screen="home-compact" /></DCArtboard>
        <DCArtboard id="theme-neon"    label="Neon · sci-fi"          width={760}  height={680}><ThemedScreen theme="neon"    screen="home-compact" /></DCArtboard>
        <DCArtboard id="theme-crimson" label="Crimson · horror"       width={760}  height={680}><ThemedScreen theme="crimson" screen="home-compact" /></DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
