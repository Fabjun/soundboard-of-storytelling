#!/usr/bin/env tsx
/**
 * @fileoverview sync-adr.ts
 *
 * Reads all docs/architecture/00*.md ADR files, extracts metadata from
 * headers, and writes a categorized index table between AUTO-GENERATED
 * markers in docs/architecture/README.md.
 *
 * Run: npm run sync:adr  (from v3/)
 */

import { readFileSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { writeGenerated } from './lib/write-generated';
import { tableRow } from './lib/markdown';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const ADR_DIR = join(ROOT, 'docs', 'architecture');
const README = join(ADR_DIR, 'README.md');

const MARKER_START = '<!-- AUTO-GENERATED:adr-index START — do not edit by hand -->';
const MARKER_END = '<!-- AUTO-GENERATED:adr-index END -->';

// Canonical category order — matches the established README section order.
const CATEGORY_ORDER = [
  'Tech stack',
  'Platform constraints',
  'Data model',
  'Persistence',
  'Audio engine & iOS memory',
  'UI architecture',
  'Interaction',
  'Test infrastructure & workflow',
  'Process & product decisions',
  'Uncategorized',
];

interface AdrMeta {
  num: string; // "0001"
  file: string; // "0001-preact.md"
  title: string;
  status: string;
  date: string;
  slice: string;
  category: string;
}

function extractField(content: string, field: string): string {
  // Handles both "**Field:** value" and "**Field**: value" formats
  const re = new RegExp(`\\*\\*${field}[*:]+:?\\s*(.+)`);
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

function parseAdr(file: string): AdrMeta | null {
  const filePath = join(ADR_DIR, file);
  const content = readFileSync(filePath, 'utf8');

  // Extract number from filename (e.g. "0001" from "0001-preact.md")
  const numMatch = file.match(/^(\d{4})/);
  if (!numMatch) return null;
  const num = numMatch[1];

  // Title from first line: "# ADR-XXXX: <Title>"
  const titleMatch = content.match(/^#\s+ADR-\d+:\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : '(no title)';

  const status = extractField(content, 'Status') || '—';
  const date = extractField(content, 'Date') || '—';
  const slice = extractField(content, 'Slice') || '—';
  const category = extractField(content, 'Category') || 'Uncategorized';

  return { num, file, title, status, date, slice, category };
}

function generateTable(adrs: AdrMeta[]): string {
  const byCategory = new Map<string, AdrMeta[]>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);

  for (const adr of adrs) {
    const cat = CATEGORY_ORDER.includes(adr.category) ? adr.category : 'Uncategorized';
    byCategory.get(cat)!.push(adr);
  }

  const lines: string[] = [];
  for (const cat of CATEGORY_ORDER) {
    const group = byCategory.get(cat)!;
    if (group.length === 0) continue;
    lines.push(`### ${cat}`);
    lines.push('');
    lines.push('| # | Title | Status | Slice | Date |');
    lines.push('|---|-------|--------|-------|------|');
    for (const a of group.sort((x, y) => x.num.localeCompare(y.num))) {
      const link = `[ADR-${a.num}](${a.file})`;
      lines.push(tableRow([link, a.title, a.status, a.slice, a.date]));
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

async function run(): Promise<void> {
  const files = readdirSync(ADR_DIR)
    .filter((f) => /^\d{4}-.+\.md$/.test(f))
    .sort();

  const adrs: AdrMeta[] = [];
  for (const file of files) {
    const meta = parseAdr(file);
    if (meta) adrs.push(meta);
  }

  const table = generateTable(adrs);

  let readme = readFileSync(README, 'utf8');
  const startIdx = readme.indexOf(MARKER_START);
  const endIdx = readme.indexOf(MARKER_END);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found in ${README}`);
  }

  const before = readme.slice(0, startIdx + MARKER_START.length);
  const after = readme.slice(endIdx);

  readme = `${before}\n${table}\n${after}`;
  await writeGenerated(README, readme);

  console.log(
    `sync-adr: wrote ${adrs.length} ADRs across ${
      [...new Set(adrs.map((a) => a.category))].length
    } categories → ${README}`,
  );
}

await run();
