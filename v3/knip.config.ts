/**
 * @fileoverview knip configuration — unused files, exports and dependencies (structure audit A18)
 *
 * knip finds code and packages nothing uses (https://knip.dev). Its plugins read the Vite,
 * Vitest, Playwright, ESLint and Stryker configurations, so their entry files count as used.
 * Code kept for a later implementation carries `@reserved` (ADR-0064) and is not reported.
 * Every ignore below names its reason (ADR-0053).
 */

import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // "!" marks what production mode (knip --production) checks: the app itself (its entry,
  // src/main.tsx, comes from the Vite plugin via index.html). Scripts and tests are checked in the
  // default mode, where tests count as users of the code they test.
  entry: ['scripts/*.ts'],
  project: ['src/**/*.{ts,tsx}!', 'scripts/**/*.ts', 'tests/**/*.ts'],
  // A symbol exported for its signature and used in its own file is not dead code
  ignoreExportsUsedInFile: true,
  ignoreIssues: {
    // The developer log is read by scripts/sync-changelog.ts (CHANGELOG.md), not by the app
    'src/lib/changelog.ts': ['exports'],
  },
  // Code kept for a later slice or a parked feature (ADR-0064, codeGuards)
  tags: ['-reserved'],
  ignoreDependencies: [
    // Peer dependency of @fast-check/vitest, which the property tests import
    'fast-check',
    // Run from the repository root by .husky/commit-msg and .husky/pre-commit, outside v3/
    '@commitlint/cli',
    'lint-staged',
    // Loaded by name in the link:check script (remark --use remark-validate-links)
    'remark-validate-links',
    // Type-only JSDoc import in stryker.config.mjs; @stryker-mutator/core pins it exactly
    '@stryker-mutator/api',
    // Stryker's "command" test runner is built into @stryker-mutator/core, not a package
    '@stryker-mutator/command-runner',
  ],
  ignoreBinaries: [
    // Installed by scripts/vale-install.ts (a Go binary, not an npm package)
    'vale',
  ],
};

export default config;
