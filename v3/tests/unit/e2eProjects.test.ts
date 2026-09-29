// ─────────────────────────────────────────────────────────────────────────────
// e2eProjects — guard: every E2E spec runs in exactly one Playwright project
//
// Playwright projects select specs by name lists (tests/e2e/projects.ts).
// A spec missing from the lists silently runs nowhere — this happened on
// 2026-09-29 after scene-crud was renamed to deck-crud. This test fails the
// commit instead. Helper files (helpers.ts, visual-setup.ts, projects.ts) are
// not specs and are ignored.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  FULL_TESTS,
  FULL_WEBKIT_TESTS,
  MOBILE_CHROMIUM_TESTS,
  MOBILE_WEBKIT_TESTS,
  PWA_TESTS,
  SMOKE_TESTS,
  VISUAL_DIR,
} from '../e2e/projects';

const E2E_DIR = join(__dirname, '..', 'e2e');

/** All *.spec.ts files under tests/e2e, as paths relative to it ('mobile/x.spec.ts'). */
function listSpecs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry.endsWith('-snapshots')) continue; // visual baselines
      out.push(...listSpecs(full));
    } else if (entry.endsWith('.spec.ts')) {
      out.push(relative(E2E_DIR, full).split('\\').join('/'));
    }
  }
  return out.sort();
}

/** Expected relative path for every listed spec, tagged with its list. */
function listedSpecs(): { path: string; list: string }[] {
  return [
    ...SMOKE_TESTS.map((n) => ({ path: `${n}.spec.ts`, list: 'SMOKE_TESTS' })),
    ...FULL_TESTS.map((n) => ({ path: `${n}.spec.ts`, list: 'FULL_TESTS' })),
    ...PWA_TESTS.map((n) => ({ path: `${n}.spec.ts`, list: 'PWA_TESTS' })),
    ...MOBILE_WEBKIT_TESTS.map((n) => ({
      path: `mobile/${n}.spec.ts`,
      list: 'MOBILE_WEBKIT_TESTS',
    })),
    ...MOBILE_CHROMIUM_TESTS.map((n) => ({
      path: `mobile/${n}.spec.ts`,
      list: 'MOBILE_CHROMIUM_TESTS',
    })),
  ];
}

describe('E2E project membership (tests/e2e/projects.ts)', () => {
  const specs = listSpecs(E2E_DIR);
  const listed = listedSpecs();

  it('finds spec files at all (sanity)', () => {
    expect(specs.length).toBeGreaterThan(10);
  });

  it('assigns every spec to a project', () => {
    const listedPaths = new Set(listed.map((l) => l.path));
    const unassigned = specs.filter((s) => !s.startsWith(`${VISUAL_DIR}/`) && !listedPaths.has(s));
    expect(
      unassigned,
      'specs that would run in no project — add them to tests/e2e/projects.ts',
    ).toEqual([]);
  });

  it('lists no spec twice', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const { path, list } of listed) {
      const prev = seen.get(path);
      if (prev) duplicates.push(`${path} (${prev} + ${list})`);
      seen.set(path, list);
    }
    expect(duplicates).toEqual([]);
  });

  it('has a file for every listed name', () => {
    const existing = new Set(specs);
    const missing = listed.filter((l) => !existing.has(l.path)).map((l) => `${l.list}: ${l.path}`);
    expect(missing, 'listed specs without a file — rename or remove the entry').toEqual([]);
  });

  it('runs FULL_WEBKIT_TESTS only as a subset of FULL_TESTS', () => {
    const notInFull = FULL_WEBKIT_TESTS.filter((n) => !FULL_TESTS.includes(n));
    expect(notInFull, 'FULL_WEBKIT_TESTS entries must also be in FULL_TESTS').toEqual([]);
  });

  it('keeps only visual specs in the visual folder', () => {
    const visual = specs.filter((s) => s.startsWith(`${VISUAL_DIR}/`));
    expect(visual.length).toBeGreaterThan(0);
    expect(visual.every((s) => /^visual\/visual-[\w-]+\.spec\.ts$/.test(s))).toBe(true);
  });
});
