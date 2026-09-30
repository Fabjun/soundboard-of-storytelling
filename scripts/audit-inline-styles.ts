#!/usr/bin/env tsx
/**
 * audit-inline-styles.ts
 *
 * Classifies every style={} JSX attribute in v3/src/**\/*.tsx at the BLOCK level.
 * Unit of analysis: the full property set of one style= attribute — never individual lines.
 * (Line-level counting produced a 60–80 miscount in the Session 1 A/B decision; this
 * script exists precisely to avoid that error.)
 *
 * Seven categories (precedence order):
 *   unclassified        — spread / ternary / indirect ref — needs manual review
 *   custom-setter       — only --* CSS custom props (ADR-0022 mechanism; NOT a Path D violation)
 *   pure-dynamic        — all regular values are runtime expressions → Path C ✓
 *   dynamic-with-static — some dynamic + some static regular props → static part still Path D
 *   pure-layout         — only layout props, all static → migrate to layout primitive class
 *   pure-structural     — only structural props, all static → Path D
 *   mixed               — layout + structural, all static → Path D
 *
 * For blocks with both --* custom props AND regular props: custom props are flagged as
 * "legitimate custom-setters (do not migrate)" — they are the ADR-0022 pixel-frame
 * override mechanism. Only the regular static props are the Path D violations.
 *
 * Run: npm run audit:inline-styles  (from v3/)
 */

import * as ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_DIR = join(ROOT, 'v3', 'src');

// --- Layout property whitelist (from CLAUDE.md#permanent-coding-standards, four-path rule) ---
const LAYOUT_PROPS = new Set([
  'display',
  'flex',
  'flexDirection',
  'flexWrap',
  'flexShrink',
  'flexGrow',
  'alignItems',
  'alignSelf',
  'justifyContent',
  'justifySelf',
  'order',
  'gap',
  'rowGap',
  'columnGap',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridColumn',
  'gridRow',
  'gridArea',
]);

type Category =
  | 'pure-dynamic'
  | 'dynamic-with-static'
  | 'pure-layout'
  | 'pure-structural'
  | 'mixed'
  | 'custom-setter'
  | 'unclassified';

type UnclassifiedReason = 'spread' | 'ternary' | 'indirect' | 'other';

interface PropInfo {
  name: string;
  isDynamic: boolean;
  isCustom: boolean; // starts with '--'
  isLayout: boolean; // in LAYOUT_PROPS and not custom
}

interface BlockRecord {
  file: string; // relative to ROOT
  line: number;
  category: Category;
  props: PropInfo[];
  hasSpread: boolean;
  unclassifiedReason?: UnclassifiedReason;
  // Separated for output clarity (see user requirement: custom-setters must be distinguishable
  // from Path D violations so Session 3 does not accidentally migrate --* assignments)
  customPropNames: string[]; // all --* props in block (legitimate; keep as-is)
  staticViolationProps: string[]; // static regular props that are Path D violations
  dynamicRegularProps: string[]; // dynamic regular props (Path C; keep as-is)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function walkDir(dir: string, ext: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...walkDir(full, ext));
    } else if (full.endsWith(ext)) {
      result.push(full);
    }
  }
  return result;
}

/** A value node is static if it is a literal with no runtime dependency. */
function isValueDynamic(node: ts.Expression): boolean {
  if (ts.isStringLiteral(node)) return false;
  if (ts.isNumericLiteral(node)) return false;
  // NoSubstitutionTemplateLiteral: `var(--x)` with no ${...} spans — still a static string
  if (ts.isNoSubstitutionTemplateLiteral(node)) return false;
  // Everything else (TemplateExpression, Identifier, CallExpression, etc.) is dynamic
  return true;
}

/** Strip type assertions and parentheses to reach the core expression. */
function unwrap(expr: ts.Expression): ts.Expression {
  if (ts.isAsExpression(expr)) return unwrap(expr.expression);
  if (ts.isParenthesizedExpression(expr)) return unwrap(expr.expression);
  return expr;
}

// ─── Block-level classification ─────────────────────────────────────────────

