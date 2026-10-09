/**
 * @fileoverview write-generated.ts — shared by the doc generators (sync:*).
 *
 * Writes a generated file already formatted with the project's Prettier config, so that
 * `sync:docs` and Prettier never rewrite each other's output (CI runs `sync:docs` and then
 * `git diff --exit-code`). Markdown goes through `formatMarkdown`, which refuses to change
 * content. Returns whether the file changed.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import { formatMarkdown } from './markdown';
import { isGeneratedDoc } from './generated-docs';

/**
 * Writes `text` to `file`, formatted the way Prettier would; leaves the file untouched when it
 * already has that content. Resolves true when the file changed.
 *
 * @throws When `file` is not in GENERATED_DOCS (scripts/lib/generated-docs.ts) — the pre-commit
 *   hook stages only the files listed there; or when Markdown formatting would change the content
 *   (see `formatMarkdown`).
 */
export async function writeGenerated(file: string, text: string): Promise<boolean> {
  if (!isGeneratedDoc(file))
    throw new Error(
      `writeGenerated: ${file} is not in GENERATED_DOCS (v3/scripts/lib/generated-docs.ts) — add it there, so the pre-commit hook stages it`,
    );
  const formatted = file.endsWith('.md')
    ? await formatMarkdown(file, text)
    : await format(text, { ...((await resolveConfig(file)) ?? {}), filepath: file });
  if (existsSync(file) && readFileSync(file, 'utf8') === formatted) return false;
  writeFileSync(file, formatted);
  return true;
}
