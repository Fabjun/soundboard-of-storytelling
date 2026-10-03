/**
 * @fileoverview ESLint flat config — Soundboard of Storytelling
 *
 * Stack: TypeScript + Preact (React-compat) + react-hooks plugin
 */

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import hooksPlugin from 'eslint-plugin-react-hooks';
import vitestPlugin from '@vitest/eslint-plugin';
import playwrightPlugin from 'eslint-plugin-playwright';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import tsdocPlugin from 'eslint-plugin-tsdoc';

// Rules tsc already enforces in every tsconfig (noUnusedLocals / noUnusedParameters, checked by
// testGuards): turned off so the same finding is not reported twice. Each switch names its
// reason inline — sync-exceptions lists them in docs/development/exceptions.md (ADR-0053).
const TSC_COVERED = {
  '@typescript-eslint/no-unused-vars': 'off', // tsc noUnusedLocals/noUnusedParameters report it
};

export default [
  // ── Exception scheme (ADR-0053) — applies to every linted file ─────────────
  // Every disable directive names its rule(s) and carries a reason after " -- ";
  // unused directives are errors, so stale exceptions cannot linger.
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  eslintComments.recommended,
  {
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
    },
  },

  // ── Production source ────────────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': hooksPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      ...TSC_COVERED,

      // verbatimModuleSyntax: true requires import type for type-only imports.
      // This rule enforces it at lint-time too (belt + suspenders).
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // ── Unit test files (vitest) ──────────────────────────────────────────────
  {
    files: ['tests/unit/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      vitest: vitestPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...TSC_COVERED,
      '@typescript-eslint/consistent-type-imports': 'error',
      // Test traps (T10, 2026-09-29): tests that pass for the wrong reason.
      'vitest/expect-expect': 'error', // a test without an assertion always passes
      'vitest/no-focused-tests': 'error', // .only silently drops every other test
      'vitest/no-disabled-tests': 'error', // skip only as a visible, justified exception
      'vitest/valid-expect': 'error', // expect() without matcher / missing await
    },
  },

  // ── E2E test files (playwright) ───────────────────────────────────────────
  {
    files: ['tests/e2e/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.e2e.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      playwright: playwrightPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...TSC_COVERED,
      '@typescript-eslint/consistent-type-imports': 'error',
      // Test traps (T10, 2026-09-29): tests that pass for the wrong reason.
      // A test without an assertion always passes. Helpers that assert internally are listed.
      'playwright/expect-expect': [
        'error',
        { assertFunctionNames: ['assertTarget', 'assertNoOverflow'] },
      ],
      'playwright/no-focused-test': 'error', // .only silently drops every other test
      // skip AND fixme only as a visible, justified exception (eslint-disable comment + reason)
      'playwright/no-skipped-test': ['error', { disallowFixme: true }],
      'playwright/valid-expect': 'error', // expect() without matcher / missing await
      // An `if` around an assertion lets the test pass without checking anything when the
      // condition is false (found 3× on 2026-10-01). Both rules are in the plugin's recommended set.
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
    },
  },

  // ── Tool config files and repository scripts (v3/scripts/) ──────────────────
  // The recommended rules need no type information; types are checked by `tsc -b`
  // (tsconfig.node.json covers the .ts configs and scripts/, ADR-0055).
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.ts'],
    languageOptions: { parser: tsParser },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },

  // ── Doc comments (ADR-0064) — production source and repository scripts ─────
  // Every export has a TSDoc comment; tests are excluded (their names say what they check).
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts'],
    plugins: { jsdoc: jsdocPlugin, tsdoc: tsdocPlugin },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            MethodDefinition: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
          contexts: [
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            'TSEnumDeclaration',
            'ExportNamedDeclaration > VariableDeclaration',
          ],
        },
      ],
      'jsdoc/no-types': 'error', // TypeScript has the types (Google TS style guide)
      'tsdoc/syntax': 'error',
    },
  },

  // ── Global ignores — generated output only (ADR-0053: every entry has a reason) ──
  {
    ignores: [
      'dist/**', // build output (vite build)
      'node_modules/**', // installed dependencies
      'coverage/**', // generated coverage report
      'playwright-report/**', // generated E2E report
      'test-results/**', // generated E2E artefacts
      '.stryker-tmp/**', // Stryker sandbox copies of the project during a mutation run
      'reports/**', // generated mutation report
    ],
  },
];
