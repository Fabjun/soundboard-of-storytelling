/**
 * @fileoverview docsGuards — keep the documentation consistent (ADR-0050)
 *
 * 1. File naming: only standard files in the repo root; lowercase-kebab .md in docs/
 *    (hubs are README.md, templates _template.md); design downloads in ISO-dated folders.
 * 2. Links: every relative Markdown link resolves with EXACT case. macOS ignores case,
 *    Linux CI does not — a link to TESTING.md for testing.md passes locally and fails
 *    after the push (seen while renaming the docs on 2026-09-29).
 * 3. README facts that drift silently: Node version (.nvmrc) and live URL (Vite base).
 * 4. ADR headers: Status, Date, Slice, Refines, [Refined by], Category — in this order, with a
 *    category from v3/scripts/sync-adr.ts (CLAUDE.md rule 12). "Refines: ADR-X" and ADR-X's
 *    "Refined by" name each other (docs/architecture/_template.md).
 * 5. Project language is English (CLAUDE.md#project-identity): no file contains German
 *    function words — a heuristic, calibrated so English text never trips it.
 * 6. File paths in code spans of ACTIVE docs name files that exist in this repository
 *    (external or planned files are written as plain text). Historical docs are excluded
 *    via the same list Vale uses (.vale.ini), and passages marked historical with
 *    `<!-- vale SoS.SupersededTerms = NO -->` are skipped (ADR-0056).
 * 7. Section references are links (ADR-0056): in active docs the section sign appears only
 *    in headings and in the text of a link with an anchor; code uses `path.md#anchor`
 *    (repository-relative) and never the section sign. Every `path.md#anchor` outside a
 *    Markdown link target is resolved here with GitHub's slug algorithm (github-slugger) —
 *    Markdown link targets are checked by remark-validate-links.
 * 8. Every GFM table row has as many cells as its header — GitHub drops extra cells silently.
 * 9. Code blocks in active docs use no superseded term (Vale skips code).
 * 10. Every feature in the V1 / V2 inventory carries a decision — a slice, Parked or Rejected, never
 *    Open (principle P8, docs/product/README.md#7-design-principles).
 * 11. Guard rules are referred to by name, never by their number: the numbers shift when
 *    branches add rules, and a numbered reference then points at another rule (2026-10-03:
 *    CLAUDE.md cited number 7 for plan names, which was number 8 on the stack). The review log
 *    is exempt — its dated entries record what was true at the time.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, relative, sep } from 'node:path';
import GithubSlugger from 'github-slugger';
import { repoFiles } from '../../scripts/lib/repo-files';
import { GENERATED_DOCS } from '../../scripts/lib/generated-docs';
import { writeGenerated } from '../../scripts/lib/write-generated';

const ROOT = join(__dirname, '..', '..', '..');
const ROOT_MD = ['CHANGELOG.md', 'CLAUDE.md', 'README.md'];
const DOC_NAME = /^(?:README|_template|[a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
// Exceptions to the naming/link rules (ADR-0053: each with a reason). Ignored files are excluded
// by .gitignore (repoFiles); hidden folders (.github, .vale, .husky) follow their tools' naming.
const SKIP = new Set([
  'design-sources', // Claude Design downloads, kept exactly as delivered (ADR-0050)
]);

/** Markdown files of the repository, as absolute paths, without SKIP and hidden folders. */
function walkMd(dir: string): string[] {
  return repoFiles(dir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !f.split('/').some((seg) => SKIP.has(seg) || seg.startsWith('.')))
    .map((f) => join(dir, f));
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

describe('guard: every V1 / V2 feature has a decision (P8)', () => {
  const rows = readFileSync(join(ROOT, 'docs', 'product', 'v1-v2-inventory.md'), 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('| ---') && !l.startsWith('| Feature'))
    .map((l) => l.split('|').map((c) => c.trim()))
    .filter((c) => c.length >= 8);

  it('finds the inventory rows (sanity)', () => {
    expect(rows.length).toBeGreaterThan(60);
  });

  it('no feature is left without a decision', () => {
    const open = rows.filter((c) => /^(\*\*)?Open\b/.test(c[c.length - 2] ?? '')).map((c) => c[1]);
    expect(open, 'decide: a slice, **Parked** or **Rejected** with the reason').toEqual([]);
  });
});

describe('guard: ADR headers (CLAUDE.md rule 12)', () => {
  const dir = join(ROOT, 'docs', 'architecture');
  const categories = [
    ...(
      /CATEGORY_ORDER = \[([\s\S]*?)\]/.exec(
        readFileSync(join(ROOT, 'v3', 'scripts', 'sync-adr.ts'), 'utf8'),
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

  it('"Refines" and "Refined by" name each other', () => {
    // Header lines only (the first block before "## "); a "Refined by" may wrap onto a second line
    const header = (f: string) => readFileSync(join(dir, f), 'utf8').split('\n## ')[0];
    const field = (text: string, name: string) =>
      new RegExp(`^\\*\\*${name}:\\*\\* ([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'm').exec(text)?.[1] ?? '';
    const ids = (s: string) => [...s.matchAll(/ADR-(\d{4})/g)].map((m) => m[1]);
    const byNum = new Map(adrs.map((f) => [f.slice(0, 4), header(f)]));
    const broken: string[] = [];
    for (const [num, text] of byNum) {
      for (const target of ids(field(text, 'Refines'))) {
        if (!ids(field(byNum.get(target) ?? '', 'Refined by')).includes(num)) {
          broken.push(`ADR-${num} refines ADR-${target}, which lacks "Refined by: ADR-${num}"`);
        }
      }
      for (const source of ids(field(text, 'Refined by'))) {
        if (!ids(field(byNum.get(source) ?? '', 'Refines')).includes(num)) {
          broken.push(
            `ADR-${num} names ADR-${source} under "Refined by", which does not refine it`,
          );
        }
      }
    }
    expect(broken).toEqual([]);
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
    'test-results', // generated E2E artifacts
    'design-sources', // Claude Design downloads, kept exactly as delivered (ADR-0050)
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

describe('guard: documents never address the reader (owner rule 2026-10-03)', () => {
  // Every Markdown document, historical ones included. Verbatim quotations ("…"), code, and link
  // targets are not the document speaking, so they are removed before the check.
  const PERSONAL = /\b(you|your|yours|yourself)\b/i;
  /** Blanks a match but keeps its line breaks, so line numbers and later quotes stay in place. */
  const blank = (m: string): string => m.replace(/[^\n]/g, '');
  const prose = (text: string): string =>
    text
      .replace(/```[\s\S]*?```/g, blank)
      .replace(/`[^`\n]*`/g, '')
      .replace(/\]\([^)]*\)/g, ']')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/"[^"]*"/g, blank) // a quotation may run over a line break
      .replace(/“[^”]*”/g, blank);
  const docs = walkMd(ROOT);

  it('scans every Markdown document (sanity)', () => {
    expect(docs.map(rel)).toEqual(expect.arrayContaining(['CLAUDE.md', 'docs/backlog.md']));
  });

  it('no "you" or "your" outside quotations, code and links', () => {
    const bad = docs.flatMap((f) =>
      prose(readFileSync(f, 'utf8'))
        .split('\n')
        .flatMap((line, i) =>
          PERSONAL.test(line) ? [`${rel(f)}:${i + 1}: ${line.trim().slice(0, 80)}`] : [],
        ),
    );
    expect(bad, 'write with the product or the subject as subject, not the reader').toEqual([]);
  });
});

// Historical docs = the .vale.ini section that switches Vale off (single source of truth).
const HISTORICAL = (
  /^\[\{([^}]+)\}\]\s*\nBasedOnStyles =\s*$/m.exec(
    readFileSync(join(ROOT, '.vale.ini'), 'utf8'),
  )?.[1] ?? ''
)
  .split(',')
  .map((g) => new RegExp('^' + g.trim().replace(/\./g, '\\.').replace(/\*/g, '[^/]*') + '$'));
const ACTIVE_DOCS = walkMd(ROOT)
  .map(rel)
  .filter((f) => !HISTORICAL.some((re) => re.test(f)));

describe('guard: file paths in active docs exist (ADR-0056)', () => {
  const tracked = walkMd(ROOT).length > 0; // sanity: walkMd works
  const historical = HISTORICAL;
  const allRepoFiles = repoFiles(ROOT);
  const repoDirs = new Set(
    allRepoFiles.flatMap((f) =>
      f
        .split('/')
        .slice(0, -1)
        .map((_, i, a) => a.slice(0, i + 1).join('/')),
    ),
  );
  const active = ACTIVE_DOCS;
  const PATH = /`([\w./-]+\.(?:md|ts|tsx|css|json|ya?ml|js|html|png|wav|sh))`/g;

  it('reads the historical list from .vale.ini (sanity)', () => {
    expect(tracked).toBe(true);
    expect(historical.length).toBeGreaterThanOrEqual(5);
    expect(active.length).toBeGreaterThan(10);
  });

  it('names only existing files in code spans', () => {
    const exists = (from: string, p: string): boolean => {
      const cands = [p, rel(join(ROOT, dirname(from), p)), `v3/${p}`, `v3/src/${p}`];
      if (cands.some((c) => allRepoFiles.includes(c) || repoDirs.has(c))) return true;
      return allRepoFiles.filter((f) => f.endsWith(`/${p}`)).length === 1; // unique short form
    };
    const bad: string[] = [];
    for (const f of active) {
      const text = readFileSync(join(ROOT, f), 'utf8')
        .replace(/```[\s\S]*?```/g, '')
        // link text: the link target itself is validated by remark-validate-links
        .replace(/\[`[^`]+`\]\(/g, '[](')
        .replace(
          /<!-- vale SoS\.SupersededTerms = NO -->[\s\S]*?<!-- vale SoS\.SupersededTerms = YES -->/g,
          '',
        );
      for (const m of text.matchAll(PATH)) {
        const p = m[1];
        if (p.startsWith('-') || !exists(f, p)) bad.push(`${f}: ${p}`);
      }
    }
    expect(bad, 'fix the path, or write external/planned files as plain text').toEqual([]);
  });
});

describe('guard: section references are links (ADR-0056)', () => {
  const SECTION = '\u00a7'; // the section sign, written escaped so this file obeys its own rule
  const codeFiles = (dir: string): string[] =>
    repoFiles(ROOT).filter((f) => f.startsWith(`${dir}/`) && /\.(?:ts|tsx|css|js|mjs)$/.test(f));
  // Exceptions (ADR-0053: each with a reason).
  const CODE_EXEMPT = new Set([
    'v3/src/lib/changelog.ts', // release notes are a historical record, like CHANGELOG.md
  ]);
  const code = [
    ...codeFiles('v3/src'),
    ...codeFiles('v3/tests'),
    ...codeFiles('v3/scripts'),
    ...readdirSync(join(ROOT, 'v3'))
      .filter((f) => /\.(?:ts|js|mjs)$/.test(f))
      .map((f) => `v3/${f}`),
  ].filter((f) => !CODE_EXEMPT.has(f));

  /** Anchors of a Markdown file, as GitHub (and remark-validate-links) generate them. */
  const anchorCache = new Map<string, Set<string>>();
  const anchorsOf = (file: string): Set<string> => {
    const cached = anchorCache.get(file);
    if (cached) return cached;
    const slugger = new GithubSlugger();
    const anchors = new Set<string>();
    let fence = false;
    for (const line of readFileSync(join(ROOT, file), 'utf8').split('\n')) {
      if (line.startsWith('```')) fence = !fence;
      const m = fence ? null : /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
      if (!m) continue;
      const text = m[1]
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // link -> its text
        .replace(/[`*]/g, '') // code and strong/emphasis markers
        .replace(/(^|\W)_+|_+(?=\W|$)/g, '$1'); // _emphasis_ markers, not snake_case
      anchors.add(slugger.slug(text));
    }
    anchorCache.set(file, anchors);
    return anchors;
  };
  const ANCHOR_REF = /([\w./-]+\.md)#([\w-]+)/g;
  const checkAnchors = (f: string, text: string, bad: string[]): void => {
    for (const [, path, anchor] of text.matchAll(ANCHOR_REF)) {
      if (path === 'path.md') continue; // the placeholder that describes the scheme
      if (!existsExact(join(ROOT, path))) bad.push(`${f}: ${path} does not exist`);
      else if (!anchorsOf(path).has(anchor))
        bad.push(`${f}: ${path}#${anchor} has no such heading`);
    }
  };

  it('scans docs and code (sanity)', () => {
    expect(ACTIVE_DOCS.length).toBeGreaterThan(10);
    expect(code.length).toBeGreaterThan(50);
    expect(anchorsOf('CLAUDE.md').has('slice-progress')).toBe(true);
    expect(anchorsOf('docs/design/design-system.md').has('6-component-inventory')).toBe(true);
  });

  it('active docs use the section sign only in headings and anchored link text', () => {
    const bad: string[] = [];
    for (const f of ACTIVE_DOCS) {
      readFileSync(join(ROOT, f), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/^#{1,6}\s/.test(line)) return;
          const rest = line.replace(/\[[^\]]*\]\([^)#]*#[^)]+\)/g, '');
          if (rest.includes(SECTION)) bad.push(`${f}:${i + 1}: ${line.trim().slice(0, 90)}`);
        });
    }
    expect(bad, 'write section references as [file.md SECTION-SIGN Heading](path#anchor)').toEqual(
      [],
    );
  });

  it('references outside Markdown links point to existing headings', () => {
    const bad: string[] = [];
    for (const f of code) {
      const text = readFileSync(join(ROOT, f), 'utf8');
      if (text.includes(SECTION)) bad.push(`${f}: uses the section sign — write path.md#anchor`);
      checkAnchors(f, text, bad);
    }
    for (const f of ACTIVE_DOCS) {
      // Markdown link targets are relative to the file and checked by remark-validate-links.
      checkAnchors(f, readFileSync(join(ROOT, f), 'utf8').replace(/\]\([^)]*\)/g, ']'), bad);
    }
    expect(bad).toEqual([]);
  });
});

describe('guard: table rows have as many cells as the header (audit A3)', () => {
  // GitHub silently drops the extra cells of a row, so an unescaped | inside a cell (also
  // inside a code span) loses content without any visible error. Line scan instead of a full
  // Markdown parse: the parser took >5 s in CI under coverage.
  const cells = (line: string): number =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split(/(?<!\\)\|/).length;
  const DELIMITER = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

  /** Tables as [header line, row lines…] with 1-based line numbers; fenced code is skipped. */
  const tablesOf = (text: string): { line: number; text: string }[][] => {
    const lines = text.split('\n').map((l) => l.replace(/^(?:>\s?)+/, ''));
    const tables: { line: number; text: string }[][] = [];
    let fence = false;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(```|~~~)/.test(lines[i])) fence = !fence;
      if (fence || !lines[i].trim().startsWith('|') || !DELIMITER.test(lines[i + 1] ?? ''))
        continue;
      // Header, delimiter (a delimiter with another cell count turns the whole table into text),
      // then the body rows.
      const table = [
        { line: i + 1, text: lines[i] },
        { line: i + 2, text: lines[i + 1] },
      ];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        table.push({ line: j + 1, text: lines[j] });
        j++;
      }
      tables.push(table);
      i = j - 1;
    }
    return tables;
  };

  it('finds tables (sanity)', () => {
    const count = walkMd(ROOT).reduce((n, f) => n + tablesOf(readFileSync(f, 'utf8')).length, 0);
    expect(count).toBeGreaterThan(50);
  });

  it('every row of every table in the repository', () => {
    const bad: string[] = [];
    for (const f of walkMd(ROOT)) {
      for (const [header, ...rows] of tablesOf(readFileSync(f, 'utf8'))) {
        const want = cells(header.text);
        for (const row of rows) {
          const got = cells(row.text);
          if (got !== want) bad.push(`${rel(f)}:${row.line}: ${got} cells, header has ${want}`);
        }
      }
    }
    expect(bad, 'escape | inside cells as \\|').toEqual([]);
  });
});

describe('guard: code blocks in active docs are current (audit A7)', () => {
  // Vale deliberately skips code, so superseded names survived in code blocks. Same term list
  // as Vale (.vale/styles/SoS/SupersededTerms.yml — single source), same exclusions.
  const rule = readFileSync(join(ROOT, '.vale', 'styles', 'SoS', 'SupersededTerms.yml'), 'utf8');
  const terms = [...(rule.split(/^swap:\s*$/m)[1] ?? '').matchAll(/^\s+'?([^':]+)'?:/gm)].map(
    (m) => new RegExp(`\\b${m[1]}\\b`),
  );
  const VALE_OFF =
    /<!-- vale SoS\.SupersededTerms = NO -->[\s\S]*?<!-- vale SoS\.SupersededTerms = YES -->/g;
  const codeBlocks = (text: string): string[] =>
    [...text.replace(VALE_OFF, '').matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1]);

  it('reads the term list (sanity)', () => {
    expect(terms.length).toBeGreaterThanOrEqual(4);
  });

  it('no superseded term in a code block', () => {
    const bad = ACTIVE_DOCS.flatMap((f) =>
      codeBlocks(readFileSync(join(ROOT, f), 'utf8')).flatMap((block) =>
        terms.filter((re) => re.test(block)).map((re) => `${f}: ${re.source}`),
      ),
    );
    expect(bad).toEqual([]);
  });
});

describe('guard: guard rules are referred to by name, not by number', () => {
  const NUMBERED = /\b(code|docs|test)Guards\b\W{0,6}rule \d/i;
  const walkCode = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? walkCode(join(dir, e.name))
        : /\.(ts|tsx|mjs)$/.test(e.name)
          ? [join(dir, e.name)]
          : [],
    );
  const files = [
    // The review log is exempt: its dated entries record what was true at the time
    ...ACTIVE_DOCS.filter((f) => f !== 'docs/development/review-log.md').map((f) => join(ROOT, f)),
    ...['src', 'tests', 'scripts'].flatMap((d) => walkCode(join(ROOT, 'v3', d))),
  ];

  it('finds docs and code (sanity)', () => {
    expect(files.length).toBeGreaterThan(100); // 123 on 2026-10-03
  });

  it('no active doc or source file cites a guard rule by its number', () => {
    const numbered = files
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .map((line, i) => ({ line, at: `${rel(f)}:${i + 1}` })),
      )
      .filter(({ line }) => NUMBERED.test(line) && !line.includes('NUMBERED = '))
      .map(({ at }) => at);
    expect(
      numbered,
      'name the rule, e.g. `codeGuards` ("the app shows no internal plan names")',
    ).toEqual([]);
  });
});

describe('guard: generated docs come from one list (2026-10-08)', () => {
  // The hook named the generated files by hand and missed CLAUDE.md (sync:api) — the API list
  // was left unstaged twice. Now writeGenerated and the hook both read GENERATED_DOCS.
  it('every listed file exists', () => {
    const missing = GENERATED_DOCS.filter((f) => !existsSync(join(ROOT, f)));
    expect(missing).toEqual([]);
  });

  it('the pre-commit hook stages the list and names no generated file itself', () => {
    const hook = readFileSync(join(ROOT, '.husky', 'pre-commit'), 'utf8');
    expect(hook).toContain('scripts/list-generated-docs.ts');
    const named = GENERATED_DOCS.filter((f) =>
      hook.split('\n').some((l) => l.includes('git ') && l.includes(f)),
    );
    expect(named, 'stage generated docs through $GENERATED only').toEqual([]);
  });

  it('writeGenerated refuses a file that is not listed, and writes nothing', async () => {
    const stray = join(tmpdir(), `sos-not-generated-${process.pid}.md`);
    await expect(writeGenerated(stray, '# x\n')).rejects.toThrow('GENERATED_DOCS');
    expect(existsSync(stray)).toBe(false);
  });
});
