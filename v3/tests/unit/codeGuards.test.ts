/**
 * @fileoverview codeGuards — keep code names on the agreed scheme (ADR-0052)
 *
 * 1. Component files (src/components, src/screens, src/App.tsx): PascalCase, no version
 *    suffix (V2, V3 …), and the file exports a function with exactly its own name.
 * 2. CSS class selectors in src/styles: `sb` / `sb-*` / `sb-theme-*`, states `is-*` / `has-*`.
 * 3. npm scripts that run `tsx scripts/<file>.ts`: file name = script name with ':' → '-'.
 * 4. Test IDs and locators (ADR-0054): every data-testid starts with the kebab-case name of
 *    its component file and ends with an element kind (root: the component name alone); a value
 *    inserted with `${…}` is, by its type, a kebab-case literal or a free value at the end;
 *    E2E tests never locate by CSS class; spec files are kebab-case without a folder prefix,
 *    helper files are named helpers.ts.
 *    Numbered E2E titles (`N — …`) are the Slice-3 verification points 1–22, each used once.
 *    Specs reload only through reloadApp, which waits for running board saves.
 * 5. Inline style lengths carry a unit (Preact 11 no longer appends px to numbers) — checked
 *    with the TypeScript type checker, so variables, ternaries and shorthands count.
 * 6. The stored state is loaded once, before the first render (src/state/boot.ts): only boot.ts
 *    and the store's own setters replace boards / libraryItems — a load that finished after the
 *    first render replaced a board created meanwhile (2026-10-02). Reading for an export is fine.
 * 7. Board writes go through src/state/boardWrites.ts: components and screens never call
 *    boardPut / upsertBoard, which save or show a finished board computed from an outdated copy
 *    (BACKLOG "Bug: board writes from an outdated board copy lose changes"). A screen that
 *    reacts to a change uses applyBoardChange (at once), never `if (await updateBoard(`.
 * 8. No internal plan names ("Slice 8", "BACKLOG") in what the app shows — text and attributes of
 *    components and screens; code comments may name them.
 * 9. No localStorage / sessionStorage anywhere (owner decision 2026-10-02, ADR-0062): small
 *    UI state lives in IndexedDB (src/state/prefs.ts) — web.dev advises against localStorage.
 * 10. Every file with a timer (setTimeout / setInterval) is listed with its reason. A delayed
 *    write goes through src/lib/debouncedSave.ts, which writes a pending value when its context
 *    ends instead of dropping it — a bare clearTimeout lost a typed pad name (2026-10-02).
 * 11. Every TypeScript file (src, tests, scripts, configuration files) opens with a
 *    `/** @fileoverview …` block — only a shebang or a tool directive may come first — and none
 *    opens with a box of `─` lines (ADR-0064; Google TypeScript style guide). Four header forms
 *    were in use before (measured 2026-10-03). A section divider is one line, `// ── Title ──…`,
 *    never a box of `// ----` lines (26 boxes in 7 files, converted 2026-10-03).
 * 12. Code and its comments (src, scripts) name no slice of the superseded May plan (Slices 5–8,
 *    CLAUDE.md "Re-plan 2026-09-28"): "deferred to Slice 8" says nothing about today's plan. Seven
 *    such statements were stale on 2026-10-03; the version history (src/lib/changelog.ts) is
 *    exempt — it records what was true then.
 * 13. Code kept for a later implementation carries `@reserved Slice N — …` or
 *    `@reserved Parked — …` (ADR-0064; owner decision 2026-10-03: such code is never deleted). The
 *    slice exists in CLAUDE.md's slice table and is not complete — a finished slice that left its
 *    reserved code unused is reported, so a reservation cannot go stale.
 * 14. American spelling in every file that is not Markdown — code, comments, styles, test names,
 *    configuration (owner decision 2026-10-04). The word list is the Vale rule
 *    .vale/styles/SoS/AmericanSpelling.yml, which checks the Markdown files; the exceptions below
 *    name their reason (verbatim third-party material, deliberate search words).
 * 15. Controls work with Tab and have a name (owner rule 2026-10-02, ADR-0080): a click handler
 *    sits on a control Tab reaches; a button that shows only an icon has an aria-label.
 * 16. Type and spacing are rem (ADR-0081): no px in a font-size, padding, margin or gap of the
 *    stylesheets but the named exceptions.
 * 17. One look for a disabled control: the token --disabled-opacity and cursor: not-allowed.
 * 18. Code and tests carry no review status ("review pending"): a decision waiting for the owner
 *    is listed in its pull request; once merged the owner has decided, and a marker left in a
 *    comment is stale — three were on 2026-10-09. The version history is exempt.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import ts from 'typescript';
import { findReservations, RESERVED_TAG } from '../../scripts/lib/reserved-code';
import { repoFiles } from '../../scripts/lib/repo-files';

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

/** The app's TypeScript program — built once, for the guards that need the type checker. */
let appProgram: ts.Program | undefined;
function getAppProgram(): ts.Program {
  if (!appProgram) {
    const { config } = ts.readConfigFile(join(V3, 'tsconfig.app.json'), ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config, ts.sys, V3);
    appProgram = ts.createProgram(parsed.fileNames, parsed.options);
  }
  return appProgram;
}

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

