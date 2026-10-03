#!/usr/bin/env tsx
/**
 * @fileoverview sync-exceptions.ts
 *
 * Generates docs/development/exceptions.md — the register of every deliberate exception to a
 * project rule (ADR-0053). Collected from the places where exceptions live, so the register
 * can never go stale:
 *   - ESLint disable directives (rule + reason after " -- ")
 *   - prettier-ignore comments (reason = comment line directly above)
 *   - test quarantine markers (skip / fixme / todo / fails + BACKLOG reference)
 *   - modules without a unit test (EXEMPT list in tests/unit/testGuards.test.ts)
 *   - tool ignore lists (.prettierignore, ESLint global ignores, docsGuards SKIP)
 *   - "## Exceptions" tables in ADRs
 *   - to-do markers with BACKLOG reference
 *
 * Run: npm run sync:exceptions  (from v3/) — part of npm run sync:docs.
 */

import { readdirSync, readFileSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { writeGenerated } from './lib/write-generated';
import { escapeCell } from './lib/markdown';
import { repoFiles } from './lib/repo-files';
import { findQuarantineMarkers } from './lib/test-markers';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const V3 = join(ROOT, 'v3');
const TARGET = join(ROOT, 'docs', 'development', 'exceptions.md');

const rel = (f: string): string => relative(ROOT, f).split('\\').join('/');
const esc = escapeCell;

/** Files below `dir` whose name matches (tracked and new files — .gitignore decides). */
function walk(dir: string, match: (f: string) => boolean): string[] {
  const prefix = relative(ROOT, dir).split('\\').join('/');
  return repoFiles(ROOT)
    .filter((f) => (prefix ? f.startsWith(`${prefix}/`) : true) && match(f.split('/').pop()!))
    .map((f) => join(ROOT, f))
    .sort();
}

const codeFiles = [
  ...walk(join(V3, 'src'), (f) => /\.(ts|tsx|css)$/.test(f)),
  ...walk(join(V3, 'tests'), (f) => /\.ts$/.test(f)),
  ...walk(join(V3, 'scripts'), (f) => /\.ts$/.test(f)),
  ...readdirSync(V3)
    .filter((f) => /\.config\.(js|ts)$/.test(f))
    .map((f) => join(V3, f))
    .sort(),
];
const lines = new Map(codeFiles.map((f) => [f, readFileSync(f, 'utf8').split('\n')]));
const SELF = rel(join(ROOT, 'scripts', 'sync-exceptions.ts'));

// ── ESLint directives ────────────────────────────────────────────────────────
const DIRECTIVE =
  /^\s*(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?\s+(.+?)\s+--\s+(.+?)\s*(?:\*\/)?\s*$/;
const eslintRows: string[] = [];
for (const [file, ls] of lines) {
  if (rel(file) === SELF) continue;
  ls.forEach((line, i) => {
    const m = DIRECTIVE.exec(line);
    if (m) eslintRows.push(`| \`${rel(file)}:${i + 1}\` | \`${esc(m[1])}\` | ${esc(m[2])} |`);
  });
}
// Rule switches in the ESLint config: `'<rule>': 'off', // <reason>` (reason enforced by testGuards).
readFileSync(join(V3, 'eslint.config.js'), 'utf8')
  .split('\n')
  .forEach((line, i) => {
    const m = /^\s*'([^']+)':\s*'off',\s*\/\/\s*(.+)$/.exec(line);
    if (m)
      eslintRows.push(
        `| \`v3/eslint.config.js:${i + 1}\` | \`${esc(m[1])}\` (off) | ${esc(m[2])} |`,
      );
  });

// ── prettier-ignore ──────────────────────────────────────────────────────────
const prettierRows: string[] = [];
for (const [file, ls] of lines) {
  if (rel(file) === SELF) continue;
  ls.forEach((line, i) => {
    if (!/^\s*(?:\/\/|\/\*)\s*prettier-ignore\b/.test(line)) return;
    const reason = (ls[i - 1] ?? '')
      .replace(/^\s*(?:\/\/|\/\*+|\*)\s*/, '')
      .replace(/\*\/\s*$/, '');
    prettierRows.push(`| \`${rel(file)}:${i + 1}\` | ${esc(reason)} |`);
  });
}

// ── Test quarantine ──────────────────────────────────────────────────────────
// The same marker scan as the testGuards check (scripts/lib/test-markers.ts)
const quarantineRows: string[] = [];
for (const [file, ls] of lines) {
  if (!rel(file).startsWith('v3/tests/') || !/\.(test|spec)\.ts$/.test(file)) continue;
  for (const m of findQuarantineMarkers(ls)) {
    quarantineRows.push(
      `| \`${rel(file)}:${m.line}\` | \`${m.kind}\` | BACKLOG "${esc(m.ref ?? '—')}" |`,
    );
  }
}

