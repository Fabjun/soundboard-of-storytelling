# ADR-0054: Test locators and test IDs

**Status:** Accepted
**Date:** 2026-09-30
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

Supersedes ADR-0038.

## Context

ADR-0038 made `data-testid` the primary E2E locator ("`getByTestId` > `getByRole` > … > CSS
class"). That is the reverse of current guidance. The structure audit of 2026-09-29 also found
test IDs without a scheme (`-button` suffix sometimes, prefixes `creation-` next to
`pad-creation-popover`), about 30 locators and assertions coupled to CSS classes
(`.sb-mode-toggle.is-setup`, `.sb-pad.is-hot`, `toHaveClass(/is-game/)`), spec files repeating
their folder name (`mobile/mobile-*.spec.ts`, `visual/visual-*.spec.ts`) and inconsistent
spelling (`boardlist`, `modetoggle`, `startscreen`). The app had 40 buttons but only 6
`aria-label`s.

## Decision

1. **Locator priority** (Playwright _Best Practices_: "Prefer user-facing attributes to XPath
   or CSS selectors"; Testing Library query priority: role / label / text first, test IDs
   "only … for cases where you can't match by role or text"):
   `getByRole` (with accessible name and state, e.g. `pressed: true`) → `getByLabel` /
   `getByText` → `getByTestId` as fallback → **never CSS classes** (neither for locating nor for
   asserting — no `toHaveClass`).
2. **State is asserted through ARIA**, not classes: the mode toggle halves, the pad type
   buttons and — in GAME — the pads carry `aria-pressed` (a pad announces "pressed" while it
   plays). This is also an accessibility improvement.
3. **Test ID scheme** (kebab-case scope-element-kind, TestID Hunter): `<component>-<element>-<kind>`
   where `<component>` is the kebab-case name of the component file (`PadEditorPanel` →
   `pad-editor-panel`), the root element is the component name alone, and `<kind>` is one of
   `button`, `input`, `slider`, `tab`, `row`, `item`, `text`, `slot`, `region`.
   **Deviation:** list instances append their id (`deck-rail-deck-tab-${id}`) instead of a
   separate `data-id` attribute — tests select by prefix, ids contain no hyphens (nanoid).
4. **Spec files:** kebab-case, no folder prefix (`mobile/touch-targets.spec.ts`,
   `visual/board-list-empty.spec.ts`); helper files are `helpers.ts`. Visual screenshot names
   follow the spec names; baselines were moved, not regenerated.
5. **Enforced** by `v3/tests/unit/codeGuards.test.ts` (test ID scheme, no class locators or
   class assertions in E2E, spec/helper names) and `e2eProjects.test.ts`.

## Exceptions

| Exception                                                                                       | Reason                                                                                                                                                                               | Reference                         | Review    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | --------- |
| Existing E2E tests locate many controls by test ID although a role + accessible name would work | Most icon-only controls have no accessible name yet; the UI is rebuilt for the mobile layout in Slice 13, where accessible names are designed in — migrating now would be done twice | BACKLOG "Role-based E2E locators" | Slice 13  |
| `pwa.spec.ts` reads `link[rel="manifest"]` with an attribute selector                           | Document metadata in `<head>`, no user-facing element exists                                                                                                                         | —                                 | permanent |

## Consequences

**Positive:**

- Tests describe what a user perceives; class or markup refactors no longer break them.
- Screen readers get real state (`aria-pressed`) and, over time, names for every control.
- One mechanically checkable test ID scheme.

**Negative / Trade-offs:**

- Longer test IDs (`board-list-screen-delete-button-${id}`).
- Single and loop pads are both asserted as "pressed" while playing; the visual difference
  (hot vs looping glow) is not asserted by E2E.

## Alternatives considered

**Keep test IDs first** (ADR-0038): stable across label changes, but contrary to current
guidance and leaves accessibility gaps. Rejected.

**Migrate every locator to roles now:** most controls lack accessible names; would be redone in
Slice 13. Deferred via the exception above.

## Amendments

**2026-10-03:** Values inserted into a test ID are checked by type (owner decision 2026-10-03).
`waveform-editor-${handle}-slider` inserted `trimEnd` — not kebab-case — and passed the scheme
check, which sees `${…}` only as a placeholder. `codeGuards.test.ts` now asks the TypeScript type
checker what each `${…}` inserts: a fixed value (literal or union of literals, e.g.
`'pause' | 'play'`) must be kebab-case; a free value (an id, an index) may only follow the element
kind, as an instance id. The regex-based ESLint rule `consistent-data-testid`
(eslint-plugin-testing-library) cannot see inserted values; a check in the DOM at run time was
considered and rejected: instance ids (nanoid) contain capitals, and it sees only the screens the
tests visit. In the same change, the PAD editor's playback position became a seek slider located
by role and name (WAI-ARIA APG Media Seek Slider) instead of getting a test ID with a new element
kind — the element kinds above stay unchanged.

## Related

- **Files:** `v3/tests/e2e/**`, `v3/tests/unit/codeGuards.test.ts`,
  `v3/tests/unit/e2eProjects.test.ts`, components with `data-testid`
- **ADRs:** ADR-0038 (superseded), ADR-0052 (component names), ADR-0053 (exceptions)
- **Sources:** https://playwright.dev/docs/best-practices ·
  https://testing-library.com/docs/queries/about/#priority ·
  https://testid-hunter.com/blog/data-testid-naming-convention-scale/
- **Commits:** see git log "…(S4)"
