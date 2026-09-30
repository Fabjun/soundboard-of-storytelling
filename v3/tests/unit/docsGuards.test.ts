// ─────────────────────────────────────────────────────────────────────────────
// docsGuards — keep the documentation consistent (ADR-0050)
//
// 1. File naming: only standard files in the repo root; lowercase-kebab .md in docs/
//    (hubs are README.md, templates _template.md); design downloads in ISO-dated folders.
// 2. Links: every relative Markdown link resolves with EXACT case. macOS ignores case,
//    Linux CI does not — a link to TESTING.md for testing.md passes locally and fails
//    after the push (seen while renaming the docs on 2026-09-29).
// 3. README facts that drift silently: Node version (.nvmrc) and live URL (Vite base).
// 4. ADR headers: Status, Date, Slice, Refines, [Refined by], Category — in this order, with a
//    category from scripts/sync-adr.ts (CLAUDE.md rule 12).
// 5. Project language is English (CLAUDE.md §Project identity): no file contains German
//    function words — a heuristic, calibrated so English text never trips it.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const ROOT_MD = ['CHANGELOG.md', 'CLAUDE.md', 'README.md'];
const DOC_NAME = /^(?:README|_template|[a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
// Exceptions to the naming/link rules (ADR-0053: each with a reason).
const SKIP = new Set([
  'node_modules', // installed dependencies
  '.git', // repository internals
  'dist', // build output
  'design-sources', // Claude Design downloads, kept exactly as delivered (ADR-0050)
  'v1-reference', // frozen V1 reference copy, not maintained
]);

function walkMd(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry) || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkMd(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

/** Case-exact existence check, segment by segment (fs.existsSync ignores case on macOS). */
function existsExact(absPath: string): boolean {
  const parts = relative(ROOT, absPath).split(sep);
  let dir = ROOT;
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return false;
    }
    if (!names.includes(part)) return false;
    dir = join(dir, part);
  }
  return true;
}

const rel = (f: string): string => relative(ROOT, f).split(sep).join('/');

describe('guard: file naming (ADR-0050)', () => {
  it('keeps only standard Markdown files in the repo root', () => {
    const rootMd = readdirSync(ROOT).filter((f) => f.endsWith('.md'));
    expect(rootMd.sort(), 'move other docs into docs/').toEqual(ROOT_MD);
  });

  it('names every .md in docs/ in lowercase-kebab (README.md / _template.md allowed)', () => {
    const docs = walkMd(join(ROOT, 'docs'));
    expect(docs.length).toBeGreaterThan(20);
    const bad = docs.filter((f) => !DOC_NAME.test(f.split(sep).pop() ?? '')).map(rel);
    expect(bad, 'rename to lowercase-kebab.md').toEqual([]);
  });

  it('uses ISO dates (YYYY-MM-DD) for design download folders', () => {
    const folders = readdirSync(join(ROOT, 'design-sources'));
    expect(folders.length).toBeGreaterThan(0);
    expect(folders.filter((f) => !/^\d{4}-\d{2}-\d{2}$/.test(f))).toEqual([]);
  });
});

describe('guard: relative Markdown links resolve with exact case', () => {
  const LINK = /\]\(\s*<?([^)\s>]+)/g;
  const links: { from: string; target: string; abs: string }[] = [];
  for (const file of walkMd(ROOT)) {
    for (const m of readFileSync(file, 'utf8').matchAll(LINK)) {
      const target = m[1];
      if (/^[a-z]+:/.test(target) || target.startsWith('#')) continue;
      const path = target.split('#')[0];
      if (!path) continue;
      links.push({ from: rel(file), target, abs: normalize(join(dirname(file), path)) });
    }
  }

  it('finds relative links (sanity)', () => {
    expect(links.length).toBeGreaterThan(50);
  });

  it('every target exists with exactly this spelling', () => {
    const broken = links.filter((l) => !existsExact(l.abs)).map((l) => `${l.from} → ${l.target}`);
    expect(broken).toEqual([]);
  });
});

