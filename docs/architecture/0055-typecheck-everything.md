# ADR-0055: Every TypeScript file is type-checked

**Status:** Accepted
**Date:** 2026-09-30
**Slice:** infrastructure
**Refines:** —
**Refined by:** ADR-0058 (scripts moved into `v3/scripts/`, checked via `tsconfig.node.json`)
**Category:** Test infrastructure & workflow

## Context

`npm run build` ran `tsc -b` over `tsconfig.app.json` (`src/`) and `tsconfig.node.json`
(`vite.config.ts`) only. Unit tests (`tsconfig.test.json`), E2E tests (`tsconfig.e2e.json`)
and `vitest.config.ts` / `playwright.config.ts` were never type-checked — ESLint only parses
with those configs, and neither test runner checks types:

- Playwright: "Playwright does not check the types and will run tests even if there are
  non-critical TypeScript compilation errors" — it recommends running `tsc --noEmit` alongside.
- Vitest checks types only with `--typecheck`, and then only type tests (`*.test-d.ts`).

Running the configs on 2026-09-30 found 7 hidden errors (BACKLOG T12): 6 in unit tests — the
`makePad(…, overrides: Partial<Pad>)` factories produced pad shapes the `Pad` union does not
allow, and results were read as `result.libraryItemRef` without narrowing — and 1 in the E2E
config (`types: ["node"]` dropped `vite/client`, so `src/main.tsx`'s CSS import had no type).
`scripts/` had its own step (`typecheck:scripts`, T8b). `strict` was active only because
TypeScript 6 enables it by default; no config stated it.

## Decision

1. `v3/tsconfig.json` references **every** project: app, node (now incl. `vitest.config.ts`
   and `playwright.config.ts`), unit tests, E2E tests and `../scripts/tsconfig.json`. `tsc -b` in
   `npm run build` therefore type-checks every TypeScript file; `npm run typecheck` runs it alone.
   The separate `typecheck:scripts` step (script, pre-commit, CI) is removed as redundant.
2. `"strict": true` is stated explicitly in every base config (CLAUDE.md "TypeScript strict
   mode"), independent of compiler defaults.
3. Test fixtures are typed as the concrete variant they build (`SinglePad`), not `Partial<Pad>`;
   results are asserted with `toHaveProperty` instead of reading variant fields off the union.
4. **Pitfall:** Playwright applies `paths` mappings from referenced projects when it loads
   `playwright.config.ts`. `scripts/tsconfig.json` therefore maps only the package it needs
   (`typescript`); an earlier catch-all `"*"` mapping made Playwright load `@playwright/test`
   as ESM from the wrong entry point ("Named export 'defineConfig' not found"). Caught by the
   pre-commit smoke run.
5. Guard in `tests/unit/testGuards.test.ts`: every `.ts`/`.tsx` file in `v3/` (outside
   `node_modules`) and `scripts/` belongs to a project referenced from `v3/tsconfig.json`
   (resolved through the TypeScript API).

## Consequences

**Positive:**

- A type error anywhere — app, tests, tool configs, doc generators — blocks the commit, CI and
  the deploy.
- New files outside any project are caught by the guard.

**Negative / Trade-offs:**

- `npm run build` checks more files (a few seconds).

## Alternatives considered

**Separate `typecheck` steps per config in hooks and CI:** works, but several commands to keep
in sync; one `tsc -b` over project references is the TypeScript-native way. Rejected.

**Vitest `--typecheck`:** only covers type tests, not the regular test files. Rejected.

## Related

- **Files:** `v3/tsconfig*.json`, `scripts/tsconfig.json`, `v3/package.json`,
  `.husky/pre-commit`, `.github/workflows/tests.yml`, `v3/tests/unit/testGuards.test.ts`
- **ADRs:** ADR-0033 (test strategy)
- **Sources:** https://playwright.dev/docs/test-typescript · https://vitest.dev/guide/testing-types ·
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- **Commits:** see git log "…(T12)"
