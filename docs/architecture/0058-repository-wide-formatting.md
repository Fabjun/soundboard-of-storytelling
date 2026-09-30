# ADR-0058: One formatter and linter setup for the whole repository

**Status:** Accepted
**Date:** 2026-09-30
**Slice:** infrastructure
**Refines:** ADR-0055
**Category:** Test infrastructure & workflow

## Context

The structure audit of 2026-09-30 (BACKLOG "Structure audit 2026-09-30", A3) measured that the
Prettier, lint-staged and ESLint configuration lived in `v3/` and therefore only covered `v3/`:
86 of 87 Markdown files, 4 of 7 repository scripts and 2 YAML files had never been formatted,
and the scripts in `scripts/` were never linted. They also reached `typescript` and other
packages only through workarounds (`paths` in `scripts/tsconfig.json`, `NODE_PATH`), because
all dependencies are installed in `v3/node_modules`.

The first repository-wide Prettier run then changed the **content** of seven Markdown files: a
bare `*` in prose turned into `_` and broke a code span, a `|` inside a table cell split a row, an
indented continuation line became a code block. Most of these sources were already rendered
wrongly on GitHub. The generated class inventory had the same table fault, because the
generators did not escape `|` in cells.

## Decision

1. **Scripts live in the package.** `scripts/` moved to `v3/scripts/` — `v3/` holds the only
   `package.json`, and tooling belongs to the package whose dependencies it uses. ESLint, Prettier
   and `tsc -b` (`tsconfig.node.json`) now cover the scripts without special configuration; the
   `paths` and `NODE_PATH` workarounds are gone. The scripts still operate on the whole
   repository. npm workspaces with a root `package.json` (the common setup for repositories with
   several packages) were considered and deferred: with one package they add migration cost
   without benefit. Trigger to revisit: a second package.
2. **Prettier config at the repository root** (`.prettierrc.json`, `.prettierignore`): it is plain
   JSON and applies to every file. `format` / `format:check` run from the root. Code inside
   Markdown code blocks is not reformatted (`embeddedLanguageFormatting: off`) — examples stay as
   written.
3. **lint-staged config at the repository root** (`.lintstagedrc.json`): the closest config
   applies to every staged file, so one root config covers the repository.
4. **Markdown is formatted only if its content stays identical.** `npm run format:md`
   (`v3/scripts/format-md.ts`, used by lint-staged) formats with Prettier and compares the
   GitHub-flavoured syntax tree before and after (`v3/scripts/lib/markdown.ts`); on any
   difference in content or structure it fails with the line instead of writing. The doc
   generators write through the same check (`v3/scripts/lib/write-generated.ts`), so their output
   is always formatted and `sync:docs` never fights Prettier.
5. **Table cells are escaped at the source.** Generators build rows with `tableRow()` /
   `escapeCell()`; `docsGuards.test.ts` checks that every table row in the repository has as many
   cells as its header (GitHub drops extra cells silently).

Standards: Prettier's documented config resolution (nearest config file); lint-staged's
"closest configuration" rule for monorepos; mdast / micromark (unified) as the Markdown parser
also used by remark.

## Exceptions

| Exception                          | Reason                                                | Reference | Review    |
| ---------------------------------- | ----------------------------------------------------- | --------- | --------- |
| `design-sources/` is not formatted | Claude Design downloads are kept exactly as delivered | ADR-0050  | permanent |

## Consequences

**Positive:**

- Every tracked text file follows one format; scripts are linted and type-checked like app code.
- A formatter can no longer silently change what a document says.

**Negative / Trade-offs:**

- One-time reformat of almost all Markdown files (layout only; verified by syntax-tree
  comparison, all content differences were deliberate source fixes).
- Three more dev dependencies for the Markdown parser (`mdast-util-from-markdown`,
  `micromark-extension-gfm`, `mdast-util-gfm`, MIT).

## Alternatives considered

**Root ESLint config:** would not find its plugins, which are installed in `v3/node_modules`.

**npm workspaces now:** see decision 1.

**Plain `prettier --write` on Markdown:** measured to damage seven files on the first run.

## Related

- **Files:** `.prettierrc.json`, `.prettierignore`, `.lintstagedrc.json`, `v3/scripts/`,
  `v3/tsconfig.node.json`, `v3/eslint.config.js`, `v3/tests/unit/docsGuards.test.ts`
- **ADRs:** ADR-0055 (type-check everything), ADR-0056 (documentation freshness), ADR-0053
  (exceptions)
- **Sources:** https://prettier.io/docs/configuration ·
  https://github.com/lint-staged/lint-staged#how-to-use-lint-staged-in-a-multi-package-monorepo ·
  https://github.com/syntax-tree/mdast-util-gfm
