/**
 * @fileoverview Smoke test: app loads and StartScreen is visible
 */

import { test, expect } from '@playwright/test';

test('StartScreen is visible with TAP TO START button', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await expect(page.getByText('TAP TO START', { exact: true })).toBeVisible();
  // The title's two lines are one heading (a <br> between them)
  await expect(page.getByRole('heading', { name: /^SOUNDBOARD\s*OF STORYTELLING$/ })).toBeVisible();
});
