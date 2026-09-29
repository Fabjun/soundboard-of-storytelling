// ─────────────────────────────────────────────────────────────────────────────
// testGuards — structural guards that keep the test suite honest (T7)
//
// 1. Every logic module (src/lib, src/state, src/db, src/audio) has a unit test
//    file tests/unit/**/<name>.test.ts — or an EXEMPT entry with a reason.
//    (CLAUDE.md required this only as text; upload.ts, libDnd.ts and nanoid.ts had
//    no tests until 2026-09-29 and nobody noticed.)
// 2. Every quarantine marker (skip / fixme / todo / fails) in tests/ is preceded
//    by a reference  BACKLOG "<part of a heading>"  that exists in docs/backlog.md.
//    (Four 'flaky' skips hid never-written tests and a missing feature.)
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const V3 = join(__dirname, '..', '..');
const BACKLOG = join(V3, '..', 'docs/backlog.md');
const LOGIC_DIRS = ['src/lib', 'src/state', 'src/db', 'src/audio'];

/** Modules that intentionally have no unit test file of their own — reason required. */
const EXEMPT: Record<string, string> = {
  'src/lib/changelog.ts': 'data only (release notes), no logic',
  'src/audio/types.ts': 'type declarations only',
  'src/audio/index.ts': 'audio facade — tested through tests/unit/audio/engine.test.ts',
  'src/lib/libDnd.ts':
    'pointer/DOM drag — covered by E2E pad-creation test 14 in Chromium and WebKit',
};

function walk(dir: string, match: (f: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry.endsWith('-snapshots')) continue;
      out.push(...walk(full, match));
    } else if (match(entry)) {
      out.push(full);
    }
  }
  return out;
}

const rel = (f: string): string => relative(V3, f).split('\\').join('/');

describe('guard: every logic module has a unit test', () => {
  const modules = LOGIC_DIRS.flatMap((d) =>
    walk(join(V3, d), (f) => f.endsWith('.ts') && !f.endsWith('.d.ts')),
  ).map(rel);
  const testNames = new Set(
    walk(join(V3, 'tests', 'unit'), (f) => f.endsWith('.test.ts')).map((f) =>
      basename(f, '.test.ts'),
    ),
  );

  it('finds logic modules (sanity)', () => {
    expect(modules.length).toBeGreaterThan(8);
  });

  it('has a tests/unit/**/<name>.test.ts for every module not exempted', () => {
    const missing = modules.filter((m) => !EXEMPT[m] && !testNames.has(basename(m, '.ts')));
    expect(missing, 'add a unit test, or an EXEMPT entry with a reason').toEqual([]);
  });

  it('keeps exemptions justified and current', () => {
    for (const [file, reason] of Object.entries(EXEMPT)) {
      expect(existsSync(join(V3, file)), `stale exemption: ${file} no longer exists`).toBe(true);
      expect(reason.trim().length, `exemption without reason: ${file}`).toBeGreaterThan(10);
      expect(
        testNames.has(basename(file, '.ts')),
        `${file} now has its own test — remove the exemption`,
      ).toBe(false);
    }
  });
});

describe('guard: every quarantine marker references an existing BACKLOG entry', () => {
  const headings = readFileSync(BACKLOG, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('#'));
  const MARKER = /\b(?:test|it|describe)(?:\.describe)?\.(skip|fixme|todo|fails)\s*\(/;
  const REF = /BACKLOG "([^"]+)"/;
  const LOOKBACK = 8;

  const markers: { at: string; ref: string | null }[] = [];
  for (const file of walk(join(V3, 'tests'), (f) => /\.(test|spec)\.ts$/.test(f))) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (line.trim().startsWith('//') || !MARKER.test(line)) return;
      const context = lines.slice(Math.max(0, i - LOOKBACK), i + 1).join('\n');
      markers.push({ at: `${rel(file)}:${i + 1}`, ref: REF.exec(context)?.[1] ?? null });
    });
  }

  it('finds the known quarantine markers (sanity)', () => {
    expect(markers.length).toBeGreaterThanOrEqual(4);
  });

  it('has a BACKLOG "<heading>" reference within the lines above each marker', () => {
    const unreferenced = markers.filter((m) => m.ref === null).map((m) => m.at);
    expect(unreferenced, `add // … BACKLOG "<heading part>" above the marker`).toEqual([]);
  });

  it('references headings that exist in docs/backlog.md', () => {
    const dangling = markers
      .filter((m) => m.ref !== null && !headings.some((h) => h.includes(m.ref!)))
      .map((m) => `${m.at} → BACKLOG "${m.ref}"`);
    expect(dangling, 'no BACKLOG heading contains this text').toEqual([]);
  });
});
