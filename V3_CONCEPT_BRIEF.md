# V3.0 Concept Brief — Soundboard of Storytelling

> **Orientation for Claude Code:**
>
> This is a **fresh implementation** in a new tech stack. It is not a
> migration of V1 and not a continuation of the V1.5 plan. Both
> `MIGRATION_PLAN.md` and `V1_5_CONCEPT_BRIEF.md` are **obsolete** for
> this work. Read them only as background on what V1 does and what
> was learned about it.
>
> V3.0 lives in a new project directory. V1 (`index.html`) remains
> untouched and stays usable for real gaming sessions until V3.0
> reaches feature parity.

---

## 1 · Stack

- **Preact** (not React) — smaller bundle, same JSX
- **TypeScript** — native to Vite, expected by the ecosystem
- **Vite** — dev server and build tool
- **IndexedDB** — local persistence, same as V1
- **PWA** — manifest + service worker, offline-capable
- **No backend** — local-first

## 2 · What V3.0 is

A re-implementation of Soundboard of Storytelling with:

- The design system (`tokens.css`, JSX components) as the visual and
  structural foundation, used **directly** (no porting to vanilla)
- A clean data model resolving V1's conceptual issues
  (Library/SETUP conflation)
- Working logic ported from V1 where appropriate (audio engine,
  IndexedDB schema, template export/import)
- A component-based architecture from the start

V1 keeps running. V3.0 is built in parallel until ready.

## 3 · Relationship to existing artifacts

**V1 (`v1-reference/index.html`, `v1-reference/sw.js`):**
- Reference for behavior — read when porting features
- Source of the audio engine (copy into V3.0, wrap behind clean API)
- Source of IndexedDB schema and template export/import format
- Not to be modified

**Design system (`SoS_DESIGN_25052026/`):**
- `tokens.css` — canonical tokens, used directly
- JSX files (`v2-screens.jsx`, `foundations.jsx`, etc.) — **used as
  starting code**, not as reference. Lift them into V3.0, adapt to
  TypeScript and the V3.0 state model.
- `HANDOFF.md` — moved to `v1-reference/HANDOFF.md`; originally written
  for V1 migration context, still valuable for design intent and JSX-file
  index (see CLAUDE.md §Reference documents for usage guidance)
- `dist/` — partial vanilla ports, ignore in V3.0 (we use JSX directly)

**V1.5 prototypes:**
- Obsolete; removed from repo. Not used in V3.0.

## 4 · Architectural decisions (binding)

### 4.1 · Data model

> **Canonical types:** `v3/src/types.ts` — source of truth for the current schema.
> The model diverged from the original sketch during Slices 1–4; specific changes
> are in CLAUDE.md §Deviations. The TypeScript sketch that was here has been removed
> to eliminate a second copy that could drift.

