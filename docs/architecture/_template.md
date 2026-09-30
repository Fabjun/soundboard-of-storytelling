# ADR-XXXX: <Title>

**Status:** Accepted | Deprecated | Superseded by ADR-YYYY
**Date:** YYYY-MM-DD
**Slice:** Slice X | cross-cutting | infrastructure
**Refines:** ADR-XXXX | —
<!-- Refines: this ADR builds on an earlier one and adds detail or a constraint WITHOUT
     replacing it — the earlier ADR stays Accepted (and gets a "Refined by" line).
     Distinction:
       "Superseded by" (in Status) = the earlier ADR is replaced / deprecated.
       "Related" (section below)   = loose association, no hierarchy.
       "Refines"                   = adds implementation detail or a constraint the earlier
                                     ADR did not specify.
     Write "—" when this ADR refines none. -->
**Category:** Tech stack | Platform constraints | Data model | Persistence | Audio engine & iOS memory | UI architecture | Interaction | Test infrastructure & workflow | Process & product decisions

## Context

What was the situation, the problem, the requirement? If the decision was not documented
explicitly but derived from a consistent code state, say so:
> *This decision was not documented explicitly; it was derived from the consistent code
> state as of YYYY-MM-DD.*

## Decision

What was decided? Concrete and unambiguous. Name the industry standard / sources the
decision is based on (CLAUDE.md §Working principles).

## Exceptions

Optional — only if the decision already has deliberate exceptions (ADR-0053). One row each;
the section is collected into `docs/development/exceptions.md` by `npm run sync:exceptions`.

| Exception | Reason | Reference | Review |
|---|---|---|---|
| … | … | ADR / BACKLOG "…" | permanent / Slice N / YYYY-MM-DD |

## Consequences

What follows from the decision — good AND bad?

**Positive:**
- …

**Negative / Trade-offs:**
- …

## Alternatives considered

Which alternatives were examined, and why were they rejected? "No alternatives were
considered" is a valid answer if true.

## Related

- **Files:** `v3/src/...`
- **ADRs:** ADR-XXXX, ADR-YYYY
- **Source documents:** `docs/architecture/concept-brief.md §X.Y`, `CLAUDE.md §Y`
- **Sources:** https://… (external standards the decision relies on)
- **Commits:** `abc1234` — short description
