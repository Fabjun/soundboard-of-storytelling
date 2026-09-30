# ADR-0046: Design→Code Integration via Checked Import Gate

**Status:** Accepted
**Date:** 2026-06-11
**Slice:** cross-cutting
**Refines:** —
**Category:** Process & product decisions

## Context

A capability interview with Claude Design (2026-06-11) established:
- Natural output uses BEM-ish class names with hardcoded hex colors and pixel values.
- Class naming is NOT stable across sessions — the same element can get different names
  in separate sessions.
- Given a partial class spec, violations occurred immediately at gaps: inline styles for
  structural wrappers where no component class existed; state classes misused as base
  classes. Interview verdict: "can approximate, expect violations."
- Long-session compliance degrades in order: inline styles → invented component classes →
  hardcoded values.

Risk without a gate: a parallel class universe would emerge in production, mixing
invented cross-session names with the project's registered system.

## Decision

**Decision 1 (binding):** No design output enters production code unchecked. Every
design→code import runs through the import gate below.

**Decision 2 (practice, not strategy):** Supplying the class spec to a design session is
a per-session dial — deliberately not a fixed model choice:
- *Exploration sessions* run free (more translation at import time).
- *Production-near sessions* receive `docs/design/claude-design-spec.md` + TODO-CLASS
  obligation (less translation at import time).
Both paths flow through the same import gate.

### Import gate — 5 checks before any design JSX merges into production code

1. **Path-D style scan:** `grep -rn 'style={{' <imported-files>` — every `style={}` hit
   must be a runtime-computed value (drag position, animation coord, data-driven size).
   Static token references like `style={{ color: 'var(--gold)' }}` are Path D violations;
   they must become classes.
2. **Class-name registry check:** extract every `class="..."` value; grep each name against
   the three registries: `docs/design/design-system.md §5a` (layout primitives), `docs/design/design-system.md §3`
   (is-* vocabulary), generated `docs/design/design-system.md §6` (component inventory).
   Unknown name = translate to a registered name, or consciously register a new class
   (following ADR-0021 process) before merge.
3. **Literal-value scan:** `grep -rn '#[0-9a-fA-F]\{3,8\}\|[0-9]\+px' <imported-files>`
   — every hex color and raw px value must become a token reference. Exception: (a) values
   inside token definitions (i.e., inside `tokens.css`); (b) hits inside styles already
   cleared by check 1 as legitimate runtime-computed values.
4. **TODO-CLASS resolution:** `grep -rn 'TODO-CLASS' <imported-files>` — every marker
   must be resolved into a real class decision before merge. No TODO-CLASS may survive
   into production code.
5. **Token existence check:** for every `var(--token-name)` reference in imported JSX,
   verify the token exists: `grep -n '\-\-token-name' v3/src/styles/tokens.css`.
   Unknown token = either use an existing token or add to tokens.css per ADR-0022 before merge.

### Gate preconditions

Checks 1 (Path-D inline-style scan) and 3 (literal-value scan) operate on the actual
imported artifact (the design output file/files). They MUST be run by grepping that
artifact directly.

- If the artifact is not present in the working context, the gate **STOPS** and requests
  it. It does NOT proceed on the basis of the design tool's self-report, description, or
  TODO-CLASS register as a substitute for scanning the artifact.
- A gate run in which checks 1 or 3 could not be executed against the real artifact is
  **INCOMPLETE, not passed** — any findings are provisional until the artifact is scanned.
  The self-report is a cross-check, never the source of truth for what the artifact contains.
- Checks 2, 4, 5 grep the project's own registries/tokens and are unaffected — they run
  regardless of artifact presence.

## Consequences

**Positive:**
- Prevents parallel class universe from accumulating in production.
- Checks 4+5 are zero-hit mechanical — any surviving hit is a violation. Checks 1–3 are
  mechanical screens whose hits require case-by-case judgment (a check-1 hit may be a
  legitimate runtime-computed style; a check-3 hit inside such a style is also acceptable).
- Per-session dial preserves design-session freedom; cost is borne at import, not design time.
- TODO-CLASS markers make spec gaps visible and explicit rather than silently invented.

**Negative / Trade-offs:**
- Import gate adds friction to the design→production flow.
- Gate requires manual execution until a script formalizes the greps (candidate code task
  tracked in docs/backlog.md §4).
- Spec currency: `docs/design/claude-design-spec.md` must be kept in sync with §5a, §3,
  and tokens.css (coupling row added to docs/analysis/foundation-analysis.md §6).

## Alternatives considered

**Pure binding-spec model without gate:** Rejected. Interview demonstrated immediate
violations at spec gaps (inline styles where no component class existed). A spec can
never be complete for all new component types; gaps are unavoidable.

**Unchecked import / trust:** Rejected. Unstable cross-session naming + demonstrated
violation behavior makes unchecked import an accumulating technical debt source.

## Related

- **Files:** `docs/design/claude-design-spec.md` (session spec artifact)
- **ADRs:** ADR-0021 (closed is-* vocabulary), ADR-0022 (design tokens)
- **Source documents:** `CLAUDE.md §Evidence Requirements`, `docs/design/design-system.md §5a`, `§3`, `§6`
- **Commits:** 2026-06-11 (introduction)
