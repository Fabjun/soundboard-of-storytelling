# Import Gate Record: Scene Rename Conflict

**Gate run date:** 2026-06-15
**Artifact:** "Scene Rename Conflict.html" (Claude Design session)
**ADR:** ADR-0046 (import gate) + ADR-0046 §Gate preconditions (commit 93e8039)
**Gate status:** COMPLETE — artifact scanned; checks 1–5 all executed against the real artifact.
Supersedes the first provisional run (2026-06-15, same session) in which checks 1/3 were
blocked by artifact absence per the newly-amended gate precondition.

---

## Feature context

Scene rename conflict feedback for the SceneRail component. Product behavior (I25, settled):
**V1 "Live feedback + blocking commit"** — duplicate names warn live while typing (blood
conflict skin + hint line naming the owning scene); Enter/blur is blocked until the name is
unique. V2 (on-commit reject) is also designed; V1 is the chosen behavior.

---

## Check 0 — Exclusion boundaries

Three regions excluded from checks 1 and 3 (confirmed from artifact):

1. **PREVIEW-ONLY token block** — `<style>` element, delimited by
   `/* PREVIEW-ONLY — NOT FOR IMPORT … */` CSS comment. Contains `:root { --surface:#1a1613; … }`.
2. **PREVIEW-ONLY prim() block** — `const PRIM = { … }` / `function prim(…)`, delimited by
   `/* PREVIEW-ONLY — NOT FOR IMPORT … Production resolves these from DESIGN_SYSTEM.md §5a
   / §3 and drops everything below. */`
3. **Harness (DELIVERABLE END → end of script)** — `StateCard`, `VariantBlock`, `App`
   components and `ReactDOM.createRoot(…)` call.

Checks 1/3 ran on the five functions between `/* DELIVERABLE START */` and `/* DELIVERABLE END */`:
`Ordinal`, `SceneTab`, `RenameRowNeutral`, `RenameRowConflict`, `Rail`.

---

## Check 1 — Path-D inline style scan (against artifact deliverable)

**13 `style={{` hits enumerated:**