describe('guard: values inserted into test IDs (ADR-0054)', () => {
  // The scheme above sees `${…}` only as a placeholder; the type checker tells what it inserts.
  // A fixed value (a union of literals, e.g. 'pause' | 'play') must be kebab-case; a free value
  // (an id, an index) may only come after the element kind, as an instance id. `${handle}`
  // inserting 'trimEnd' passed the scheme above unseen (2026-10-03).
  const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  let inserts = 0;
  const bad: string[] = [];
  // Building the type checker is one-off setup, shared with the inline-style guard
  beforeAll(() => {
    const program = getAppProgram();
    const checker = program.getTypeChecker();
    /** The values of a literal type or union of literals; null for a free type (string, number). */
    const literals = (t: ts.Type): string[] | null => {
      const parts = t.isUnion() ? t.types : [t];
      return parts.every((p) => p.isStringLiteral() || p.isNumberLiteral())
        ? parts.map((p) => String((p as ts.LiteralType).value))
        : null;
    };
    for (const sf of program.getSourceFiles()) {
      if (!sf.fileName.startsWith(SRC) || !sf.fileName.endsWith('.tsx')) continue;
      const visit = (node: ts.Node): void => {
        if (
          ts.isJsxAttribute(node) &&
          node.name.getText(sf) === 'data-testid' &&
          node.initializer &&
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression &&
          ts.isTemplateExpression(node.initializer.expression)
        ) {
          const spans = node.initializer.expression.templateSpans;
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
          const where = `${relative(V3, sf.fileName)}:${line + 1}`;
          spans.forEach((span, i) => {
            inserts++;
            const values = literals(checker.getTypeAtLocation(span.expression));
            const inserted = span.expression.getText(sf);
            if (values) {
              const off = values.filter((v) => !KEBAB.test(v));
              if (off.length)
                bad.push(`${where} \${${inserted}}: ${off.join(', ')} not kebab-case`);
              return;
            }
            // Free value: only `-${…}` may follow it
            const rest = spans.slice(i);
            const trailing = rest.every((s, j) =>
              j === rest.length - 1 ? s.literal.text === '' : s.literal.text === '-',
            );
            if (!trailing) bad.push(`${where} \${${inserted}}: free value before the element kind`);
          });
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
  }, 30_000);

  it('finds inserted values (sanity)', () => {
    expect(inserts).toBeGreaterThan(15);
  });

  it('fixed values are kebab-case, free values only at the end', () => {
    expect(bad, 'insert kebab-case literals; ids and indices go last').toEqual([]);
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

  it('reloads only through reloadApp (it waits for running board saves)', () => {
    // A change shows before it is saved (updateBoard) — a bare reload can lose it (pad-dnd
    // test 20 did on 2026-10-02).
    const bad = files
      .filter((f) => basename(f) !== 'helpers.ts')
      .filter((f) => /\bpage\.reload\(/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(E2E, f));
    expect(bad, 'use reloadApp(page) from helpers.ts').toEqual([]);
  });

  it('numbers only the Slice-3 verification points (1–22), each once', () => {
    // `test('N — …')` marks a Slice-3 verification point; later tests carry no number
    // (two specs once both had a test 12).
    const seen = new Map<number, string>();
    const bad: string[] = [];
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\btest\(\s*['"`](\d+) —/g)) {
        const n = Number(m[1]);
        const where = relative(E2E, f);
        if (n < 1 || n > 22) bad.push(`${where}: ${n} is not a Slice-3 verification point`);
        else if (seen.has(n)) bad.push(`${where}: ${n} also in ${seen.get(n)}`);
        else seen.set(n, where);
      }
    }
    expect(bad, 'new tests get a title without a number').toEqual([]);
  });

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

describe('guard: inline style lengths carry a unit (Preact 11 upgrade)', () => {
  // Preact 10 appends "px" to numeric style values; Preact 11 does not (upgrade guide). A number
  // for a length would silently stop working, so every length is written with its unit. The
  // TypeScript checker sees through variables, ternaries and shorthand properties.
  const UNITLESS = new Set([
    'opacity',
    'zIndex',
    'flex',
    'flexGrow',
    'flexShrink',
    'order',
    'lineHeight',
    'fontWeight',
    'zoom',
    'animationIterationCount',
  ]);
  let program: ts.Program;
  let found: string[];
  // Building the type checker and scanning all components is one-off setup (~0.5 s, more
  // under coverage), not the test itself.
  beforeAll(() => {
    program = getAppProgram();
    found = numericStyles();
  }, 30_000);

  const numericStyles = (): string[] => {
    const checker = program.getTypeChecker();
    const isNumber = (t: ts.Type): boolean =>
      t.isUnion() ? t.types.some(isNumber) : (t.flags & ts.TypeFlags.NumberLike) !== 0;
    const found: string[] = [];
    for (const sf of program.getSourceFiles()) {
      if (!sf.fileName.startsWith(SRC) || !sf.fileName.endsWith('.tsx')) continue;
      const visit = (node: ts.Node): void => {
        if (
          ts.isJsxAttribute(node) &&
          node.name.getText(sf) === 'style' &&
          node.initializer &&
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression
        ) {
          const type = checker.getTypeAtLocation(node.initializer.expression);
          for (const prop of type.getProperties()) {
            if (UNITLESS.has(prop.name) || prop.name.startsWith('--')) continue;
            if (isNumber(checker.getTypeOfSymbolAtLocation(prop, node))) {
              const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
              found.push(`${relative(V3, sf.fileName)}:${line + 1} ${prop.name}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    return found;
  };

  it('finds style attributes (sanity)', () => {
    const files = program.getSourceFiles().filter((f) => f.fileName.startsWith(SRC));
    expect(files.length).toBeGreaterThan(20);
  });

  it('no numeric value for a length in style={…}', () => {
    expect(found, 'write the unit, e.g. `${n}px`').toEqual([]);
  });
});

describe('guard: the stored state is loaded only before the first render (src/state/boot.ts)', () => {
  const walkSrc = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walkSrc(join(dir, e.name)) : [join(dir, e.name)],
    );
  // `boards.value = …` / `libraryItems.value = …` replaces the whole collection in the store
  const writers = walkSrc(SRC)
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => /\b(boards|libraryItems)\.value\s*=(?!=)/.test(readFileSync(f, 'utf8')))
    .map((f) => relative(SRC, f).split('\\').join('/'))
    .sort();

  it('boot.ts fills the store (sanity)', () => {
    expect(writers).toContain('state/boot.ts');
  });

  it('only boot.ts and the store setters replace boards / library list', () => {
    expect(writers, 'load in src/state/boot.ts; change through the store setters').toEqual([
      'state/boot.ts',
      'state/store.ts',
    ]);
  });
});

describe('guard: board writes go through boardWrites (BACKLOG "board writes from an outdated board copy")', () => {
  const calls = componentFiles.flatMap((f) => {
    const src = readFileSync(join(SRC, f), 'utf8');
    return [...src.matchAll(/\b(boardPut|upsertBoard)\s*\(/g)].map((m) => `${f}: ${m[1]}(…)`);
  });
  const usesUpdateBoard = componentFiles.filter((f) =>
    /\bupdateBoard\s*\(/.test(readFileSync(join(SRC, f), 'utf8')),
  );

  it('finds board writers (sanity)', () => {
    expect(usesUpdateBoard.length).toBeGreaterThanOrEqual(5);
  });

  it('the screen reacts to a change at once, not after its save (applyBoardChange)', () => {
    // `if (await updateBoard(` / `x = await updateBoard(` reacts only once the save is done — a
    // name typed meanwhile went to the previous pad (2026-10-02).
    const late = componentFiles.flatMap((f) =>
      /(if \(|=\s*)await updateBoard\(/.test(readFileSync(join(SRC, f), 'utf8')) ? [f] : [],
    );
    expect(late, 'const { board } = applyBoardChange(…); if (board) …').toEqual([]);
  });

  it('components and screens use updateBoard / createBoard, never boardPut / upsertBoard', () => {
    expect(calls, 'write: await updateBoard(board.id, (b) => change(b, …))').toEqual([]);
  });
});

describe('guard: the app shows no internal plan names', () => {
  // Comment lines (`//`, `/*`, `*`, `{/*`) may name slices; everything else is rendered or an attribute
  const shown = componentFiles.flatMap((f) =>
    readFileSync(join(SRC, f), 'utf8')
      .split('\n')
      .map((line, i) => ({ line, at: `${f}:${i + 1}` }))
      .filter(({ line }) => !/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line))
      .filter(({ line }) => /\b(Slice \d|BACKLOG)\b/.test(line.replace(/\/\/.*$/, '')))
      .map(({ at }) => at),
  );

  it('finds component files (sanity)', () => {
    expect(componentFiles.length).toBeGreaterThan(20);
  });

  it('no component or screen shows a slice number or a backlog reference', () => {
    expect(shown, 'say what the user can do, not where it is planned').toEqual([]);
  });
});

describe('guard: no localStorage or sessionStorage (ADR-0062)', () => {
  const walkSrc = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walkSrc(join(dir, e.name)) : [join(dir, e.name)],
    );
  const files = walkSrc(SRC).filter((f) => /\.tsx?$/.test(f));

  it('finds source files (sanity)', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('no source file uses localStorage or sessionStorage', () => {
    const bad = files
      .filter((f) => /\b(localStorage|sessionStorage)\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f));
    expect(bad, 'keep UI state in IndexedDB: a typed function in src/state/prefs.ts').toEqual([]);
  });
});

describe('guard: timers are listed with their reason (delayed writes use debouncedSave)', () => {
  /** src-relative file → why it needs a timer. None of them delays a write. */
  const TIMER_FILES: Record<string, string> = {
    'audio/engine.ts': 'V1 audio engine: fades, combo steps, pause timers (ADR-0044)',
    'components/LibraryPanel.tsx': 'long press starts the library drag',
    'components/ModeToggle.tsx': 'removes the spark elements after their animation',
    'components/UpdatePrompt.tsx': 'asks the server for a new version every hour (ADR-0066)',
    'components/UndoToast.tsx': 'hides the toast; the deletion itself is already saved',
    'lib/backupExport.ts': 'revokes the download URL once the browser has taken the file',
    'lib/debouncedSave.ts': 'the delayed write itself — flushed, never dropped',
    'state/stopControl.ts': 'ends the first STOP ALL stage when its fade is over (K16)',
  };
  const walkSrc = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walkSrc(join(dir, e.name)) : [join(dir, e.name)],
    );
  const withTimers = walkSrc(SRC)
    .filter(
      (f) => /\.tsx?$/.test(f) && /\bset(Timeout|Interval)\s*\(/.test(readFileSync(f, 'utf8')),
    )
    .map((f) => relative(SRC, f).split('\\').join('/'))
    .sort();

  it('finds timers (sanity)', () => {
    expect(withTimers).toContain('lib/debouncedSave.ts');
  });

  it('every file with a timer is listed — a delayed write uses debouncedSave instead', () => {
    expect(
      withTimers,
      'save later: debouncedSave(write, ms); other timers: add file + reason',
    ).toEqual(Object.keys(TIMER_FILES).sort());
  });
});

describe('guard: dialogs close on Escape through useEscapeKey (ADR-0074)', () => {
  // A document keydown listener added in a passive effect misses a key pressed right after the
  // dialog appeared (two races in CI, 2026-10-05); src/lib/escapeKey.ts is the one place that adds one
  const walkSrc = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walkSrc(join(dir, e.name)) : [join(dir, e.name)],
    );
  const withKeydown = walkSrc(SRC)
    .filter(
      (f) =>
        /\.tsx?$/.test(f) && /addEventListener\(\s*['"]keydown['"]/.test(readFileSync(f, 'utf8')),
    )
    .map((f) => relative(SRC, f).split('\\').join('/'))
    .sort();

  it('finds the hook (sanity)', () => {
    expect(withKeydown).toContain('lib/escapeKey.ts');
  });

  /**
   * The files allowed to add one, each with its reason. state/keyControl.ts: the one listener
   * that lets keys play pads (ADR-0077, owner decision 2026-10-08) — not a dialog, and added once
   * at app start in main.tsx, never in an effect, so the race above cannot happen.
   */
  const ALLOWED = ['lib/escapeKey.ts', 'state/keyControl.ts'];

  it('no other file adds a keydown listener — use useEscapeKey', () => {
    expect(
      withKeydown,
      'close a dialog with useEscapeKey(onClose, active); keys that play pads: state/keyControl.ts',
    ).toEqual(ALLOWED);
  });
});

describe('guard: every TypeScript file opens with a file overview (ADR-0064)', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );
  const files = [
    ...['src', 'tests', 'scripts'].flatMap((d) => walk(join(V3, d))),
    ...readdirSync(V3)
      .filter((f) => /\.config\.(ts|js|mjs)$/.test(f))
      .map((f) => join(V3, f)),
  ].filter((f) => /\.(tsx?|mjs)$/.test(f) || /\.config\.js$/.test(f));

  /** The file's text after a shebang and leading tool directives (they must come first). */
  const opening = (text: string): string =>
    text.replace(/^(#!.*\n|\/\/ @vitest-environment .*\n)*/, '');

  it('finds TypeScript files in src, tests, scripts and the configuration (sanity)', () => {
    const rel = files.map((f) => relative(V3, f).split('\\').join('/'));
    expect(rel).toEqual(expect.arrayContaining(['src/main.tsx', 'eslint.config.js']));
    expect(rel.filter((f) => f.startsWith('tests/')).length).toBeGreaterThan(50);
  });

  it('the first comment is a /** @fileoverview block, never a box of ─ lines', () => {
    const bad = files
      .filter((f) => !/^\/\*\*\n \* @fileoverview \S/.test(opening(readFileSync(f, 'utf8'))))
      .map((f) => relative(V3, f).split('\\').join('/'));
    expect(bad, 'open the file with /**\\n * @fileoverview <what the file is for>').toEqual([]);
  });

  it('section dividers are one line (// ── Title ──…), never a box of // ---- lines', () => {
    const bad = files.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .flatMap((line, i) =>
          /^\s*\/\/ -{20,}\s*$/.test(line)
            ? [`${relative(V3, f).split('\\').join('/')}:${i + 1}`]
            : [],
        ),
    );
    expect(bad, 'write the divider as // ── Title ───').toEqual([]);
  });
});

describe('guard: code names no slice of the superseded May plan (Slices 5–8)', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );
  /** The version history records what was true then. */
  const EXEMPT = new Set(['src/lib/changelog.ts']);
  const files = ['src', 'scripts']
    .flatMap((d) => walk(join(V3, d)))
    .filter((f) => /\.(tsx?|css)$/.test(f))
    .map((f) => relative(V3, f).split('\\').join('/'))
    .filter((f) => !EXEMPT.has(f));
  const MAY_PLAN = /\bSlices? [5-8](?![0-9])/;

  it('scans source, styles and scripts (sanity)', () => {
    expect(files).toEqual(expect.arrayContaining(['src/styles/tokens.css', 'src/main.tsx']));
  });

  it('no file names Slice 5, 6, 7 or 8 — say which slice of today’s plan, or none', () => {
    const bad = files.flatMap((f) =>
      readFileSync(join(V3, f), 'utf8')
        .split('\n')
        .flatMap((line, i) => (MAY_PLAN.test(line) ? [`${f}:${i + 1}`] : [])),
    );
    expect(bad, 'the May plan is superseded (CLAUDE.md "Re-plan 2026-09-28")').toEqual([]);
  });
});

describe('guard: reserved code names an open slice or a parked decision (ADR-0064)', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );
  /** Slice number → status cell, from CLAUDE.md's slice table. */
  const slices = new Map(
    [
      ...readFileSync(join(V3, '..', 'CLAUDE.md'), 'utf8').matchAll(
        /^\| (\d+) +\|[^|]+\|([^|]+)\|/gm,
      ),
    ].map((m) => [Number(m[1]), m[2].trim()]),
  );
  const files = ['src', 'scripts']
    .flatMap((d) => walk(join(V3, d)))
    .filter((f) => /\.tsx?$/.test(f));
  const rel = (f: string) => relative(V3, f).split('\\').join('/');
  // The same tag scan as the exception register (scripts/lib/reserved-code.ts)
  const reservations = files.flatMap((f) =>
    findReservations(readFileSync(f, 'utf8').split('\n')).map((r) => ({
      at: `${rel(f)}:${r.line}`,
      text: r.text,
    })),
  );

  it('reads the slice table and finds the reservations (sanity)', () => {
    // Slice 1 is finished for good — its status cell proves the table is read column by column
    expect(slices.get(1)).toContain('Complete');
    expect(reservations.length).toBeGreaterThanOrEqual(5);
  });

  it('a @reserved tag stands at the start of a doc comment line, where tools find it', () => {
    // A tag elsewhere in a doc comment (e.g. on a one-line /** … */) would be honored by knip
    // but missed by this guard and the register; prose names the tag in backticks
    const bad = files.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .flatMap((line, i) =>
          /^\s*(\/\*\*|\*).*(?<!`)@reserved\b/.test(line) && !RESERVED_TAG.test(line)
            ? [`${rel(f)}:${i + 1}`]
            : [],
        ),
    );
    expect(bad, 'put @reserved on its own line of the doc comment').toEqual([]);
  });

  it('every @reserved says "Slice N — …" or "Parked — …"', () => {
    const bad = reservations
      .filter((r) => !/^(Slice \d+|Parked) — \S/.test(r.text))
      .map((r) => `${r.at}: ${r.text}`);
    expect(bad, 'write @reserved Slice N — <what for>, or @reserved Parked — <what>').toEqual([]);
  });

  it('the slice exists and is not complete — a finished slice must use or release its code', () => {
    const bad = reservations.flatMap((r) => {
      const n = /^Slice (\d+)/.exec(r.text)?.[1];
      if (!n) return [];
      const status = slices.get(Number(n));
      return status && !status.includes('Complete') && !status.includes('Superseded')
        ? []
        : [`${r.at}: Slice ${n} is ${status ?? 'not in the slice table'}`];
    });
    expect(bad).toEqual([]);
  });
});

describe('guard: American spelling outside Markdown (owner decision 2026-10-04)', () => {
  const ROOT = join(V3, '..');
  const RULE = '.vale/styles/SoS/AmericanSpelling.yml';
  const swap = new Map(
    [...readFileSync(join(ROOT, RULE), 'utf8').matchAll(/^ {2}([a-z]+): ([a-z]+)$/gm)].map(
      (m) => [m[1], m[2]] as const,
    ),
  );
  /** Files that keep their spelling, each with its reason (ADR-0053). */
  const KEEP: [RegExp, string][] = [
    [/\.md$/, 'Markdown is checked by Vale with the same rule'],
    [/^design-sources\//, 'Claude Design downloads, kept as delivered (CLAUDE.md)'],
    [/^v3\/src\/icons\/catalog\.json$/, 'search words: British forms are deliberate synonyms'],
    [/^v3\/src\/icons\/v1-map\.json$/, "V1's icon ids, an external format"],
    [/^v3\/src\/icons\/sets\/.*\.LICENSE\.txt$/, 'third-party license texts, verbatim'],
    [/^\.vale\/styles\/SoS\/AmericanSpelling\.yml$/, 'the word list itself'],
    [/(^|\/)package-lock\.json$/, 'names and texts of third-party packages'],
    [/\.(png|jpe?g|gif|ico|svg|woff2?|ttf|gz|zip|wav|mp3|ogg|webp|pdf)$/, 'binary or image files'],
  ];

  it('reads the word list of the Vale rule (sanity)', () => {
    expect(swap.size).toBeGreaterThan(50);
    expect([...swap].filter(([british, american]) => british === american)).toEqual([]);
  });

  it('no British spelling in code, comments, styles, test names or configuration', () => {
    const word = new RegExp(`\\b(${[...swap.keys()].join('|')})\\b`, 'gi');
    const bad = repoFiles(ROOT)
      .filter((f) => !KEEP.some(([re]) => re.test(f)))
      .flatMap((f) =>
        readFileSync(join(ROOT, f), 'utf8')
          .split('\n')
          .flatMap((line, i) =>
            [...line.matchAll(word)].map(
              (m) => `${f}:${i + 1}: ${m[0]} → ${swap.get(m[0].toLowerCase())}`,
            ),
          ),
      );
    expect(bad).toEqual([]);
  });
});

describe('guard: controls work with Tab and have a name (owner rule 2026-10-02)', () => {
  // CLAUDE.md UI rules: every control works with the Tab key and has an accessible name (icon
  // buttons: aria-label). axe (tests/e2e/a11y.spec.ts) checks names at runtime; it cannot see a
  // click handler on a plain element, so that half is checked here, in the source.
  const NATIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary', 'label']);
  const ICONS = new Set(['PixelIcon', 'IconGlyph']);

  /** Plain elements allowed to take a click, each with its reason. */
  const ALLOWED_CLICKS: Record<string, string> = {
    'components/TopBar.tsx sb-mode-badge':
      'never shown — no screen passes `mode`; becomes a button when one does',
  };

  type Found = {
    at: string;
    tag: string;
    attrs: Map<string, string>;
    node: ts.JsxElement | ts.JsxSelfClosingElement;
  };
  const elements: Found[] = componentFiles.flatMap((file) => {
    const sf = ts.createSourceFile(
      file,
      readFileSync(join(SRC, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const out: Found[] = [];
    const visit = (n: ts.Node): void => {
      const el = ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : null;
      if (el) {
        const attrs = new Map<string, string>();
        for (const p of el.attributes.properties)
          if (ts.isJsxAttribute(p))
            attrs.set(p.name.getText(sf), p.initializer ? p.initializer.getText(sf) : 'true');
        const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        out.push({
          at: `${file}:${line}`,
          tag: el.tagName.getText(sf),
          attrs,
          node: n as Found['node'],
        });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    return out;
  });

  /** Whether the element shows text somewhere inside (text, or an expression that is no icon). */
  const showsText = (n: ts.Node): boolean =>
    ts.isJsxText(n)
      ? n.getText().trim() !== ''
      : ts.isJsxExpression(n)
        ? n.expression !== undefined &&
          !(ts.isJsxSelfClosingElement(n.expression) && ICONS.has(n.expression.tagName.getText()))
        : ts.isJsxSelfClosingElement(n) && ICONS.has(n.tagName.getText())
          ? false
          : ts.isJsxElement(n)
            ? n.children.some(showsText)
            : false;

  it('finds buttons and click handlers (sanity)', () => {
    expect(elements.filter((e) => e.tag === 'button').length).toBeGreaterThan(40);
  });

  it('a click handler sits on a control that Tab reaches', () => {
    const bad = elements
      .filter((e) => /^[a-z]/.test(e.tag) && !NATIVE.has(e.tag) && e.attrs.has('onClick'))
      .filter((e) => !(e.attrs.has('role') && e.attrs.has('tabIndex')))
      // closing a dialog by a click beside it — Escape does the same (ADR-0074)
      .filter((e) => !/backdrop/.test(e.attrs.get('class') ?? ''))
      // only keeps a click inside from reaching what is behind
      .filter((e) => !/^\{\(?e\)? => e\.stopPropagation\(\)\}$/.test(e.attrs.get('onClick') ?? ''))
      .filter((e) => {
        const cls = /sb-[\w-]+/.exec(e.attrs.get('class') ?? '')?.[0] ?? '';
        return !(`${e.at.split(':')[0]} ${cls}` in ALLOWED_CLICKS);
      })
      .map((e) => `${e.at} <${e.tag}>`);
    expect(
      bad,
      'use a <button> (sb-row-button for a list row) — or role + tabIndex + keys',
    ).toEqual([]);
  });

  it('a button that shows only an icon has an aria-label', () => {
    const bad = elements
      .filter((e) => e.tag === 'button' && ts.isJsxElement(e.node))
      .filter((e) => !(e.node as ts.JsxElement).children.some(showsText))
      .filter((e) => !e.attrs.has('aria-label') && !e.attrs.has('aria-labelledby'))
      .map((e) => e.at);
    expect(bad, 'add aria-label (a title alone is not reliably read)').toEqual([]);
  });
});

describe('guard: type and spacing in rem (ADR-0081, owner decision 2026-10-02)', () => {
  // WCAG 2.2 SC 1.4.4: text resizable to 200 %; px font sizes and spacing ignore the user's text
  // size. px stays for borders, pixel-art details and minimum touch targets only.
  const STYLES = ['styles/tokens.css', 'styles/components.css', 'styles/global.css'];
  const TYPE_AND_SPACING =
    /^\s*(font-size|padding(-[a-z-]+)?|margin(-[a-z-]+)?|gap|row-gap|column-gap)\s*:([^;]*);/;

  /** The px values kept on purpose, each with its reason. */
  const ALLOWED: Record<string, string> = {
    'margin-bottom: -1px': 'pulls a 1px border under the next one — a border, not spacing',
    'padding-inline: max(0px, calc((100% - 40rem) / 2))': '0px is zero — no length',
    'gap: 1px': 'the 1px line between waveform bars — a pixel-art detail',
  };

  const lines = STYLES.flatMap((file) =>
    readFileSync(join(SRC, file), 'utf8')
      .split('\n')
      .map((text, i) => ({ at: `${file}:${i + 1}`, text })),
  );

  it('finds the declarations (sanity)', () => {
    expect(lines.filter((l) => TYPE_AND_SPACING.test(l.text)).length).toBeGreaterThan(200);
  });

  it('font sizes, padding, margins and gaps use rem, not px', () => {
    const bad = lines
      .filter((l) => {
        const m = TYPE_AND_SPACING.exec(l.text);
        return m !== null && /\dpx/.test(m[4]);
      })
      .filter((l) => !Object.keys(ALLOWED).some((ok) => l.text.trim().startsWith(ok)))
      .map((l) => `${l.at}: ${l.text.trim()}`);
    expect(bad, 'write rem (px / 16) — or name the exception in ALLOWED with its reason').toEqual(
      [],
    );
  });

  it('the spacing and type tokens are rem', () => {
    const bad = lines
      .filter((l) => /^\s*--(space|fs)-[\w-]+\s*:/.test(l.text) && !/:\s*[\d.]+rem;/.test(l.text))
      .map((l) => `${l.at}: ${l.text.trim()}`);
    expect(bad).toEqual([]);
  });
});

describe('guard: one look for a disabled control (structure review 2026-10-09)', () => {
  // Three looks existed (0.4 / 0.5, cursor default / not-allowed); now the token
  // --disabled-opacity and cursor: not-allowed for every :disabled or aria-disabled rule.
  const css = readFileSync(join(SRC, 'styles', 'components.css'), 'utf8');
  const rules = [...css.matchAll(/([^{}]*(?::disabled|aria-disabled)[^{}]*)\{([^}]*)\}/g)].map(
    (m) => ({ selector: m[1].trim().split('\n').at(-1) ?? '', body: m[2] }),
  );

  it('finds the disabled rules (sanity)', () => {
    expect(rules.length).toBeGreaterThanOrEqual(3);
  });

  it('every disabled rule uses --disabled-opacity and cursor: not-allowed', () => {
    const bad = rules
      .filter(
        (r) =>
          !/opacity:\s*var\(--disabled-opacity\)/.test(r.body) ||
          !/cursor:\s*not-allowed/.test(r.body),
      )
      .map((r) => r.selector);
    expect(bad).toEqual([]);
  });
});

describe('guard: code and tests carry no review status (2026-10-09)', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );
  /** The version history records what was true then. */
  const EXEMPT = new Set(['src/lib/changelog.ts', 'tests/unit/codeGuards.test.ts']);
  const files = ['src', 'tests', 'scripts']
    .flatMap((d) => walk(join(V3, d)))
    .filter((f) => /\.(tsx?|css)$/.test(f))
    .map((f) => relative(V3, f).split('\\').join('/'))
    .filter((f) => !EXEMPT.has(f));
  /** "review pending", also when a comment breaks the line between the two words. */
  const REVIEW_PENDING = /\breview(\s*(\*|\/\/)?\s*)+pending\b/i;

  it('scans source, tests and scripts (sanity)', () => {
    expect(files).toEqual(
      expect.arrayContaining(['src/state/modeControl.ts', 'tests/e2e/stop-all.spec.ts']),
    );
  });

  it('no file says "review pending" — the pull request lists what waits for the owner', () => {
    const bad = files.filter((f) => REVIEW_PENDING.test(readFileSync(join(V3, f), 'utf8')));
    expect(bad, 'a merged decision is decided — say so, or name the decision').toEqual([]);
  });
});
