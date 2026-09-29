// ─────────────────────────────────────────────────────────────────────────────
// Playwright configuration — E2E tests
//
// baseURL is http://localhost:5199 — a dedicated test port (dev server stays on 5173).
// Tests navigate explicitly to /soundboard-of-storytelling/ so the URL is readable.
//
// Projects:
//   smoke           — 5 smoke specs × Chromium (fast, ~10s)
//   smoke-webkit    — same 5 specs × WebKit (iOS Safari proxy)
//   full            — 6 full-suite specs × Chromium only (slice-3 coverage, ~90s)
//   mobile          — touch-wiring (audio-free) × WebKit/iPhone 13 Pro (~15s)
//   mobile-chromium — pad touch-wiring (requires audio) × Chromium/iPhone 13 Pro (~20s)
//   visual          — screenshot regression specs × Chromium (local-only, NOT in CI)
//
// Why two mobile projects:
//   Playwright's headless WebKit has no audio codec support — decodeAudioData
//   fails, breaking any test that needs an audio file in the library.
//   Tests that assert pad is-hot/is-looping DOM state run under Chromium with
//   iPhone 13 Pro device settings (viewport 390×844, hasTouch, isMobile).
//   Audio-free navigation/touch tests run under WebKit to exercise the actual
//   Safari engine path for pointer events and CSS.
//
// Default `playwright test` (no flags) runs all projects.
// Use --project=<name> to run a subset.
//
// webServer: starts its own Vite dev server on the dedicated test port and waits
// for the app URL. Never reuses an existing server (see TEST_PORT).
// Project membership lives in tests/e2e/projects.ts (guarded by a unit test).
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig, devices } from '@playwright/test';
import {
  FULL_TESTS,
  FULL_WEBKIT_TESTS,
  MOBILE_CHROMIUM_TESTS,
  MOBILE_WEBKIT_TESTS,
  PWA_TESTS,
  SMOKE_TESTS,
  VISUAL_DIR,
} from './tests/e2e/projects';

// Dedicated test port — never reuse a server that happens to run on the dev port
// (it may serve other code). Port in use → the run fails loudly (strictPort).
const TEST_PORT = 5199;
const TEST_ORIGIN = `http://localhost:${TEST_PORT}`;

// Test target: dev server (default) or the PRODUCTION BUILD (E2E_TARGET=prod →
// `vite preview` of dist/, incl. service worker + manifest). Build first:
// `npm run test:e2e:prod` does both.
const PROD = process.env.E2E_TARGET === 'prod';

const smokeMatch = new RegExp(`tests/e2e/(${SMOKE_TESTS.join('|')})\\.spec\\.ts$`);
const fullMatch = new RegExp(`tests/e2e/(${FULL_TESTS.join('|')})\\.spec\\.ts$`);
const fullWebkitMatch = new RegExp(`tests/e2e/(${FULL_WEBKIT_TESTS.join('|')})\\.spec\\.ts$`);
const pwaMatch = new RegExp(`tests/e2e/(${PWA_TESTS.join('|')})\\.spec\\.ts$`);
const mobileWebKitMatch = new RegExp(
  `tests/e2e/mobile/(${MOBILE_WEBKIT_TESTS.join('|')})\\.spec\\.ts$`,
);
const mobileChromiumMatch = new RegExp(
  `tests/e2e/mobile/(${MOBILE_CHROMIUM_TESTS.join('|')})\\.spec\\.ts$`,
);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  // list: failing tests with name + error in the terminal (pre-push hook, CI log);
  // html: full report in playwright-report/ (overwritten by the next run).
  reporter: [['list'], ['html', { open: 'never' }]],
  // CI: a test that only passes on retry fails the run (and blocks deploy).
  // Quarantine procedure: docs/development/testing.md §Flaky tests.
  failOnFlakyTests: !!process.env.CI,
  // A committed test.only would silently drop every other test — always forbidden.
  forbidOnly: true,
  use: {
    baseURL: TEST_ORIGIN,
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      // Allow very small pixel-level differences (font subpixel rendering).
      // macOS-only: baselines are NOT committed for CI (different font stack).
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'smoke',
      testMatch: smokeMatch,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'smoke-webkit',
      testMatch: smokeMatch,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'full',
      testMatch: fullMatch,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Same specs as `full` where no playback is needed — in the Safari engine.
      name: 'full-webkit',
      testMatch: fullWebkitMatch,
      use: { ...devices['Desktop Safari'] },
    },
    {
      // iPhone 13 Pro: viewport 390×844, hasTouch: true, isMobile: true,
      // deviceScaleFactor: 3, defaultBrowserType: webkit.
      // Covers audio-free touch-wiring (tap() events), touch target sizes, overflow.
      // File-picker, audio output, Ringer Switch: see docs/development/manual-iphone-checklist.md.
      name: 'mobile',
      testMatch: mobileWebKitMatch,
      use: { ...devices['iPhone 13 Pro'] },
    },
    {
      // Same iPhone 13 Pro profile but running on Chromium.
      // Required for pad-interaction and pad-creation tests because headless
      // WebKit has no audio codec support — decodeAudioData fails and the
      // upload pipeline skips the file, so those tests time out in WebKit.
      // Chromium decodes WAV without issue.
      name: 'mobile-chromium',
      testMatch: mobileChromiumMatch,
      use: { ...devices['iPhone 13 Pro'], defaultBrowserType: 'chromium' as const },
    },
    // PWA checks exist only in the production build (no service worker in dev).
    ...(PROD
      ? [
          {
            name: 'pwa',
            testMatch: pwaMatch,
            use: { ...devices['Desktop Chrome'] },
          },
        ]
      : []),
    {
      name: 'visual',
      testMatch: new RegExp(`tests/e2e/${VISUAL_DIR}/.*\\.spec\\.ts$`),
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: PROD
      ? `npm run preview -- --port ${TEST_PORT} --strictPort`
      : `npm run dev -- --port ${TEST_PORT} --strictPort`,
    url: `${TEST_ORIGIN}/soundboard-of-storytelling/`,
    // Always start a fresh server for tests (locally and in CI).
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
