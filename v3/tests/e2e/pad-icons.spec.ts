/**
 * @fileoverview Full E2E — pad icons: up to 4 per pad from the icon picker (Slice 15d, ADR-0070)
 *
 * The PAD editor's four icon slots (V1's scope): + opens the picker, a search word finds icons by
 * name or search word, a tap picks; a filled slot changes on a tap and is removed on a second tap
 * of its ✕. The pad shows its icons, or its type's placeholder. Everything is checked again after
 * the board is reopened (stored, not only shown). No playback — runs in Chromium and WebKit.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  padCells,
  reopenFirstBoard,
} from './helpers';

/** + → search `word` → tap the icon `key`. */
async function addIcon(page: Page, word: string, key: string) {
  await page.getByTestId('pad-editor-panel-add-icon-button').click();
  await page.getByTestId('icon-picker-search-input').fill(word);
  await page.getByTestId(`icon-picker-icon-button-${key}`).click();
  await expect(page.getByTestId('icon-picker')).toBeHidden();
}

/** The keys in the editor's slots, in order (each slot button carries its key as title). */
const slotKeys = (page: Page) =>
  page
    .locator('[data-testid^="pad-editor-panel-icon-button-"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('title')));

/** How many collection icons the first pad shows (each one an svg with a path). */
const padIconCount = (page: Page) =>
  padCells(page).first().getByTestId('pad-icons').locator('svg path').count();

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addNamedPad(page, 'Icons');
});

test('a pad takes up to 4 icons in the order picked; they show on the pad and are stored', async ({
  page,
}) => {
  await addIcon(page, 'dragon', 'nikoichu:dragon');
  await addIcon(page, 'wind', 'pixelarticons:wind');
  await addIcon(page, 'fire', 'pixelarticons:fire');
  await addIcon(page, 'sword', 'pixelarticons:sword');
  expect(await slotKeys(page)).toEqual([
    'nikoichu:dragon',
    'pixelarticons:wind',
    'pixelarticons:fire',
    'pixelarticons:sword',
  ]);
  await expect(page.getByTestId('pad-editor-panel-add-icon-button')).toBeHidden(); // 4 is the most
  await expect.poll(() => padIconCount(page)).toBe(4);

  // A tap on a filled slot changes that icon
  await page.getByTestId('pad-editor-panel-icon-button-1').click();
  await page.getByTestId('icon-picker-search-input').fill('rain');
  await page.getByTestId('icon-picker-icon-button-nikoichu:rain').click();

  await page.getByTestId('pad-editor-panel-close-button').click();
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await expect.poll(() => padIconCount(page)).toBe(4);
  await padCells(page).first().click();
  expect(await slotKeys(page)).toEqual([
    'nikoichu:dragon',
    'nikoichu:rain',
    'pixelarticons:fire',
    'pixelarticons:sword',
  ]);
});

test('an icon is removed on the second tap of its ✕; without icons the pad shows its placeholder', async ({
  page,
}) => {
  await addIcon(page, 'dragon', 'nikoichu:dragon');
  await expect.poll(() => padIconCount(page)).toBe(1);
  const remove = page.getByTestId('pad-editor-panel-icon-remove-button-0');
  await remove.click();
  await expect(remove).toHaveText('CONFIRM'); // the first tap only asks
  expect(await slotKeys(page)).toHaveLength(1);
  await remove.click();
  expect(await slotKeys(page)).toEqual([]);
  // The placeholder is a UI icon (rects), not a collection icon (one path)
  await expect.poll(() => padIconCount(page)).toBe(0);
  await expect(padCells(page).first().getByTestId('pad-icons').locator('svg')).toHaveCount(1);
});

test('the picker lists categories that open and close, moves by arrow keys, and closes with Escape', async ({
  page,
}) => {
  await page.getByTestId('pad-editor-panel-add-icon-button').click();
  await expect(page.getByTestId('icon-picker-search-input')).toBeFocused();
  const creatures = page.getByTestId('icon-picker-category-button-creatures');
  await expect(creatures).toHaveAttribute('aria-expanded', 'false');
  await creatures.click();
  await expect(creatures).toHaveAttribute('aria-expanded', 'true');
  const first = page.locator('[data-testid^="icon-picker-icon-button-"]').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-testid^="icon-picker-icon-button-"]').nth(1)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('icon-picker')).toBeHidden();
  expect(await slotKeys(page)).toEqual([]); // closing picks nothing
});