// ── Modules without unit test (EXEMPT) ───────────────────────────────────────
const guards = readFileSync(join(V3, 'tests', 'unit', 'testGuards.test.ts'), 'utf8');
const exemptBlock = /const EXEMPT[^{]*\{([\s\S]*?)\n\};/.exec(guards)?.[1] ?? '';
const exemptRows = [...exemptBlock.matchAll(/'([^']+)':\s*'([^']+)'/g)].map(
  (m) => `| \`v3/${m[1]}\` | ${esc(m[2])} |`,
);

// ── Tool ignore lists ────────────────────────────────────────────────────────
const toolRows: string[] = [];
{
  let reason = '';
  for (const line of readFileSync(join(ROOT, '.prettierignore'), 'utf8').split('\n')) {
    if (line.startsWith('#')) reason = line.replace(/^#\s*/, '');
    else if (line.trim())
      toolRows.push(`| \`.prettierignore\` | \`${esc(line)}\` | ${esc(reason)} |`);
  }
}
for (const [file, label] of [
  [join(V3, 'eslint.config.js'), 'ESLint global ignores'],
  [join(V3, 'tests', 'unit', 'docsGuards.test.ts'), 'docsGuards SKIP'],
] as const) {
  const src = readFileSync(file, 'utf8');
  const block = /(?:ignores: \[|const SKIP = new Set\(\[)([\s\S]*?)\]/.exec(src)?.[1] ?? '';
  for (const m of block.matchAll(/'([^']+)',\s*\/\/\s*(.+)/g)) {
    toolRows.push(`| ${label} | \`${esc(m[1])}\` | ${esc(m[2])} |`);
  }
}

// ── npm overrides (reason in the "//overrides" key of package.json, enforced by testGuards) ──
{
  const pkg = JSON.parse(readFileSync(join(V3, 'package.json'), 'utf8')) as {
    overrides?: Record<string, Record<string, string> | string>;
    '//overrides'?: Record<string, string>;
  };
  for (const [parent, value] of Object.entries(pkg.overrides ?? {})) {
    for (const [dep, version] of Object.entries(
      typeof value === 'string' ? { '': value } : value,
    )) {
      const key = dep ? `${parent} > ${dep}` : parent;
      toolRows.push(
        `| npm override | \`${esc(key)}\` → \`${esc(version)}\` | ${esc(pkg['//overrides']?.[key] ?? '')} |`,
      );
    }
  }
}

// ── Dependabot: deliberately ignored updates (reason = comment line directly above) ──
{
  const lines = readFileSync(join(ROOT, '.github', 'dependabot.yml'), 'utf8').split('\n');
  lines.forEach((line, i) => {
    const m = /^\s*- dependency-name: '([^']+)'/.exec(line);
    if (!m) return;
    const reason = /^\s*#\s*(.+)$/.exec(lines[i - 1] ?? '')?.[1] ?? '';
    const types = /update-types: \[([^\]]*)\]/.exec(lines[i + 1] ?? '')?.[1] ?? 'all';
    toolRows.push(
      `| Dependabot ignore | \`${esc(m[1])}\` (${esc(types.replace(/'/g, ''))}) | ${esc(reason)} |`,
    );
  });
}

// ── Vale: historical docs and marked historical passages ───────────────────────
const valeRows: string[] = [];
{
  const ini = readFileSync(join(ROOT, '.vale.ini'), 'utf8');
  const globs = /^\[\{([^}]+)\}\]\s*\nBasedOnStyles =\s*$/m.exec(ini)?.[1] ?? '';
  for (const g of globs
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)) {
    valeRows.push(
      `| \`.vale.ini\` | \`${esc(g)}\` | historical record — keeps the names valid at its time |`,
    );
  }
  const mdFiles = walk(ROOT, (f) => f.endsWith('.md')).filter(
    (f) => !/\/(node_modules|design-sources)\//.test(f),
  );
  for (const f of mdFiles) {
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const m = /<!-- vale ([\w.]+) = NO --><!-- reason: (.*?) -->/.exec(line);
        if (m) valeRows.push(`| \`${rel(f)}:${i + 1}\` | \`${esc(m[1])}\` off | ${esc(m[2])} |`);
      });
  }
}

