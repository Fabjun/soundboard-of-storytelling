/**
 * @fileoverview Full E2E — pads on the board grid are squares of at most one standard size
 *
 * Owner decision 2026-10-05: a pad is a square of the standard size (`--pad-size`) instead of
 * stretching to the panel. On a wide window every pad has exactly that size; on a narrow one the
 * columns shrink and the pads with them, staying square — none is cut off at the right edge (found
 * by the owner on a phone). On a short window they shrink further, so the whole grid is seen (down
 * to the 44px touch target; below that the grid scrolls). The rows keep the height of their pads,
 * so pads never overlap.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, createDeck, enterSetupMode } from './helpers';

const WIDE = { width: 1280, height: 800 };
const SHORT = { width: 1280, height: 400 };
const VERY_SHORT = { width: 1280, height: 300 };
const PHONE = { width: 390, height: 844 };

/** A board with a deck and `count` pads, in SETUP; createDeck unfolds the deck list. */
async function boardWithPads(page: Page, count: number) {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  for (let i = 0; i < count; i++) {
    // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
    await page.getByText('ADD PAD', { exact: true }).click();
    await page.getByTestId('pad-editor-panel-close-button').click();
  }
}

/** The bounding box of a visible element; fails the test when it has none. */
async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return box;
}

/** The standard pad size in pixels: the token is in rem, so it is measured, not parsed. */
function padSizePx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.width = 'var(--pad-size)';
    document.body.appendChild(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
  });
}

const firstPadCell = (page: Page) =>
  page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();

test('on a wide window every pad is a square of the standard size', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await boardWithPads(page, 1);
  const size = await padSizePx(page);
  expect(size).toBeGreaterThan(44);
  const box = await boxOf(firstPadCell(page));
  expect(box.width).toBeCloseTo(size, 0);
  expect(box.height).toBeCloseTo(size, 0);
});

test('on a phone with the deck list folded, the pads are touch-sized squares inside the window', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await boardWithPads(page, 1);
  await page.getByTestId('deck-rail-toggle-button').click();
  const size = await padSizePx(page);
  // The pads grow once the grid has measured its new width (ResizeObserver, a frame later) — wait
  // for that instead of measuring the frame before it (CI 2026-10-05: 30.5px, the open-list size)
  await expect.poll(async () => (await boxOf(firstPadCell(page))).width).toBeGreaterThanOrEqual(44);
  const box = await boxOf(firstPadCell(page));
  expect(box.width).toBeLessThanOrEqual(size);
  expect(box.height).toBeCloseTo(box.width, 0);
  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflowX).toBe(0);
});

test('with the deck list open on a phone, no pad is cut off at the right edge', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await boardWithPads(page, 4);
  const grid = page.getByTestId('pad-grid');
  const g = await boxOf(grid);
  // The cells, their pads and the empty slots: each is a button, and each must stay inside
  const cells = page.locator(
    '[data-testid^="pad-grid-cell-"], [data-testid^="pad-grid-cell-"] > [role="button"]',
  );
  const n = await cells.count();
  for (let i = 0; i < n; i++) {
    const b = await boxOf(cells.nth(i));
    expect(b.x + b.width, `cell ${i} ends inside the grid`).toBeLessThanOrEqual(
      g.x + g.width + 0.5,
    );
    expect(b.height, `cell ${i} is square`).toBeCloseTo(b.width, 0);
  }
  const overflowX = await grid.evaluate((e) => e.scrollWidth - e.clientWidth);
  expect(overflowX).toBeLessThanOrEqual(0);
});

test('on a short window the pads shrink so the whole grid is seen without scrolling', async ({
  page,
}) => {
  await page.setViewportSize(SHORT);
  await boardWithPads(page, 13);
  const size = await padSizePx(page);
  const box = await boxOf(firstPadCell(page));
  expect(box.width).toBeLessThan(size);
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeCloseTo(box.width, 0);
  const grid = page.getByTestId('pad-grid');
  expect(await grid.evaluate((g) => g.scrollHeight - g.clientHeight)).toBeLessThanOrEqual(0);
});

test('on a very short window the pads stop at the touch size, never overlap, and the grid scrolls', async ({
  page,
}) => {
  await page.setViewportSize(VERY_SHORT);
  await boardWithPads(page, 13);
  expect((await boxOf(firstPadCell(page))).width).toBeCloseTo(44, 0);
  const first = await boxOf(page.locator('[data-pos="0,0"]'));
  const below = await boxOf(page.locator('[data-pos="0,1"]'));
  expect(below.y - first.y, 'the second row starts below the first pad').toBeGreaterThanOrEqual(
    first.height,
  );
  const grid = page.getByTestId('pad-grid');
  expect(await grid.evaluate((g) => g.scrollHeight - g.clientHeight)).toBeGreaterThan(0);
});
