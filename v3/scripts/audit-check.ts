/**
 * @fileoverview audit-check — the security audit of the pre-push hook and CI (npm run audit:check)
 *
 * Runs `npm audit --json` and fails on a high or critical advisory, unless `"//audit-allow"` in
 * `v3/package.json` allows it with its reason (scripts/lib/audit-allow.ts); fails as well when an
 * allowed advisory is no longer reported, so the exception goes once it is fixed.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judgeAudit, type AuditReport } from './lib/audit-allow';

const V3 = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(V3, 'package.json'), 'utf8')) as {
  '//audit-allow'?: Record<string, string>;
};
// npm audit exits non-zero whenever it finds anything; the report on stdout is what counts
const run = spawnSync('npm', ['audit', '--json'], { cwd: V3, encoding: 'utf8' });
let report: AuditReport;
try {
  report = JSON.parse(run.stdout) as AuditReport;
} catch {
  console.error(`❌ npm audit gave no report (exit ${run.status}):\n${run.stderr}`);
  process.exit(1);
}
const { blocking, allowed, stale } = judgeAudit(report, pkg['//audit-allow'] ?? {});
for (const a of allowed) console.log(`⚠  allowed (v3/package.json "//audit-allow"): ${a}`);
if (blocking.length > 0) {
  console.error(`❌ high/critical advisories:\n  ${blocking.join('\n  ')}`);
  console.error('   Try `npm audit fix` (without --force) first; details: npm audit');
}
if (stale.length > 0) {
  console.error(
    `❌ allowed but no longer reported — remove from "//audit-allow": ${stale.join(', ')}`,
  );
}
if (blocking.length > 0 || stale.length > 0) process.exit(1);
console.log('✅ No high/critical advisory that is not allowed.');
