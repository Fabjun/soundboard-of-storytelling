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

const editor = (page: Page) => page.getByRole('dialog', { name: 'Pad editor', exact: true });
const picker = (page: Page) => page.getByRole('dialog', { name: 'Choose an icon', exact: true });

/** + → search `word` → tap the icon `key` (a test ID: the key is shown nowhere — pad-icons.spec.ts). */
async function addIcon(page: Page, word: string, key: string) {
  await editor(page).getByRole('button', { name: 'Add an icon', exact: true }).click();
  await picker(page)
    .getByRole('searchbox', { name: 'Search icons by name or word', exact: true })
    .fill(word);
  await picker(page).getByTestId(`icon-picker-icon-button-${key}`).click();
  await expect(picker(page)).toBeHidden();
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
  await editor(page).getByRole('button', { name: 'SAVE', exact: true }).click(); // a draft until SAVE (ADR-0084)

  await addNamedPad(page, 'Wind');
  await page
    .getByRole('group', { name: 'TYPE', exact: true })
    .getByRole('button', { name: 'LOOP', exact: true })
    .click(); // no question: no file yet
  await editor(page).getByRole('button', { name: 'SAVE', exact: true }).click();

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
  await expect(editor(page)).toBeVisible();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('pad-editor.png', { fullPage: false });
});
