/**
 * @fileoverview Full E2E — the PAD editor covers the whole window, the board's top bar included
 *
 * Owner decision 2026-10-05: tapping a pad in SETUP opens the PAD editor full screen, on every
 * screen size. It is a modal dialog (WAI-ARIA APG): the board behind cannot be used, Escape closes
 * it — but first closes the icon list when that is open on top — and focus goes back to the pad.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
} from './helpers';

const editor = (page: Page) => page.getByRole('dialog', { name: 'Pad editor' });

/** A board with two pads, the editor closed; returns the first pad's button. */
async function boardWithTwoPads(page: Page) {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addNamedPad(page, 'Owl');
  await addNamedPad(page, 'Rain');
  await closePadEditor(page);
  return page.getByRole('button', { name: 'Owl' });
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`at ${viewport.width}px the editor covers the whole window, top bar included`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const owl = await boardWithTwoPads(page);
    await owl.click();
    await expect(editor(page)).toBeVisible();
    const box = await editor(page).boundingBox();
    expect(box).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    // What is on top at the mode switch is the editor, not the board's top bar
    const toggle = await page.getByTestId('mode-toggle').boundingBox();
    const onTop = await page.evaluate(
      ([x, y]) => !!document.elementFromPoint(x, y)?.closest('[role="dialog"]'),
      [toggle!.x + toggle!.width / 2, toggle!.y + toggle!.height / 2],
    );
    expect(onTop).toBe(true);
  });
}

test('the board behind the editor cannot be used, by pointer or by Tab', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const owl = await boardWithTwoPads(page);
  const rain = await page.getByRole('button', { name: 'Rain' }).boundingBox();
  await owl.click();
  await expect(page.getByTestId('pad-editor-panel-name-input')).toHaveValue('Owl');

  // A tap where the other pad was lands in the editor: it still edits Owl
  await page.mouse.click(rain!.x + rain!.width / 2, rain!.y + rain!.height / 2);
  await expect(page.getByTestId('pad-editor-panel-name-input')).toHaveValue('Owl');

  // Tab never leaves the editor
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () =>
        !!document.activeElement?.closest('[role="dialog"]') ||
        document.activeElement === document.body,
    );
    expect(inside, `Tab ${i + 1} stays in the editor`).toBe(true);
  }
});

test('Escape closes the editor and focus goes back to the pad', async ({ page }) => {
  const owl = await boardWithTwoPads(page);
  await owl.focus();
  await page.keyboard.press('Enter');
  await expect(editor(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor(page)).toBeHidden();
  await expect(owl).toBeFocused();
});

test('Escape in the icon list closes only the icon list', async ({ page }) => {
  const owl = await boardWithTwoPads(page);
  await owl.click();
  await page.getByRole('button', { name: /add an icon/i }).click();
  const picker = page.getByRole('dialog', { name: 'Choose an icon' });
  await expect(picker).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
  await expect(editor(page)).toBeVisible();
});
