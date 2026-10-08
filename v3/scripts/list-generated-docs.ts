/**
 * @fileoverview list-generated-docs.ts — prints the generated files for the pre-commit hook
 *
 * `.husky/pre-commit` stages what this prints after `sync:docs`; the list itself lives in
 * scripts/lib/generated-docs.ts (one source for the hook and the generators).
 */

import { GENERATED_DOCS } from './lib/generated-docs';

console.log(GENERATED_DOCS.join(' '));
