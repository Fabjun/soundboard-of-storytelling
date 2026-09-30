// ─────────────────────────────────────────────────────────────────────────────
// Smoke test: ModeToggle switches between GAME and SETUP mode
//
// Starting state: currentMode = 'play' → .sb-mode-toggle has .is-game class
// After clicking SETUP half: currentMode = 'edit' → .sb-mode-toggle has .is-setup
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';

test('ModeToggle switches from GAME to SETUP and back', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');

  // Navigate to a board (create one first)
  await page.getByRole('button', { name: 'BOARD' }).click();
  await page.getByRole('button', { name: /NEW BOARD/ }).click();
  await page.locator('[data-testid^="board-list-screen-row-"]').first().click();

  // Initial state: GAME is the pressed half (aria-pressed — user-facing state)
  const setup = page.getByRole('button', { name: 'SETUP' });
  const game = page.getByRole('button', { name: 'GAME' });
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
