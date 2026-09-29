// ─────────────────────────────────────────────────────────────────────────────
// Vitest configuration — separate from vite.config.ts intentionally:
//   - vite.config.ts includes vite-plugin-pwa (build-only, breaks in test mode)
//   - Test environment uses jsdom, not the Vite dev server
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/lib/**', 'src/state/**', 'src/db/**', 'src/audio/**'],
      exclude: ['tests/**', '**/*.config.ts', 'src/main.tsx', 'src/app.tsx'],
      // Coverage FLOOR (T6, 2026-09-29): just below the measured values
      // (lines 69.45 · statements 67.8 · functions 71.75 · branches 61.61).
      // Enforced in CI via `npm run test:coverage`. Only ever RAISE these —
      // at slice completion, to the new measured values rounded down.
      thresholds: {
        lines: 69,
        functions: 71,
        branches: 61,
        statements: 67,
      },
    },
  },
});
