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
  'pad-dnd',
  'game-mode',
  'audio',
];

/** tests/e2e/mobile/<name>.spec.ts — audio-free, WebKit / iPhone 13 Pro (real Safari engine path). */
export const MOBILE_WEBKIT_TESTS = [
  'mobile-unlock-nav',
  'mobile-board-flow',
  'mobile-mode-toggle',
  'mobile-touch-targets',
  'mobile-overflow',
];

/**
 * tests/e2e/mobile/<name>.spec.ts — audio-dependent, Chromium / iPhone 13 Pro
 * (headless WebKit has no audio codec support → decodeAudioData fails).
 */
export const MOBILE_CHROMIUM_TESTS = ['mobile-pad-interaction', 'mobile-pad-creation'];

/** Folder whose specs all belong to the local-only `visual` project. */
export const VISUAL_DIR = 'visual';
