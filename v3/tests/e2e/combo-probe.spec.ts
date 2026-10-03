/**
 * @fileoverview PROBE ONLY (branch ci-probe-ubuntu26b, never merged) — the combo test with Tab
 * instead of blur(), to compare both ways of leaving the wait field on ubuntu-26.04 WebKit.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  goToBoardList,
  createBoardAndNavigate,
  enterSetupMode,
  reopenFirstBoard,
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

test('TAB variant: a combo keeps its steps: pads, wait and "stop everything first"', async ({
  page,
}) => {
  const owl = await addNamedPad(page, 'Owl');
  await addNamedPad(page, 'Rain');
  const day = await addNamedPad(page, 'Day', { combo: true });

  await page.getByTestId('combo-steps-editor-add-button').click();
  await choose(page, 0, 'Owl');
  await choose(page, 0, 'Rain');
  await page.getByTestId('combo-steps-editor-wait-input-0').fill('2.5');
  await page.getByTestId('combo-steps-editor-wait-input-0').press('Tab');
  await page.getByTestId('combo-steps-editor-add-button').click();
  await page.getByTestId('combo-steps-editor-stop-all-input-1').check();
  await page.waitForTimeout(1000);

  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await page.getByTestId(`pad-grid-cell-${day}`).click();
  await expect(page.getByTestId(`combo-steps-editor-pad-button-0-${owl}`)).toContainText('Owl');
  await expect(page.getByTestId('combo-steps-editor-wait-input-0')).toHaveValue('2.5');
});
