/**
 * write-generated.ts — shared by the doc generators (sync:*).
 *
 * Writes a generated file already formatted with the project's Prettier config, so that
 * `sync:docs` and Prettier never rewrite each other's output (CI runs `sync:docs` and then
 * `git diff --exit-code`). Markdown goes through `formatMarkdown`, which refuses to change
 * content. Returns whether the file changed.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { format, resolveConfig } from 'prettier';
import { formatMarkdown } from './markdown';

export async function writeGenerated(file: string, text: string): Promise<boolean> {
  const formatted = file.endsWith('.md')
    ? await formatMarkdown(file, text)
    : await format(text, { ...((await resolveConfig(file)) ?? {}), filepath: file });
  if (existsSync(file) && readFileSync(file, 'utf8') === formatted) return false;
  writeFileSync(file, formatted);
  return true;
}
