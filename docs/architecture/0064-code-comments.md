# ADR-0064: Code comments — TSDoc doc comments, file overviews, line comments for the why

**Status:** Accepted
**Date:** 2026-10-03
**Slice:** cross-cutting
**Refines:** —
**Category:** Test infrastructure & workflow

## Context

The owner asked for professional code comments to the industry standard, as thorough as the rest
of the project (2026-10-03), and chose: a documented scheme, lint checks, and an overhaul of the
existing code.

Measured on main (3.0.145, a lint run of `src/` and `scripts/` with the rules below): 114 exported
functions, classes, types and constants had no doc comment, 34 doc comments broke the TSDoc syntax
(unescaped `{`, `}` and `>`, `@param` without the hyphen), in 55 files. File headers came in four
forms: 122 of 150 TypeScript files open with a box drawn from `─` characters, the scripts put it
after a shebang, two files use a `/**` block, twelve files have no header at all.

## Decision

The scheme follows the TSDoc standard for the syntax of doc comments and the Google TypeScript
Style Guide for what to document and how.

### 1. Doc comments document the API

- **Every export** of `src/` and `scripts/` — function, class, method, interface, type alias, enum,
  exported constant — has a doc comment `/** … */`. Google: "Document all top-level exports of
  modules". A symbol that is not exported gets one when its purpose is not obvious from its name.
- **Content:** a function's comment starts with a verb phrase in the third person ("Reads the
  archive's table of contents …", as if "This function …" came before it); a type's or constant's
  with a noun phrase. It says what a caller needs to know — purpose, units, edge cases, what it
  throws or rejects with, memory or timing rules — never only the name again (Google: "Avoid
  merely restating the property or parameter name").
- **Tags** (TSDoc syntax): `@param name - text` and `@returns text` only when they add
  information; never types in tags (TypeScript has them — Google: "JSDoc type annotations are
  redundant in TypeScript source code"); `@throws` for what a function throws or rejects with;
  `@remarks` for longer background; `@example`, `@deprecated`, `@see` where they help.
- Characters TSDoc treats as markup (`{`, `}`, `@`, `>`) are written in backticks or escaped.

### 2. Every file opens with a file overview

The first comment of every TypeScript file (`src/`, `scripts/`, `tests/`, configuration files) is
a `/** @fileoverview … */` block: what the file is for, the decisions and documents it follows
(`path.md#anchor`), and — for tests — the edge cases it covers. Only a shebang line or a tool
directive that must come first (`// @vitest-environment`) may precede it. This follows Google's
source file structure ("JSDoc with @fileoverview") and replaces the `─` boxes ("Comments are not
enclosed in boxes drawn with asterisks or other characters").

### 3. Line comments explain the why

Inside the code, `//` comments explain why the code does something the reader would not expect —
a platform quirk, a memory rule, a decision — not what the next line does. A comment of several
lines is several `//` lines, never `/* … */` (Google). A comment that no longer matches the code is
a defect: whoever changes the code updates or removes the comment in the same commit.

### 4. Code kept for a later implementation is marked, never deleted

Code that nothing uses today but a later slice or a parked feature needs is **kept** (owner
decision 2026-10-03, structure audit A17) and carries a TSDoc block tag in its doc comment:

```ts
/**
 * Sets or clears a pad's key in one deck (keys belong to the placement).
 *
 * @reserved Slice 12 — keys play pads (docs/product/README.md#6-platforms--input)
 */
```

The text starts with `Slice N —` or `Parked —` and says what for. `v3/tsdoc.json` declares the
tag. knip (structure audit A18, https://knip.dev) skips tagged exports (`--tags=-reserved`) and,
in production mode, reports a tag on code the app does use — a stale reservation; `codeGuards`
checks the form and that the slice exists and is not complete; the exception register lists every
reservation with its slice as the review trigger.

### 5. Checked mechanically

- `eslint-plugin-jsdoc` `require-jsdoc` (`publicOnly`, with the TypeScript contexts) on `src/` and
  `scripts/`: an export without a doc comment fails lint. `jsdoc/no-types`: no types in tags.
- `eslint-plugin-tsdoc` `tsdoc/syntax` on `src/` and `scripts/`; `v3/tsdoc.json` declares
  `@fileoverview` and `@reserved`, which TSDoc does not define itself.
- `v3/tests/unit/codeGuards.test.ts` ("every TypeScript file opens with a file overview"): the
  first comment is a `/** @fileoverview` block and no file opens with a `─` box; ("reserved code
  names an open slice or a parked decision") the form of every `@reserved`.
- `npm run knip` (pre-push and CI): unused files, exports and dependencies; `@reserved` code and
  the ignores in `v3/knip.config.ts` (each with its reason, ADR-0053) excepted.

Tests are not under `require-jsdoc`: a test's name says what it checks, and the file overview
lists the cases.

## Consequences

**Positive:**

- Editors show the doc comment of every exported symbol on hover; a reader sees purpose, rules and
  edge cases without reading the body.
- One header form in every file; the lint and the guard keep both rules without anyone having to
  remember them.

**Negative / Trade-offs:**

- A one-time change to almost every file (headers and the 114 missing comments).
- Two more development dependencies (`eslint-plugin-jsdoc`, BSD-3-Clause; `eslint-plugin-tsdoc`,
  MIT) — development only, not shipped.
- `@fileoverview` is a JSDoc tag, not a TSDoc tag; `tsdoc.json` has to declare it.

## Alternatives considered

- **`@packageDocumentation` as the file header** — rejected: TSDoc reserves it for the entry point
  of a whole package ("should never be used to describe an individual API item").
- **TypeDoc's `@module`** — names a module for generated documentation; this project generates
  none, and Google's `@fileoverview` says what the block is.
- **Keeping the `─` boxes** — the existing majority, but the style guide rules them out and the
  files already used four forms; one form has to be chosen anyway.
- **Doc comments on every symbol, exported or not** — rejected: the Google guide asks for them where
  the purpose is not obvious, and a rule that forces comments on obvious helpers produces comments
  that only restate the name.

## Related

- **Files:** v3/eslint.config.js, v3/tsdoc.json, v3/knip.config.ts,
  v3/tests/unit/codeGuards.test.ts
- **ADRs:** ADR-0053 (exception scheme), ADR-0056 (documentation checked by tools)
- **Sources:**
  - https://tsdoc.org/ — TSDoc, the doc comment standard for TypeScript (Microsoft)
  - https://tsdoc.org/pages/tags/packagedocumentation/ — `@packageDocumentation` is for a
    package's entry point only
  - https://google.github.io/styleguide/tsguide.html — "JSDoc versus comments", "Document all
    top-level exports of modules", "Method and function comments", "JSDoc type annotations",
    "Source file structure" / "@fileoverview JSDoc", comment boxes
  - https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/require-jsdoc.md —
    `publicOnly`, `require`, `contexts`
  - https://github.com/microsoft/tsdoc/tree/main/eslint-plugin — `tsdoc/syntax`
  - https://knip.dev/reference/jsdoc-tsdoc-tags — custom tags exclude tagged exports
    (`--tags=-<tag>`), tag hints report tags that are no longer needed
