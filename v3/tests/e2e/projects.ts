// ─────────────────────────────────────────────────────────────────────────────
// E2E project membership — single source for playwright.config.ts
//
// Every *.spec.ts under tests/e2e/ must belong to exactly ONE list below
// (visual/ specs are matched by folder). tests/unit/e2eProjects.test.ts
// enforces this on every commit: a spec that is not listed would otherwise
// silently run nowhere (happened on 2026-09-29 after a rename).
// ─────────────────────────────────────────────────────────────────────────────

/** tests/e2e/<name>.spec.ts — Chromium + WebKit (desktop), runs on every commit. */
export const SMOKE_TESTS = [
  'app-loads',
  'library-empty',
  'board-list-empty',
  'board-create',
  'mode-toggle',
];

/** tests/e2e/<name>.spec.ts — Chromium (desktop), pre-push + CI. */
export const FULL_TESTS = [
  'board-crud',
  'deck-crud',
  'pad-creation',
  'pad-editing',
  'layout-reach',
  'pad-dnd',
  'pad-pool',
  'game-mode',
  'audio',
];

/**
 * Subset of FULL_TESTS that ALSO runs in WebKit (desktop Safari engine). Audio playback
 * is impossible in headless WebKit; these specs need the library but no playback —
 * helpers.ensureTestAudio seeds it there. Must stay a subset of FULL_TESTS (guarded).
 */
export const FULL_WEBKIT_TESTS = [
  'board-crud',
  'deck-crud',
  'pad-creation',
  'pad-editing',
  'layout-reach',
  'pad-dnd',
  'pad-pool',
];

/** tests/e2e/mobile/<name>.spec.ts — audio-free, WebKit / iPhone 13 Pro (real Safari engine path). */
export const MOBILE_WEBKIT_TESTS = [
  'unlock-nav',
  'board-flow',
  'mode-toggle',
  'touch-targets',
  'overflow',
];

/**
 * tests/e2e/mobile/<name>.spec.ts — audio-dependent, Chromium / iPhone 13 Pro
 * (headless WebKit has no audio codec support → decodeAudioData fails).
 */
export const MOBILE_CHROMIUM_TESTS = ['pad-interaction', 'pad-creation'];

/**
 * tests/e2e/<name>.spec.ts — only against the PRODUCTION BUILD (E2E_TARGET=prod):
 * service worker, manifest, offline. The dev server has no service worker.
 */
export const PWA_TESTS = ['pwa'];

/** Folder whose specs all belong to the local-only `visual` project. */
export const VISUAL_DIR = 'visual';
