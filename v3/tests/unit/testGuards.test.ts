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
// 3. Exception scheme (ADR-0053) for markers ESLint cannot check:
//    to-do markers (TODO, FIXME, XXX) carry a BACKLOG reference; every `// prettier-ignore`
//    is preceded by a comment line giving the reason.
// 4. Every TypeScript file in v3/ (incl. v3/scripts/) belongs to a project that `tsc -b` checks
//    (T12, ADR-0055) — Vitest and Playwright run tests without type checking, so an
//    unchecked file hides type errors (found: 6 in unit tests, 1 in E2E, 2026-09-30).
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import ts from 'typescript';

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

describe('guard: exception markers follow the scheme (ADR-0053)', () => {
  const ROOT = join(V3, '..');
  const files = [
    ...walk(join(V3, 'src'), (f) => /\.(ts|tsx|css)$/.test(f)),
    ...walk(join(V3, 'tests'), (f) => /\.ts$/.test(f)),
    ...walk(join(V3, 'scripts'), (f) => /\.ts$/.test(f)),
  ];
  const TODO = /(?:\/\/|\/\*|^\s*\*)\s*(?:TODO|FIXME|XXX)\b/;
  const REF = /BACKLOG "([^"]+)"/;

  it('scans source, test and script files (sanity)', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it('gives every TODO / FIXME / XXX comment a BACKLOG reference', () => {
    const bad: string[] = [];
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (TODO.test(line) && !REF.test(line)) bad.push(`${rel(file)}:${i + 1}`);
        });
    }
    expect(bad, 'add a BACKLOG "<heading part>" reference to the to-do marker').toEqual([]);
  });

  it('precedes every prettier-ignore with a reason comment', () => {
    const bad: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!/^\s*(?:\/\/|\/\*)\s*prettier-ignore\b/.test(line)) return;
        const above = (lines[i - 1] ?? '').trim();
        if (!/^(?:\/\/|\/\*|\*)\s*\S/.test(above) || /prettier-ignore/.test(above)) {
          bad.push(`${rel(file)}:${i + 1}`);
        }
      });
    }
    expect(bad, 'add a comment line with the reason directly above').toEqual([]);
  });
});

describe('guard: every TypeScript file is type-checked (ADR-0055)', () => {
  const ROOT = join(V3, '..');
  const rootConfig = ts.readConfigFile(join(V3, 'tsconfig.json'), ts.sys.readFile).config as {
    references: { path: string }[];
  };
  const checked = new Set<string>();
  for (const ref of rootConfig.references) {
    const path = join(V3, ref.path);
    const { config } = ts.readConfigFile(path, ts.sys.readFile);
    for (const f of ts.parseJsonConfigFileContent(config, ts.sys, dirname(path)).fileNames) {
      checked.add(rel(f));
    }
  }
  // All of v3/ incl. v3/scripts/ (walk skips node_modules and snapshot folders).
  const tsFiles = walk(V3, (f) => /\.tsx?$/.test(f)).map(rel);

  it('reads the referenced projects (sanity)', () => {
    expect(rootConfig.references.length).toBeGreaterThanOrEqual(4);
    expect(tsFiles.length).toBeGreaterThan(60);
  });

  it('covers every .ts/.tsx file with a project referenced from v3/tsconfig.json', () => {
    const unchecked = tsFiles.filter((f) => !checked.has(f));
    expect(unchecked, 'add the file (or its folder) to a referenced tsconfig').toEqual([]);
  });
});
