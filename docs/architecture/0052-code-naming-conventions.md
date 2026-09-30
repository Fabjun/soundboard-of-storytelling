# ADR-0052: Code naming conventions

**Status:** Accepted
**Date:** 2026-09-29
**Slice:** cross-cutting
**Refines:** ADR-0021, ADR-0028
**Category:** UI architecture

## Context

The structure audit of 2026-09-29 (BACKLOG "Structure clean-up", stage S2) found naming
drift in the code: component names carrying design-prototype version numbers
(`TopBarV2`, `StatusBarV2`, `BoardTopBarV3`), a two-file folder `src/chrome/` next to
`src/components/`, the root component in lowercase (`app.tsx`, Preact scaffold default)
while every other component is PascalCase, CSS classes outside the `sb-*` / `is-*` scheme
(`.touch-target`, `.pixel-icon` — both unused — and `.theme-*`), and generator scripts whose
file names did not match their npm scripts (`sync-sb-classes-inventory.ts` for
`sync:classes`).

## Decision

Based on current industry guidance:

1. **Component files:** PascalCase, file name = exported component name, one component per
   file (Airbnb React Style Guide: "Use PascalCase for filenames", "Use the filename as the
   component name"). Applies to `src/components/`, `src/screens/` and `src/App.tsx`.
2. **No version numbers in names.** Names describe the role; history lives in git. Design
   prototype names (`v2-screens.jsx TopBarV2`) are cited only in `Source:` comments.
3. **Folders by kind:** `components/`, `screens/`, `lib/`, `state/`, `db/`, `audio/`,
   `styles/` — add a folder only when a kind needs it (Robin Wieruch, *React Folder
   Structure*, 2026). `src/chrome/` is dissolved into `components/`.
4. **CSS namespaces** (refines ADR-0021): every project class starts with `sb-`
   (block `sb-<block>`, part `sb-<block>-<part>`, themes `sb-theme-<name>`); state classes
   `is-<state>` / `has-<thing>` without project prefix. `is-` follows SMACSS state rules;
   `is-`/`has-` as the state namespace and the rationale "clarity and confidence" follow
   CSS Wizardry, *More Transparent UI Code with Namespaces*. No other namespaces.
5. **Scripts:** a script invoked as npm script `<group>:<name>` lives in
   `scripts/<group>-<name>.ts` (`sync:classes` → `sync-classes.ts`).
6. **ADR-0028 exception kept:** `BoardTopBar` stays a board-specific component next to
   `TopBar` (ADR-0026). It is re-evaluated in Slice 13, where both are rebuilt for the mobile
   layout.
7. **Enforced** by `v3/tests/unit/codeGuards.test.ts`.

Renamed on 2026-09-29: `chrome/TopBarV2.tsx` → `components/TopBar.tsx`,
`chrome/StatusBarV2.tsx` → `components/StatusBar.tsx`, `BoardTopBarV3.tsx` →
`BoardTopBar.tsx`, `app.tsx` → `App.tsx`, `.theme-*` → `.sb-theme-*`,
`sync-adr-index.ts` / `sync-sb-classes-inventory.ts` / `sync-tokens-inventory.ts` /
`sync-test-inventory.ts` → `sync-adr.ts` / `sync-classes.ts` / `sync-tokens.ts` /
`sync-tests.ts`. Removed as unused: `.touch-target`, `.pixel-icon`, `@keyframes sb-flicker`.

## Consequences

**Positive:**
- A name tells the kind of thing (component, class, state, script) at a glance.
- Guard tests stop new drift at commit time.

**Negative / Trade-offs:**
- Older docs and commit messages mention the former names (history is not rewritten).

## Alternatives Considered

**Separate theme namespace `t-`** (CSS Wizardry): rejected — one project prefix `sb-` keeps
the rule simpler; themes are ordinary project classes.

**Keep lowercase `app.tsx`** (Preact template default): rejected — the project's own
PascalCase rule takes precedence over a scaffold default.

## Related

- **Files:** `v3/src/components/`, `v3/src/App.tsx`, `v3/src/styles/`, `scripts/`,
  `v3/tests/unit/codeGuards.test.ts`
- **ADRs:** ADR-0021 (CSS naming), ADR-0026 (board top bar), ADR-0028 (single component with
  variants), ADR-0050 (file naming for docs)
- **Sources:** https://github.com/airbnb/javascript/tree/master/react ·
  https://www.robinwieruch.de/react-folder-structure/ · https://smacss.com/book/type-state/ ·
  https://csswizardry.com/2015/03/more-transparent-ui-code-with-namespaces/
- **Commits:** see git log "…(S2)"
