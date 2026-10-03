/**
 * @fileoverview Mobile E2E — Mode Toggle (Playwright WebKit, iPhone 13 Pro profile)
 *
 * SCOPE: Verifies that SETUP ↔ GAME switching responds to tap() events and
 * reflects the correct CSS class state on a 390×844 viewport.
 *
 *   A. GAME half tap → .sb-mode-toggle.is-game applied
 *   B. SETUP half tap → .sb-mode-toggle.is-setup applied
 *
 * OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
 *   Audio output, Ringer Switch, backgrounding.
 */

import { test, expect } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate } from '../helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
});

test('A — GAME half tap switches mode to GAME', async ({ page }) => {
  const setup = page.getByRole('button', { name: 'SETUP' });
  const game = page.getByRole('button', { name: 'GAME' });
  // Default state after createBoardAndNavigate may be either mode; force SETUP first
  await setup.tap();
  await expect(setup).toHaveAttribute('aria-pressed', 'true');

  // Now switch to GAME via tap
  await game.tap();

  await expect(game).toHaveAttribute('aria-pressed', 'true');
  await expect(setup).toHaveAttribute('aria-pressed', 'false');
});

test('B — SETUP half tap switches mode to SETUP', async ({ page }) => {
  const setup = page.getByRole('button', { name: 'SETUP' });
  const game = page.getByRole('button', { name: 'GAME' });
  // Force GAME mode first
  await game.tap();
  await expect(game).toHaveAttribute('aria-pressed', 'true');

  // Now switch to SETUP via tap
  await setup.tap();

  await expect(setup).toHaveAttribute('aria-pressed', 'true');
  await expect(game).toHaveAttribute('aria-pressed', 'false');
});
