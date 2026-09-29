// ─────────────────────────────────────────────────────────────────────────────
// Mobile E2E — Mode Toggle (Playwright WebKit, iPhone 13 Pro profile)
//
// SCOPE: Verifies that SETUP ↔ GAME switching responds to tap() events and
// reflects the correct CSS class state on a 390×844 viewport.
//
//   A. GAME half tap → .sb-mode-toggle.is-game applied
//   B. SETUP half tap → .sb-mode-toggle.is-setup applied
//
// OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
//   Audio output, Ringer Switch, backgrounding.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate } from '../helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
});

test('A — GAME half tap switches mode to is-game', async ({ page }) => {
  // Default state after createBoardAndNavigate may be either mode; force SETUP first
  await page.getByTestId('mode-toggle-setup').tap();
  await page.locator('.sb-mode-toggle.is-setup').waitFor();

  // Now switch to GAME via tap
  await page.getByTestId('mode-toggle-game').tap();

  await expect(page.locator('.sb-mode-toggle.is-game')).toBeVisible();
  await expect(page.locator('.sb-mode-toggle.is-setup')).not.toBeVisible();
});

test('B — SETUP half tap switches mode to is-setup', async ({ page }) => {
  // Force GAME mode first
  await page.getByTestId('mode-toggle-game').tap();
  await page.locator('.sb-mode-toggle.is-game').waitFor();

  // Now switch to SETUP via tap
  await page.getByTestId('mode-toggle-setup').tap();

  await expect(page.locator('.sb-mode-toggle.is-setup')).toBeVisible();
  await expect(page.locator('.sb-mode-toggle.is-game')).not.toBeVisible();
});
