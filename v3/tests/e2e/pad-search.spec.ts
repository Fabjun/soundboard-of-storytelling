/**
 * @fileoverview Full E2E — search and sort in the current view (Slice 13c)
 *
 * docs/product/README.md#board-decks--quick-access (owner decisions 2026-09-28): search and sort
 * are always there and apply to the current view only — All pads or the current deck; they
 * combine. In a deck they rearrange only for the moment: with the search empty and no sort, the
 * deck shows its saved arrangement again; pads cannot be moved while either is active. A search
 * that finds nothing says so. Needs no playback — runs in WebKit too.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  padCells,
} from './helpers';

const search = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search pads by name', exact: true });
const sortBy = (page: Page) => page.getByRole('combobox', { name: 'Sort pads by', exact: true });
const emptyCells = (page: Page) => page.locator('[data-testid^="pad-grid-cell-empty-slot-"]');

/** The pad names in the order they are seen: row by row, left to right. */
async function seen(page: Page): Promise<string[]> {
  const boxes = await Promise.all(
    (await padCells(page).all()).map(async (c) => ({
      name: (await c.getByRole('button').getAttribute('aria-label')) ?? '',
      box: (await c.boundingBox())!,
    })),
  );
  return boxes
    .sort((a, b) => (Math.abs(a.box.y - b.box.y) < 1 ? a.box.x - b.box.x : a.box.y - b.box.y))
    .map((b) => b.name);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  // Arranged on purpose against the name order
  for (const name of ['Thunder', 'Owl', 'Storm bell', 'Applause']) await addNamedPad(page, name);
  await closePadEditor(page);
});

test('a search in a deck shows only the matching pads; empty again, the deck is back as it was', async ({
  page,
}) => {
  await expect.poll(() => seen(page)).toEqual(['Thunder', 'Owl', 'Storm bell', 'Applause']);
  await search(page).fill('STORM');
  await expect(padCells(page)).toHaveCount(1);
  await expect.poll(() => seen(page)).toEqual(['Storm bell']);
  await search(page).fill('');
  await expect(padCells(page)).toHaveCount(4);
  await expect.poll(() => seen(page)).toEqual(['Thunder', 'Owl', 'Storm bell', 'Applause']);
  await expect(emptyCells(page).first()).toBeVisible(); // the arrangement with its empty cells
});

test('a sort in a deck lasts until it is set back or the view changes; the deck keeps its arrangement', async ({
  page,
}) => {
  await expect(sortBy(page)).toHaveValue(''); // Arrangement
  await sortBy(page).selectOption('name');
  await expect.poll(() => seen(page)).toEqual(['Applause', 'Owl', 'Storm bell', 'Thunder']);
  await page.getByRole('button', { name: 'Reverse the order', exact: true }).click();
  await expect.poll(() => seen(page)).toEqual(['Thunder', 'Storm bell', 'Owl', 'Applause']);
  await sortBy(page).selectOption('');
  await expect.poll(() => seen(page)).toEqual(['Thunder', 'Owl', 'Storm bell', 'Applause']);
  // Another view and back: the sort is gone
  await sortBy(page).selectOption('name');
  await page.getByText('All pads', { exact: true }).click();
  await page.getByText('Deck 1', { exact: true }).click();
  await expect(sortBy(page)).toHaveValue('');
  await expect.poll(() => seen(page)).toEqual(['Thunder', 'Owl', 'Storm bell', 'Applause']);
});

test('while a search or sort is active in SETUP, the deck shows no empty cells to fill', async ({
  page,
}) => {
  await expect(emptyCells(page).first()).toBeVisible();
  await search(page).fill('o'); // Owl, Storm bell
  await expect(padCells(page)).toHaveCount(2);
  await expect(emptyCells(page)).toHaveCount(0);
  await search(page).fill('');
  await sortBy(page).selectOption('name');
  await expect(padCells(page)).toHaveCount(4);
  await expect(emptyCells(page)).toHaveCount(0);
});

test('a search belongs to its view: another view starts without it', async ({ page }) => {
  await search(page).fill('owl');
  await expect(padCells(page)).toHaveCount(1);
  await page.getByText('All pads', { exact: true }).click();
  await expect(search(page)).toHaveValue('');
  await expect(padCells(page)).toHaveCount(4);
  await page.getByText('Deck 1', { exact: true }).click();
  await expect(search(page)).toHaveValue('');
  await expect(padCells(page)).toHaveCount(4);
});

test('on a phone the search field keeps room to type in next to the sort', async ({ page }) => {
  // Found in the screenshot review: the sort choice took the whole bar, the field was a sliver
  await page.setViewportSize({ width: 390, height: 844 });
  const field = (await search(page).boundingBox())!;
  const sort = (await sortBy(page).boundingBox())!;
  expect(field.width).toBeGreaterThanOrEqual(140);
  expect(sort.width).toBeLessThanOrEqual(field.width);
});

test('a search finds pads in All pads and says so when nothing matches', async ({ page }) => {
  await page.getByText('All pads', { exact: true }).click();
  await search(page).fill('owl');
  // The view updates after the input event — wait for it, never read the grid at once
  await expect.poll(() => seen(page)).toEqual(['Owl']);
  await search(page).fill('xyzzy');
  await expect(
    page.getByText('No pad here has "xyzzy" in its name.', { exact: true }),
  ).toBeVisible();
  await expect(padCells(page)).toHaveCount(0);
});
