/**
 * @fileoverview Visual regression — pads on the board and the PAD editor (BACKLOG "Visual
 * baselines without pads")
 *
 * The other visual specs show no pad, so the pad's picture area (own icons, the type's
 * placeholder), its type colors and the PAD editor were not compared. Three pads, one per type: a
 * Single with two icons, a Loop and a Combo with their placeholders. Compared against the macOS
 * baseline (CLAUDE.md workflow rule 10); stableScreenshot (helpers.ts) first turns motion off and
 * waits for the fonts.
 */

import { test, expect, type Page } from '@playwright/test';
import { stableScreenshot } from './helpers';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  padCells,
} from '../helpers';

/** + → search `word` → tap the icon `key`. */
async function addIcon(page: Page, word: string, key: string) {
  await page.getByTestId('pad-editor-panel-add-icon-button').click();
  await page.getByTestId('icon-picker-search-input').fill(word);
  await page.getByTestId(`icon-picker-icon-button-${key}`).click();
  await expect(page.getByTestId('icon-picker')).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);

  await addNamedPad(page, 'Dragon');
  await addIcon(page, 'dragon', 'nikoichu:dragon');
  await addIcon(page, 'fire', 'pixelarticons:fire');
  await page.getByTestId('pad-editor-panel-save-button').click(); // a draft until SAVE (ADR-0084)

  await addNamedPad(page, 'Wind');
  await page.getByTestId('pad-editor-panel-type-button-loop').click(); // no question: no file yet
  await page.getByTestId('pad-editor-panel-save-button').click();

  await addNamedPad(page, 'Nightfall', { combo: true });
  await closePadEditor(page);
  await expect(padCells(page)).toHaveCount(3);
});

test('pads of each type — own icons and the placeholders of Loop and Combo', async ({ page }) => {
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('board-pads.png', { fullPage: false });
});

test('the PAD editor of a Single with two icons', async ({ page }) => {
  await padCells(page).first().click();
  await expect(page.getByTestId('pad-editor-panel')).toBeVisible();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('pad-editor.png', { fullPage: false });
});
