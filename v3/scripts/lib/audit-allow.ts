/**
 * @fileoverview audit-allow — which npm audit findings block a push and a pull request
 *
 * The gate blocks at high and critical severity (pre-push hook, CI). An advisory that has no fixed
 * version and cannot reach the shipped app may be allowed for a time, with its reason, in the
 * `"//audit-allow"` key of `v3/package.json` (owner decision 2026-11-17; ADR-0053 exceptions — the
 * register `docs/development/exceptions.md` lists it). OWASP, "Vulnerable and Outdated Components":
 * judge a finding by whether it can be exploited, and record a deliberate exception with a review.
 * An allowed advisory that npm no longer reports fails the check too, so the exception is removed
 * once it is fixed.
 */

/** The severities that block. */
const BLOCKING = new Set(['high', 'critical']);

/** One advisory as `npm audit --json` lists it in a package's `via`. */
interface Advisory {
  url: string;
  severity: string;
  name: string;
  title: string;
}

/** The part of the `npm audit --json` report the check reads. */
export interface AuditReport {
  vulnerabilities?: Record<string, { via: (Advisory | string)[] }>;
}

/** What the check found: advisories that block, and allowed ones npm no longer reports. */
export interface AuditVerdict {
  blocking: string[];
  allowed: string[];
  stale: string[];
}

/** Returns the GHSA id at the end of an advisory URL, or the URL itself when it has none. */
function advisoryId(url: string): string {
  return /GHSA-[\w-]+$/.exec(url)?.[0] ?? url;
}

/**
 * Sorts the advisories of `report` into those that block (high or critical, not in `allow`) and
 * those allowed, each as "GHSA-… package (severity): title"; and names every id of `allow` the
 * report no longer holds as stale.
 */
export function judgeAudit(
  report: AuditReport,
  allow: Readonly<Record<string, string>>,
): AuditVerdict {
  const seen = new Map<string, Advisory>();
  for (const pkg of Object.values(report.vulnerabilities ?? {}))
    for (const via of pkg.via) if (typeof via !== 'string') seen.set(advisoryId(via.url), via);
  const line = (id: string, a: Advisory) => `${id} ${a.name} (${a.severity}): ${a.title}`;
  const severe = [...seen].filter(([, a]) => BLOCKING.has(a.severity));
  return {
    blocking: severe.filter(([id]) => !(id in allow)).map(([id, a]) => line(id, a)),
    allowed: severe.filter(([id]) => id in allow).map(([id, a]) => line(id, a)),
    stale: Object.keys(allow).filter((id) => !seen.has(id)),
  };
}
