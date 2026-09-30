#!/usr/bin/env tsx
/**
 * sync-classes.ts
 *
 * Extracts all sb-* CSS class names used in v3/src and writes a table
 * between AUTO-GENERATED markers in docs/design/design-system.md#6-component-inventory.
 *
 * Class names are extracted from:
 *   - TSX: className="..." attribute values (static strings)
 *   - CSS: selector lines starting with .sb-
 *
 * Descriptions come from @inventory comments on CSS definitions:
 *   .sb-foo { /* @inventory: description goes here *\/  }
 *
 * Classes without an @inventory comment appear with empty description.
 * That is intentional — it makes undocumented classes visible.
 *
 * Run: npm run sync:classes  (from v3/)
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC_DIR = join(ROOT, "v3", "src");
const DESIGN_SYSTEM = join(ROOT, "docs/design/design-system.md");

const MARKER_START =
  "<!-- AUTO-GENERATED:sb-classes START — do not edit by hand -->";
const MARKER_END = "<!-- AUTO-GENERATED:sb-classes END -->";

// Only classes with this prefix are tracked
const PREFIX = "sb-";

interface ClassInfo {
  name: string; // e.g. "sb-pad"
  description: string; // from @inventory comment, or ""
  definedIn: string; // relative path to CSS file, or ""
  usedIn: string[]; // relative paths to files where used
}

function walkDir(dir: string, exts: string[]): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      result.push(...walkDir(full, exts));
    } else if (exts.some((e) => full.endsWith(e))) {
      result.push(full);
    }
  }
  return result;
}

// Extract sb-* class names from className="..." in TSX files.
// Only scans static string literals in className= attributes.
function extractFromTsx(content: string): Set<string> {
  const classes = new Set<string>();
  // Match className="..." or className='...'
  const staticRe = /className=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = staticRe.exec(content)) !== null) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls.startsWith(PREFIX)) classes.add(cls);
    }
  }
  // Match className={`...`} template literals (extract raw words)
  const templateRe = /className=\{`([^`]+)`\}/g;
  while ((m = templateRe.exec(content)) !== null) {
    for (const word of m[1].split(/[\s${}`]+/)) {
      if (word.startsWith(PREFIX)) classes.add(word);
    }
  }
  return classes;
}

// Extract sb-* class names defined as CSS selectors.
function extractFromCss(content: string): Set<string> {
  const classes = new Set<string>();
  // Match selector lines: .sb-foo, .sb-foo:hover, .sb-foo .sb-bar etc.
  const re = /^\s*(\.sb-[a-z][a-z0-9-]*)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const cls = m[1].replace(".", "");
    if (cls.startsWith(PREFIX)) classes.add(cls);
  }
  return classes;
}

// Extract @inventory descriptions for CSS-defined classes.
// Looks for patterns like:
//   .sb-foo { /* @inventory: description */ }
//   .sb-foo {
//     /* @inventory: description */
function extractInventory(content: string): Map<string, string> {
  const map = new Map<string, string>();
  // One regex: class selector followed (within a few lines) by @inventory
  const re =
    /\.sb-([a-z][a-z0-9-]*)\s*\{[^}]*?\/\*\s*@inventory:\s*([^*]+?)\s*\*\//gs;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const cls = `sb-${m[1]}`;
    if (!map.has(cls)) {
      map.set(cls, m[2].trim());
    }
  }
  return map;
}

function run(): void {
  const tsxFiles = walkDir(SRC_DIR, [".tsx", ".ts"]);
  const cssFiles = walkDir(SRC_DIR, [".css"]);

  const allClasses = new Set<string>();
  const usedIn = new Map<string, string[]>();
  const definedIn = new Map<string, string>();
  const inventory = new Map<string, string>();

  // --- Scan TSX/TS files for className usage ---
  for (const file of tsxFiles) {
    const content = readFileSync(file, "utf8");
    const found = extractFromTsx(content);
    for (const cls of found) {
      allClasses.add(cls);
      if (!usedIn.has(cls)) usedIn.set(cls, []);
      usedIn.get(cls)!.push(relative(ROOT, file));
    }
  }

  // --- Scan CSS files for definitions + @inventory ---
  for (const file of cssFiles) {
    const content = readFileSync(file, "utf8");
    const defined = extractFromCss(content);
    for (const cls of defined) {
      allClasses.add(cls);
      if (!definedIn.has(cls)) {
        definedIn.set(cls, relative(ROOT, file));
      }
    }
    const inv = extractInventory(content);
    for (const [cls, desc] of inv) {
      if (!inventory.has(cls)) inventory.set(cls, desc);
    }
  }

  // Build final entries
  const entries: ClassInfo[] = [];
  for (const cls of [...allClasses].sort()) {
    entries.push({
      name: cls,
      description: inventory.get(cls) ?? "",
      definedIn: definedIn.get(cls) ?? "",
      usedIn: usedIn.get(cls) ?? [],
    });
  }

  // Warn on CSS-defined classes that lack an @inventory description.
  // [unused-css] / [verify] markers count as descriptions — warning is for genuinely blank entries.
  const missingInventory = entries.filter(
    (e) => e.description === "" && e.definedIn !== "",
  );
  if (missingInventory.length > 0) {
    console.warn(
      `sync-classes: WARN — ${missingInventory.length} sb-* class(es) missing @inventory description:`,
    );
    for (const e of missingInventory) {
      console.warn(`  ${e.name}  (${e.definedIn})`);
    }
    console.warn(
      "  Add /* @inventory: description */ at the CSS selector definition.",
    );
  }

  // Generate table
  const lines: string[] = [];
  lines.push("| Class | Description | Defined in |");
  lines.push("|--------|-------------|-------------|");
  for (const e of entries) {
    const desc = e.description || "";
    const def = e.definedIn
      ? `\`${e.definedIn}\``
      : e.usedIn[0]
        ? `\`${e.usedIn[0]}\` (no CSS definition)`
        : "—";
    lines.push(`| \`${e.name}\` | ${desc} | ${def} |`);
  }

  const table = lines.join("\n");

  let doc = readFileSync(DESIGN_SYSTEM, "utf8");
  const startIdx = doc.indexOf(MARKER_START);
  const endIdx = doc.indexOf(MARKER_END);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found in ${DESIGN_SYSTEM}`);
  }

  const before = doc.slice(0, startIdx + MARKER_START.length);
  const after = doc.slice(endIdx);

  doc = `${before}\n${table}\n${after}`;
  writeFileSync(DESIGN_SYSTEM, doc, "utf8");

  const withDesc = entries.filter((e) => e.description).length;
  console.log(
    `sync-classes: wrote ${entries.length} sb-* classes (${withDesc} with @inventory) → docs/design/design-system.md`,
  );
}

run();