function classifyObjectLiteral(obj: ts.ObjectLiteralExpression): Omit<BlockRecord, 'file' | 'line'> {
  const props: PropInfo[] = [];
  let hasSpread = false;

  for (const member of obj.properties) {
    if (ts.isSpreadAssignment(member)) {
      hasSpread = true;
      continue;
    }
    if (!ts.isPropertyAssignment(member)) continue;

    let propName: string | null = null;
    if (ts.isIdentifier(member.name)) {
      propName = member.name.text;
    } else if (ts.isStringLiteral(member.name)) {
      // CSS custom properties use string literal keys: '--pad-color'
      propName = member.name.text;
    }
    // Computed keys (e.g. [expr]: value) are treated as spread-equivalent (unclassifiable)
    if (propName === null) {
      hasSpread = true;
      continue;
    }

    const isCustom = propName.startsWith('--');
    const isLayout = !isCustom && LAYOUT_PROPS.has(propName);
    const isDynamic = isValueDynamic(member.initializer);
    props.push({ name: propName, isDynamic, isCustom, isLayout });
  }

  // Spread present → unclassified (known props stored for context)
  if (hasSpread) {
    return {
      hasSpread: true,
      props,
      category: 'unclassified',
      unclassifiedReason: 'spread',
      customPropNames: props.filter((p) => p.isCustom).map((p) => p.name),
      staticViolationProps: [],
      dynamicRegularProps: [],
    };
  }

  const customProps = props.filter((p) => p.isCustom);
  const regularProps = props.filter((p) => !p.isCustom);

  // All props are custom (or no props at all) → custom-setter
  if (regularProps.length === 0) {
    return {
      hasSpread: false,
      props,
      category: 'custom-setter',
      customPropNames: customProps.map((p) => p.name),
      staticViolationProps: [],
      dynamicRegularProps: [],
    };
  }

  // Classify by regular (non-custom) props
  const dynamicRegular = regularProps.filter((p) => p.isDynamic);
  const staticRegular = regularProps.filter((p) => !p.isDynamic);
  const staticLayout = staticRegular.filter((p) => p.isLayout);
  const staticStructural = staticRegular.filter((p) => !p.isLayout);

  const customPropNames = customProps.map((p) => p.name);
  const dynamicRegularProps = dynamicRegular.map((p) => p.name);

  // Any dynamic regular props present
  if (dynamicRegular.length > 0) {
    if (staticRegular.length > 0) {
      // Some dynamic, some static → dynamic-with-static
      // The static props are STILL Path D violations even though the block has dynamic ones
      return {
        hasSpread: false,
        props,
        category: 'dynamic-with-static',
        customPropNames,
        staticViolationProps: staticRegular.map((p) => p.name),
        dynamicRegularProps,
      };
    }
    // All regular props are dynamic → fully Path C
    return {
      hasSpread: false,
      props,
      category: 'pure-dynamic',
      customPropNames,
      staticViolationProps: [],
      dynamicRegularProps,
    };
  }

  // All regular props are static → determine layout/structural/mixed
  if (staticLayout.length > 0 && staticStructural.length === 0) {
    return {
      hasSpread: false,
      props,
      category: 'pure-layout',
      customPropNames,
      staticViolationProps: staticLayout.map((p) => p.name),
      dynamicRegularProps: [],
    };
  }
  if (staticStructural.length > 0 && staticLayout.length === 0) {
    return {
      hasSpread: false,
      props,
      category: 'pure-structural',
      customPropNames,
      staticViolationProps: staticStructural.map((p) => p.name),
      dynamicRegularProps: [],
    };
  }
  if (staticLayout.length > 0 && staticStructural.length > 0) {
    return {
      hasSpread: false,
      props,
      category: 'mixed',
      customPropNames,
      staticViolationProps: [...staticLayout, ...staticStructural].map((p) => p.name),
      dynamicRegularProps: [],
    };
  }

  // Empty regular-props section (e.g. block was only custom props but all got filtered)
  // — shouldn't happen given the guard above, but be safe
  return {
    hasSpread: false,
    props,
    category: 'pure-dynamic',
    customPropNames,
    staticViolationProps: [],
    dynamicRegularProps: [],
  };
}

function classifyExpression(expr: ts.Expression): Omit<BlockRecord, 'file' | 'line'> {
  const inner = unwrap(expr);
  const empty = {
    hasSpread: false,
    props: [],
    customPropNames: [],
    staticViolationProps: [],
    dynamicRegularProps: [],
  };

  if (ts.isObjectLiteralExpression(inner)) {
    return classifyObjectLiteral(inner);
  }
  if (ts.isConditionalExpression(inner)) {
    return { ...empty, category: 'unclassified', unclassifiedReason: 'ternary' };
  }
  if (ts.isIdentifier(inner)) {
    return { ...empty, category: 'unclassified', unclassifiedReason: 'indirect' };
  }
  return { ...empty, category: 'unclassified', unclassifiedReason: 'other' };
}

// ─── File processor ──────────────────────────────────────────────────────────

function processFile(filePath: string): BlockRecord[] {
  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(ROOT, filePath);
  const records: BlockRecord[] = [];

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes= */ true,
    ts.ScriptKind.TSX,
  );

  function visit(node: ts.Node): void {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'style' &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression
    ) {
      const expr = node.initializer.expression;
      const { line } = ts.getLineAndCharacterOfPosition(sourceFile, node.pos);
      const classification = classifyExpression(expr);
      records.push({ file: relPath, line: line + 1, ...classification });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return records;
}

// ─── Report helpers ──────────────────────────────────────────────────────────

