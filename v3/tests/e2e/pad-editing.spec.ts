// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — Pad Editing (Slice-3 verification points 16–19)
//
// 16. Tap pad in SETUP → PadEditorPanel opens
// 17. Change pad name → auto-saved (persists after reload)
// 18. Trivial type change (single→loop) → no dialog, type updates
// 19. Lossy type change (single→combo drops the audio files) → PadTypeConfirmDialog appears
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import {
  ensureTestAudio,
  goToBoardList,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  createPadAtCell00,
  reloadApp,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
});

// ── Test 16: Tap pad in SETUP → PadEditorPanel opens ─────────────────────────

test('16 — tap pad in SETUP mode → PadEditorPanel opens', async ({ page }) => {
  const padCell = page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();
  await padCell.click();
  await expect(page.getByTestId('pad-editor-panel')).toBeVisible();
});

// ── Test 17: Change pad name → auto-saved ────────────────────────────────────

test('17 — change pad name in editor → persists after page reload', async ({ page }) => {
  // Open editor
  const padCell = page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();
  await padCell.click();
  await page.getByTestId('pad-editor-panel').waitFor();

  // Change the name
  const nameInput = page.getByTestId('pad-editor-panel-name-input');
  await nameInput.fill('Renamed Pad');
  // Wait for auto-save debounce (500ms) + some buffer
  await page.waitForTimeout(800);

  // Reload page and navigate back to the board
  await reloadApp(page);
  await page.getByRole('button', { name: 'BOARD' }).click();
  // Board should still exist
  const boardRow = page.locator('[data-testid^="board-list-screen-row-"]').first();
  await boardRow.waitFor();
  await boardRow.locator('[data-testid^="board-list-screen-name-text-"]').click();
  await page.getByTestId('mode-toggle').waitFor();
  // Re-enter setup mode
  await enterSetupMode(page);

  // The pad cell should show the new name (DOM text; textTransform is CSS-visual only)
  await expect(
    page
      .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
      .first(),
  ).toContainText('Renamed Pad');
});

// ── Test 18: Trivial type change → no dialog ─────────────────────────────────

test('18 — trivial type change (single→loop) → no confirmation dialog', async ({ page }) => {
  // Open editor
  const padCell = page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();
  await padCell.click();
  await page.getByTestId('pad-editor-panel').waitFor();

  // Click LOOP type button (trivial from single)
  await page.getByTestId('pad-editor-panel-type-button-loop').click();

  // No dialog should appear
  await expect(page.getByTestId('pad-type-confirm-dialog')).not.toBeVisible({
    timeout: 1000,
  });
  // Type button should be the selected one (loop)
  await expect(page.getByTestId('pad-editor-panel-type-button-loop')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

// ── Test 19: Lossy type change → PadTypeConfirmDialog appears ────────────────

test('19 — lossy type change → PadTypeConfirmDialog appears', async ({ page }) => {
  const padCell = page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();
  await padCell.click();
  await page.getByTestId('pad-editor-panel').waitFor();

  // single→combo drops the audio files (padMigrationMatrix 'reset', ADR-0048): the dialog appears
  const dialog = page.getByTestId('pad-type-confirm-dialog');
  await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await expect(dialog).toBeVisible();

  // Cancel: the type stays SINGLE
  await page.getByTestId('pad-type-confirm-dialog-cancel-button').click();
  await expect(dialog).not.toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('pad-editor-panel-type-button-single')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Confirm: the pad becomes a COMBO
  await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await page.getByTestId('pad-type-confirm-dialog-switch-button').click();
  await expect(dialog).not.toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('pad-editor-panel-type-button-combo')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
