// ─────────────────────────────────────────────────────────────────────────────
// codeGuards — keep code names on the agreed scheme (ADR-0052)
//
// 1. Component files (src/components, src/screens, src/App.tsx): PascalCase, no version
//    suffix (V2, V3 …), and the file exports a function with exactly its own name.
// 2. CSS class selectors in src/styles: `sb` / `sb-*` / `sb-theme-*`, states `is-*` / `has-*`.
// 3. npm scripts that run `tsx scripts/<file>.ts`: file name = script name with ':' → '-'.
// 4. Test IDs and locators (ADR-0054): every data-testid starts with the kebab-case name of
//    its component file and ends with an element kind (root: the component name alone);
//    E2E tests never locate by CSS class; spec files are kebab-case without a folder prefix,
//    helper files are named helpers.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

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
    .map(([name, cmd]) => ({ name, file: /tsx scripts\/([\w-]+)\.ts/.exec(cmd)?.[1] }))
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

// ── Test IDs and locators (ADR-0054) ─────────────────────────────────────────
const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
/** Element kinds a non-root test ID may end with (before instance placeholders). */
const KINDS = ['button', 'input', 'slider', 'tab', 'row', 'item', 'text', 'slot', 'region'];

describe('guard: data-testid scheme (ADR-0054)', () => {
  const ids: { file: string; id: string }[] = [];
  for (const f of componentFiles) {
    const src = readFileSync(join(SRC, f), 'utf8');
    for (const m of src.matchAll(/data-testid=(?:"([^"]+)"|\{`([^`]+)`\})/g)) {
      ids.push({ file: f, id: (m[1] ?? m[2]).replace(/\$\{[^}]+\}/g, '{}') });
    }
  }

  it('finds test IDs (sanity)', () => {
    expect(ids.length).toBeGreaterThan(30);
  });

  it('prefixes every test ID with its component name and ends with an element kind', () => {
    const bad = ids.filter(({ file, id }) => {
      const comp = kebab(basename(file, '.tsx'));
      if (!/^[a-z0-9-{}]+$/.test(id) || !(id === comp || id.startsWith(`${comp}-`))) return true;
      const rest = id.slice(comp.length).replace(/(-\{\})+$/, ''); // drop instance placeholders
      if (rest === '') return false; // root element
      const kind = rest.split('-').pop()!;
      return !KINDS.includes(kind);
    });
    expect(
      bad.map((b) => `${b.file}: ${b.id}`),
      `use <component>-<element>-<${KINDS.join('|')}>`,
    ).toEqual([]);
  });
});

describe('guard: E2E locators and spec names (ADR-0054)', () => {
  const E2E = join(V3, 'tests', 'e2e');
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? e.name.endsWith('-snapshots')
          ? []
          : walk(join(dir, e.name))
        : [join(dir, e.name)],
    );
  const files = walk(E2E).filter((f) => f.endsWith('.ts'));

  it('never locates or asserts by CSS class', () => {
    const bad: string[] = [];
    for (const f of files) {
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/locator\(\s*['"`]\.|toHaveClass\(|getAttribute\(\s*['"]class['"]/.test(line)) {
            bad.push(`${relative(E2E, f)}:${i + 1}`);
          }
        });
    }
    expect(bad, 'use getByRole / getByText / getByTestId instead of CSS classes').toEqual([]);
  });

  it('names specs in kebab-case without a folder prefix, helpers as helpers.ts', () => {
    const bad = files
      .map((f) => relative(E2E, f).split('\\').join('/'))
      .filter((rel) => {
        const parts = rel.split('/');
        const name = parts.pop()!;
        const folder = parts.pop();
        if (name.endsWith('.spec.ts')) {
          const base = name.replace(/\.spec\.ts$/, '');
          return (
            !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(base) || (folder && base.startsWith(`${folder}-`))
          );
        }
        return !['helpers.ts', 'projects.ts'].includes(name);
      });
    expect(bad).toEqual([]);
  });
});
