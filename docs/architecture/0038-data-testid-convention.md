# ADR-0038: `data-testid` convention for E2E selectors

**Status:** Superseded by ADR-0054
**Date:** 2026-05-27
**Slice:** infrastructure
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

E2E tests need stable selectors for DOM elements. Alternatives:
- CSS classes (`sb-btn`, `.sb-scene-tab`)
- texts (`getByText('Delete')`)
- roles (`getByRole('button', { name: 'Delete' })`)
- `data-testid` attributes

CSS classes break on refactoring or when design-system classes are renamed (planned for
Slice 8). Text selectors depend on language and break on copy changes. Role selectors are
semantic, but not unique when there are several elements of the same kind.

## Decision

E2E tests primarily use `data-testid` attributes:

```typescript
await page.getByTestId('new-board-button');
await page.getByTestId(`board-row-${board.id}`);
await page.getByTestId(`scene-tab-${scene.id}`);
```

**Naming convention:**
```
data-testid="<component>-<element>"           // unique
data-testid="<component>-<element>-<id>"      // instance in a list
```

**Examples:**
```
new-board-button
board-row-{board.id}
scene-tab-{scene.id}
scene-delete-{scene.id}
mode-toggle
mode-toggle-setup
pad-cell-empty-{col}-{row}
```

**Selector priority in Playwright:**
`getByTestId` > `getByRole` > `.filter({ hasText })` > CSS class

Only test-critical elements get a `data-testid` (no complete DOM coverage).

## Consequences

**Positive:**
- Stable under refactoring: CSS renames and design-system updates do not break tests.
- Unique: instance IDs prevent "strict mode violation" for elements that occur several times.
- Self-documenting: `data-testid` makes testable elements recognisable in the markup.

**Negative / Trade-offs:**
- Markup pollution: `data-testid` attributes are visible in the production HTML. No semantic
  value for users, but no functional harm.
- Maintenance effort: adding a `data-testid` is an extra step during development.

## Alternatives considered

**CSS classes as selectors:** break with the Slice 8 refactoring. Not suitable.

**ARIA labels as selectors:** semantic, but require complete accessibility markup. V3 has only
baseline a11y; ARIA labels are not present on every button.

## Related

- **Files:** `v3/src/components/*.tsx` (data-testid attributes), `v3/tests/e2e/helpers.ts`, `v3/tests/e2e/*.spec.ts`
- **ADRs:** ADR-0033 (test strategy), ADR-0035 (Playwright)
- **Source documents:** `docs/development/testing.md §Test locators (ADR-0054)` (formerly §Test-Selector-Konvention)
- **Commits:** `cb633ab` — refactor: add data-testid attributes for test stability
