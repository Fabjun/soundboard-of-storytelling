// ─────────────────────────────────────────────────────────────────────────────
// ESLint flat config — BotC Soundboard V3
//
// Stack: TypeScript + Preact (React-compat) + react-hooks plugin
// ─────────────────────────────────────────────────────────────────────────────

import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import hooksPlugin from 'eslint-plugin-react-hooks';
import vitestPlugin from '@vitest/eslint-plugin';
import playwrightPlugin from 'eslint-plugin-playwright';

export default [
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

      // tsc (noUnusedLocals/noUnusedParameters) already enforces this for src/.
      // Turning it off here avoids duplicate reporting. NOTE: if noUnusedLocals
      // is ever disabled in tsconfig.app.json, re-enable this rule here too.
      '@typescript-eslint/no-unused-vars': 'off',

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
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
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
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
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
    },
  },

  // ── Global ignores ────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '*.config.{js,ts}',
    ],
  },
];
