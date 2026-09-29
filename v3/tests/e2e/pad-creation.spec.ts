// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — Pad Creation (Slice-3 verification points 12–15)
//
// 12. Tap empty cell → PadCreationPopover opens
// 13. Select audio from RECENT → ADD PAD → pad appears in cell
// 14. Library drag to empty cell → pad created there (real pointer drag)
// 15. BROWSE tab in popover → source select + ADD PAD
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import {
  goToLibrary,
  uploadTestAudio,
  goToBoardList,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  pointerDrag,
  TEST_AUDIO_NAME,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  // Upload audio first (required for pad creation)
  await goToLibrary(page);
  await uploadTestAudio(page);
  // Navigate to board
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
});

// ── Test 12: Tap empty cell → popover opens ───────────────────────────────────

test('12 — tap empty cell → PadCreationPopover opens', async ({ page }) => {
  await page.getByTestId('pad-cell-empty-0-0').click();
  await expect(page.getByTestId('pad-creation-popover')).toBeVisible();
  // CANCEL button closes it
  await page.getByTestId('creation-cancel').click();
  await expect(page.getByTestId('pad-creation-popover')).not.toBeVisible({
    timeout: 2000,
  });
});

// ── Test 13: Path A — select RECENT → ADD PAD ────────────────────────────────

test('13 — Path A: select from RECENT tab → ADD PAD → pad appears in cell', async ({ page }) => {
  await page.getByTestId('pad-cell-empty-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();

  // RECENT tab is default; source item should be visible
  const sourceItem = page.locator('[data-testid^="creation-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();

  // ADD PAD should now be enabled
  const addPadBtn = page.getByTestId('creation-add-pad');
  await expect(addPadBtn).not.toBeDisabled();
  await addPadBtn.click();

  // Popover closes, pad cell appears (not empty)
  await expect(popover).not.toBeVisible({ timeout: 3000 });
  await expect(
    page.locator('[data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])').first(),
  ).toBeVisible();
  // Cell 0,0 is no longer empty
  await expect(page.getByTestId('pad-cell-empty-0-0')).not.toBeVisible({
    timeout: 2000,
  });
});

// ── Test 14: Path B — library drag → pad created ─────────────────────────────

test('14 — Path B: library drag to empty cell → pad created there', async ({ page }) => {
  // Open the library panel (right slot) — its rows start a Pointer-Events drag (libDnd.ts)
  await page.getByTitle('Open library panel').click();
  const row = page.locator('.sb-lib-panel-row').filter({ hasText: TEST_AUDIO_NAME }).first();
  await row.waitFor();

  await pointerDrag(page, row, page.getByTestId('pad-cell-empty-2-1'));

  const created = page.locator(
    '[data-pos="2,1"][data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])',
  );
  await expect(created).toBeVisible();
  await expect(created).toContainText(TEST_AUDIO_NAME);
  await expect(page.getByTestId('pad-cell-empty-2-1')).toHaveCount(0);
});

// ── Test 15: Path A via BROWSE tab ────────────────────────────────────────────

test('15 — Path A: BROWSE tab → search → select → ADD PAD', async ({ page }) => {
  await page.getByTestId('pad-cell-empty-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();

  // Switch to BROWSE tab
  await page.getByTestId('creation-tab-browse').click();

  // Source items should appear in BROWSE tab
  const sourceItem = page.locator('[data-testid^="creation-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();

  // Pad name input should be populated or at least focusable
  const nameInput = page.getByTestId('creation-pad-name-input');
  await expect(nameInput).toBeVisible();

  // ADD PAD
  const addPadBtn = page.getByTestId('creation-add-pad');
  await expect(addPadBtn).not.toBeDisabled();
  await addPadBtn.click();

  // Pad appears
  await expect(
    page.locator('[data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])').first(),
  ).toBeVisible();
});