**Key concepts:** → moved to [docs/product/PRODUCT.md §5](docs/product/PRODUCT.md#5-core-concepts)
(2026-09-28). Revised there: pads belong to a board-wide pool; decks (formerly "scenes") are hand-picked views;
pad sets are dropped in favor of a board-wide quick-access bar.

### 4.2 · Component architecture

Every UI element has **one** component. Variants via props.

```tsx
function Pad({ pad, mode, isHot }: PadProps) { ... }
function Button({ label, variant, icon, onClick }: ButtonProps) { ... }
function PixelIcon({ name, size, color }: PixelIconProps) { ... }
function SceneCard({ scene, active, onClick }: SceneCardProps) { ... }
```

When a new variant is needed: **extend the existing component with a
new prop**. Never create a parallel component for "slightly different"
needs. If tempted, ask the user.

### 4.3 · State management

**Decision (Slice 1, ADR-0002): Preact Signals.** Zustand was the
alternative; Signals was chosen for its native Preact integration,
zero Provider overhead, and automatic granular re-renders. This
decision is irreversible without a full state-layer rewrite.

A central store holds all UI state. Components read signals via
`.value` or auto-subscribed JSX binding (no "hooks"). Mutations via
exported setter functions (e.g. `addPlayingPad`, `removeLoopingPad`).
IndexedDB is the persistence layer, not the truth layer.

> **Canonical signal definitions:** `v3/src/state/store.ts`
> **Types (`AppMode`, `AppScreen`, etc.):** `v3/src/types.ts`
> The AppState sketch that was here has been removed to eliminate a
> second copy that could drift from these sources of truth.

### 4.4 · Audio engine

V1's audio engine is **copied unchanged** into V3.0 behind a clean
TypeScript-typed facade:

```typescript
// src/audio/index.ts
export function play(padId: string, pad: Pad): Promise<void>;
export function stop(padId: string, immediate?: boolean, fadeOut?: number): void;
export function crossfade(from: string, to: Pad, duration: number): void;
// NOTE: crossfade is a stub in Slice 4 (stop from, play to — no simultaneous overlap yet)
// internal: V1's audio code in engine.ts, kept as-is
```

Do not redesign audio behavior. Do not improve the engine. Copy,
wrap, move on.

### 4.5 · IndexedDB

V1's schema is preserved where it overlaps. Extended with new stores
for Scenes and Sets. Existing field names and types compatible.

**Compatibility goal:** V1 boards (exported as templates) import
cleanly into V3.0. A V1 board becomes a V3.0 board with one default
Scene containing all pads.

**Decision (Slice 2, ADR-0016): `idb`** (Jake Archibald's TypeScript
wrapper, ~1.4 KB gzip). Raw IndexedDB and Dexie were considered and
rejected. All IDB access routes through `v3/src/db/idb.ts` — raw
transactions outside that layer are forbidden.

### 4.6 · Template export/import

→ moved to [docs/product/features/data-backup.md](docs/product/features/data-backup.md)
(2026-09-28). Revised there: V1 import stays; the V1-readable export is **dropped**.

### 4.7 · Tokens

Token language follows the design system canonically:
- Fonts: `--font-display`, `--font-ui`, `--font-mono`
- Mode colors: `--mode-setup`, `--mode-game`
- Spacing: `--space-1` through `--space-16`
- Colors, borders, shadows, glows per `tokens.css`

`tokens.css` is imported directly into V3.0. No renames, no aliases
to V1 names.

### 4.8 · Project structure

Implemented structure (post-Slice 4):

```
v3/
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icons.svg          (manifest.json + sw.js auto-generated by vite-plugin-pwa)
├── src/
│   ├── main.tsx            (entry)
│   ├── app.tsx             (root component — lowercase)
│   ├── app.css
│   ├── index.css
│   ├── types.ts            (shared TypeScript types — source of truth for schema)
│   ├── audio/              (V1 engine + typed facade)
│   │   ├── engine.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── chrome/             (TopBarV2, StatusBarV2)
│   ├── components/         (Pad, Button, PixelIcon, SceneRail, etc.)
│   ├── db/
│   │   └── idb.ts          (all IDB access — no raw transactions elsewhere)
│   ├── lib/                (upload, padDnd, libDnd, padUtils, nanoid, changelog)
│   ├── screens/            (StartScreen, BoardListScreen, BoardScreen, LibraryScreen)
│   ├── state/
│   │   └── store.ts        (Preact Signals — all app state)
│   └── styles/
│       ├── tokens.css
│       └── global.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 4.9 · PWA / Service Worker

Use **`vite-plugin-pwa`** for service-worker generation. Auto-handles
cache invalidation, asset listing, version bumps. Configure for:
- Cache-first for app shell
- Network-first for dynamic content (none yet, but ready)
- Skip-waiting + clients-claim on update

Why a plugin: V1's manual `sw.js` worked but required discipline
(SHELL list, VERSION bumps). The plugin removes that failure mode.

### 4.10 · Responsive

V3.0 uses a **two-axis adaptive model** (→ `docs/architecture/0045-two-axis-adaptive-model.md`):
Axis 1 adapts the frame layout to screen format (narrow/portrait → bottom dock; wide/landscape →
side rail). Axis 2 adds input capabilities progressively (touch is the base everywhere; mouse/
keyboard add hover, right-click, shortcuts non-destructively). One adaptive app — no separate
mobile variant, no version switch.

### 4.11 · Language

English only. No i18n infrastructure yet, but structure code so a
future i18n pass is feasible (texts in named constants, not hardcoded
in JSX).

### 4.12 · Accessibility

Baseline (semantic HTML, design-system contrasts) but no dedicated
a11y pass.

### 4.13 · Supported platforms (binding)

**Primary target:** iPhone 13 Pro (iOS 17/18) + Brave browser.

**Minimum supported:**
- iOS Safari 15+ (iPhone 6s and newer)
- Android Chrome 100+ (~2022)
- Desktop: current Chromium, Firefox, Safari (last 2 major versions)

**Guaranteed APIs (all on minimum):** Pointer Events, IndexedDB, Web Audio API,
Service Worker / PWA, CSS clamp()/prefers-reduced-motion, IntersectionObserver.

**Graceful degradation only:** Container Queries (iOS 16+), View Transitions (iOS 18+).

**Explicitly avoided:**
- HTML5 Drag-and-Drop (`draggable`, `ondragstart`, `ondrop`) — not supported
  on iOS Safari/Brave. **All DnD must use Pointer Events.**
  See `src/lib/padDnd.ts` and `src/lib/libDnd.ts` as canonical patterns.
- Any API requiring iOS 17+ as a hard dependency.

## 5 · Working method

### 5.1 · Vertical slices

Build in working slices, not horizontal layers. Each slice ends with
a committable, testable, screenshot-verifiable result.

Slice list and status → moved to `CLAUDE.md §Slice progress` (single source, 2026-09-28).
Re-planned there: Slices 5–8 superseded (numbers not reused); new plan Slices 9–14.

### 5.2 · Using design-system JSX

The JSX files in `SoS_DESIGN_25052026/` are starting material. Approach:

1. Read the relevant JSX file
2. Copy the structure into a new TypeScript component
3. Add typed props
4. Connect to V3.0 state via signals (read via `.value` or auto-subscribed JSX
   binding; see `v3/src/state/store.ts`)
5. Adapt where the design assumed React (mostly no changes needed —
   Preact is API-compatible)

Do not duplicate components. If two screens use the same component,
both import it from the same file.

### 5.3 · When V1 is needed

For any feature whose behavior isn't obvious from the design, read
V1's code. V1 is the reference for:
- Audio engine internals
- Drag-and-drop behavior
- Hotkey wiring
- Crossfade timing
- Playlist semantics
- Combo-pad chain logic
- Export/import format details
- Edge cases (deleting a pad during playback, etc.)

Before porting V1 behavior: summarize what V1 does, confirm with user,
then implement.

### 5.4 · When to ask

Ask the user — don't assume — when:
- A V1 behavior is ambiguous
- The data model needs extension beyond §4.1
- A component variant tempts parallel implementation
- A V1↔V3 incompatibility appears
- A new third-party library is being considered

### 5.5 · Discipline points

- Never silent file deletions
- Never schema changes without confirmation
- Never audio-engine modifications
- Always announce new dependencies before adding them
- Always typed props, no `any`

## 6 · Out of scope for V3.0

- Real-time multi-user sync
- Cloud storage
- Live audio sharing during play
- Plugin system
- Multi-language (English only)
- Comprehensive accessibility (baseline only)

## 7 · How to start

1. Read this brief in full.
2. Read `v1-reference/HANDOFF.md`.
3. Skim V1 (`v1-reference/index.html`) for orientation.
4. Slices 1–4 are already implemented — check `v3/src/screens/` to orient on what
   exists. For future slices, relevant design-system JSX files are in
   `SoS_DESIGN_25052026/` (versioned v2–v26 exploration files).
5. Ask the user which slice to start with. Current next: see `CLAUDE.md §Slice progress`.
6. Before writing code, summarize back:
   - Scope of the slice
   - Files to create
   - Dependencies to add (with rationale)
   - V1 code to read first (if any)
7. Wait for confirmation. Then build.

## 8 · Style

The user works with engineering discipline: explicit assumptions,
honest uncertainty, measurement over guessing, deliberate trade-offs.

Match that. Flag uncertainty. Name trade-offs. Don't perform false
confidence. Don't over-explain when action is asked. Don't
under-explain when understanding is asked.

---

*End of brief. Begin with §7 step 5.*