// ── ADR "## Exceptions" tables ───────────────────────────────────────────────
const adrDir = join(ROOT, 'docs', 'architecture');
const adrRows: string[] = [];
for (const f of readdirSync(adrDir)
  .filter((n) => /^\d{4}-.*\.md$/.test(n))
  .sort()) {
  const doc = readFileSync(join(adrDir, f), 'utf8');
  const section = /^## Exceptions\n([\s\S]*?)(?=^## )/m.exec(doc)?.[1] ?? '';
  for (const row of section.split('\n').filter((l) => l.startsWith('|'))) {
    const cells = row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 4 || /^-+$/.test(cells[0]) || cells[0] === 'Exception' || cells[0] === '…')
      continue;
    adrRows.push(`| [ADR-${f.slice(0, 4)}](../architecture/${f}) | ${cells.join(' | ')} |`);
  }
}

// ── To-do markers ────────────────────────────────────────────────────────────
const TODO = /(?:\/\/|\/\*|^\s*\*)\s*(TODO|FIXME|XXX)\b(.*)$/;
const todoRows: string[] = [];
for (const [file, ls] of lines) {
  ls.forEach((line, i) => {
    const m = TODO.exec(line);
    if (m) todoRows.push(`| \`${rel(file)}:${i + 1}\` | ${m[1]} | ${esc(m[2])} |`);
  });
}

// ── Render ───────────────────────────────────────────────────────────────────
function section(title: string, intro: string, header: string, rows: string[]): string[] {
  const sep =
    '|' +
    header
      .split('|')
      .slice(1, -1)
      .map(() => '---')
      .join('|') +
    '|';
  return [
    `## ${title} (${rows.length})`,
    '',
    intro,
    '',
    ...(rows.length ? [header, sep, ...rows] : ['_None._']),
    '',
  ];
}

const out = [
  '# Exception register',
  '',
  '<!-- AUTO-GENERATED by `npm run sync:exceptions` (v3/scripts/sync-exceptions.ts) — do not edit. -->',
  '',
  'Every deliberate exception to a project rule, collected from where it lives (ADR-0053).',
  'Permanent exceptions carry a reason; temporary ones also a `BACKLOG "…"` reference that says',
  'when they are reviewed. To add or remove one, change it at its source and run',
  '`npm run sync:docs`.',
  '',
  ...section(
    'Design and rule exceptions — ADRs',
    'From the `## Exceptions` section of each ADR.',
    '| ADR | Exception | Reason | Reference | Review |',
    adrRows,
  ),
  ...section(
    'ESLint rule suppressions',
    'Inline: `// eslint-disable-next-line <rule> -- <reason>` (enforced by `require-description`). ' +
      "Config: `'<rule>': 'off', // <reason>` in `v3/eslint.config.js` (enforced by `testGuards.test.ts`).",
    '| Location | Rule | Reason |',
    eslintRows,
  ),
  ...section(
    'Formatting exceptions (prettier-ignore)',
    'The reason is the comment line directly above — enforced by `testGuards.test.ts`.',
    '| Location | Reason |',
    prettierRows,
  ),
  ...section(
    'Quarantined tests',
    'Procedure: `docs/development/testing.md`; reference enforced by `testGuards.test.ts`.',
    '| Location | Marker | Reference |',
    quarantineRows,
  ),
  ...section(
    'Modules without their own unit test',
    'EXEMPT list in `v3/tests/unit/testGuards.test.ts`.',
    '| Module | Reason |',
    exemptRows,
  ),
  ...section(
    'Tool ignore lists',
    'Paths excluded from formatting, linting or doc guards.',
    '| Tool | Pattern | Reason |',
    toolRows,
  ),
  ...section(
    'Prose lint exceptions (Vale)',
    'Historical docs excluded in `.vale.ini`, and passages marked `<!-- vale … = NO --><!-- reason: … -->` (ADR-0056).',
    '| Where | Scope | Reason |',
    valeRows,
  ),
  ...section(
    'To-do markers',
    'Only with a `BACKLOG "…"` reference — enforced by `testGuards.test.ts`.',
    '| Location | Marker | Text |',
    todoRows,
  ),
].join('\n');

const total =
  adrRows.length +
  eslintRows.length +
  prettierRows.length +
  quarantineRows.length +
  exemptRows.length +
  toolRows.length +
  valeRows.length +
  todoRows.length;
if (await writeGenerated(TARGET, out)) {
  console.log(`✅ exceptions.md regenerated (${total} exceptions).`);
} else {
  console.log(`✅ exceptions.md already up to date (${total} exceptions).`);
}
