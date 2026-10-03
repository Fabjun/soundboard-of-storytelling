// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — combo editor, minimal first version (Slice 11, docs/product/README.md#combos--decided)
//
// - Steps with the pads that start together, the wait and "stop everything first" — kept after
//   a reload
// - A combo is never offered a pad that would make it start itself (no cycles)
// - Removing a pad from a step and removing a step take two taps
//
// No audio needed: pads come from ADD PAD (Chromium and WebKit).
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect, type Page } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, enterSetupMode, reopenFirstBoard } from './helpers';

const padCells = (page: Page) =>
  page.locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])');

/** ADD PAD → (optionally make it a combo while it is still fresh) → name it; returns its id. */
async function addPad(page: Page, name: string, combo = false): Promise<string> {
  const before = await padCells(page).count();
  // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
  await page.getByText('ADD PAD', { exact: true }).click();
  await expect(padCells(page)).toHaveCount(before + 1);
  const testId = (await padCells(page).nth(before).getAttribute('data-testid'))!;
  if (combo) await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await page.getByTestId('pad-editor-panel-name-input').fill(name);
  await expect(page.getByTestId(testId)).toContainText(name);
  return testId.replace('pad-grid-cell-', '');
}

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
  const owl = await addPad(page, 'Owl');
  const rain = await addPad(page, 'Rain');
  const day = await addPad(page, 'Day', true);

  await page.getByTestId('combo-steps-editor-add-button').click();
  await choose(page, 0, 'Owl');
  await choose(page, 0, 'Rain');
  await page.getByTestId('combo-steps-editor-wait-input-0').fill('2.5');
  await page.getByTestId('combo-steps-editor-wait-input-0').blur();
  await page.getByTestId('combo-steps-editor-add-button').click();
  await page.getByTestId('combo-steps-editor-stop-all-input-1').check();
  await page.waitForTimeout(1000); // the editor saves 500 ms after the last change

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
  await addPad(page, 'Owl');
  const a = await addPad(page, 'Dawn', true);
  await addPad(page, 'Dusk', true);

  // Dusk starts Dawn
  await page.getByTestId('combo-steps-editor-add-button').click();
  await choose(page, 0, 'Dawn');
  await page.waitForTimeout(1000);

  // In Dawn, Dusk would close a cycle and Dawn is itself: only Owl is offered
  await page.getByTestId(`pad-grid-cell-${a}`).click();
  await page.getByTestId('combo-steps-editor-add-button').click();
  const options = await page
    .getByTestId('combo-steps-editor-pad-input-0')
    .locator('option')
    .allTextContents();
  expect(options).toEqual(['+ pad…', 'Owl']);
});

test('taking a pad out of a step and removing a step need two taps', async ({ page }) => {
  const owl = await addPad(page, 'Owl');
  await addPad(page, 'Day', true);
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
