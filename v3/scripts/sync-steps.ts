#!/usr/bin/env tsx
/**
 * sync-steps.ts
 *
 * Writes the steps of the CI workflow and of the git hooks into docs/development/testing.md
 * (between AUTO-GENERATED markers). The step lists used to be typed in three places and drifted
 * (a missing Vale step, "six gates" for seven — structure audit 2026-09-30, A4).
 *
 * Sources:
 *   - .github/workflows/tests.yml — jobs, their `needs`, step names and commands
 *   - .husky/pre-commit, .husky/pre-push — every step announces itself with a message
 *     "<icon> Pre-commit: <what>..." / "<icon> Pre-push: <what>..."; the command is the first
 *     npm / npx call before the next step message ("shell check" if the step has none)
 *
 * Run: npm run sync:steps (from v3/) — part of npm run sync:docs.
 */

import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';
import { tableRow } from './lib/markdown';
import { writeGenerated } from './lib/write-generated';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const TESTING = join(ROOT, 'docs', 'development', 'testing.md');

interface Step {
  name?: string;
  uses?: string;
  run?: string;
}
interface Job {
  needs?: string | string[];
  steps: Step[];
}

function ciTable(): string[] {
  const workflow = parse(readFileSync(join(ROOT, '.github', 'workflows', 'tests.yml'), 'utf8')) as {
    jobs: Record<string, Job>;
  };
  const rows = [tableRow(['Job', 'Needs', 'Step', 'Command'])];
  rows.push('| --- | --- | --- | --- |');
  for (const [job, def] of Object.entries(workflow.jobs)) {
    const needs = [def.needs ?? []].flat().join(', ') || '—';
    for (const step of def.steps) {
      const command = step.run ? `\`${step.run.trim().split('\n').join(' && ')}\`` : `${step.uses}`;
      rows.push(tableRow([`\`${job}\``, needs, step.name ?? '(setup)', command]));
    }
  }
  return rows;
}

const MESSAGE =
  /(?:echo|printf)\s+(['"])(?:\\n)?\S+\s+Pre-(?:commit|push):\s*(.+?)(?:\.{3})?(?:\\n)?\1/;
// The npm / npx call of a step (flags only where they change the meaning, e.g. the audit level).
const COMMAND = /\b(npm (?:run [\w:.-]+|ci|audit(?: --audit-level=\w+)?)|npx [\w-]+)/g;

function hookTable(hook: string): string[] {
  const lines = readFileSync(join(ROOT, '.husky', hook), 'utf8').split('\n');
  const rows = [tableRow(['#', 'Step', 'Command']), '| --- | --- | --- |'];
  lines.forEach((line, i) => {
    const m = MESSAGE.exec(line);
    if (!m) return;
    const after = lines.slice(i + 1);
    const end = after.findIndex((l) => MESSAGE.test(l));
    const commands = (end === -1 ? after : after.slice(0, end))
      .filter((l) => !/^\s*(?:#|echo\b|printf\b)/.test(l)) // comments and messages mention commands
      .flatMap((l) => [...l.matchAll(COMMAND)].map((m) => m[1]));
    // A command without its own message would be documented under the previous step.
    if (commands.length > 1)
      throw new Error(
        `sync-steps: .husky/${hook}:${i + 1} runs ${commands.join(', ')} — give each step its own "Pre-…:" message`,
      );
    const command = commands[0];
    const conditional = /^\s+/.test(line) ? ' (conditional)' : '';
    rows.push(
      tableRow([
        String(rows.length - 1),
        `${m[2]}${conditional}`,
        command ? `\`${command}\`` : 'shell check',
      ]),
    );
  });
  if (rows.length === 2) throw new Error(`sync-steps: no step messages found in .husky/${hook}`);
  return rows;
}

function replaceBlock(doc: string, name: string, body: string[]): string {
  const start = `<!-- AUTO-GENERATED:${name} START — do not edit by hand (npm run sync:steps) -->`;
  const end = `<!-- AUTO-GENERATED:${name} END -->`;
  const a = doc.indexOf(start);
  const b = doc.indexOf(end);
  if (a === -1 || b === -1)
    throw new Error(`sync-steps: markers for ${name} missing in testing.md`);
  return `${doc.slice(0, a + start.length)}\n\n${body.join('\n')}\n\n${doc.slice(b)}`;
}

let doc = readFileSync(TESTING, 'utf8');
doc = replaceBlock(doc, 'ci-steps', ciTable());
doc = replaceBlock(doc, 'pre-commit-steps', hookTable('pre-commit'));
doc = replaceBlock(doc, 'pre-push-steps', hookTable('pre-push'));
if (await writeGenerated(TESTING, doc))
  console.log('✅ docs/development/testing.md step lists updated.');
else console.log('✅ docs/development/testing.md step lists already up to date.');
