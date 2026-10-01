#!/usr/bin/env tsx
/**
 * mutation-report.ts — summarises reports/mutation/mutation.json (T11c, ADR-0059).
 *
 * Prints the mutation score and the timeout share, appends them to the GitHub step summary when
 * running in Actions, and fails when more than 5 % of the mutants timed out: Stryker counts a
 * timeout as detected, so a starved runner inflates the score instead of lowering it (weekly run
 * 36770237372: 89 of 134 mutants timed out). A clean run had 0.4 % timeouts (2026-09-30).
 *
 * In CI it also checks the runtime (MUTATION_SECONDS, set by the weekly job) against the job's
 * timeout-minutes in .github/workflows/weekly.yml (single source) and fails from 70 % on: the
 * run grows with mutants × test-suite time, and a red run is the only notification that is seen
 * (weekly.yml). Act before the job hits its limit (faster runner, incremental mode, split).
 *
 * Arguments: report files (default: reports/mutation/mutation.json); with several files — one
 * per module from the weekly matrix — they are summed. `--break` also enforces the threshold
 * `BREAK` of stryker.config.mjs over all of them (per-module jobs run with break: null).
 *
 * Run: npm run mutation:report (from v3/, after npm run test:mutation).
 */

import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { BREAK } from '../stryker.config.mjs';

const MAX_TIMEOUT_SHARE = 0.05;
const MAX_RUNTIME_SHARE = 0.7;
const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const enforceBreak = args.includes('--break');
const files = args.filter((a) => a !== '--break');
const REPORTS = files.length
  ? files
  : [join(resolve(__dirname, '..'), 'reports', 'mutation', 'mutation.json')];

interface Report {
  files: Record<string, { mutants: { status: string }[] }>;
}

const mutants = REPORTS.flatMap((path) =>
  Object.values((JSON.parse(readFileSync(path, 'utf8')) as Report).files).flatMap((f) => f.mutants),
);
let detected = 0;
let timeouts = 0;
let total = 0;
for (const { status } of mutants) {
  if (['CompileError', 'RuntimeError', 'Ignored'].includes(status)) continue;
  total++;
  if (status === 'Killed' || status === 'Timeout') detected++;
  if (status === 'Timeout') timeouts++;
}
const pct = (n: number): string => ((100 * n) / total).toFixed(2);
const line = `${pct(detected)} % detected (${detected} of ${total}), timeouts ${pct(timeouts)} %`;
console.log(`Mutation score: ${line}`);
// Unset or empty (a local run) → no runtime check; Number('') would be 0.
const seconds = process.env.MUTATION_SECONDS ? Number(process.env.MUTATION_SECONDS) : NaN;
let runtimeLine = '';
let runtimeShare = 0;
if (Number.isFinite(seconds)) {
  const workflow = parse(
    readFileSync(resolve(__dirname, '..', '..', '.github', 'workflows', 'weekly.yml'), 'utf8'),
  ) as { jobs: { mutation: { 'timeout-minutes': number } } };
  const limit = workflow.jobs.mutation['timeout-minutes'] * 60;
  runtimeShare = seconds / limit;
  runtimeLine = `runtime ${Math.round(seconds / 60)} min of the ${limit / 60} min job limit (${Math.round(100 * runtimeShare)} %)`;
  console.log(`Mutation run: ${runtimeLine}`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Mutation score\n\n${line}${runtimeLine ? `\n\n${runtimeLine}` : ''}\n`,
  );
}
if (runtimeShare > MAX_RUNTIME_SHARE) {
  console.error(
    `❌ The mutation run used more than ${MAX_RUNTIME_SHARE * 100} % of its time limit — act before it hits the limit (BACKLOG "T11c").`,
  );
  process.exitCode = 1;
}
if (enforceBreak && (100 * detected) / total < BREAK) {
  console.error(`❌ Mutation score ${pct(detected)} % is below the break threshold ${BREAK} %.`);
  process.exitCode = 1;
}
if (timeouts / total > MAX_TIMEOUT_SHARE) {
  console.error(
    `❌ Timeout share above ${MAX_TIMEOUT_SHARE * 100} % — the run was starved; the score is not trustworthy.`,
  );
  process.exit(1);
}
