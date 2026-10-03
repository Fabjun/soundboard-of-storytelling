/**
 * @fileoverview Smoke test: app loads and StartScreen is visible
 */

import { test, expect } from '@playwright/test';

test('StartScreen is visible with TAP TO UNLOCK button', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await expect(page.getByText('TAP TO UNLOCK')).toBeVisible();
  await expect(page.getByText('SOUNDBOARD')).toBeVisible();
  await expect(page.getByText('OF STORYTELLING')).toBeVisible();
});
