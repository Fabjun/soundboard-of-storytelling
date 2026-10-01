#!/usr/bin/env tsx
/**
 * mutation-modules.ts — prints the files mutation testing covers, as a JSON array (T11c).
 *
 * Expands the MUTATE patterns of stryker.config.mjs (single source) so the weekly workflow can
 * run one job per module (matrix). Run: npm run mutation:modules (from v3/).
 */

import { globSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MUTATE } from '../stryker.config.mjs';

const V3 = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const include = MUTATE.filter((p: string) => !p.startsWith('!'));
const exclude = new Set(
  MUTATE.filter((p: string) => p.startsWith('!')).map((p: string) => p.slice(1)),
);
const files = [...new Set(include.flatMap((p: string) => globSync(p, { cwd: V3 })))]
  .filter((f) => !exclude.has(f))
  .sort();
if (files.length === 0) throw new Error('mutation-modules: no files matched');
console.log(JSON.stringify(files));
