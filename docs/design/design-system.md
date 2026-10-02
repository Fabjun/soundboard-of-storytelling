# Soundboard of Storytelling — Design System

> **Source of truth.** `docs/design/design-system-cheatsheet.md` is the single-page quick reference
> for daily use. When the cheatsheet and this document conflict, this document wins.
> Documentation roles and relationships across all project docs: see `../README.md`.

---

## §1 Naming Conventions (project-wide)

<!-- TODO: Write out each sub-topic below. Short form in docs/design/design-system-cheatsheet.md. -->

### CSS class naming

<!-- TODO: Write up fully. Conventions already followed:
     Block: sb-<block> (e.g. sb-pad, sb-btn)
     Part:  sb-<block>-<part> (e.g. sb-pad-title, sb-btn-sm)
     State: is-<state> (e.g. is-hot, is-setup) — never block-scoped
     Per ADR-0021. Short form in docs/design/design-system-cheatsheet.md#the-60-second-contract. -->

### Token naming

<!-- TODO: Write up fully. --<name> conventions; grouping by section; when to use
     --sb-* legacy aliases vs. canonical names. Per ADR-0022. Already followed
     — needs writing up. -->

### Component & file naming

<!-- TODO: Write up fully. PascalCase components (e.g. AudioRow, ModeToggle,
     PadCreationPopover). File name matches component name (AudioRow.tsx = AudioRow
     component). Already followed — needs writing up. -->

### Signal & state naming

<!-- TODO: Write up fully. camelCase signals, no prefix/suffix (e.g. audioContextState,
     currentScreen, libraryItems). Exported from src/state/store.ts. Already followed
     — needs writing up. -->

### Lib & helper function naming

<!-- TODO: Write up fully. camelCase functions in camelCase files (padDnd.ts, libDnd.ts,
     padUtils.ts, upload.ts, nanoid.ts). Already followed — needs writing up. -->

### ADR file naming

<!-- TODO: Write up fully. NNNN-kebab-slug.md in docs/architecture/; template at
     docs/architecture/_template.md; index in docs/architecture/README.md.
     Already followed — needs writing up. -->

### data-testid naming

<!-- TODO: Convention documented in docs/development/testing.md — cross-reference, do not duplicate here. -->

### Branch/commit conventions

<!-- TODO: No formal convention established yet. Gap to document. -->

---

## §2 Pixel frame system

<!-- TODO: write out in full — short version in docs/design/design-system-cheatsheet.md decision tree -->

Base classes of the pixel frame family: `sb-pix`, `sb-card`, `sb-pad`, `sb-btn`,
`sb-pill`, `sb-menu-row`. Customise via the CSS custom properties `--pix-bg`,
`--pix-border`, `--pix-step` — never write new clip-path/border CSS.

---

## §3 State vocabulary (closed set)

