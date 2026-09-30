#!/usr/bin/env tsx
/**
 * mutation-report.ts — summarises reports/mutation/mutation.json (T11c, ADR-0059).
 *
 * Prints the mutation score and the timeout share, appends them to the GitHub step summary when
 * running in Actions, and fails when more than 5 % of the mutants timed out: Stryker counts a
 * timeout as detected, so a starved runner inflates the score instead of lowering it (weekly run
 * 36770237372: 89 of 134 mutants timed out). A clean run had 0.4 % timeouts (2026-09-30).
 *
 * Run: npm run mutation:report (from v3/, after npm run test:mutation).
 */

import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_TIMEOUT_SHARE = 0.05;
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT =
  process.argv[2] ?? join(resolve(__dirname, '..'), 'reports', 'mutation', 'mutation.json');

interface Report {
  files: Record<string, { mutants: { status: string }[] }>;
}

const report = JSON.parse(readFileSync(REPORT, 'utf8')) as Report;
let detected = 0;
let timeouts = 0;
let total = 0;
for (const file of Object.values(report.files)) {
  for (const { status } of file.mutants) {
    if (['CompileError', 'RuntimeError', 'Ignored'].includes(status)) continue;
    total++;
    if (status === 'Killed' || status === 'Timeout') detected++;
    if (status === 'Timeout') timeouts++;
  }
}
const pct = (n: number): string => ((100 * n) / total).toFixed(2);
const line = `${pct(detected)} % detected (${detected} of ${total}), timeouts ${pct(timeouts)} %`;
console.log(`Mutation score: ${line}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Mutation score\n\n${line}\n`);
}
if (timeouts / total > MAX_TIMEOUT_SHARE) {
  console.error(
    `❌ Timeout share above ${MAX_TIMEOUT_SHARE * 100} % — the run was starved; the score is not trustworthy.`,
  );
  process.exit(1);
}
