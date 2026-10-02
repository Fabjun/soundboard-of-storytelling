// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — every control can be reached on a short window
//
// Content that does not fit scrolls; nothing is cut off or hidden under another bar
// (WCAG 2.2 SC 1.4.10 Reflow: no "loss of information or functionality"). Found 2026-10-02: the
// deck grid of an imported 8-row deck had no scrolling — its last row slid under the ADD PAD
// bar and could not be reached.
//
// Scrolled the way a person scrolls — the mouse wheel over the area — and then each control must
// be WHOLLY visible (ratio 1; clipping by a parent counts). Two weaker versions of this test
// stayed green against the bug: a click only needs the centre visible, and Playwright's
// scrollIntoView also scrolls an `overflow: hidden` box that no person can scroll.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, createDeck, enterSetupMode } from './helpers';

// Four rows of pads (80 px each) do not fit: without scrolling, the fourth row is cut off by
// 30 px (measured). At 480 px they still fitted, and empty cells (56 px) fit even at 400.
const SHORT = { width: 1280, height: 400 };

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(SHORT);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
});

test('the last grid cell can be reached and tapped on a short window', async ({ page }) => {
  // 13 pads: rows 1–3 full, one pad in row 4 — the last pad and the last empty cell sit in row 4
  for (let i = 0; i < 13; i++) {
    // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
    await page.getByText('ADD PAD', { exact: true }).click();
    await page.getByTestId('pad-editor-panel-close-button').click();
  }
  const pads = page.locator(
    '[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])',
  );
  await expect(pads).toHaveCount(13);
  const grid = page.getByTestId('pad-grid');
  const overflow = await grid.evaluate((g) => g.scrollHeight - g.clientHeight);
  expect(overflow, 'the window must be short enough that the grid does not fit').toBeGreaterThan(0);

  await grid.hover();
  await page.mouse.wheel(0, 2000);
  await expect(pads.last()).toBeInViewport({ ratio: 1 });
  await pads.last().click();
  await expect(page.getByTestId('pad-editor-panel')).toBeVisible();
  await page.getByTestId('pad-editor-panel-close-button').click();

  const lastCell = page.locator('[data-testid^="pad-grid-cell-empty-slot-"]').last();
  await grid.hover();
  await page.mouse.wheel(0, 2000);
  await expect(lastCell).toBeInViewport({ ratio: 1 });
  await lastCell.click();
  await expect(page.getByTestId('pad-creation-popover')).toBeVisible();
});

test("the pad editor's delete button can be reached on a short window", async ({ page }) => {
  // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
  await page.getByText('ADD PAD', { exact: true }).click();
  const remove = page.getByTestId('pad-editor-panel-delete-button');
  await page.getByTestId('pad-editor-panel').hover();
  await page.mouse.wheel(0, 2000);
  await expect(remove).toBeInViewport({ ratio: 1 });
  await remove.click();
  await expect(remove).toContainText('CONFIRM DELETE');
});
