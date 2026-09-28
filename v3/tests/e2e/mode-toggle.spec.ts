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
  await page.locator('.sb-menu-row').first().click();

  // Initial state: toggle shows GAME mode (.is-game)
  const toggle = page.locator('.sb-mode-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveClass(/is-game/);

  // Click the SETUP half
  await page.getByRole('button', { name: 'SETUP' }).click();

  // After toggle: .is-setup class appears, .is-game disappears
  await expect(toggle).toHaveClass(/is-setup/);
  await expect(toggle).not.toHaveClass(/is-game/);

  // Click back to GAME
  await page.getByRole('button', { name: 'GAME' }).click();
  await expect(toggle).toHaveClass(/is-game/);
  await expect(toggle).not.toHaveClass(/is-setup/);
});
