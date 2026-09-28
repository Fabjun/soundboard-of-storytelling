// ─────────────────────────────────────────────────────────────────────────────
// Smoke test: LIBRARY button opens LibraryScreen
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';

test('LIBRARY button navigates to LibraryScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'LIBRARY' }).click();
  // IMPORT button is unique to LibraryScreen (not present on Start or BoardList)
  // Note: the actual button text is "IMPORT" — CLAUDE.md says "UPLOAD" which is wrong.
  await expect(page.getByRole('button', { name: /IMPORT/ })).toBeVisible();
  // Library heading in the TopBar (sb-display-vt, filtered to avoid StatusBar match)
  await expect(page.locator('.sb-display-vt').filter({ hasText: 'Library' })).toBeVisible();
});
