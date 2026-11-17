/**
 * @fileoverview audit-allow — which npm audit findings block (scripts/lib/audit-allow.ts)
 *
 * Cases: a high and a critical advisory block, a moderate one does not; an allowed advisory does
 * not block and is listed as allowed; an allowed advisory npm no longer reports is stale; one
 * advisory reached through several packages counts once; packages that only depend on a
 * vulnerable one (a string in `via`) add nothing; an empty report blocks nothing.
 */

import { judgeAudit, type AuditReport } from '../../scripts/lib/audit-allow';

const advisory = (id: string, severity: string, name: string) => ({
  url: `https://github.com/advisories/${id}`,
  severity,
  name,
  title: `${name} problem`,
});

const REPORT: AuditReport = {
  vulnerabilities: {
    picomatch: { via: [advisory('GHSA-aaaa-1111-high', 'high', 'picomatch')] },
    'other/picomatch': { via: [advisory('GHSA-aaaa-1111-high', 'high', 'picomatch')] },
    glob: { via: [advisory('GHSA-bbbb-2222-mod', 'moderate', 'glob'), 'minimatch'] },
    tar: { via: [advisory('GHSA-cccc-3333-crit', 'critical', 'tar')] },
    vite: { via: ['picomatch'] },
  },
};

describe('judgeAudit', () => {
  it('blocks high and critical, never moderate; each advisory once', () => {
    expect(judgeAudit(REPORT, {})).toEqual({
      blocking: [
        'GHSA-aaaa-1111-high picomatch (high): picomatch problem',
        'GHSA-cccc-3333-crit tar (critical): tar problem',
      ],
      allowed: [],
      stale: [],
    });
  });

  it('an allowed advisory does not block and is listed as allowed', () => {
    const v = judgeAudit(REPORT, { 'GHSA-aaaa-1111-high': 'no fix yet' });
    expect(v.blocking).toEqual(['GHSA-cccc-3333-crit tar (critical): tar problem']);
    expect(v.allowed).toEqual(['GHSA-aaaa-1111-high picomatch (high): picomatch problem']);
  });

  it('an allowed advisory npm no longer reports is stale', () => {
    expect(judgeAudit({ vulnerabilities: {} }, { 'GHSA-gone-0000-0000': 'fixed' })).toEqual({
      blocking: [],
      allowed: [],
      stale: ['GHSA-gone-0000-0000'],
    });
  });

  it('a clean or empty report blocks nothing', () => {
    expect(judgeAudit({}, {})).toEqual({ blocking: [], allowed: [], stale: [] });
  });
});
