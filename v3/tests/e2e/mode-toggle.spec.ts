/**
 * @fileoverview Smoke test: ModeToggle switches between GAME and SETUP mode
 *
 * Starting state: currentMode = 'play' → .sb-mode-toggle has .is-game class
 * After clicking SETUP half: currentMode = 'edit' → .sb-mode-toggle has .is-setup
 */

import { test, expect } from '@playwright/test';
import { openMainMenu } from './helpers';

test('ModeToggle switches from GAME to SETUP and back', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');

  // Navigate to a board (create one first)
  await openMainMenu(page);
  await page.getByRole('button', { name: 'BOARD', exact: true }).click();
  await page.getByRole('button', { name: /NEW BOARD/ }).click();
  await page.locator('[data-testid^="board-list-screen-row-"]').first().click();

  // Initial state: GAME is the pressed half (aria-pressed — user-facing state)
  const setup = page.getByRole('button', { name: 'SETUP', exact: true });
  const game = page.getByRole('button', { name: 'GAME', exact: true });
  await expect(page.getByTestId('mode-toggle')).toBeVisible();
  await expect(game).toHaveAttribute('aria-pressed', 'true');

  // Click the SETUP half → SETUP pressed, GAME released
  await setup.click();
  await expect(setup).toHaveAttribute('aria-pressed', 'true');
  await expect(game).toHaveAttribute('aria-pressed', 'false');

  // Click back to GAME
  await game.click();
  await expect(game).toHaveAttribute('aria-pressed', 'true');
  await expect(setup).toHaveAttribute('aria-pressed', 'false');
});

// The sparks fly beyond the toggle: children of document.body in viewport coordinates, so no
// container of the toggle can clip them (ModeToggle.tsx). A spark lives at least 430 ms.
test('a switch throws sparks that hang on the page, fixed in the viewport', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: 'BOARD', exact: true }).click();
  await page.getByRole('button', { name: /NEW BOARD/ }).click();
  await page.locator('[data-testid^="board-list-screen-row-"]').first().click();

  await page.getByRole('button', { name: 'SETUP', exact: true }).click();
  // One read of a spark that exists — it is removed after its flight
  const position = await page
    .locator('body > .sb-mode-toggle-spark')
    .first()
    .evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe('fixed');
});
