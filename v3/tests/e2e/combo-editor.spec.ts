/**
 * @fileoverview Full E2E — combo editor, minimal first version (Slice 11, docs/product/README.md#combos--decided)
 *
 * - Steps with the pads that start together, the wait and "stop everything first" — kept after
 *   a reload
 * - A combo is never offered a pad that would make it start itself (no cycles)
 * - Removing a pad from a step and removing a step take two taps
 *
 * No audio needed: pads come from ADD PAD (Chromium and WebKit).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  goToBoardList,
  createBoardAndNavigate,
  enterSetupMode,
  reopenFirstBoard,
  waitForSaves,
} from './helpers';

const choose = (page: Page, step: number, label: string) =>
  page.getByTestId(`combo-steps-editor-pad-input-${step}`).selectOption({ label });

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await page.getByTestId('deck-rail-new-button').click();
  await enterSetupMode(page);
});

test('a combo keeps its steps: pads, wait and "stop everything first"', async ({ page }) => {
  const owl = await addNamedPad(page, 'Owl');
  const rain = await addNamedPad(page, 'Rain');
  const day = await addNamedPad(page, 'Day', { combo: true });

  await page.getByTestId('combo-steps-editor-add-button').click();
  await choose(page, 0, 'Owl');
  await choose(page, 0, 'Rain');
  await page.getByTestId('combo-steps-editor-wait-input-0').fill('2.5');
  await page.getByTestId('combo-steps-editor-wait-input-0').blur();
  await page.getByTestId('combo-steps-editor-add-button').click();
  await page.getByTestId('combo-steps-editor-stop-all-input-1').check();

  // reopenFirstBoard waits for the saves, the waiting auto-save included — a fixed wait of 1 s
  // was too short on ubuntu-26.04 runners, 1 run in 3 (2026-10-04)
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await page.getByTestId(`pad-grid-cell-${day}`).click();
  await expect(page.getByTestId(`combo-steps-editor-pad-button-0-${owl}`)).toContainText('Owl');
  await expect(page.getByTestId(`combo-steps-editor-pad-button-0-${rain}`)).toContainText('Rain');
  await expect(page.getByTestId('combo-steps-editor-wait-input-0')).toHaveValue('2.5');
  await expect(page.getByTestId('combo-steps-editor-stop-all-input-1')).toBeChecked();
  await expect(page.getByTestId('combo-steps-editor-stop-all-input-0')).not.toBeChecked();
});

test('a combo is never offered itself or a combo that starts it', async ({ page }) => {
  await addNamedPad(page, 'Owl');
  const a = await addNamedPad(page, 'Dawn', { combo: true });
  await addNamedPad(page, 'Dusk', { combo: true });

  // Dusk starts Dawn
  await page.getByTestId('combo-steps-editor-add-button').click();
  await choose(page, 0, 'Dawn');
  await waitForSaves(page);

  // In Dawn, Dusk would close a cycle and Dawn is itself: only Owl is offered
  await closePadEditor(page);
  await page.getByTestId(`pad-grid-cell-${a}`).click();
  await page.getByTestId('combo-steps-editor-add-button').click();
  const options = await page
    .getByTestId('combo-steps-editor-pad-input-0')
    .locator('option')
    .allTextContents();
  expect(options).toEqual(['+ pad…', 'Owl']);
});

test('taking a pad out of a step and removing a step need two taps', async ({ page }) => {
  const owl = await addNamedPad(page, 'Owl');
  await addNamedPad(page, 'Day', { combo: true });
  await page.getByTestId('combo-steps-editor-add-button').click();
  await choose(page, 0, 'Owl');

  const chip = page.getByTestId(`combo-steps-editor-pad-button-0-${owl}`);
  await chip.click();
  await expect(chip).toContainText('tap again to remove');
  await chip.click();
  await expect(chip).toHaveCount(0);

  const remove = page.getByTestId('combo-steps-editor-remove-button-0');
  await remove.click();
  await expect(remove).toHaveText('CONFIRM REMOVE');
  await expect(page.getByTestId('combo-steps-editor-step-item-0')).toBeVisible();
  await remove.click();
  await expect(page.getByTestId('combo-steps-editor-step-item-0')).toHaveCount(0);
});
