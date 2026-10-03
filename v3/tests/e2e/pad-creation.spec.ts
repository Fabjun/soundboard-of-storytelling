/**
 * @fileoverview Full E2E — Pad Creation (Slice-3 verification points 12–15)
 *
 * 12. Tap empty cell → PadCreationPopover opens
 * 13. Select audio from RECENT → ADD PAD → pad appears in cell
 * 14. Library drag to empty cell → pad created there (real pointer drag)
 * 15. BROWSE tab in popover → source select + ADD PAD
 * Later tests (no Slice-3 number): a new pad is SINGLE unless the user picks a type; the suggested name follows the file, a typed
 * name is kept.
 */

import { test, expect } from '@playwright/test';
import {
  ensureTestAudio,
  goToBoardList,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  pointerDrag,
  reopenFirstBoard,
  seedTestAudio,
  TEST_AUDIO_NAME,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  // Audio in the library (required for pad creation): upload (Chromium) / seed (WebKit)
  await ensureTestAudio(page);
  // Navigate to board
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
});

// ── Test 12: Tap empty cell → popover opens ───────────────────────────────────

test('12 — tap empty cell → PadCreationPopover opens', async ({ page }) => {
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  await expect(page.getByTestId('pad-creation-popover')).toBeVisible();
  // CANCEL button closes it
  await page.getByTestId('pad-creation-popover-cancel-button').click();
  await expect(page.getByTestId('pad-creation-popover')).not.toBeVisible({
    timeout: 2000,
  });
});

// ── Test 13: Path A — select RECENT → ADD PAD ────────────────────────────────

test('13 — Path A: select from RECENT tab → ADD PAD → pad appears in cell', async ({ page }) => {
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();

  // RECENT tab is default; source item should be visible
  const sourceItem = page.locator('[data-testid^="pad-creation-popover-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();

  // ADD PAD should now be enabled
  const addPadBtn = page.getByTestId('pad-creation-popover-add-button');
  await expect(addPadBtn).not.toBeDisabled();
  await addPadBtn.click();

  // Popover closes, pad cell appears (not empty)
  await expect(popover).not.toBeVisible({ timeout: 3000 });
  await expect(
    page
      .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
      .first(),
  ).toBeVisible();
  // Cell 0,0 is no longer empty
  await expect(page.getByTestId('pad-grid-cell-empty-slot-0-0')).not.toBeVisible({
    timeout: 2000,
  });
});

// ── Test 14: Path B — library drag → pad created ─────────────────────────────

test('14 — Path B: library drag to empty cell → pad created there', async ({ page }) => {
  // Open the library panel (right slot) — its rows start a Pointer-Events drag (libDnd.ts)
  await page.getByTitle('Open library panel').click();
  const row = page
    .locator('[data-testid^="library-panel-row-"]')
    .filter({ hasText: TEST_AUDIO_NAME })
    .first();
  await row.waitFor();

  await pointerDrag(page, row, page.getByTestId('pad-grid-cell-empty-slot-2-1'));

  const created = page.locator(
    '[data-pos="2,1"][data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])',
  );
  await expect(created).toBeVisible();
  await expect(created).toContainText(TEST_AUDIO_NAME);
  await expect(page.getByTestId('pad-grid-cell-empty-slot-2-1')).toHaveCount(0);
});

// ── Test 15: Path A via BROWSE tab ────────────────────────────────────────────

test('15 — Path A: BROWSE tab → search → select → ADD PAD', async ({ page }) => {
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();

  // Switch to BROWSE tab
  await page.getByTestId('pad-creation-popover-source-tab-browse').click();

  // Source items should appear in BROWSE tab
  const sourceItem = page.locator('[data-testid^="pad-creation-popover-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();

  // Pad name input should be populated or at least focusable
  const nameInput = page.getByTestId('pad-creation-popover-name-input');
  await expect(nameInput).toBeVisible();

  // ADD PAD
  const addPadBtn = page.getByTestId('pad-creation-popover-add-button');
  await expect(addPadBtn).not.toBeDisabled();
  await addPadBtn.click();

  // Pad appears
  await expect(
    page
      .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
      .first(),
  ).toBeVisible();
});

// ── Later tests: what the user picks or types is kept ─────────────────────────

const LONG_AUDIO = {
  id: 'e2e0000000000000000000000000000000000000000000000000000000000002',
  name: 'long-12s.wav',
  duration: 12,
};

test('a new pad is SGL unless the user picks a type — also for a long file', async ({ page }) => {
  // A long file: before 2026-10-02 the app guessed LOOP from ≥ 10 s (metadata is enough)
  await seedTestAudio(page, LONG_AUDIO);
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  const popover = page.getByTestId('pad-creation-popover');
  const longItem = popover
    .locator('[data-testid^="pad-creation-popover-source-item-"]')
    .filter({ hasText: 'long-12s' });
  const padAt = (pos: string) =>
    page.locator(
      `[data-pos="${pos}"][data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])`,
    );

  // Popover, no type picked → SGL
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  await longItem.click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await expect(padAt('0,0')).toContainText('SGL');

  // Popover, LOOP picked before the file → LOOP is kept
  await page.getByTestId('pad-grid-cell-empty-slot-1-0').click();
  await popover.getByRole('button', { name: 'LOOP', exact: true }).click();
  await longItem.click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await expect(padAt('1,0')).toContainText('LOOP');

  // Library drag (no type to pick) → SGL
  await page.getByTitle('Open library panel').click();
  const row = page.locator('[data-testid^="library-panel-row-"]').filter({ hasText: 'long-12s' });
  await pointerDrag(page, row, page.getByTestId('pad-grid-cell-empty-slot-2-1'));
  await expect(padAt('2,1')).toContainText('SGL');
});

test('the suggested name follows the chosen file; a typed name is kept', async ({ page }) => {
  await seedTestAudio(page, LONG_AUDIO);
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  const popover = page.getByTestId('pad-creation-popover');
  const item = (name: string) =>
    popover.locator('[data-testid^="pad-creation-popover-source-item-"]').filter({ hasText: name });
  const pads = page.locator(
    '[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])',
  );

  // One file, then another: the pad takes the name of the second
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  await item(TEST_AUDIO_NAME).click();
  await item('long-12s').click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await expect(pads.first()).toContainText('long-12s');

  // A typed name survives choosing a file
  await page.getByTestId('pad-grid-cell-empty-slot-1-0').click();
  await page.getByTestId('pad-creation-popover-name-input').fill('Rain');
  await item('long-12s').click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await expect(pads.filter({ hasText: 'Rain' })).toHaveCount(1);
});
