/**
 * @fileoverview Vitest configuration — separate from vite.config.ts intentionally:
 *   - vite.config.ts includes vite-plugin-pwa (build-only, breaks in test mode)
 *   - Test environment uses jsdom, not the Vite dev server
 */

import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    // Node by default: jsdom costs ~0.5 s per test file (81 % of a single-worker run), which
    // multiplied by ~1,800 mutants made mutation testing time out (T11c). Test files that need a
    // DOM opt in with a first-line docblock: // @vitest-environment jsdom
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
    // Time budget per test. CI (coverage, slower runners) was measured more than 7x slower
    // than a local run without coverage (docsGuards table guard: 0.7 s local → >5 s in CI,
    // run 36755104559). A local budget of 1/10 of CI's makes a slow test fail at commit time,
    // not only after the push. Slowest test on 2026-09-30: 157 ms under coverage.
    testTimeout: process.env.CI ? 5000 : 500,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/lib/**', 'src/state/**', 'src/db/**', 'src/audio/**'],
      exclude: ['tests/**', '**/*.config.ts', 'src/main.tsx', 'src/App.tsx'],
      // Coverage FLOOR (T6, 2026-09-29): just below the measured values
      // (lines 69.45 · statements 67.8 · functions 71.75 · branches 61.61).
      // Enforced in CI via `npm run test:coverage`. Only ever RAISE these —
      // at slice completion, to the new measured values rounded down.
      // Last raise 2026-10-03 (stack #31–#40 and B1/B8/B9 on main; three runs, identical):
      // lines 92.32 · statements 91.15 · functions 94.02 · branches 89.05.
      thresholds: {
        lines: 92,
        functions: 94,
        branches: 89,
        statements: 91,
      },
    },
  },
});
