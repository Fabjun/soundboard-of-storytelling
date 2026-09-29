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
      // Thresholds intentionally 0 — this tracks trends, not gates CI.
      // Raise these when meaningful coverage targets are established.
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
});
