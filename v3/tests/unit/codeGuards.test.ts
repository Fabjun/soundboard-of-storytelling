// ─────────────────────────────────────────────────────────────────────────────
// codeGuards — keep code names on the agreed scheme (ADR-0052)
//
// 1. Component files (src/components, src/screens, src/App.tsx): PascalCase, no version
//    suffix (V2, V3 …), and the file exports a function with exactly its own name.
// 2. CSS class selectors in src/styles: `sb` / `sb-*` / `sb-theme-*`, states `is-*` / `has-*`.
// 3. npm scripts that run `tsx ../scripts/<file>.ts`: file name = script name with ':' → '-'.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const V3 = join(__dirname, '..', '..');
const SRC = join(V3, 'src');

const componentFiles = [
  ...['components', 'screens'].flatMap((dir) =>
    readdirSync(join(SRC, dir))
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => join(dir, f)),
  ),
  'App.tsx',
];

describe('guard: component file names (ADR-0052)', () => {
  it('finds component files (sanity)', () => {
    expect(componentFiles.length).toBeGreaterThan(15);
  });

  it('uses PascalCase without a version suffix', () => {
    const bad = componentFiles.filter((f) => {
      const name = f
        .split('/')
        .pop()!
        .replace(/\.tsx$/, '');
      return !/^[A-Z][A-Za-z0-9]*$/.test(name) || /V\d+$/.test(name);
    });
    expect(bad, 'rename to PascalCase, drop V2/V3 suffixes').toEqual([]);
  });

  it('exports a function named exactly like the file', () => {
    const bad = componentFiles.filter((f) => {
      const name = f
        .split('/')
        .pop()!
        .replace(/\.tsx$/, '');
      return !new RegExp(`^export function ${name}\\b`, 'm').test(
        readFileSync(join(SRC, f), 'utf8'),
      );
    });
    expect(bad, 'file name and exported component must match').toEqual([]);
  });
});

describe('guard: CSS class namespaces (ADR-0052 / ADR-0021)', () => {
  const ALLOWED = /^(?:sb|sb-[a-z0-9-]+|is-[a-z0-9-]+|has-[a-z0-9-]+)$/;
  const classes = new Set<string>();
  for (const file of readdirSync(join(SRC, 'styles')).filter((f) => f.endsWith('.css'))) {
    const css = readFileSync(join(SRC, 'styles', file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '') // comments
      .replace(/url\([^)]*\)/g, '') // url(...) and @import targets
      .replace(/@import[^;]*;/g, '')
      .replace(/\{[^{}]*\}/g, '{}'); // declarations (values like 0.5em)
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(m[1]);
  }

  it('finds classes (sanity)', () => {
    expect(classes.size).toBeGreaterThan(100);
  });

  it('uses only sb-*, is-* and has-* classes', () => {
    const bad = [...classes].filter((c) => !ALLOWED.test(c)).sort();
    expect(bad, 'prefix project classes with sb-, states with is-/has-').toEqual([]);
  });
});

describe('guard: script files are named after their npm scripts (ADR-0052)', () => {
  const scripts: Record<string, string> = JSON.parse(
    readFileSync(join(V3, 'package.json'), 'utf8'),
  ).scripts;
  const runs = Object.entries(scripts)
    .map(([name, cmd]) => ({ name, file: /tsx \.\.\/scripts\/([\w-]+)\.ts/.exec(cmd)?.[1] }))
    .filter((s): s is { name: string; file: string } => s.file !== undefined);

  it('finds script-backed npm scripts (sanity)', () => {
    expect(runs.length).toBeGreaterThanOrEqual(6);
  });

  it('maps <group>:<name> to scripts/<group>-<name>.ts', () => {
    const bad = runs
      .filter((s) => s.file !== s.name.replace(/:/g, '-'))
      .map((s) => `${s.name} → ${s.file}.ts`);
    expect(bad).toEqual([]);
  });
});