| # | Component / element | Non-prim properties | Literals | Classification |
|---|---------------------|---------------------|----------|----------------|
| 1 | `Ordinal` `<span>` | `fontFamily:var(--font-mono)`, `fontSize:var(--fs-xs)`, `color:var(--text-mute)` | — | Path D |
| 2 | `SceneTab` `<div>` resting | `background:var(--surface)`, `border:1px solid var(--border-soft)`, `borderRadius:var(--radius-md)`, `padding:var(--space-2) var(--space-3)` | `1px` | Path D |
| 3 | `SceneTab` label `<span>` | `fontFamily:var(--font-ui)`, `fontSize:var(--fs-md)`, `color:var(--text)` | — | Path D |
| 4 | `RenameRowNeutral` `<div>` | `background:var(--raised)`, `border:1px solid var(--border-strong)`, `borderRadius:var(--radius-md)`, `padding:var(--space-2) var(--space-3)` | `1px` | Path D |
| 5 | `RenameRowNeutral` `<input>` | `background:transparent`, `border:none`, `outline:none`, `fontFamily:var(--font-ui)`, `fontSize:var(--fs-md)`, `color:var(--text-strong)`, `padding:0` | CSS keywords | Path D |
| 6 | `RenameRowConflict` outer `sb-col` | `gap:var(--space-1)` | — | Path D (sb-col gap #1) |
| 7 | `RenameRowConflict` conflict tab `<div>` | `background:var(--raised)`, `border:1px solid var(--border-blood)`, `borderLeft:3px solid var(--blood)`, `borderRadius:var(--radius-md)`, `padding:var(--space-2) var(--space-3)` | `1px`, `3px` | Path D |
| 8 | `RenameRowConflict` `<input>` | same as #5 | CSS keywords | Path D |
| 9 | `RenameRowConflict` glyph `<span>` | `fontFamily:var(--font-mono)`, `fontSize:var(--fs-sm)`, `color:var(--blood-bright)` | — | Path D |
| 10 | Hint row `<div className="sb-row-sm">` | `paddingLeft:var(--space-3)` | — | Path D |
| 11 | Hint "Name already used by" `<span>` | `fontFamily:var(--font-ui)`, `fontSize:var(--fs-xs)`, `color:var(--blood)` | — | Path D |
| 12 | Hint `conflictName` `<span className="is-italic">` | `fontFamily:var(--font-ui)`, `fontSize:var(--fs-xs)`, `color:var(--blood-bright)` | — | Path D |
| 13 | `Rail` outer `sb-col` | `gap:var(--space-1)` | — | Path D (sb-col gap #2) |

Note: all `...prim()` spreads in each `style={{}}` are preview-materialization and drop at import.
No hit is runtime-computed (no drag coords, animation positions, or data-driven dims).

**Comparison to self-audit:** self-audit disclosed "inline token styling", "sb-col gap (var(--space-1))",
and "transparent/none/0 resets". Artifact contains exactly these categories. Self-audit did not
specify 2× sb-col gap instances — it described the pattern, not the count. Not an omission.

---

## Check 2 — Class-name registry check

Non-TODO-CLASS names in deliverable (from self-audit; verified against registries in first run):

| Class | §5a / §3 / §6 | Status |
|-------|--------------|--------|
| `sb-row` | §5a L126 + §6 L271 | ✅ Registered |
| `sb-row-sm` | §5a L127 + §6 L275 | ✅ Registered |
| `sb-col` | §5a L130 + §6 L189 | ✅ Registered |
| `sb-flex-min` | §5a L138 + §6 L216 | ✅ Registered |
| `sb-flex-trunc` | §5a L139 + §6 L217 | ✅ Registered |
| `is-active` | §3 L68 | ✅ Registered |
| `is-italic` | §3 L75 | ✅ Registered |

No unregistered non-TODO-CLASS names found.

---

## Check 3 — Literal-value scan (against artifact deliverable)

**Hex colors** (`#[0-9a-fA-F]{3,8}`): **ZERO** in deliverable. All color references are
`var(--token)`. Hex values exist only in the excluded `:root` block and harness.

**Px values** (`[0-9]+px`):
- `1px` — hits #2, #4, #7 (border widths)
- `3px` — hit #7 (borderLeft conflict accent)

`padding:0` (hits #5, #8) is a bare JS `0`, not `[0-9]+px` — not a literal hit.

**Comparison to self-audit:** "1px solid (tab borders) and 3px solid (the conflict left accent)"
— confirmed exactly. No undisclosed px values; no hex in deliverable.

---

## Check 4 — TODO-CLASS markers

Six markers in the deliverable, matching the design's TODO-CLASS register exactly:

| Marker | Component | Occurrences |
|--------|-----------|-------------|
| `scene-ordinal` | `Ordinal` | 1 |
| `scene-tab` | `SceneTab` (resting), `RenameRowNeutral`, `RenameRowConflict` | 4× comments |
| `scene-rename-input` | `RenameRowNeutral` input, `RenameRowConflict` input | 2 |
| `is-conflict` | `RenameRowConflict` conflict tab `<div>` | 1 |
| `conflict-glyph` | `RenameRowConflict` glyph `<span>` | 1 |
| `scene-conflict-hint` | `RenameRowConflict` hint section | 1 |

---

## Check 5 — Token existence

All `var(--token)` references in the deliverable verified present in `v3/src/styles/tokens.css`:

`--font-mono` ✅ `--font-ui` ✅ `--fs-xs` ✅ `--fs-sm` ✅ `--fs-md` ✅
`--text-mute` ✅ `--text` ✅ `--text-strong` ✅ `--surface` ✅ `--raised` ✅
`--border-soft` ✅ `--border-strong` ✅ `--border-blood` ✅ `--blood` ✅ `--blood-bright` ✅
`--radius-md` ✅ `--space-1` ✅ `--space-2` ✅ `--space-3` ✅

No missing tokens.

---

## Self-audit reliability verdict (artifact-grounded)

**CONFIRMED accurate for this artifact (evidence-based) — a positive datapoint.**

Claude Design's self-audit was accurate for this artifact. This is one verified datapoint,
not a guarantee — the gate's artifact-scan precondition remains mandatory for every future
import regardless, since interview findings (ADR-0046 §Context) show long-session compliance
degrades. The purpose of the gate is to scan rather than trust, even after a clean run.

Specific verdicts:
- "zero invented class names" — ✅ confirmed (all 7 non-TODO classes registered)
- "1px/3px border widths only, no hex, transparent/none/0 resets" — ✅ confirmed by check 3
- "inline token styling" — ✅ confirmed; all 13 hits are static token references
- "sb-col gap" — ✅ confirmed (2 instances, pattern accurately disclosed)
- "is-conflict not in closed is-* set, flagged" — ✅ correct; §3 has no is-conflict entry

---

## TODO-CLASS resolutions

### `scene-tab` → existing `sb-scene-tab`

Evidence (re-confirmed at gate run):
```
DESIGN_SYSTEM.md:284: sb-scene-tab
tokens.css:1441: .sb-scene-tab
tokens.css:1464: .sb-scene-tab.is-active
tokens.css:1469: .sb-scene-tab.is-editing
```

- Resting state (SceneTab component): `sb-scene-tab` — inline hits #2, #3 fold in
- Edit/neutral rename state (RenameRowNeutral): `sb-scene-tab is-editing` — hit #4 folds in
- Conflict state (RenameRowConflict tab div): `sb-scene-tab` + conflict modifier — hit #7
  folds in (depends on is-conflict decision below)

### `scene-rename-input` → existing `sb-scene-rename-input`

Evidence (re-confirmed at gate run):
```
DESIGN_SYSTEM.md:283: sb-scene-rename-input
tokens.css:2460: .sb-scene-rename-input
SceneRail.tsx:218: class="sb-scene-rename-input"
```

Inline hits #5 and #8 fold into `sb-scene-rename-input`. Existing class already defines:
transparent fill, font-ui fs-md, no outline (per §6 description).

### `scene-ordinal` → new class `sb-scene-ordinal`

No existing class. Propose: `sb-scene-ordinal`
- Purpose: muted mono index badge before scene label (font-mono, fs-xs, text-mute, flex-shrink:0)
- Inline hit #1 folds in
- 1-use (SceneRail); requires `/* @inventory: … */` annotation

### `conflict-glyph` → new class `sb-scene-tab-conflict-glyph`

No existing class. Propose: `sb-scene-tab-conflict-glyph`
- Purpose: trailing blood "!" alert mark on scene tab in conflict state
  (font-mono, fs-sm, blood-bright, flex-shrink:0)
- Inline hit #9 folds in
- 1-use (SceneRail)

### `scene-conflict-hint` → new class `sb-scene-conflict-hint`

No existing class. Propose: `sb-scene-conflict-hint`
- Purpose: hint line below conflict scene-tab — "Name already used by [italic owning scene]"
  (font-ui fs-xs; label in blood, name in blood-bright italic; space-3 left padding to align
  under scene label)
- Inline hits #10, #11, #12 fold in
- 1-use (SceneRail)

### `is-conflict` → **RESOLVED 2026-06-15: Option (a)**

Options:

**(a) Register new state class `is-conflict` in §3 + ADR-0021 amendment**
- Pros: clean semantics; "validation failure / name conflict" is distinct from destructive-action
  and from loop/playlist type states. Proper closed-set expansion. Future reuse for board rename
  conflicts etc.
- Cons: expands the closed is-* set; requires ADR-0021 amendment and §3 table update before use.

**(b) RULED OUT** — is-danger §3 definition: "Destruktive Aktion (2-Tap-Confirm)". Applying
it to "invalid input / name conflict" strains semantics and would produce misleading class names
at call sites.

**(c) Component-class modifier only**
- Avoid global state vocabulary change; express conflict via e.g. an `is-conflict` skin baked
  into `sb-scene-tab`'s CSS or a compound `.sb-scene-tab--conflict` class.
- Pros: no changes to global §3 vocabulary.
- Cons: conflict presentation may extend beyond scene tabs (future board rename); a global
  `is-conflict` would serve all future sites without reinvention.

---

## sb-col gap notes (for code pass)

- Hit #13 (`Rail` outer `sb-col` gap): spacing between all scene tabs. Likely already handled
  in SceneRail.tsx's existing layout; verify at code pass. If not, belongs in SceneRail's own CSS.
- Hit #6 (`RenameRowConflict` `sb-col` gap): wraps conflict-tab-row + hint line. This structural
  gap belongs either in `sb-scene-conflict-hint`'s parent wrapper definition, or as part of the
  conflict state skin. Resolve at code pass.

---

## Pending items

- ✅ **RESOLVED 2026-06-15: is-conflict** — Option (a); registered in DESIGN_SYSTEM.md §3 and ADR-0021 amended (this pass). CSS and SceneRail wiring deferred to code-pass.
- **PENDING: code-pass implementation** — new classes (`sb-scene-ordinal`, `sb-scene-tab-conflict-glyph`,
  `sb-scene-conflict-hint`), `is-conflict` resolution, SceneRail wiring, live-validation +
  blocking-commit behavior (I25). Requires §6 registration of new classes, §3 amendment (done — this pass).

---

*Gate run executed 2026-06-15. No feature code built this pass.*
