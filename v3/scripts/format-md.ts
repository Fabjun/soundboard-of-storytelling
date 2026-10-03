#!/usr/bin/env tsx
/**
 * @fileoverview format-md.ts — formats the given Markdown files with Prettier, but only if the content and
 * structure stay identical (see scripts/lib/markdown.ts). Used by lint-staged for every staged
 * .md file; run manually: `npm run format:md -- <files…>` (from v3/).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formatMarkdown } from './lib/markdown';

let failed = false;
for (const arg of process.argv.slice(2)) {
  const file = resolve(arg);
  const text = readFileSync(file, 'utf8');
  try {
    const formatted = await formatMarkdown(file, text);
    if (formatted !== text) writeFileSync(file, formatted);
  } catch (err) {
    failed = true;
    console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  }
}
if (failed) process.exit(1);
