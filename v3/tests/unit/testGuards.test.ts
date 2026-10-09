/**
 * @fileoverview testGuards — structural guards that keep the test suite honest (T7)
 *
 * 1. Every logic module (src/lib, src/state, src/db, src/audio) has a unit test
 *    file <name>.test.ts anywhere under tests/unit/ — or an EXEMPT entry with a reason.
 *    (CLAUDE.md required this only as text; upload.ts, libDnd.ts and nanoid.ts had
 *    no tests until 2026-09-29 and nobody noticed.)
 * 2. Every quarantine marker (skip / fixme / todo / fails) in tests/ is preceded
 *    by a reference  BACKLOG "<part of a heading>"  that exists in docs/backlog.md.
 *    (Four 'flaky' skips hid never-written tests and a missing feature.)
 * 3. Exception scheme (ADR-0053) for markers ESLint cannot check:
 *    to-do markers (TODO, FIXME, XXX) carry a BACKLOG reference; every `// prettier-ignore`
 *    is preceded by a comment line giving the reason.
 * 4. Every TypeScript file in v3/ (incl. v3/scripts/) belongs to a project that `tsc -b` checks
 *    (T12, ADR-0055) — Vitest and Playwright run tests without type checking, so an
 *    unchecked file hides type errors (found: 6 in unit tests, 1 in E2E, 2026-09-30).
 * 5. Lockstep dependency families (exact peer pins) share a Dependabot group (audit A6).
 * 6. Guard files (this one included) number their header rules 1..n in order — and number some:
 *    the check looked for `// 1.` lines only and found none once the headers became doc blocks
 *    (ADR-0064), so three missing codeGuards rules went unnoticed (2026-10-09).
 * 7. ESLint config rule switches name their reason inline; the tsc flags behind them stay on.
 * 8. Dependabot ignore rules carry a reason; @types/node matches the Node major in .nvmrc.
 * 9. npm overrides carry a reason; files excluded from mutation testing are EXEMPT files.
 * 10. lint-staged runs ESLint where its config lives: every lint-staged config with an ESLint
 *    task sits next to an eslint.config.js and passes no --config, and the pre-commit hook lets
 *    lint-staged find its configs (no --config / --cwd). With `--config v3/eslint.config.js` from
 *    the root, ESLint matched its file patterns against the root — none matched under v3/, most
 *    rules never ran at commit time and errors surfaced only in CI (2026-10-04).
 * 11. Every CI job that runs steps has `timeout-minutes` (a job that calls a reusable workflow
 *    cannot have one): a browser download hung for over 13 minutes on 2026-10-09, and GitHub's
 *    default limit is 360 minutes — the required checks would have blocked every merge.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import ts from 'typescript';
import { repoFiles } from '../../scripts/lib/repo-files';
import { findQuarantineMarkers } from '../../scripts/lib/test-markers';

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

/** Files below `dir` whose name matches, as absolute paths (.gitignore decides — repoFiles). */
function walk(dir: string, match: (f: string) => boolean): string[] {
  const root = join(V3, '..');
  const prefix = relative(root, dir).split('\\').join('/');
  return repoFiles(root)
    .filter((f) => f.startsWith(`${prefix}/`) && match(basename(f)))
    .map((f) => join(root, f));
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
  // The same marker scan as the exception register (scripts/lib/test-markers.ts)
  const markers = walk(join(V3, 'tests'), (f) => /\.(test|spec)\.ts$/.test(f)).flatMap((file) =>
    findQuarantineMarkers(readFileSync(file, 'utf8').split('\n')).map((m) => ({
      at: `${rel(file)}:${m.line}`,
      ref: m.ref,
    })),
  );

  // A probe of the scan itself, not a count of today's markers: a typed count went stale when
  // two quarantines were lifted (2026-10-09), and fewer markers is the goal, not a failure.
  it('finds a marker and its BACKLOG reference, and skips a marker named in a comment (sanity)', () => {
    // Joined at run time, so this file's own lines hold no marker for the scan above
    const marker = (kind: string) => ['test', kind].join('.') + '(';
    const probe = findQuarantineMarkers([
      `// ${'BACK'}LOG "Probe heading"`,
      `${marker('fixme')}'probe', () => {});`,
      ` * ${marker('skip')} named in a comment`,
    ]);
    expect(probe).toEqual([{ line: 2, kind: 'fixme', ref: 'Probe heading' }]);
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

describe('guard: lockstep dependency families update together (audit A6)', () => {
  // A package that pins another direct dependency to an EXACT version as peer (vitest ↔
  // @vitest/coverage-v8, size-limit ↔ @size-limit/file) cannot be updated alone: `npm ci`
  // fails on the peer conflict. Both must share a Dependabot group.
  const pkg = JSON.parse(readFileSync(join(V3, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  const direct = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const pairs: [string, string][] = [];
  for (const name of direct) {
    const meta = JSON.parse(
      readFileSync(join(V3, 'node_modules', name, 'package.json'), 'utf8'),
    ) as { peerDependencies?: Record<string, string> };
    for (const [peer, range] of Object.entries(meta.peerDependencies ?? {})) {
      if (direct.includes(peer) && /^\d+\.\d+\.\d+$/.test(range)) pairs.push([name, peer]);
    }
  }
  // Groups as written in .github/dependabot.yml: `<name>:` followed by `patterns: [...]`.
  const yml = readFileSync(join(V3, '..', '.github', 'dependabot.yml'), 'utf8');
  const groups = [...yml.matchAll(/^ {6}([\w-]+):\n {8}patterns: \[([^\]]*)\]/gm)].map((m) =>
    m[2].split(',').map((p) => new RegExp(`^${p.trim().replace(/'/g, '').replace(/\*/g, '.*')}$`)),
  );
  const shareGroup = (a: string, b: string): boolean =>
    groups.some((g) => g.some((re) => re.test(a)) && g.some((re) => re.test(b)));

  it('finds exact peer pins and groups (sanity)', () => {
    expect(pairs.length).toBeGreaterThanOrEqual(2);
    expect(groups.length).toBeGreaterThanOrEqual(3);
  });

  it('every exact peer pin is inside one group', () => {
    const bad = pairs.filter(([a, b]) => !shareGroup(a, b)).map(([a, b]) => `${a} → ${b}`);
    expect(bad, 'add both packages to one group in .github/dependabot.yml').toEqual([]);
  });
});

describe('guard: guard files list their rules in order', () => {
  // The numbered rule list in a guard file's header is its table of contents; it drifted out
  // of order twice (docsGuards 4-6-5, testGuards 5 before 4 on 2026-09-30).
  const files = readdirSync(join(V3, 'tests', 'unit')).filter((f) => f.endsWith('Guards.test.ts'));

  /** The rule numbers of a guard file's header — ` * 1. …` in its doc block (or `// 1. …`). */
  const ruleNumbers = (f: string): number[] => {
    const header = readFileSync(join(V3, 'tests', 'unit', f), 'utf8').split('\n\n')[0];
    return [...header.matchAll(/^\s*(?:\/\/|\*) (\d+)\. /gm)].map((m) => Number(m[1]));
  };

  it('finds the guard files and their rules (sanity)', () => {
    expect(files.length).toBeGreaterThanOrEqual(3);
    expect(files.filter((f) => ruleNumbers(f).length === 0)).toEqual([]);
  });

  it('header rules are numbered 1..n without gaps', () => {
    const bad = files.flatMap((f) => {
      const nums = ruleNumbers(f);
      return nums.every((n, i) => n === i + 1) ? [] : [`${f}: ${nums.join(' ')}`];
    });
    expect(bad).toEqual([]);
  });
});

describe('guard: ESLint rule switches carry a reason that stays true (audit A5)', () => {
  const config = readFileSync(join(V3, 'eslint.config.js'), 'utf8').split('\n');
  const switches = config.filter((l) => /^\s*'[^']+':\s*'off'/.test(l));

  it('finds the rule switches (sanity)', () => {
    expect(switches.length).toBeGreaterThanOrEqual(1);
  });

  it("every `'rule': 'off'` names its reason inline (exception register, ADR-0053)", () => {
    const bad = switches.filter((l) => !/'off',\s*\/\/\s*\S/.test(l)).map((l) => l.trim());
    expect(bad).toEqual([]);
  });

  it('the reason of TSC_COVERED holds: every tsconfig project reports unused code', () => {
    const projects = readdirSync(V3).filter((f) => /^tsconfig\..+\.json$/.test(f));
    const bad = projects.filter((f) => {
      // parseJsonConfigFileContent resolves `extends` (the test projects inherit the flags).
      const { config: cfg } = ts.readConfigFile(join(V3, f), ts.sys.readFile);
      const opts = ts.parseJsonConfigFileContent(cfg, ts.sys, V3).options;
      return opts.noUnusedLocals !== true || opts.noUnusedParameters !== true;
    });
    expect(projects.length).toBeGreaterThanOrEqual(4);
    expect(bad, 're-enable no-unused-vars in eslint.config.js or restore the tsc flags').toEqual(
      [],
    );
  });
});

describe('guard: deliberately ignored dependency updates stay justified', () => {
  const yml = readFileSync(join(V3, '..', '.github', 'dependabot.yml'), 'utf8').split('\n');
  const ignores = yml
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => /^\s*- dependency-name: /.test(line));

  it('finds the ignore rules (sanity)', () => {
    expect(ignores.length).toBeGreaterThanOrEqual(1);
  });

  it('every ignore rule has a reason comment directly above (ADR-0053)', () => {
    const bad = ignores.filter(({ i }) => !/^\s*#\s*\S/.test(yml[i - 1] ?? '')).map((x) => x.line);
    expect(bad).toEqual([]);
  });

  it('@types/node has the same major version as the Node runtime (.nvmrc)', () => {
    const nvmrc = readFileSync(join(V3, '..', '.nvmrc'), 'utf8')
      .trim()
      .split('.')[0];
    const pkg = JSON.parse(readFileSync(join(V3, 'package.json'), 'utf8')) as {
      devDependencies: Record<string, string>;
    };
    const major = /\d+/.exec(pkg.devDependencies['@types/node'])?.[0];
    expect(major, 'raise @types/node together with .nvmrc').toBe(nvmrc);
  });
});

describe('guard: mutation testing and overrides stay justified (T11c)', () => {
  it('every npm override has a reason in the "//overrides" key', () => {
    const pkg = JSON.parse(readFileSync(join(V3, 'package.json'), 'utf8')) as {
      overrides?: Record<string, Record<string, string> | string>;
      '//overrides'?: Record<string, string>;
    };
    const keys = Object.entries(pkg.overrides ?? {}).flatMap(([parent, value]) =>
      typeof value === 'string' ? [parent] : Object.keys(value).map((dep) => `${parent} > ${dep}`),
    );
    expect(keys.filter((k) => !pkg['//overrides']?.[k]?.trim())).toEqual([]);
  });

  it('files excluded from mutation are exactly the EXEMPT files without unit tests', () => {
    const config = readFileSync(join(V3, 'stryker.config.mjs'), 'utf8');
    const excluded = [...config.matchAll(/'!(src\/[^']+)'/g)].map((m) => m[1]);
    expect(excluded.length).toBeGreaterThanOrEqual(1);
    expect(excluded.filter((f) => !(f in EXEMPT))).toEqual([]);
  });
});

describe('guard: lint-staged runs ESLint where its config lives (2026-10-04)', () => {
  const ROOT = join(V3, '..');

  it('a lint-staged config with an ESLint task sits next to eslint.config.js and passes no --config', () => {
    const configs = repoFiles(ROOT).filter((f) => basename(f) === '.lintstagedrc.json');
    expect(configs.length).toBeGreaterThanOrEqual(2); // the root's and v3's
    const problems = configs.flatMap((file) => {
      const tasks = Object.values(JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as object)
        .flat()
        .map(String)
        .filter((t) => /\beslint\b/.test(t));
      const dir = dirname(join(ROOT, file));
      return tasks.flatMap((t) => [
        ...(existsSync(join(dir, 'eslint.config.js'))
          ? []
          : [`${file}: "${t}" runs where no eslint.config.js is`]),
        ...(/--config\b|(^|\s)-c\s/.test(t) ? [`${file}: "${t}" passes --config`] : []),
      ]);
    });
    expect(problems).toEqual([]);
  });

  it('the pre-commit hook lets lint-staged find its configs', () => {
    const hook = readFileSync(join(ROOT, '.husky/pre-commit'), 'utf8');
    // The lines that run lint-staged — not comments, not the echo / printf messages about it
    const calls = hook
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /\blint-staged\b/.test(l) && !/^(#|echo\b|printf\b)/.test(l));
    expect(calls.length).toBe(1);
    expect(calls.filter((l) => /--config|--cwd/.test(l))).toEqual([]);
  });
});

describe('guard: every CI job has a time limit (2026-10-09)', () => {
  const ROOT = join(V3, '..');
  const workflows = repoFiles(ROOT).filter((f) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(f));

  /** The jobs of a workflow with their own lines (two-space keys under `jobs:`). */
  const jobsOf = (file: string): { name: string; body: string[] }[] => {
    const lines = readFileSync(join(ROOT, file), 'utf8').split('\n');
    const start = lines.indexOf('jobs:');
    const jobs: { name: string; body: string[] }[] = [];
    for (const line of lines.slice(start + 1)) {
      const key = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
      if (key) jobs.push({ name: key[1], body: [] });
      else if (/^\S/.test(line)) break;
      else jobs.at(-1)?.body.push(line);
    }
    return jobs;
  };

  it('finds the workflows and their jobs (sanity)', () => {
    expect(workflows).toEqual(expect.arrayContaining(['.github/workflows/tests.yml']));
    expect(jobsOf('.github/workflows/tests.yml').map((j) => j.name)).toContain('e2e-full');
  });

  it('every job that runs steps sets timeout-minutes', () => {
    const missing = workflows.flatMap((file) =>
      jobsOf(file)
        .filter((j) => !j.body.some((l) => /^ {4}uses: /.test(l))) // calls a reusable workflow
        .filter((j) => !j.body.some((l) => /^ {4}timeout-minutes: \d+/.test(l)))
        .map((j) => `${file}: ${j.name}`),
    );
    expect(missing, 'set timeout-minutes — about 3x the longest run, at least 10').toEqual([]);
  });
});
