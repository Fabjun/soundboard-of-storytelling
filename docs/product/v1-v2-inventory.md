# V1 / V2 feature inventory

> **Leaf of [docs/product/README.md](README.md).** Created 2026-09-28. Lists what the prototypes V1 and
> V2 could do and where V3 stands, so the product owner can decide per feature what V3
> adopts. Per [docs/product/README.md §7](README.md#7-design-principles) P7 this describes
> **behavior, not code to copy** — anything adopted is re-implemented in V3 idiom.
>
> **Naming:** "Scene" is renamed to **Deck** (docs/product/README.md Q1). Feature names below keep the
> historical V1/V2/current-code wording.

## Sources

- **V1** — `v1-reference/index.html` (APP_VERSION 179, 2026-05-26). Changelog v37–v179
  (earlier entries not recorded), keyboard handler `index.html:8586ff`.
- **V2** — folder `v1_5/` of the V1 repo `Fabjun/botc-soundboard` (v1.5.x → renamed
  v2.0.0–v2.0.12, 2026-05-25/26; 52 commits). Repo private since 2026-09-29; complete local
  archive in `~/dev/archive/botc-soundboard/` (outside this repo). V2 rebuilt most V1 features
  in a new structure; genuinely new in V2: the **scene model**, **pad sets + Quick Access
  strip**, **audio ducking**. V3's data model (Board → Scene → Pad, PadSet) derives from V2.

## Legend

**V3 status** — as found in code on 2026-09-28:

| Value | Meaning |
|---|---|
| **built** | usable in the V3 UI |
| **engine only** | implemented in `src/audio/`, no UI to use it |
| **model only** | field exists in `src/types.ts`, nothing reads or edits it |
| **missing** | not present |

**Decision** — **Open** until the product owner decides: *adopt* (→ docs/product/README.md / BACKLOG),
*Parked*, or *drop*. Reviewed area by area in dialogue.

---

## 1. Pads & playback

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Single pad (one-shot) | ✓ | ✓ | built | `PadGridCell.tsx` tap → `play()` | **Decided** (§5 Pads; multi-file = V1 "random") |
| Loop pad | ✓ | ✓ | built (infinite only) | CLAUDE.md Slice 4 deviations | **Decided** (§5 Pads; multi-file in order / shuffle) |
| Playlist pad (V2 label "LIST ☰"); V1 variants playlist / chain / random | ✓ | ✓ | engine only — engine plays sequential or shuffle; editor picks **one** file | `engine.ts:243ff`; `PadEditorPanel.tsx:124` | **Decided**: merged into Loop (§5 Pads, Q2) |
| Combo pad: steps, foreground/background, "stop all" / "fade out all" as steps | ✓ | ✓ | engine only — no step editor | `types.ts ComboStep`; `PadEditorPanel.tsx:128` passes steps through | **Decided** (§5 Combos) |
| Nested combos with cycle detection | ✓ | ? | missing | — | **Decided** (§5 Combos) |
| Combo editor: drag chips between steps, reorder steps | ✓ | ✓ | missing | — | **Decided** — target scope (§5 Combos) |
| Combo per-chip volume and fade-in | — | ✓ | missing | — | **Decided** — target scope (§5 Combos) |
| Per-pad volume | ✓ | ✓ | built | editor volume slider | **Decided** (§5) |
| Per-pad fade in / fade out | ✓ | ✓ | built (fade-out on stop effectively 0) | CLAUDE.md Slice 4 deviations | **Decided** (§5) |
| Trim start / end with visual scrubber | ✓ | ✓ | engine only | `trimStart` in `types.ts`, `engine.ts`; no UI | **Decided** — low priority (§5) |
| Preview inside the PAD editor | ✓ | ✓ | missing | no audio import in `PadEditorPanel.tsx` | **Decided** (PRODUCT §3) — not yet built |
| Quick volume slider (long-press on playing pad in GAME) | ✓ | ✓ | missing | — | **Parked** (§5) |
| Double-tap to stop in GAME (single tap on playing pad = no-op) | ✓ | ? | missing — V3 tap toggles | `PadGridCell.tsx:84-88` | **Parked** — Settings option (§5) |
| Audio ducking (loops dip while a foreground sound plays) | — | ✓ | missing | — | **Parked** (§5) |
| Master volume | ✓ | ✓ | engine only | `masterGain` in `engine.ts` | **Parked** (§5) |
| Crossfade between pads | ? | — | engine stub (`stop` + `play`) | `audio/index.ts:96` | **Parked** (§5) |
| Pad level meter (live amplitude on playing pads) | ✓ | ✓ | missing | — | **Parked** (§5) |
| Now-playing bar / "N playing" summary | ✓ | ? | missing | — | **Open** — layout (§5) |

## 2. Controls & numpad

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Assign a key to each pad (captures `e.code`: numpad "1" ≠ main-row "1") | ✓ | ✓ | model only — `hotkey` shown read-only | `types.ts:59`; editor comment "Key-Capture = Slice 8" | **Decided** (§6 K1, K2) |
| Key press plays the pad; re-press never stops a running sound (deliberate, live safety) | ✓ | ✓ | missing | V1 `playFromKey`, `index.html:4820` | **Decided** (§6 K3, K4) |
| Space = pause all | ✓ | ? | missing | V1 `index.html:8591` | **Decided** (§6 K7, K8) |
| Enter = stop last started (SERIAL) or all (TOTAL), setting | ✓ | ✓ | missing | V1 `index.html:8592-8596` | **Decided** (§6 K5; mode setting via K12) |
| Numpad decimal = stop all | ✓ | ? | missing | V1 `index.html` keydown handler | **Decided** (§6 K6) |
| Key test screen (identify key codes) | ✓ | ? | missing | — | **Parked** (§6) |
| Keymap overlay (help key shows all assignments) | ✓ | ✓ | missing | — | **Parked** (§6); key shown on pad: **Decided** (K10) |
| Stop all / panic / fade-all button | ✓ | ✓ | engine only | `stopAll`, `fadeOutAll` only in `audio/index.ts` | STOP ALL **Decided** (§6 K9); fade-all **Open** |
| Screen Wake Lock in GAME (keeps Bluetooth numpad working) | ✓ | ✓ | missing | no `wakeLock` in `src/` | **Decided** (§6 K11) |
| Cue stack: long-press queues pads, TAB fires next | ✓ | ✓ | missing | — | **Parked** (§6) |
| Configurable long-press action in GAME (volume / rename / cue / off) | ✓ | ✓ | missing | — | **Parked** (§6) |
| Auto-stop after inactivity (setting) | ✓ | ✓ | missing | — | **Parked** (§6) |
| Command palette (Ctrl/Cmd+K) | ✓ | ✓ | missing | — | **Parked** (§6) |
| Mode toggle GAME / SETUP | ✓ | ✓ | built | `ModeToggle.tsx` | **Decided** (PRODUCT §3) |
| Custom sound on mode switch | ✓ | ✓ | missing | — | **Parked** (§6) |
| Lock against accidental mode switch | — | — | missing | — | **Decided** (PRODUCT §3) — not yet built |

## 3. Board, decks & quick access

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Boards: create / rename / delete | ✓ | ✓ | built | `BoardListScreen.tsx` | Open |
| Board duplicate | ✓ | ✓ | missing | — | Open |
| Board search / filter | — | ✓ | missing | — | Open |
| Scenes: create / rename / duplicate / reorder / delete + undo | — | ✓ | built **except reorder** (not built — corrected 2026-09-29; the earlier "built" relied on a code comment) | `DeckRail.tsx` | **Decided** — become decks: hand-picked views of the pad pool (§5, Q1) |
| Switching scenes | — | ✓ | built (desktop rail) | `DeckRail.tsx` | **Decided** (PRODUCT §3): classic controls, desktop + phone |
| Pad sets + Quick Access strip (pads pinned across scenes/boards) | ✓ (strip) | ✓ | model only | `Board.sets`, `PadSet` in `types.ts` | Sets **dropped**; quick-access bar **Decided** — board-wide, fixed keys (§5, K13) |
| Pad drag: swap (centre) and insert (edge) | ✓ | ✓ | built (SETUP), E2E-tested since 2026-09-29 | `padDnd.ts`, `pad-dnd.spec.ts` | Open |
| Quick rename (long-press in SETUP) | ✓ | ✓ | missing | — | Open |
| Search + sort pads on the board | ✓ | ? | missing | — | **Decided** (§5: per view, combinable, temporary) |
| Filter pads by type (ALL / S-PAD / C-PAD) | ✓ | ? | missing | — | Open |
| Grid: columns AUTO / 2–6, pad size, gap, label size, square / circle | ✓ | ✓ | model only (`gridConfig`), no UI | `types.ts Scene.gridConfig` | Open |

## 4. Library

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Audio upload (serial, waveform peaks, duration) | ✓ | ✓ | built | `lib/upload.ts` | Open |
| Rename / 2-tap delete / search | ✓ | ✓ | built | `LibraryScreen.tsx` | Open |
| Preview in the Library | ✓ | ✓ | missing | — | Open |
| Sort (date / edit / name) | ✓ | ✓ | missing | — | Open |
| Groups / folders, multi-select, bulk move | ✓ | ✓ | missing — V3 has read-only tags + a CATEGORY placeholder | `LibraryScreen.tsx:235, 244` | Open |
| "In use" indicator (which pads use a file) | ✓ | ? | missing | — | Open |
| Original filename kept after rename | ✓ | ? | missing | — | Open |
| Pad templates (save pad, assign to another board) — PADS tab | ✓ | ✓ | missing — tab is a placeholder | `LibraryScreen.tsx:9` | Open |
| Boards tab in the Library | ✓ | ✓ | missing — placeholder | `LibraryScreen.tsx:9` | Open |
| Icons: ~2,300 built-in pixel icons, up to 4 per pad, custom SVG upload, auto-icon from pad name | ✓ | ✓ | model only (`iconRef`) — ICONS tab is a placeholder | `types.ts`; `LibraryScreen.tsx:9` | Open |

## 5. Data & backup

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Export everything as `.json.gz` (streamed, iOS-safe); iPhone share sheet | ✓ | ✓ | missing | no export code in `src/` | **Decided** (data-backup D1, D6) |
| Import with conflict resolution (keep both / replace / skip) | ✓ | ✓ | missing | — | **Decided**, simplified (data-backup D2 + import rules) |
| Auto-backup (3 rotating files, File System Access API, desktop Chromium) | ✓ | ✓ | missing | — | **Parked** (data-backup) |
| Backup age indicator + reminder banner | ✓ | ✓ | missing | — | **Decided** (data-backup D3) |
| Import of V1 backups into the newer format | — | ✓ | missing (planned Slice 10: data backup & import) | CLAUDE.md slice table | **Decided** (data-backup D5) |
| Reset all data | ✓ | ✓ | missing | — | **Parked** (data-backup) |

**Risk note:** V3 keeps all boards and audio only in the browser's IndexedDB. Without export,
data loss (e.g. iOS evicting site data) is unrecoverable.

## 6. Settings

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Settings screen (sub-menus: controls, appearance, visuals, keybinding, data, developer) | ✓ | ✓ | missing | `src/screens/` has no Settings | Open |
| Start mode setting | ✓ | ✓ | missing | — | **Parked** (PRODUCT §3) |
| Appearance: content width, font / symbol / icon scale, density | ✓ | ✓ | missing | — | Open |
| Developer: debug log, stats, LRU view | ✓ | ? | missing | — | Open |

## 7. Visuals & atmosphere

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Themes (base + Verdant / Neon / Crimson) | ✓ | ? | missing (`Board.themeId` in model) | `types.ts` | Open |
| Pad type colours + spine + depth | ✓ | ✓ | built | ADR-0027, `is-deep` | Open |
| Mode colours (SETUP teal / GAME gold), sparks on mode switch | ✓ | ✓ | built | `ModeToggle.tsx` | Open |
| Atmosphere: now-playing aura, breathing loops, hearth glow, ambient embers; animations toggle | ✓ | ✓ | missing | — | Open |
| Animated pixel flame (warm = GAME, frozen = SETUP) | ✓ | ? | missing | — | Open |
| Fullscreen button | ✓ | ? | missing | — | Open |

## 8. Help & onboarding

| Feature | V1 | V2 | V3 status | Evidence | Decision |
|---|---|---|---|---|---|
| Onboarding slides on first launch | ✓ | ✓ | missing | — | Open |
| Context tips (? button per screen) | ✓ | ? | missing | — | Open |
| In-app changelog | ✓ | ✓ | built (data) | `lib/changelog.ts` | Open |
| Unsaved-changes guard in editors | ✓ | ✓ | n/a — V3 editor auto-saves | `PadEditorPanel.tsx` header | Open |
| Update-available modal with backup before reload | ✓ | ? | missing | — | Open |

---

**"?"** = not verified in V2 source; check before deciding if it matters.
