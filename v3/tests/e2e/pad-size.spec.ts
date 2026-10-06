/**
 * @fileoverview Full E2E — the pads flow into as many columns as the window allows (ADR-0075)
 *
 * Owner decisions 2026-10-06: a row holds as many pads as fit at the board's pad size, so on a
 * phone 4 pads fill a row and a wide window holds many more; the places keep their reading order;
 * nothing is cut off at the right edge, and the grid scrolls downwards. The PAD SIZE slider in the
 * deck rail (SETUP only, stored) sets the size for every deck of the board and All pads, whichever
 * view it is moved in — a larger size, fewer pads per row.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  openDeckRail,
  reopenFirstBoard,
} from './helpers';

const PHONE = { width: 390, height: 844 };
const TABLET = { width: 768, height: 1024 };
const WIDE = { width: 1280, height: 800 };
const NAMES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];

/** A board with a deck holding the six NAMES pads in that order; SETUP, the editor closed. */
async function boardWithSixPads(page: Page) {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  for (const name of NAMES) await addNamedPad(page, name);
  await closePadEditor(page);
}

/** The bounding box of a visible element; fails the test when it has none. */
async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return box;
}

const cells = (page: Page) => page.locator('[data-testid^="pad-grid-cell-"]');
const slider = (page: Page) => page.getByRole('slider', { name: 'PAD SIZE' });

/** How many cells stand in the grid's first row. */
async function columns(page: Page): Promise<number> {
  const boxes = await Promise.all((await cells(page).all()).map(boxOf));
  return boxes.filter((b) => Math.abs(b.y - boxes[0].y) < 1).length;
}

/** The NAMES pads in the order they are seen: row by row, left to right. */
async function seenOrder(page: Page): Promise<string[]> {
  const seen = await Promise.all(
    NAMES.map(async (name) => ({ name, box: await boxOf(page.getByRole('button', { name })) })),
  );
  return seen
    .sort((a, b) => (Math.abs(a.box.y - b.box.y) < 1 ? a.box.x - b.box.x : a.box.y - b.box.y))
    .map((s) => s.name);
}

test('on a phone 4 pads fill a row; a wide window holds more; the order stays', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await boardWithSixPads(page);
  await page.getByRole('button', { name: 'Hide the deck list' }).click();
  await expect.poll(() => columns(page)).toBe(4);
  expect(await seenOrder(page)).toEqual(NAMES);

  await page.setViewportSize(WIDE);
  await expect.poll(() => columns(page)).toBeGreaterThanOrEqual(10);
  expect(await seenOrder(page)).toEqual(NAMES);
  const pad = await boxOf(page.getByRole('button', { name: 'A1' }));
  expect(pad.width).toBeLessThanOrEqual(88.5);
  expect(pad.height).toBeCloseTo(pad.width, 0);
});

/** Nothing is cut off at the right edge, and the first row reaches close to it. */
async function assertRowFillsWidth(page: Page, label: string) {
  const grid = page.getByTestId('pad-grid');
  await expect
    .poll(() => grid.evaluate((g) => g.scrollWidth - g.clientWidth), { message: label })
    .toBeLessThanOrEqual(0);
  const g = await boxOf(grid);
  const all = await Promise.all((await cells(page).all()).map(boxOf));
  for (const c of all) expect(c.x + c.width, label).toBeLessThanOrEqual(g.x + g.width + 0.5);
  // No wide empty strip beside the pads
  const firstRow = all.filter((c) => Math.abs(c.y - all[0].y) < 1);
  const right = Math.max(...firstRow.map((c) => c.x + c.width));
  expect(g.x + g.width - right, label).toBeLessThan(firstRow[0].width);
}

for (const viewport of [PHONE, TABLET, WIDE]) {
  test(`at ${viewport.width}px a row fills the width and nothing is cut off, list open or folded`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await boardWithSixPads(page);
    await assertRowFillsWidth(page, 'list open');
    await page.getByRole('button', { name: 'Hide the deck list' }).click();
    await assertRowFillsWidth(page, 'list folded');
  });
}

test('the PAD SIZE slider sets fewer, larger pads per row; the size is kept', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await boardWithSixPads(page);
  const before = await columns(page);
  await expect(slider(page)).toHaveValue('88');

  await slider(page).focus();
  await page.keyboard.press('End');
  await expect(slider(page)).toHaveValue('160');
  await expect.poll(() => columns(page)).toBeLessThan(before);
  const big = await boxOf(page.getByRole('button', { name: 'A1' }));
  expect(big.width).toBeGreaterThan(88);
  expect(big.width).toBeLessThanOrEqual(160.5);

  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await openDeckRail(page);
  await expect(slider(page)).toHaveValue('160');
});

// Owner decision 2026-10-06: one size for the whole board, whichever deck the slider is moved in
test('the PAD SIZE slider sets the size for every deck and All pads, from any of them', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await boardWithSixPads(page);
  await slider(page).focus();
  await page.keyboard.press('End'); // in Deck 1
  await expect(slider(page)).toHaveValue('160');

  await page.getByTestId('deck-rail-new-button').click();
  await page.getByText('Deck 2', { exact: true }).click();
  await expect(slider(page)).toHaveValue('160');
  expect((await boxOf(cells(page).first())).width).toBeGreaterThan(88);

  await page.getByText('All pads', { exact: true }).click();
  await expect(slider(page)).toHaveValue('160');
  expect((await boxOf(page.getByRole('button', { name: 'A1' }))).width).toBeGreaterThan(88);

  await slider(page).focus();
  await page.keyboard.press('Home'); // in All pads
  await expect(slider(page)).toHaveValue('44');
  await page.getByText('Deck 1', { exact: true }).click();
  await expect(slider(page)).toHaveValue('44');
  expect((await boxOf(page.getByRole('button', { name: 'A1' }))).width).toBeLessThanOrEqual(44.5);
});

test('the PAD SIZE slider is there only in SETUP', async ({ page }) => {
  await boardWithSixPads(page);
  await openDeckRail(page);
  await expect(slider(page)).toBeVisible();
  await enterGameMode(page);
  await expect(slider(page)).toHaveCount(0);
});

test('on a short window the grid scrolls downwards and pads never overlap', async ({ page }) => {
  // 4 rows of phone-sized pads are taller than the grid area at this height
  await page.setViewportSize({ width: 390, height: 400 });
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await page.getByRole('button', { name: 'Hide the deck list' }).click();
  const first = await boxOf(page.locator('[data-pos="0,0"]'));
  const below = await boxOf(page.locator('[data-pos="0,1"]'));
  expect(below.y - first.y, 'the second row starts below the first').toBeGreaterThanOrEqual(
    first.height,
  );
  const grid = page.getByTestId('pad-grid');
  expect(await grid.evaluate((g) => g.scrollHeight - g.clientHeight)).toBeGreaterThan(0);
});
