// ─────────────────────────────────────────────────────────────────────────────
// Mobile E2E — Board Flow (Playwright WebKit, iPhone 13 Pro profile)
//
// SCOPE: Verifies that creating a board and navigating into it works via
// touch events on a 390×844 viewport.
//
//   A. NEW BOARD tap → board row appears
//   B. Board row title tap → BoardScreen loads (mode-toggle visible)
//   C. Back button tap → returns to BoardListScreen
//
// OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
//   File upload, audio output, Ringer Switch, backgrounding.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { goToBoardList } from '../helpers';

test('A+B — NEW BOARD tap creates board; row title tap opens BoardScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);

  // Create board via tap
  await page.getByTestId('new-board-button').tap();

  // Board row appears in the list
  const boardRow = page.locator('[data-testid^="board-row-"]').first();
  await boardRow.waitFor();

  // Tap the row title to open the board (action buttons stop propagation)
  await boardRow.locator('[data-testid^="board-row-title-"]').tap();

  // BoardScreen is active — ModeToggle always present
  await expect(page.getByTestId('mode-toggle')).toBeVisible();
});

test('C — Back button tap from BoardScreen returns to BoardListScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);

  // Setup: create and enter a board
  await page.getByTestId('new-board-button').tap();
  const boardRow = page.locator('[data-testid^="board-row-"]').first();
  await boardRow.waitFor();
  await boardRow.locator('[data-testid^="board-row-title-"]').tap();
  await page.getByTestId('mode-toggle').waitFor();

  // Tap back
  await page.getByTestId('board-back-button').tap();

  // We're back on BoardListScreen
  await expect(page.getByTestId('new-board-button')).toBeVisible();
});
