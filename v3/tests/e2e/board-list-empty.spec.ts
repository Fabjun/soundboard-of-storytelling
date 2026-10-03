/**
 * @fileoverview Smoke test: BOARD button opens BoardListScreen with empty state CTA
 */

import { test, expect } from '@playwright/test';

test('BOARD button opens BoardListScreen with NEW BOARD CTA', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'BOARD' }).click();
  // Header and primary action button visible
  await expect(page.getByRole('button', { name: /NEW BOARD/ })).toBeVisible();
});
