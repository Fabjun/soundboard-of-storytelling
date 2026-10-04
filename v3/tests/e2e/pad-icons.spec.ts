/**
 * @fileoverview Full E2E — pad icons: up to 4 per pad from the icon picker (Slice 15d, ADR-0070)
 *
 * The PAD editor's four icon slots (V1's scope): + opens the picker, a search word finds icons by
 * name or search word, a tap picks; a filled slot changes on a tap and is removed on a second tap
 * of its ✕. The pad shows its icons, or its type's placeholder. Everything is checked again after
 * the board is reopened (stored, not only shown). No playback — runs in Chromium and WebKit.
 */

import { readFileSync } from 'node:fs';
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

/** How many of its own icons the first pad shows (each one an svg with a path), not counting a placeholder. */
const padIconCount = (page: Page) =>
  padCells(page).first().locator('[data-testid="pad-icons"]:not(.is-placeholder) svg path').count();

/** The drawing of each pad type's placeholder, as the build wrote it. */
const PLACEHOLDERS = JSON.parse(
  readFileSync(new URL('../../src/icons/placeholders.json', import.meta.url), 'utf8'),
) as Record<string, { d: string }>;

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
  // No own icon left: the pad draws its type's placeholder (a Single: the circle)
  await expect.poll(() => padIconCount(page)).toBe(0);
  await expect(
    padCells(page).first().locator('[data-testid="pad-icons"].is-placeholder svg path'),
  ).toHaveAttribute('d', PLACEHOLDERS.single.d);
});

test('a short search lists every match but draws only the visible rows; arrow keys reach the rows below', async ({
  page,
}) => {
  // Phone width: few columns, so the arrow keys soon reach rows that are not drawn yet (on a wide
  // window the keys that came before a row was drawn got lost only here — WebKit, 2026-10-04)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('pad-editor-panel-add-icon-button').click();
  await page.getByTestId('icon-picker-search-input').fill('a');
  const countText = await page.getByTestId('icon-picker-result-count-text').innerText();
  const count = Number(/^(\d+) icons match/.exec(countText)?.[1]);
  expect(count, countText).toBeGreaterThan(1000); // one letter matches most of the collection

  const grid = page.getByRole('grid', { name: 'Search results' });
  const cols = Number(await grid.getAttribute('aria-colcount'));
  await expect(grid).toHaveAttribute('aria-rowcount', String(Math.ceil(count / cols)));
  const rows = grid.getByRole('row');
  const drawnRows = await rows.count();
  expect(drawnRows * cols).toBeLessThan(count); // the rows below are not drawn

  // Down past the last drawn row: the focus arrives there, and that row is drawn now
  await page.locator('[data-testid^="icon-picker-icon-button-"]').first().focus();
  for (let i = 0; i < drawnRows + 5; i++) await page.keyboard.press('ArrowDown');
  const focusedRow = page.locator(':focus').locator('xpath=ancestor::*[@role="row"]');
  await expect(focusedRow).toHaveAttribute('aria-rowindex', String(drawnRows + 6));

  // Keys typed faster than the rows are drawn (here: five in one go, before any row is drawn)
  // each move on from the last one, none is lost
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    }
  });
  await expect(focusedRow).toHaveAttribute('aria-rowindex', String(drawnRows + 11));
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