describe('guard: README facts match the code', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');

  it('states the Node.js version from .nvmrc', () => {
    const nvmrc = readFileSync(join(ROOT, '.nvmrc'), 'utf8').trim();
    expect(readme).toContain(`Node.js ${nvmrc}`);
  });

  it('links the live version under the Vite base path', () => {
    const vite = readFileSync(join(ROOT, 'v3', 'vite.config.ts'), 'utf8');
    const base = /base:\s*'([^']+)'/.exec(vite)?.[1];
    expect(base).toBeTruthy();
    expect(readme).toContain(`https://fabjun.github.io${base}`);
  });
});

describe('guard: ADR headers (CLAUDE.md rule 12)', () => {
  const dir = join(ROOT, 'docs', 'architecture');
  const categories = [
    ...(
      /CATEGORY_ORDER = \[([\s\S]*?)\]/.exec(
        readFileSync(join(ROOT, 'scripts', 'sync-adr.ts'), 'utf8'),
      )?.[1] ?? ''
    ).matchAll(/'([^']+)'/g),
  ]
    .map((m) => m[1])
    .filter((c) => c !== 'Uncategorized');
  const adrs = readdirSync(dir).filter((f) => /^\d{4}-.*\.md$/.test(f));

  it('finds ADRs and categories (sanity)', () => {
    expect(adrs.length).toBeGreaterThan(50);
    expect(categories.length).toBe(9);
  });

  it('starts every ADR with the header fields in the canonical order', () => {
    const bad: string[] = [];
    for (const f of adrs) {
      const lines = readFileSync(join(dir, f), 'utf8').split('\n');
      const fields = lines
        .slice(2, 9)
        .filter((l) => l.startsWith('**'))
        .map((l) => /^\*\*([^:*]+):\*\*/.exec(l)?.[1] ?? '?');
      const expected = fields.includes('Refined by')
        ? ['Status', 'Date', 'Slice', 'Refines', 'Refined by', 'Category']
        : ['Status', 'Date', 'Slice', 'Refines', 'Category'];
      const category = /^\*\*Category:\*\* (.+)$/m.exec(lines.join('\n'))?.[1];
      if (fields.join('|') !== expected.join('|') || !categories.includes(category ?? '')) {
        bad.push(`${f}: ${fields.join(', ')} / ${category}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('guard: project language is English (CLAUDE.md)', () => {
  // German function words and typical tool-message words — none of them is an English word.
  // Threshold 1: calibrated on 2026-09-30 (with 2, two real German remnants slipped through).
  const GERMAN =
    /\b(?:und|nicht|wird|werden|für|oder|sind|muss|eine|einen|einer|ist|wenn|bei|nach|dass|über|zum|zur|kein|keine|auch|noch|wurde|sollte|kann|diese|dieser|ohne|zwischen|siehe|bereits|sowie|Fehler|Datei|Dateien|Beschreibung|erneut|prüfen|abgebrochen|fortgesetzt|Hinweis|Ergebnis|Änderung|Änderungen)\b/g;
  const SKIP_DIRS = new Set([
    'node_modules', // installed dependencies
    '.git', // repository internals
    'dist', // build output
    'coverage', // generated coverage report
    'playwright-report', // generated E2E report
    'test-results', // generated E2E artefacts
    'design-sources', // Claude Design downloads, kept exactly as delivered (ADR-0050)
    'v1-reference', // frozen V1 reference copy, not maintained
  ]);
  const walkText = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      if (SKIP_DIRS.has(e.name)) return [];
      const full = join(dir, e.name);
      if (e.isDirectory()) return walkText(full);
      return /\.(md|ts|tsx|css|yml|yaml|html)$/.test(e.name) || dirname(full).endsWith('.husky')
        ? [full]
        : [];
    });
  const files = walkText(ROOT).filter((f) => !f.endsWith('docsGuards.test.ts'));

  it('scans the project text files (sanity)', () => {
    expect(files.length).toBeGreaterThan(150);
  });

  it('contains no German prose', () => {
    const bad = files
      .map((f) => ({ f: rel(f), hits: readFileSync(f, 'utf8').match(GERMAN) ?? [] }))
      .filter((x) => x.hits.length >= 1)
      .map((x) => `${x.f}: ${[...new Set(x.hits)].slice(0, 5).join(', ')}`);
    expect(bad, 'translate to English (chat with the user stays German)').toEqual([]);
  });
});
