/**
 * @fileoverview generated-docs.ts — the one list of files the doc generators (sync:*) write
 *
 * The pre-commit hook stages exactly these files after `sync:docs` (through
 * scripts/list-generated-docs.ts), and `writeGenerated` refuses any file not listed here. Before
 * this list the hook named the files by hand and missed CLAUDE.md, which sync:api writes — the
 * API list was left unstaged twice (2026-10-08, Slices 12b and 12d).
 */

import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repository root. */
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Every file a generator writes, relative to the repository root. */
export const GENERATED_DOCS = [
  'CHANGELOG.md',
  'CLAUDE.md',
  'docs/architecture/README.md',
  'docs/design/design-system.md',
  'docs/development/exceptions.md',
  'docs/development/testing.md',
] as const;

/** Tells whether `file` (absolute) is one of the generated files. */
export function isGeneratedDoc(file: string): boolean {
  const rel = relative(REPO_ROOT, file).split('\\').join('/');
  return (GENERATED_DOCS as readonly string[]).includes(rel);
}
