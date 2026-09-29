// ─────────────────────────────────────────────────────────────────────────────
// Playwright configuration — E2E tests
//
// baseURL is http://localhost:5173 (without the Vite base path).
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
// webServer: starts `npm run dev` and waits for the Vite server to be ready
// at the app's actual URL. `reuseExistingServer` allows reuse on local dev
// so tests can run quickly without a cold start every time.
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig, devices } from '@playwright/test';

const SMOKE_TESTS = [
  'app-loads',
  'library-empty',
  'board-list-empty',
  'board-create',
  'mode-toggle',
];
const FULL_TESTS = [
  'board-crud',
  'scene-crud',
  'pad-creation',
  'pad-editing',
  'pad-dnd',
  'game-mode',
  'audio',
];
// Audio-free mobile specs: WebKit exercises the real Safari engine path.
const MOBILE_WEBKIT_TESTS = [
  'mobile-unlock-nav',
  'mobile-board-flow',
  'mobile-mode-toggle',
  'mobile-touch-targets',
  'mobile-overflow',
];
// Audio-dependent mobile specs: Chromium needed because headless WebKit has
// no audio codec support (decodeAudioData fails → upload pipeline is skipped).
const MOBILE_CHROMIUM_TESTS = ['mobile-pad-interaction', 'mobile-pad-creation'];

const smokeMatch = new RegExp(
  `tests/e2e/(${SMOKE_TESTS.join('|')})\\.spec\\.ts$`,
);
const fullMatch = new RegExp(
  `tests/e2e/(${FULL_TESTS.join('|')})\\.spec\\.ts$`,
);
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
  use: {
    baseURL: 'http://localhost:5173',
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
      // iPhone 13 Pro: viewport 390×844, hasTouch: true, isMobile: true,
      // deviceScaleFactor: 3, defaultBrowserType: webkit.
      // Covers audio-free touch-wiring (tap() events), touch target sizes, overflow.
      // File-picker, audio output, Ringer Switch: see docs/MANUAL_IPHONE_CHECKLIST.md.
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
    {
      name: 'visual',
      testMatch: /tests\/e2e\/visual\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/soundboard-of-storytelling/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