Currently registered state classes (short list also in
[design-system-cheatsheet.md §Quick reminders](design-system-cheatsheet.md#quick-reminders)):

| Class              | Meaning                            |
| ------------------ | ---------------------------------- |
| `is-active`        | Active element within a group      |
| `is-on`            | Binary on state (toggle)           |
| `is-hot`           | Audio is playing                   |
| `is-setup`         | SETUP mode active                  |
| `is-game`          | GAME mode active                   |
| `is-danger`        | Destructive action (2-tap confirm) |
| `is-conflict`      | Name conflict / invalid input      |
| `is-raised`        | Raised surface (surface hierarchy) |
| `is-italic`        | Italic rendering                   |
| `is-loop`          | Loop context                       |
| `is-playlist`      | Playlist context                   |
| `is-combo`         | Combo context                      |
| `is-deep`          | Opt-in for the pad depth stack     |
| `is-compact`       | Compact rendering                  |
| `is-looping`       | Pad is currently looping           |
| `is-drag-source`   | DnD: this pad is being dragged     |
| `is-drag-swap`     | DnD target: swap with this pad     |
| `is-insert-before` | DnD target: insert before this pad |
| `is-insert-after`  | DnD target: insert after this pad  |

Add new state classes here **before** they are used in code. `has-*` classes (e.g. `has-divider`) are allowed as state classes too (ADR-0052).

---

## §4 Component anatomy

<!-- TODO: describe how sb-pix, sb-card, sb-pad are built structurally -->

---

## §5 Token usage rules

<!-- TODO: which token when — colour tokens, spacing, typography, radius, shadows -->

Forbidden patterns in new V3 code:

- colour literals (hard-coded `#hex` or `rgb(...)`)
- `--sb-*` legacy aliases (only for backward compatibility with old CSS)
- `border-radius` on the `sb-pix` family (pixel-art shapes use clip-path)
- `box-shadow` on clip-path elements (use `filter: drop-shadow()` instead)
- utility classes (`sb-mt-4` etc.)

---

## §5a Layout Primitives

Layout-only structure classes — flex/gap/align wrappers with no visual styling. Use these
instead of inline `style={{ display: 'flex', ... }}` (Path B in [CLAUDE.md §Permanent coding standards](../../CLAUDE.md#permanent-coding-standards)).
Defined in `v3/src/styles/tokens.css`; all appear in the generated [§6 inventory](#6-component-inventory) below.

> **Maintenance:** When adding, renaming, or removing a layout-primitive class in
> `v3/src/styles/tokens.css`, update this table in the same commit.
> _(Interim process-note: a planned code task will formalise this as an automated
> drift-guard — introducing a `/* @layout-primitive: <purpose> */` CSS tag on each
> primitive and a check (extending the existing sync tooling) that flags removals and
> new unregistered primitives. Until that check exists, this table is the canonical
> list and the process-note is the guard.)_

| Class         | CSS                                                          | Purpose                                                                                   |
| ------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `sb-row`      | `flex; align-items:center; gap:8px (--space-2); min-width:0` | Horizontal row with overflow guard. Default for icon+label pairs and toolbar rows.        |
| `sb-row-sm`   | `flex; align-items:center; gap:4px (--space-1)`              | Compact row for tight action clusters.                                                    |
| `sb-row-wrap` | `flex; flex-wrap:wrap; gap:4px (--space-1)`                  | Wrapping row for grids and tag groups.                                                    |
| `sb-row-fill` | `flex:1; flex; align-items:center; justify-content:center`   | Fills flex parent and centers content both axes. Use for empty-state placeholders.        |
| `sb-col`      | `flex; flex-direction:column; min-height:0`                  | Vertical flex container with scroll-overflow guard. Required parent for `sb-scroll-fill`. |
| `sb-flex-1`   | `flex:1`                                                     | Takes all remaining space in a flex parent. Use as spacer or to push siblings apart.      |

**Related flex utilities** (not pure layout primitives — extend flex with additional behaviour;
also in [§6](#6-component-inventory)):

| Class            | Extends with                                                                                           | Use case                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `sb-flex-min`    | `flex:1; min-width:0`                                                                                  | Flex-fill for truncatable text in a flex row.        |
| `sb-flex-trunc`  | `flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`                     | Truncating flex-fill for text labels that must clip. |
| `sb-scroll-fill` | `flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; min-height:0` | Scrollable flex fill — requires a `sb-col` ancestor. |

---

## §6 Component inventory

> Generated via `npm run sync:classes`. Descriptions come from the
> `/* @inventory: description */` comment at the CSS definition.
> Classes without a comment appear with an empty description — deliberately,
> to make missing documentation visible.

<!-- AUTO-GENERATED:sb-classes START — do not edit by hand -->

| Class                          | Description                                                                                                                                                                                                                                                                                                                                                                        | Defined in                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `sb-animated-flame`            | Root of AnimatedFlame (StartScreen) — footprint of the 16×17 flame itself; anchors the larger canvas field. Size set inline (prop-driven).                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-animated-flame-canvas`     | AnimatedFlame canvas — 32×40-cell field overflowing the flame box (room for sparks, steam, shards); pixelated; no double-tap zoom. Size, offset, cursor and glow filter set inline (computed).                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-audio-col-duration`        | Duration metadata column in AudioRow — mono xs, text-dim, centered. For the 70px duration column.                                                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-audio-col-size`            | File-size metadata column in AudioRow — mono xs, text-dim. For the 90px file-size column (not centered, unlike duration).                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-audio-row`                 | Main container grid for AudioRow — 5-column table layout (name 160px \| waveform 1fr \| duration 70px \| size 90px \| delete 44px). Cursor + userSelect for row click; background and borderLeft set inline for selected state. NOTE: fixed columns (364px) + gaps (48px) = 412px min — overflows 390px mobile viewport; pre-existing design, deferred to Slice 8 responsive pass. | `v3/src/styles/tokens.css` |
| `sb-audio-row-delete-btn`      | Bare 44×44px delete button in AudioRow — centered flex icon container, no background, pointer cursor. Border and color set inline for deleteStep confirm state (2-tap confirmation pattern).                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-audio-row-name`            | Display-state name span in RenameField within AudioRow — font-ui fs-sm, click-to-edit cursor, block display with ellipsis truncation. Truncation is context-bound (inseparable from the element's function), not a utility add-on.                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-audio-row-rename`          | Editing-state input in RenameField within AudioRow — font-ui fs-sm (14px), sunk background, strong border. Distinct from sb-row-rename-input (fs-lg/18px, uppercase for board names).                                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-board-body`                | 3-column content row in BoardScreen — fills space between TopBar and StatusBar, flex row with overflow containment.                                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-board-list-area`           | Scrollable board list container in BoardListScreen — flex column fill with iOS-touch scroll and overscroll containment.                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-board-main`                | Center column of BoardScreen 3-col layout — flex column fill with min-width:0 (allows inner content to shrink) and overflow containment.                                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-board-row`                 | Board list row modifier for sb-menu-row — raised pixel-frame background, pointer cursor, tighter gap/padding, 56px min-height. Overrides sb-menu-row defaults via later cascade.                                                                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-board-topbar`              | 3-column grid header bar for BoardScreen (back + breadcrumb \| mode-toggle \| actions).                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-board-topbar-left`         | Left column of the board top bar (flex row, back button + breadcrumb).                                                                                                                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-board-topbar-right`        | Right column of the board top bar (actions, right-aligned).                                                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-btn`                       | Pixel-frame button base; all button variants extend this.                                                                                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-btn-block`                 | Full-width block button modifier — 100% width, centered, 44px min touch target (iOS guideline).                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-btn-clear`                 | Bare inline clear/dismiss button — no pixel frame, mono xs text in text-mute, pointer cursor.                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-btn-cta`                   | CTA button sizing modifier — 200px min-width, 44px min-height (iOS touch guideline). For primary action buttons in empty states.                                                                                                                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-btn-danger`                | Button variant for destructive actions; blood-red border and label.                                                                                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-btn-filled`                | Button variant — solid gold fill and dark label; primary CTA. Currently no TSX usage. [unused-css]                                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-btn-ghost`                 | Button variant — transparent fill, dimmed border; low-emphasis.                                                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-btn-icon`                  | Icon-sized button modifier for sb-btn — 28×28px touch target, tight padding.                                                                                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-btn-icon-sm`               | Compact icon-button modifier — 36px min-width, tight 6px padding. For icon-only action buttons in list rows (edit, delete). Bet for 3g reuse (AudioRow).                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-btn-muted`                 | Visually recessive action button — 11px font (deliberate off-ladder, see sub-token pattern note), text-mute color, 32px height. For de-emphasized secondary actions like "More options".                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-btn-primary`               | Button variant — gold border and label; highlighted action.                                                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-btn-sm`                    | Small-size modifier for .sb-btn; tighter padding and smaller font.                                                                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-btn-unlock`                | Sizing modifier for the StartScreen TAP TO UNLOCK CTA — 240px min-width and taller padding. 1-use. Rule-mandated: minWidth + padding-override are static values.                                                                                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-btn-xs`                    | Extra-small button modifier — smaller than sb-btn-sm; for tight button rows in inspector and type-confirm panels.                                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-caption`                   | Smallest text style — xs mono in text-mute; for filenames and metadata. Currently no TSX usage. [unused-css]                                                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-card`                      | Pixel-frame container card with padding and drop-shadow elevation. Currently no TSX usage; V3 list items use sb-menu-row instead. [unused-css]                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-category-item`             | Active category row in filter rail — gold left border indicator, flex space-between, VT323 font. Slice 3 has only "All"; gains more uses in Slice 5+.                                                                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-center-placeholder`        | Centered placeholder message in a flex-fill area — flex row, centered both axes, mono muted text, gap for optional inline button.                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-changelog-entry-header`    | Per-entry header row in a changelog list — baseline alignment and margin override on sb-row. Use as class="sb-row sb-changelog-entry-header".                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-changelog-item`            | Changelog list item text additions on top of sb-mono — xs font-size and relaxed line-height. Use as class="sb-mono sb-changelog-item".                                                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-changelog-items`           | <ul> list reset for changelog items — flex-column layout with small gap and no default margins.                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-changelog-version`         | Version number label inside a changelog entry — large VT323 in gold.                                                                                                                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-col`                       | Flex-column layout primitive with min-height:0 — enables overflow scrolling in flex-column children. Use for column containers that scroll.                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-count-text`                | Inline count/quantity text — mono xs muted, no flex-shrink. Used in category rows and similar metadata contexts.                                                                                                                                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-creation-popover`          | Fixed 300px popover for Path A (desktop) pad creation flow.                                                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-creation-popover-actions`  | Footer actions row in creation popover — padded flex row, top border separator, no-shrink. For CANCEL/ADD PAD action buttons.                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-creation-popover-backdrop` | Fixed full-screen click-away backdrop for desktop creation popover — z-index 399 (below popover at 400).                                                                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-creation-popover-section`  | Section container in creation popover — column layout, var(--space-2) padding, top border separator (--border-soft), no-shrink. Used for the name+type form section.                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-creation-sheet`            | Mobile bottom sheet for pad creation and pad-type confirmation (slides up from bottom, max 85dvh).                                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-creation-sheet-backdrop`   | Mobile backdrop behind sb-creation-sheet; sb-type-confirm-backdrop is the desktop equivalent.                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-deck-add-btn`              | Full-width inset button at the bottom of the deck rail — 8px margins, calc(100% − 16px) width, 44px touch target, centered flex with 6px gap. Modifies sb-btn layout for the rail context. 1-use (DeckRail).                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-deck-check-row`            | One deck in the PAD editor's deck checklist — label row with a checkbox, 44px touch target (Slice 9e).                                                                                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-deck-conflict-hint`        | Hint line below a conflict deck tab — "Name already used by [owning deck]". font-ui fs-xs, blood text, space-3 left indent. 1-use (DeckRail).                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-deck-num-badge`            | Deck-number indicator badge in deck rail tabs — mono xs muted, 16px minimum width for numeral alignment, no flex-shrink. 1-use (DeckRail).                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-deck-rail`                 | Left 220px deck navigation column on BoardScreen (fixed width, scrollable).                                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-deck-rename-input`         | Inline rename input for deck tabs — font-ui fs-md 0.06em uppercase, matching sb-deck-tab's own font scale. Distinct from sb-row-rename-input (fs-lg/0.08em for board names). 1-use (DeckRail).                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-deck-tab`                  | Clickable deck entry in the deck rail; is-active highlights the current deck.                                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-deck-tab-actions`          | Action buttons (duplicate, delete) revealed on hover or on the active deck tab.                                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-deck-tab-conflict-glyph`   | Trailing blood "!" alert mark inside a deck tab editing row in conflict state. font-mono fs-sm blood-bright, no shrink. 1-use (DeckRail).                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-dialog-action-btn`         | Minimum-width enforcer on CANCEL/SWITCH buttons in the dialog actions row — ensures readable button width. 2-use within PadTypeConfirmDialog.                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-dialog-actions`            | Footer actions row in a dialog sheet — spacious padding (12/16px), border-top separator, flex justify-end. Wider padding than sb-creation-popover-actions (space-1/2), for dialog context.                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-dialog-danger-note`        | Red danger note block inside a dialog (used for RESET warning) — blood-soft bg, blood border-top, mono xs blood-bright text.                                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-dialog-header`             | Header container strip in the type-confirm dialog — spacious padding, soft bottom border.                                                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-dialog-section`            | Section container in the type-confirm dialog field lists — 8/16px padding, soft bottom border. Repeated per FieldList invocation (KEEPS/MIGRATES/DROPS).                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-dialog-title`              | Title text inside a dialog header — UI font, md size, 0.10em tracking, uppercase, text colour, space-2 bottom margin.                                                                                                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-display`                   | Hero title — Press Start 2P with gold glow; for page-level titles only.                                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-display-vt`                | VT323 heading variant of sb-display for medium headings; same glow, less chunky pixels.                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-drop-hint`                 | Drag-over drop zone hint text — padded, mono xs, transition on color/border. border and color set inline by drag state.                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-empty-body`                | Description text inside an empty state — mono xs muted, centered, max-width constrained, relaxed line-height.                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-error-label`               | Inline error/warning label — blood red, help cursor, left margin for inline placement.                                                                                                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-field-chip`                | Individual field name chip/tag in a field list — mono xs, dim text, 1/6px padding (sub-token tight chip sizing), sunk bg, soft border.                                                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-field-label`               | Mono 11px field label for inspector sections — block display, bottom margin, uppercase. Used for NAME/TYPE/AUDIO SOURCE/HOTKEY/FADE labels.                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-field-section-label`       | Uppercase mono label above a field-chip list — xs font, 0.08em tracking, space-1 bottom margin, uppercase. Color set inline (dynamic — varies per section: setup/gold/blood).                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-filter-rail`               | Left sidebar filter column — deep background, right border, flex column, iOS-touch scroll.                                                                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-flame-well`                | Fixed 200×200 centered well for the StartScreen AnimatedFlame (room for its halo). 1-use.                                                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-flex-1`                    | Flex fill — takes all remaining space in a flex container. Use as a spacer or to push siblings to opposite ends.                                                                                                                                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-flex-min`                  | Text-fill layout primitive — flex:1 + min-width:0. Use for flex containers that hold truncatable text. Distinct from sb-flex-1 (spacer): min-width:0 is the defining property.                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-flex-trunc`                | Truncating flex-fill primitive — flex:1 + min-width:0 + ellipsis. For text spans that fill available flex space and truncate at their boundary. Distinct from sb-flex-min (no truncation) and sb-flex-1 (no min-width or truncation).                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-grid-bg`                   | Cross-hatch layout grid on the board canvas in SETUP mode.                                                                                                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-hidden`                    | Visibility utility — hides element from layout (display:none). For hidden file inputs and conditionally invisible nodes.                                                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-hint-text`                 | Secondary annotative text in inspector rows — mono 10px muted, truncates to one line. Intentionally below --fs-xs; consider --fs-xxs token in Session 8.                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-hotkey-value`              | Hotkey binding value text in inspector — mono xs; color set inline for has/lacks-hotkey state.                                                                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-icon`                      | Icon slot in a board-list menu row — fixed 28px width, gold colour.                                                                                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-inspector`                 | Generic right-rail inspector shell; V3 uses specific variants sb-pad-editor and sb-library-panel. [unused-css]                                                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-inspector-section`         | Padded content section within an inspector panel, separated by bottom border.                                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-item-list`                 | Scrollable flex-column item list — fills remaining height, iOS-touch scroll, padded, 4px gap.                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-label`                     | Uppercase VT323 label; intended for field labels and section headings. Currently no TSX usage. [unused-css]                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-lib-browser`               | Compact library picker container in inspector — flex column, sunk background, bordered.                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-lib-browser-empty`         | Empty-state placeholder in library browser — dashed border, centered muted text.                                                                                                                                                                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-lib-browser-item`          | Clickable row in library browser list — padded, truncated, pointer cursor; selection color/bg set inline.                                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-lib-browser-item-name`     | Truncated filename in a library browser item row — ellipsis overflow, mono xs.                                                                                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-lib-browser-list`          | Scrollable item list inside library browser — capped height, sunk background, iOS-touch scroll.                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-lib-browser-no-results`    | "No results" / empty-state message in a library or source list — centered, muted. Spacious padding suits both capped inspector browsers and full-height source pickers.                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-lib-browser-search`        | Search section wrapper inside library browser — padded with border-bottom divider, no-shrink in flex-column parent.                                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-lib-panel-drag-hint`       | Drag-instructions hint bar below the LibraryPanel search section — mono 10px muted, deep background, soft bottom border, no-shrink. Combines structural bar + text styling for this component-specific element. 1-use (LibraryPanel).                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-lib-panel-row`             | Draggable library item row in LibraryPanel — flex column layout, padded, soft border-bottom separator, grab cursor with DnD-ready pointer-events (NOT sb-source-item which uses pointer cursor for click, not drag).                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-lib-panel-search-bar`      | Outer search section bar in LibraryPanel — compact padding (6/8px), deep background, soft bottom border, no-shrink. Sibling of sb-search-bar (same structural role, smaller dimensions for a 280px panel). 1-use (LibraryPanel).                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-library-panel`             | Library browse panel in the board right rail (280px, hides overflow).                                                                                                                                                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-menu-row`                  | Pixel-frame list row base — flex row, space-4 gap, space-4/5 padding. Child slots styled via flat .sb-icon / .sb-row-title / .sb-row-sub classes.                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-mode-badge`                | Compact inline SETUP/GAME badge for top-bar surfaces — flex-shrink:0 prevents badge from shrinking in flex topbar context.                                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-mode-toggle`               | Interactive SETUP \| GAME pill in the board top bar center (v24 design).                                                                                                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-mode-toggle-flash`         | Reduced-motion fallback for sb-mode-toggle (brightness flash instead of sparks). ModeToggle.tsx skips animation entirely rather than applying this class. [unused-css]                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-mode-toggle-half`          | Left or right half-button of the mode toggle pill.                                                                                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-mode-toggle-sep`           | 1 px vertical separator between the two mode toggle halves.                                                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-mode-toggle-spark`         | Individual animated spark particle emitted on mode switch.                                                                                                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-mode-toggle-sparks`        | Overflow container intended for spark particles during mode-switch. Not used; ModeToggle.tsx appends sparks to document.body instead. [unused-css]                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-mono`                      | Secondary mono body text in text-dim; currently used only for the StartScreen tagline, designed as a utility for descriptions and body copy.                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-num`                       | Premiere-style numeric scrubber chip — ew-resize cursor, sunk background; for PAD editor trim and loop inputs. [unused-css]                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-overlay`                   | Fixed full-viewport overlay shell — deep background, flex column, no overscroll. Used for full-screen dialogs (z-index 300).                                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-overlay-body`              | Scrollable flex-fill body of an overlay — grows to fill remaining height, iOS-touch scroll, padded, flex-column content layout.                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-overlay-header`            | Header strip for full-screen overlays — space-between flex row, border separator, no-shrink. Wraps sb-overlay-title + close action.                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-overlay-scroll`            | Scroll container for overlays and panels; contains overscroll within the element. Currently no TSX usage. [unused-css]                                                                                                                                                                                                                                                             | `v3/src/styles/global.css` |
| `sb-overlay-title`             | Large VT323 heading inside an overlay header — identifies what the overlay contains.                                                                                                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-pad`                       | Base pad shell — pixel-frame, type-colour left spine, is-hot glow, is-setup dashed border.                                                                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-pad-cell-add`              | "+" symbol in empty grid cells; the tap-to-create affordance.                                                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-pad-editor`                | Right inspector panel shown when a pad is selected in SETUP mode (280px, scrolls).                                                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-pad-grid`                  | CSS grid for the active deck's pads; col/row counts from --grid-cols/--grid-rows CSS vars. Rows share the height but never shrink below their pads; what does not fit scrolls (WCAG 1.4.10 Reflow).                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-pad-grid-cell`             | Single cell wrapper in the pad grid; carries position, DnD states, and touch targets.                                                                                                                                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-pad-grid-pool`             | Variant of sb-pad-grid for the All pads view — rows take their content height and the pool scrolls instead of sharing the panel height (Slice 9e).                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-panel-empty`               | Empty-state text message inside a scrollable panel or rail — centered, padded, mono xs muted, relaxed line-height. Used in DeckRail (no decks) and LibraryPanel (no results).                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-panel-header`              | Compact 28px header strip on inspector panels (icon + uppercase label).                                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-panel-title`               | Flexible-fill title span inside a panel header — mono xs in normal text color.                                                                                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-pill`                      | Compact pixel-frame badge; type-colour variants via is-on, is-loop, is-combo.                                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-pix`                       | Shared CSS base for card/btn/pad/pill/menu-row pixel-frame styling; never applied directly as a className. [unused-css]                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-pixel-icon`                | SVG display fix for PixelIcon — block display prevents inline baseline gap. Applied as hardcoded base class inside PixelIcon component; callers' class prop is appended after.                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-place-banner`              | Place-Mode notification banner in BoardScreen — flex row, setup-mode background, no-shrink. Shown while user picks a pad slot.                                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-place-banner-label`        | Label text inside sb-place-banner — fills row, mono xs, night color (on setup-mode bg).                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-rail-label`                | Section label inside a sidebar rail — VT323 11px muted, letterSpacing, padded. For CATEGORY/TAGS headers.                                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-rail-section`              | Padded section container in a sidebar rail. Add .has-divider for a bottom border separator.                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-range-input`               | Native <input type="range"> styled with design-system gold accent — full width, pointer cursor.                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-readonly-field`            | Read-only display row in inspector — flex, sunk background, bordered; for hotkey and value display.                                                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-row`                       | Horizontal flex row; align-items center, 8px gap (--space-2). Standard row for icon+label or toolbar items. min-width:0 enables truncation inside grid cells.                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-row-actions`               | Non-shrinking compact action-button group — flex row, 4px gap, flex-shrink:0. For icon-button clusters at the trailing end of list rows. Bet for 3g reuse (AudioRow action group).                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-row-fill`                  | Centred fill row — fills flex parent (flex:1) and centres content both axes. Use for empty-state containers.                                                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-row-rename-input`          | Inline rename input in a list row — matches row-title typography (font-ui, fs-lg, uppercase), sunk background, strong border, no outline. Bet for 3g reuse (AudioRow).                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-row-sm`                    | Compact flex row; align-items center, 4px gap (--space-1). For tight action groups and button clusters.                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-row-sub`                   | Secondary subtitle in a board-list menu row — mono sm dim, relaxed line-height.                                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-row-title`                 | Primary title in a board-list menu row — UI font lg, uppercase, gold, truncating.                                                                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-row-wrap`                  | Wrapping flex row; 4px gap (--space-1). For type-selector grids and wrapping button groups.                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-scanlines`                 | CRT scanline overlay via ::after pseudo-element; currently applied to StartScreen only.                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-screen`                    | Full-height screen root container — flex column, 100dvh, surface background, positioned, overflow hidden; outline-offset for inset drag indicators.                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-screen-empty`              | Full-screen centered empty state — flex column, centered both axes, fills parent, mono xs text in text-mute.                                                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-screen-layout`             | 2-column content grid for LibraryScreen — 220px filter rail + 1fr content, fills parent, min-height:0 for scroll.                                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-scroll`                    | iOS-momentum scroll utility; touch scrolling without overscroll containment. Currently no TSX usage. [unused-css]                                                                                                                                                                                                                                                                  | `v3/src/styles/global.css` |
| `sb-scroll-fill`               | Scrollable flex-fill container — takes all remaining height in a flex column, scrolls content, iOS-touch scroll, contained overscroll. Use for list/source areas that fill a panel.                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-search-bar`                | Outer search section bar — deep background, bottom border, no-shrink. Wraps sb-search-field.                                                                                                                                                                                                                                                                                       | `v3/src/styles/tokens.css` |
| `sb-search-field`              | Inner search input row — flex, sunk background, bordered. Wraps icon + input + optional clear button.                                                                                                                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-search-input`              | Transparent search input inside a bordered container — no background, no border, mono xs font. Use with sb-flex-1 when input shares a flex row with other elements.                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-section-header-row`        | Flex row for inspector section headers — label left, action right, space-between, 6px bottom margin.                                                                                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-setup-toolbar`             | SETUP-mode bottom toolbar in BoardScreen — flex row, deep background, top border, no-shrink. Contains ADD PAD button and keyboard hint.                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-sheet-header`              | Title header strip for mobile bottom sheets — spacious padding (12/16/8px), VT323 md font, uppercase, soft bottom border, no-shrink. Used for the "Add Pad" title in the creation sheet.                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-slider`                    | Horizontal range track bar for volume and trim controls; Slice 8+ feature. [unused-css]                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-slider-fill`               | Active filled portion of the slider track; width set by inline style. Slice 8+ feature. [unused-css]                                                                                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-slider-thumb`              | Draggable thumb on the slider track with gold glow. Slice 8+ feature. [unused-css]                                                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-source-item`               | Clickable column item in a source picker list — column layout, 5px/8px padding, soft bottom separator, pointer cursor, 2px gap between name row and waveform preview. Background (selection state) set inline.                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-source-tabs`               | Tab row container in creation popover source picker — flex row, soft bottom border, no-shrink. Wraps sb-tab sb-tab-sm source-picker tabs.                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-start-footer`              | Footer strip at the bottom of StartScreen — in the flow, pushed down by an auto margin, so on a short window it sits below the buttons instead of over them; mono xs muted text, centered, flex row for version link + build info. 1-use.                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-start-nav`                 | Navigation buttons row on StartScreen — flex row with 12px gap and top margin. 1-use.                                                                                                                                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-start-screen`              | Centered splash container for StartScreen — full-viewport flex column with 3-stop flame gradient; the content is centred by equal auto margins of the first child and the footer, and grows (the page scrolls) when the window is too short. 1-use (StartScreen only).                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-start-tagline`             | Layout for the sb-mono is-italic tagline on StartScreen — sm font-size, centered, max-width constraint, bottom margin. 1-use.                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-start-title`               | Layout additions for the sb-display hero title on StartScreen — xl font-size, centered, bottom margin. 1-use.                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-status-bar`                | Bottom 24px strip showing mode, board name, and other metadata.                                                                                                                                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-status-right`              | Right-slot wrapper in the status bar — auto left margin pushes it to the far right, flex row with space-4 gap.                                                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-tab`                       | Individual tab in a tab bar; is-active shows gold underline and label colour.                                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-tab-badge`                 | Count badge inside a tab label — mono xs muted, left margin for separation from tab text.                                                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-tab-bar`                   | Outer wrapper for the tab navigation row — screen chrome with deep background, bottom border, side padding. Wraps .sb-tabs.                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-tab-sm`                    | Compact size modifier for sb-tab — fills row evenly, 14px font, 0.08em letter-spacing, 6px 0 padding, 36px min-height. For tabs in panels and popovers (not full-screen tab bars).                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-tabs`                      | Tab bar container — flex row with bottom border separating tabs from content.                                                                                                                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-tag-list`                  | Flex-wrap container for tag pills — padded with horizontal gutters.                                                                                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-text-input`                | Pixel-style text input — sunk background, bordered, VT323 uppercase. For pad name and form fields.                                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-theme-crimson`             | Theme override (unused until Slice 14 settings) — crimson horror palette; re-declares colour tokens.                                                                                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-theme-neon`                | Theme override (unused until Slice 14 settings) — neon sci-fi palette; re-declares colour tokens.                                                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-theme-verdant`             | Theme override (unused until Slice 14 settings) — green fantasy palette; re-declares colour tokens.                                                                                                                                                                                                                                                                                | `v3/src/styles/tokens.css` |
| `sb-toggle`                    | Binary on/off toggle switch (40×20px); is-on moves thumb right and adds gold glow. Currently no TSX usage. [unused-css]                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-topbar`                    | Root container for TopBar — flex row, 48px height, deep bg, bottom border. Uses flex (vs sb-board-topbar's grid). Sub-token padding: 10px/16px (no exact token match).                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-topbar-bc-col`             | Breadcrumb column flex wrapper in BoardTopBar — stacks board name above deck name, min-width:0 for truncation.                                                                                                                                                                                                                                                                     | `v3/src/styles/tokens.css` |
| `sb-topbar-icon-btn`           | Icon button size override in the board top bar — 44px min-width (iOS touch target), 0/space-2 padding, space-1 gap for icon+label. 2-use: back button + library toggle.                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-topbar-logo`               | Flame icon wrapper in TopBar — flame colour, no-shrink.                                                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-topbar-secondary`          | Secondary muted mono text in topbar context — font-mono 12px (normalized from 11px on V3, sub-token), text-mute, truncating. Cross-topbar: used on V2 breadcrumb and V3 deck name.                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-topbar-title`              | Truncating title span base — used by TopBar (is-app) and BoardTopBar (is-board). Base provides truncation; scale set via is-app / is-board modifier.                                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-topbar-title-group`        | Title + breadcrumb flex group in TopBar — baseline-aligned row, fills remaining space, min-width:0 for truncation.                                                                                                                                                                                                                                                                 | `v3/src/styles/tokens.css` |
| `sb-type-btn`                  | Type-selector button (pad type pill) — fills row evenly, mono xs font, uppercase, tight padding, 28px min-height; color/border/background set inline for active pad-type state.                                                                                                                                                                                                    | `v3/src/styles/tokens.css` |
| `sb-type-change-arrow`         | Arrow separator (→) in the type-change confirmation row — muted colour.                                                                                                                                                                                                                                                                                                            | `v3/src/styles/tokens.css` |
| `sb-type-change-from`          | FROM-type label in the type-change confirmation row — dim colour to de-emphasise the source type.                                                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-type-change-row`           | Flex row showing FROM → TO type labels with verdict pill — flex, center-aligned, space-3 gap, UI font md.                                                                                                                                                                                                                                                                          | `v3/src/styles/tokens.css` |
| `sb-type-confirm`              | Desktop modal for confirming a pad-type change (z-index 500, pixel corners); sb-creation-sheet is used on mobile.                                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-type-confirm-backdrop`     | Desktop backdrop for sb-type-confirm; sb-creation-sheet-backdrop is the mobile equivalent.                                                                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-type-indicator`            | 8×8px colored dot indicating pad type in inspector header; color set inline by caller.                                                                                                                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-undo-btn`                  | UNDO action button inside the undo toast — tight 2px vertical padding (sub-token, space-3 horizontal), no-shrink to stay visible.                                                                                                                                                                                                                                                  | `v3/src/styles/tokens.css` |
| `sb-undo-message`              | Message text span inside the undo toast — mono 13px (sub-token between xs/sm, intentional toast sizing), dim colour.                                                                                                                                                                                                                                                               | `v3/src/styles/tokens.css` |
| `sb-undo-toast`                | Fixed notification toast above the status bar shown after deck deletion.                                                                                                                                                                                                                                                                                                           | `v3/src/styles/tokens.css` |
| `sb-undo-toast-progress`       | Animated gold progress bar at the bottom of the undo toast (linear shrink).                                                                                                                                                                                                                                                                                                        | `v3/src/styles/tokens.css` |
| `sb-upload-bar`                | Upload status notification bar — flex row, raised background, top border, mono xs text. Color set inline for error/normal state.                                                                                                                                                                                                                                                   | `v3/src/styles/tokens.css` |
| `sb-value-text`                | Numeric value display in inspector — mono xs gold; for fade/volume values next to sliders.                                                                                                                                                                                                                                                                                         | `v3/src/styles/tokens.css` |
| `sb-verdict-pill`              | Verdict label pill in the type-change row (ADDS/MIGRATES/DROPS/LOSSY/RESET) — auto left-push, 2px/10px padding, night text, mono xs bold. background set inline (dynamic per verdict).                                                                                                                                                                                             | `v3/src/styles/tokens.css` |
| `sb-version-link`              | Bare button styled as underlined text link — for version number in StartScreen footer that triggers the changelog overlay. 1-use. Different function from sb-btn-clear (text-link vs dismiss button).                                                                                                                                                                              | `v3/src/styles/tokens.css` |
| `sb-waveform`                  | Root container for the peak-bar waveform — flex row, center-aligned, 1px gap (sub-token, design-specific bar separation). Height and opacity set inline (props: height, dim).                                                                                                                                                                                                      | `v3/src/styles/tokens.css` |
| `sb-waveform-bar`              | Individual peak bar in the waveform — fills equal flex width, 1px border-radius (sub-token, design-specific). Height and background set inline (computed: barHeight, played state).                                                                                                                                                                                                | `v3/src/styles/tokens.css` |

<!-- AUTO-GENERATED:sb-classes END -->

---

## §A Token inventory

> Generated via `npm run sync:tokens` from
> `v3/src/styles/tokens.css`. Groups correspond to the
> section comments in the token source file.

<!-- AUTO-GENERATED:tokens START — do not edit by hand -->

### SURFACE HIERARCHY

| Token       | Value     | Description |
| ----------- | --------- | ----------- |
| `--night`   | `#08081a` | —           |
| `--deep`    | `#0e0e22` | —           |
| `--surface` | `#16162e` | —           |
| `--raised`  | `#22224a` | —           |
| `--top`     | `#2d2d60` | —           |
| `--sunk`    | `#060614` | —           |

### BORDERS

| Token             | Value     | Description                      |
| ----------------- | --------- | -------------------------------- |
| `--border`        | `#383868` | default 1px hairline · L* ~0.116 |
| `--border-soft`   | `#232348` | dividers inside dense lists      |
| `--border-strong` | `#5252a0` | drag handles, focused inputs     |
| `--border-gold`   | `#c9a84c` | selected / active                |
| `--border-blood`  | `#a02828` | destructive zones                |

### TEXT

| Token             | Value     | Description                                 |
| ----------------- | --------- | ------------------------------------------- |
| `--text`          | `#f0e8d0` | —                                           |
| `--text-strong`   | `#ffffff` | high emphasis · numbers, headings on raised |
| `--text-dim`      | `#b8b0c8` | secondary · descriptions                    |
| `--text-mute`     | `#7e7494` | tertiary · meta only, AA-large              |
| `--text-on-gold`  | `#14100a` | —                                           |
| `--text-on-blood` | `#ffe8e0` | —                                           |

### BRAND ACCENTS

| Token               | Value                      | Description                                                         |
| ------------------- | -------------------------- | ------------------------------------------------------------------- |
| `--gold`            | `#d4b25c`                  | +9% L* over original — readable at 14px                             |
| `--gold-bright`     | `#f5d57a`                  | highlights, "now playing", focus rings                              |
| `--gold-dim`        | `#8a6e34`                  | muted gold — divider lines                                          |
| `--gold-soft`       | `rgba(212, 178, 92, 0.18)` | —                                                                   |
| `--flame`           | `#e8821e`                  | the logo flame                                                      |
| `--flame-soft`      | `rgba(232, 130, 30, 0.15)` | ambient bg wash (StartScreen radial)                                |
| `--flame-aura`      | `rgba(232, 130, 30, 0.32)` | mid-alpha glow ring                                                 |
| `--flame-outer`     | `#c46818`                  | animated flame — outer pixel layer (warm)                           |
| `--flame-mid`       | `#e8881e`                  | animated flame — mid pixel layer (warm)                             |
| `--flame-core`      | `#f5c242`                  | animated flame — core pixel layer (warm)                            |
| `--flame-heart`     | `#ffe8a0`                  | animated flame — pulsing heart (warm)                               |
| `--flame-highlight` | `#ffffff`                  | animated flame — sparks, glitter, ice highlights                    |
| `--flame-steam`     | `#e2eef4`                  | animated flame — translucent steam when frozen / thawing            |
| `--ice-glow`        | `#78b4e0`                  | animated flame — drop-shadow glow when frozen (warm glow = --flame) |
| `--ice-outer`       | `#3f88b8`                  | animated flame — outer pixel layer (frozen)                         |
| `--ice-mid`         | `#5bafd8`                  | animated flame — mid layer + cold halo (frozen)                     |
| `--ice-core`        | `#9fd8ee`                  | animated flame — core pixel layer (frozen)                          |
| `--ice-heart`       | `#e8f8ff`                  | animated flame — heart (frozen)                                     |
| `--blood`           | `#a02828`                  | +14% L* over #8b1a1a — readable on dark                             |
| `--blood-bright`    | `#ef7575`                  | —                                                                   |
| `--blood-soft`      | `rgba(160, 40, 40, 0.18)`  | —                                                                   |

### PAD TYPES

| Token               | Value                       | Description |
| ------------------- | --------------------------- | ----------- |
| `--pad-single`      | `#d4b25c`                   | —           |
| `--pad-single-soft` | `rgba(212, 178, 92, 0.16)`  | —           |
| `--pad-single-glow` | `rgba(245, 213, 122, 0.55)` | —           |
| `--pad-loop`        | `#6db5b8`                   | —           |
| `--pad-loop-soft`   | `rgba(109, 181, 184, 0.16)` | —           |
| `--pad-loop-glow`   | `rgba(141, 213, 216, 0.55)` | —           |
| `--pad-combo`       | `#c9529d`                   | —           |
| `--pad-combo-soft`  | `rgba(201, 82, 157, 0.18)`  | —           |
| `--pad-combo-glow`  | `rgba(225, 110, 185, 0.55)` | —           |

### PAD SURFACE

| Token              | Value                       | Description |
| ------------------ | --------------------------- | ----------- |
| `--pad-edge-light` | `rgba(255, 255, 255, 0.12)` | —           |
| `--pad-edge-dark`  | `rgba(0, 0, 0, 0.4)`        | —           |
| `--fade`           | `#6fa85f`                   | —           |
| `--fade-soft`      | `rgba(111, 168, 95, 0.18)`  | —           |

### SEMANTIC

| Token       | Value                 | Description                 |
| ----------- | --------------------- | --------------------------- |
| `--success` | `#6db5b8`             | —                           |
| `--warning` | `#d4b25c`             | gold doubles as caution     |
| `--danger`  | `var(--blood-bright)` | —                           |
| `--info`    | `#9d7fc7`             | violet for hints / metadata |

### MODE

| Token               | Value                       | Description |
| ------------------- | --------------------------- | ----------- |
| `--mode-setup`      | `#6db5b8`                   | —           |
| `--mode-setup-soft` | `rgba(109, 181, 184, 0.06)` | —           |
| `--mode-setup-glow` | `rgba(141, 213, 216, 0.55)` | —           |
| `--mode-game`       | `#d4b25c`                   | —           |
| `--mode-game-soft`  | `rgba(212, 178, 92, 0.05)`  | —           |
| `--mode-game-glow`  | `rgba(245, 213, 122, 0.55)` | —           |

### ATMOSPHERE

| Token           | Value     | Description |
| --------------- | --------- | ----------- |
| `--glow-radial` | `#2c1f4a` | —           |

### SPACING

| Token        | Value  | Description |
| ------------ | ------ | ----------- |
| `--space-1`  | `4px`  | —           |
| `--space-2`  | `8px`  | —           |
| `--space-3`  | `12px` | —           |
| `--space-4`  | `16px` | —           |
| `--space-5`  | `20px` | —           |
| `--space-6`  | `24px` | —           |
| `--space-8`  | `32px` | —           |
| `--space-10` | `40px` | —           |
| `--space-12` | `48px` | —           |
| `--space-16` | `64px` | —           |

### RADIUS

| Token          | Value  | Description |
| -------------- | ------ | ----------- |
| `--radius-sm`  | `4px`  | —           |
| `--radius-pad` | `6px`  | —           |
| `--radius-md`  | `8px`  | —           |
| `--radius-lg`  | `12px` | —           |
| `--radius-xl`  | `16px` | —           |

### ELEVATION

| Token               | Value                                           | Description |
| ------------------- | ----------------------------------------------- | ----------- |
| `--shadow-card`     | `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.28))`    | —           |
| `--shadow-pop`      | `drop-shadow(0 8px 24px rgba(0, 0, 0, 0.45))`   | —           |
| `--shadow-pad-lift` | `drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.65))`    | —           |
| `--glow-flame`      | `drop-shadow(0 0 6px rgba(232, 130, 30, 0.55))` | —           |

### TYPE

| Token            | Value                                   | Description |
| ---------------- | --------------------------------------- | ----------- |
| `--font-display` | `'Press Start 2P', 'VT323', monospace`  | —           |
| `--font-ui`      | `'VT323', 'Share Tech Mono', monospace` | —           |
| `--font-mono`    | `'Share Tech Mono', 'VT323', monospace` | —           |
| `--fs-xs`        | `12px`                                  | —           |
| `--fs-sm`        | `14px`                                  | —           |
| `--fs-md`        | `16px`                                  | —           |
| `--fs-lg`        | `18px`                                  | —           |
| `--fs-xl`        | `22px`                                  | —           |
| `--fs-2xl`       | `28px`                                  | —           |
| `--fs-3xl`       | `36px`                                  | —           |
| `--fs-4xl`       | `48px`                                  | —           |
| `--fs-pixel-sm`  | `22px`                                  | —           |
| `--fs-pixel-md`  | `32px`                                  | —           |
| `--fs-pixel-lg`  | `48px`                                  | —           |

<!-- AUTO-GENERATED:tokens END -->
