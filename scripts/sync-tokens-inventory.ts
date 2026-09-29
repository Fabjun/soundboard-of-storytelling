#!/usr/bin/env tsx
/**
 * sync-tokens-inventory.ts
 *
 * Reads v3/src/styles/tokens.css (canonical — what the app loads), extracts all
 * CSS custom properties from exclusive :root { } blocks, grouped by section, and
 * writes a table between AUTO-GENERATED markers in docs/design/design-system.md §A.
 *
 * Only tokens inside an exclusive `:root { }` selector are included.
 * Multi-selector blocks (`:root, .theme-verdant, ...`) and theme-override blocks
 * (`.theme-verdant { }`) are skipped — they are not canonical token definitions.
 * Legacy --sb-* aliases are excluded for the same reason.
 *
 * Run: npm run sync:tokens  (from v3/)
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TOKENS_CSS = join(ROOT, 'v3', 'src', 'styles', 'tokens.css');
const DESIGN_SYSTEM = join(ROOT, 'docs/design/design-system.md');

const MARKER_START = '<!-- AUTO-GENERATED:tokens START — nicht manuell editieren -->';
const MARKER_END = '<!-- AUTO-GENERATED:tokens END -->';

interface TokenEntry {
  name: string;
  value: string;
  description: string;
  group: string;
}

function parseTokens(css: string): TokenEntry[] {
  const entries: TokenEntry[] = [];
  let currentGroup = 'Allgemein';
  let inLegacyBlock = false;

  // Primary exclusion for legacy aliases: the comma-check on ':root, .theme-*' selectors.
  // inLegacyBlock is belt-and-suspenders in case aliases end up inside a canonical :root block.
  const legacyMarker = 'LEGACY ALIASES';

  // :root context tracking
  let inRootContext = false;
  let braceDepth = 0;
  let pendingRoot = false; // saw exclusive ':root' selector, waiting for opening '{'

  const lines = css.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Section headers: track on ALL lines so grouping works between blocks ──
    if (line.includes(legacyMarker)) {
      inLegacyBlock = true;
      currentGroup = 'Legacy Aliases (--sb-*)';
    } else {
      const sectionMatch = line.match(/\/\*\s*──\s*([A-ZÄÖÜ][^─*]+?)\s*──/);
      if (sectionMatch && !inLegacyBlock) {
        currentGroup = sectionMatch[1].trim().replace(/\s+/g, ' ');
      }
    }

    // ── Detect exclusive :root selector (not ':root,' multi-selector) ──
    // A canonical token block has ':root' as the sole selector before '{'.
    // The legacy alias block starts with ':root,' — the comma is the distinguishing mark.
    if (!inRootContext && /^\s*:root\b/.test(line)) {
      const afterRoot = line.slice(line.indexOf(':root') + 5).trim();
      if (!afterRoot.startsWith(',') && !afterRoot.includes(',')) {
        // No comma on this line → could be exclusive :root { or :root (brace next line)
        pendingRoot = true;
      }
      // Has comma → ':root, .theme-*' multi-selector; pendingRoot stays false
    }

    // ── Count braces ──
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;

    // Activate :root context on the first '{' after an exclusive ':root' selector
    if (pendingRoot && opens > 0) {
      inRootContext = true;
      pendingRoot = false;
    }

    braceDepth += opens - closes;

    // Exit :root context when braceDepth returns to 0 (block fully closed)
    if (inRootContext && braceDepth === 0) {
      inRootContext = false;
      inLegacyBlock = false; // reset on block exit
      continue;
    }

    // ── Skip tokens outside exclusive :root or inside legacy alias block ──
    if (!inRootContext || inLegacyBlock) continue;

    // ── Token extraction ──
    const nameMatch = line.match(/^\s*(--[\w-]+)\s*:/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const colonIdx = line.indexOf(':');
    const afterColon = line.slice(colonIdx + 1);
    const semicolonIdx = afterColon.indexOf(';');
    if (semicolonIdx === -1) continue; // no semicolon = not a declaration

    const rawValue = afterColon.slice(0, semicolonIdx).trim();
    const afterSemicolon = afterColon.slice(semicolonIdx + 1).trim();

    // Extract single-line inline comment from after the semicolon
    let description = '';
    const inlineComment = afterSemicolon.match(/\/\*\s*(.+?)\s*\*\//);
    if (inlineComment) {
      description = inlineComment[1].trim();
      description = description.replace(/^[·\s]+/, '').trim();
    }

    // Shorten very long values (e.g. drop-shadow chains)
    const displayValue =
      rawValue.length > 60 ? rawValue.slice(0, 57) + '…' : rawValue;

    entries.push({
      name,
      value: displayValue,
      description,
      group: currentGroup,
    });
  }

  return entries;
}

function generateTable(entries: TokenEntry[]): string {
  // Group by section, preserve order
  const groups = new Map<string, TokenEntry[]>();
  for (const e of entries) {
    if (!groups.has(e.group)) groups.set(e.group, []);
    groups.get(e.group)!.push(e);
  }

  const lines: string[] = [];
  for (const [group, tokens] of groups) {
    lines.push(`### ${group}`);
    lines.push('');
    lines.push('| Token | Wert | Beschreibung |');
    lines.push('|-------|------|-------------|');
    for (const t of tokens) {
      const desc = t.description || '—';
      lines.push(`| \`${t.name}\` | \`${t.value}\` | ${desc} |`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function run(): void {
  const css = readFileSync(TOKENS_CSS, 'utf8');
  const entries = parseTokens(css);
  const table = generateTable(entries);

  let doc = readFileSync(DESIGN_SYSTEM, 'utf8');
  const startIdx = doc.indexOf(MARKER_START);
  const endIdx = doc.indexOf(MARKER_END);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found in ${DESIGN_SYSTEM}`);
  }

  const before = doc.slice(0, startIdx + MARKER_START.length);
  const after = doc.slice(endIdx);

  doc = `${before}\n${table}\n${after}`;
  writeFileSync(DESIGN_SYSTEM, doc, 'utf8');

  console.log(`sync-tokens: wrote ${entries.length} tokens in ${countGroups(entries)} groups → §A`);
}

function countGroups(entries: TokenEntry[]): number {
  return new Set(entries.map((e) => e.group)).size;
}

run();
