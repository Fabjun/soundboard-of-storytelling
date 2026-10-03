#!/usr/bin/env tsx
/**
 * @fileoverview sync-api.ts
 *
 * Writes the API list of CLAUDE.md, section "V3 audio/IDB API" (between AUTO-GENERATED:api
 * markers), from the code: every exported function of the modules below with its signature (from
 * the TypeScript type checker) and its TSDoc description, `@reserved` and `@throws`. The list used
 * to be typed by hand and drifted — one claim was wrong, one reference pointed nowhere
 * (2026-10-03). Industry practice: a generated API report (Microsoft API Extractor) instead of a
 * hand-kept list. Functions tagged `@internal` are left out.
 *
 * Run: npm run sync:api (from v3/) — part of npm run sync:docs.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { writeGenerated } from './lib/write-generated';

const __dirname = dirname(fileURLToPath(import.meta.url));
const V3 = resolve(__dirname, '..');
const ROOT = resolve(V3, '..');
const CLAUDE = join(ROOT, 'CLAUDE.md');

/** The modules whose exported functions form the API list (owner decision 2026-10-03). */
const MODULES = ['src/db/idb.ts', 'src/lib/upload.ts', 'src/audio/index.ts', 'src/lib/preview.ts'];

/** Longest line in the generated code blocks (the project's Prettier print width). */
const WIDTH = 100;

/**
 * Wraps `text` into `// ` comment lines indented by two spaces; paragraphs stay apart, and every
 * list item (`1.`, `-`) starts a line of its own.
 */
function commentLines(text: string): string[] {
  const lines: string[] = [];
  text.split(/\n\s*\n/).forEach((paragraph, i) => {
    if (i > 0) lines.push('  //'); // an empty comment line between paragraphs
    let line = '  //';
    for (const source of paragraph.split('\n')) {
      if (/^\s*(\d+\.|-)\s/.test(source) && line !== '  //') {
        lines.push(line);
        line = '  //';
      }
      for (const word of source.split(/\s+/).filter(Boolean)) {
        if (line !== '  //' && line.length + 1 + word.length > WIDTH) {
          lines.push(line);
          line = '  //';
        }
        line += ` ${word}`;
      }
    }
    lines.push(line);
  });
  return lines;
}

/** Returns the text of a JSDoc comment or tag comment, or ''. */
const textOf = (comment: string | ts.NodeArray<ts.JSDocComment> | undefined): string =>
  ts.getTextOfJSDocComment(comment) ?? '';

/** Returns the code block lines of one module: signature, then its description as comments. */
function moduleBlock(program: ts.Program, file: string): string[] {
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(join(V3, file));
  if (!sf) throw new Error(`sync-api: ${file} is not part of tsconfig.app.json`);
  const out: string[] = [];
  for (const st of sf.statements) {
    if (!ts.isFunctionDeclaration(st) || !st.name) continue;
    if (!(ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Export)) continue;
    const docs = ts.getJSDocCommentsAndTags(st).filter(ts.isJSDoc);
    const tags = docs.flatMap((d) => [...(d.tags ?? [])]);
    if (tags.some((t) => t.tagName.text === 'internal')) continue;
    const signature = checker.getSignatureFromDeclaration(st);
    if (!signature) continue;
    const typed = checker.signatureToString(
      signature,
      st,
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
    );
    const parts = [docs.map((d) => textOf(d.comment)).join('\n\n')];
    for (const tag of tags) {
      if (tag.tagName.text === 'reserved') parts.push(`Reserved: ${textOf(tag.comment)}`);
      if (tag.tagName.text === 'throws') parts.push(`Throws: ${textOf(tag.comment)}`);
    }
    if (out.length) out.push('');
    out.push(`${st.name.text}${typed}`, ...commentLines(parts.filter(Boolean).join('\n\n')));
  }
  return out;
}

const { config } = ts.readConfigFile(join(V3, 'tsconfig.app.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, V3);
const program = ts.createProgram(parsed.fileNames, parsed.options);

const body = MODULES.flatMap((file) => [
  `### \`${relative(ROOT, join(V3, file))}\``,
  '',
  '```typescript',
  ...moduleBlock(program, file),
  '```',
  '',
]);

const start = '<!-- AUTO-GENERATED:api START — do not edit by hand (npm run sync:api) -->';
const end = '<!-- AUTO-GENERATED:api END -->';
const doc = readFileSync(CLAUDE, 'utf8');
const [before, rest] = doc.split(start);
if (rest === undefined || !rest.includes(end)) {
  throw new Error('sync-api: markers missing in CLAUDE.md');
}
const after = rest.slice(rest.indexOf(end));
const changed = await writeGenerated(CLAUDE, `${before}${start}\n\n${body.join('\n')}\n${after}`);
console.log(
  changed ? '✅ CLAUDE.md API list regenerated.' : '✅ CLAUDE.md API list already up to date.',
);
