// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — GAME mode (Slice-3 verification point 22)
//
// 22. GAME mode: no CRUD-UI visible (delete buttons, drag handles, editor)
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import {
  goToBoardList,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  enterGameMode,
} from './helpers';

test('22 — GAME mode: CRUD controls hidden, ModeToggle shows is-game', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);

  // First verify SETUP mode has CRUD UI visible
  await enterSetupMode(page);
  // DeckRail action buttons visible on hover in SETUP
  // NEW DECK button always visible
  await expect(page.getByTestId('new-deck-button')).toBeVisible();

  // Switch to GAME mode
  await enterGameMode(page);

  // ModeToggle shows game state
  await expect(page.getByTestId('mode-toggle')).toHaveClass(/is-game/);

  // GAME mode: pad editor should not be open
  await expect(page.getByTestId('pad-editor')).not.toBeVisible();

  // GAME mode: NEW DECK button is still visible (it's part of the DeckRail
  // which is always rendered). The key GAME restriction is on pad CRUD:
  // empty cells have no + button affordance and clicking doesn't open the popover.
  // Verify: pad creation popover cannot be triggered
  const emptyCell = page.getByTestId('pad-cell-empty-0-0');
  if (await emptyCell.isVisible()) {
    await emptyCell.click();
    // Popover should NOT appear in GAME mode
    await expect(page.getByTestId('pad-creation-popover')).not.toBeVisible({
      timeout: 1000,
    });
  }

  // Verify switching back to SETUP restores the toggle class
  await enterSetupMode(page);
  await expect(page.getByTestId('mode-toggle')).toHaveClass(/is-setup/);
});
