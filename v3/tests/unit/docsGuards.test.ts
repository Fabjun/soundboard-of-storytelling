// ─────────────────────────────────────────────────────────────────────────────
// docsGuards — keep the documentation consistent (ADR-0050)
//
// 1. File naming: only standard files in the repo root; lowercase-kebab .md in docs/
//    (hubs are README.md, templates _template.md); design downloads in ISO-dated folders.
// 2. Links: every relative Markdown link resolves with EXACT case. macOS ignores case,
//    Linux CI does not — a link to TESTING.md for testing.md passes locally and fails
//    after the push (seen while renaming the docs on 2026-09-29).
// 3. README facts that drift silently: Node version (.nvmrc) and live URL (Vite base).
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const ROOT_MD = ['CHANGELOG.md', 'CLAUDE.md', 'README.md'];
const DOC_NAME = /^(?:README|_template|[a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const SKIP = new Set(['node_modules', '.git', 'dist', 'design-sources', 'v1-reference']);

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
