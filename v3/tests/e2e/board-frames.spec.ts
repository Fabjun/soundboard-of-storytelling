/**
 * @fileoverview Full E2E — the narrow and the wide frame of the Board screen (Slice 13a)
 *
 * docs/product/features/adaptive-layout.md L1 / L2 (owner decisions 2026-10-10): below 600 px the
 * bottom bar is the dock and holds PAUSED and STOP ALL (thumb zone), large enough to hit; from
 * 600 px they stay in the top bar. A resize or a rotation switches the frame at once. Needs no
 * playback — runs in WebKit too.
 */

import { test, expect, type Page } from '@playwright/test';
import { createBoardAndNavigate, createDeck, enterSetupMode, goToBoardList } from './helpers';

const stopAll = (page: Page) => page.getByRole('button', { name: 'STOP ALL', exact: true });
const topBar = (page: Page) => page.getByTestId('board-top-bar');
const bottomBar = (page: Page) => page.getByTestId('status-bar');

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
});

test('below 600 px STOP ALL sits in the dock at the bottom, at least 48 px tall', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    bottomBar(page).getByRole('button', { name: 'STOP ALL', exact: true }),
  ).toBeVisible();
  await expect(topBar(page).getByRole('button', { name: 'STOP ALL', exact: true })).toHaveCount(0);
  const box = (await stopAll(page).boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(48);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  expect(box.y).toBeGreaterThan(844 / 2); // in the lower half — the thumb zone
});

test('from 600 px STOP ALL stays in the top bar; the bottom bar shows the board and deck', async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await expect(topBar(page).getByRole('button', { name: 'STOP ALL', exact: true })).toBeVisible();
  await expect(bottomBar(page).getByRole('button', { name: 'STOP ALL', exact: true })).toHaveCount(
    0,
  );
  await expect(bottomBar(page)).toContainText('Deck 1');
});

test('a resize or a rotation moves STOP ALL at once, both ways', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(topBar(page).getByRole('button', { name: 'STOP ALL', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 599, height: 800 });
  await expect(
    bottomBar(page).getByRole('button', { name: 'STOP ALL', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(topBar(page).getByRole('button', { name: 'STOP ALL', exact: true })).toBeVisible();
});

test('in SETUP the dock shows the save status and no STOP ALL', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterSetupMode(page);
  await expect(stopAll(page)).toHaveCount(0);
  await expect(page.getByTestId('status-bar-save-text')).toBeVisible();
});