const VIOLATION_CATEGORIES: Category[] = ['pure-layout', 'pure-structural', 'mixed'];

const CATEGORY_LABELS: Record<Category, string> = {
  'pure-dynamic': '✓ pure-dynamic        ',
  'custom-setter': '✓ custom-setter       ',
  'dynamic-with-static': '⚠ dynamic-with-static ',
  'pure-layout': '✗ pure-layout         ',
  'pure-structural': '✗ pure-structural     ',
  mixed: '✗ mixed               ',
  unclassified: '? unclassified        ',
};

function patternKey(r: BlockRecord): string {
  const layoutNames = r.props
    .filter((p) => !p.isCustom && p.isLayout && !p.isDynamic)
    .map((p) => p.name)
    .sort();
  return layoutNames.join(', ') || '(empty)';
}

// ─── Main ────────────────────────────────────────────────────────────────────

function run(): void {
  const tsxFiles = walkDir(SRC_DIR, '.tsx');
  const allRecords: BlockRecord[] = [];
  const parseWarnings: string[] = [];

  for (const file of tsxFiles) {
    try {
      allRecords.push(...processFile(file));
    } catch (err) {
      const relPath = relative(ROOT, file);
      parseWarnings.push(`WARN: could not process ${relPath}: ${(err as Error).message}`);
    }
  }

  if (parseWarnings.length > 0) {
    for (const w of parseWarnings) console.warn(w);
    console.warn('');
  }

  // Group by category
  const byCategory = new Map<Category, BlockRecord[]>();
  for (const cat of [
    'pure-dynamic',
    'custom-setter',
    'dynamic-with-static',
    'pure-layout',
    'pure-structural',
    'mixed',
    'unclassified',
  ] as Category[]) {
    byCategory.set(cat, []);
  }
  for (const r of allRecords) {
    byCategory.get(r.category)!.push(r);
  }

  const total = allRecords.length;
  const violations = VIOLATION_CATEGORIES.flatMap((c) => byCategory.get(c)!);
  const extraStaticViolations = byCategory
    .get('dynamic-with-static')!
    .flatMap((r) => r.staticViolationProps).length;

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' Inline Style Audit — v3/src');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total style={} blocks found: ${total}`);
  console.log('');
  console.log('  CLASSIFICATION BREAKDOWN');
  for (const [cat, label] of Object.entries(CATEGORY_LABELS) as [Category, string][]) {
    const count = byCategory.get(cat)!.length;
    console.log(`    ${label} ${count}`);
  }
  console.log('');
  console.log(`  Total Path D blocks:  ${violations.length}`);
  console.log(`  (+ ${extraStaticViolations} static-violation props inside dynamic-with-static blocks)`);
  console.log('');

  // ── Pure-layout patterns ───────────────────────────────────────────────────
  const layoutBlocks = byCategory.get('pure-layout')!;
  if (layoutBlocks.length > 0) {
    const patternCounts = new Map<string, number>();
    for (const r of layoutBlocks) {
      const key = patternKey(r);
      patternCounts.set(key, (patternCounts.get(key) ?? 0) + 1);
    }
    console.log('  PURE-LAYOUT PATTERNS (informs how many layout primitives Session 3 needs)');
    for (const [pattern, count] of [...patternCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${count}x  { ${pattern} }`);
    }
    console.log('');
  }

  // ── Per-file breakdown ─────────────────────────────────────────────────────
  const byFile = new Map<string, BlockRecord[]>();
  for (const r of allRecords) {
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file)!.push(r);
  }
  const filesWithViolations = [...byFile.entries()]
    .map(([file, recs]) => ({
      file,
      total: recs.length,
      violations: recs.filter((r) => VIOLATION_CATEGORIES.includes(r.category)).length,
    }))
    .filter((x) => x.violations > 0)
    .sort((a, b) => b.violations - a.violations);

  console.log('  PER-FILE BREAKDOWN (files with Path D violations)');
  console.log(
    '    ' + 'file'.padEnd(52) + ' total  violations',
  );
  for (const { file, total: t, violations: v } of filesWithViolations) {
    const name = file.replace('v3/src/', '');
    console.log(`    ${name.padEnd(52)} ${String(t).padStart(5)}  ${String(v).padStart(10)}`);
  }
  console.log('');

  // ── Unclassified detail ────────────────────────────────────────────────────
  const unclassified = byCategory.get('unclassified')!;
  if (unclassified.length > 0) {
    console.log('  UNCLASSIFIED BLOCKS (manual review needed)');
    for (const r of unclassified) {
      const knownProps =
        r.props.length > 0 ? `  known props: [${r.props.map((p) => p.name).join(', ')}]` : '';
      console.log(`    ${r.file}:${r.line}  [${r.unclassifiedReason ?? 'unknown'}]${knownProps}`);
    }
    console.log('');
  }

  // ── Dynamic-with-static detail ─────────────────────────────────────────────
  const dynWithStatic = byCategory.get('dynamic-with-static')!;
  if (dynWithStatic.length > 0) {
    console.log('  DYNAMIC-WITH-STATIC DETAIL (static props are still Path D violations)');
    for (const r of dynWithStatic) {
      console.log(`    ${r.file}:${r.line}`);
      if (r.dynamicRegularProps.length > 0) {
        console.log(`      Path C (keep):   [${r.dynamicRegularProps.join(', ')}]`);
      }
      if (r.staticViolationProps.length > 0) {
        console.log(`      Path D (fix):    [${r.staticViolationProps.join(', ')}]`);
      }
      if (r.customPropNames.length > 0) {
        console.log(
          `      Custom (keep):  [${r.customPropNames.join(', ')}]  ← ADR-0022 mechanism, do not migrate`,
        );
      }
    }
    console.log('');
  }

  // ── Blocks with mixed --* custom props + violations ────────────────────────
  // Any violation block that also contains --* props: custom props must NOT be migrated
  const violationsWithCustom = violations.filter((r) => r.customPropNames.length > 0);
  if (violationsWithCustom.length > 0) {
    console.log(
      '  VIOLATION BLOCKS WITH CUSTOM-PROP SETTERS',
      '(migrate only the regular props; keep --* as-is)',
    );
    for (const r of violationsWithCustom) {
      console.log(`    ${r.file}:${r.line}  [${r.category}]`);
      console.log(`      Path D (migrate): [${r.staticViolationProps.join(', ')}]`);
      console.log(
        `      Custom (keep):   [${r.customPropNames.join(', ')}]  ← ADR-0022 mechanism, do not migrate`,
      );
    }
    console.log('');
  }

  // ── Sanity check ───────────────────────────────────────────────────────────
  // Manual baseline from Session 1 A/B decision (style={{ grep, 198 blocks):
  //   pure-layout: 14, mixed: 85, pure-structural: 84, dynamic: 15
  // Script scans all style= forms; manual grep only caught style={{ (double-brace start).
  // Expected delta: ~+5 blocks (4 type-casted + 1 ternary invisible to style={{ grep).
  const MANUAL_LAYOUT = 14;
  const MANUAL_MIXED = 85;
  const MANUAL_STRUCTURAL = 84;
  const MANUAL_DYNAMIC = 15;

  const scriptLayout = byCategory.get('pure-layout')!.length;
  const scriptMixed = byCategory.get('mixed')!.length;
  const scriptStructural = byCategory.get('pure-structural')!.length;
  // "Dynamic" in manual count includes: pure-dynamic + dynamic-with-static + custom-setter
  const scriptDynamic =
    byCategory.get('pure-dynamic')!.length +
    byCategory.get('dynamic-with-static')!.length +
    byCategory.get('custom-setter')!.length;

  function delta(script: number, manual: number): string {
    const d = script - manual;
    if (d === 0) return '✓ exact match';
    if (Math.abs(d) <= 5) return `Δ ${d > 0 ? '+' : ''}${d}  (within expected range)`;
    return `Δ ${d > 0 ? '+' : ''}${d}  ⚠ INVESTIGATE — exceeds expected variance`;
  }

  console.log('  SANITY CHECK vs. manual count (Session 1 A/B decision, style={{ grep, 198 blocks)');
  console.log(`    Total:          manual 198,  script ${total}  ${delta(total, 198)}`);
  console.log(`    pure-layout:    manual ${MANUAL_LAYOUT},   script ${scriptLayout}  ${delta(scriptLayout, MANUAL_LAYOUT)}`);
  console.log(`    mixed:          manual ${MANUAL_MIXED},   script ${scriptMixed}  ${delta(scriptMixed, MANUAL_MIXED)}`);
  console.log(`    pure-structural: manual ${MANUAL_STRUCTURAL},  script ${scriptStructural}  ${delta(scriptStructural, MANUAL_STRUCTURAL)}`);
  console.log(`    dynamic (all):  manual ${MANUAL_DYNAMIC},   script ${scriptDynamic}  ${delta(scriptDynamic, MANUAL_DYNAMIC)}`);
  console.log(
    '    Note: expected ~+5 total (4 type-casted blocks + 1 ternary invisible to style={{ grep)',
  );
  console.log(
    '    Note: "dynamic" delta may exceed +5 — the manual Python regex was narrow and missed',
  );
  console.log(
    '          (a) ternaries returning numbers (opacity: dim ? 0.45 : 1 — Python requires ? \')',
  );
  console.log(
    '          (b) plain identifier values (color: typeColor) — Python matched only keywords.',
  );
  console.log(
    '          The AST correctly identifies both. Δ in dynamic count = Python undercounting.',
  );
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

run();
