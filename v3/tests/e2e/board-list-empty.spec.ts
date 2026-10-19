/**
 * @fileoverview Smoke test: BOARD button opens BoardListScreen with empty state CTA
 */

import { test, expect } from '@playwright/test';
import { openMainMenu } from './helpers';

test('BOARD button opens BoardListScreen with NEW BOARD CTA', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: 'BOARD', exact: true }).click();
  // Header and primary action button visible
  await expect(page.getByRole('button', { name: /NEW BOARD/ })).toBeVisible();
});
