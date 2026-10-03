/**
 * @fileoverview Smoke test: LIBRARY button opens LibraryScreen
 */

import { test, expect } from '@playwright/test';

test('LIBRARY button navigates to LibraryScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'LIBRARY' }).click();
  // IMPORT button is unique to LibraryScreen (not present on Start or BoardList)
  // Note: the actual button text is "IMPORT" — CLAUDE.md says "UPLOAD" which is wrong.
  await expect(page.getByRole('button', { name: /IMPORT/ })).toBeVisible();
  // Library title in the TopBar (scoped to the TopBar to avoid other "Library" text)
  await expect(page.getByTestId('top-bar').getByText('Library', { exact: true })).toBeVisible();
});
