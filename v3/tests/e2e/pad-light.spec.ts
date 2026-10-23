/**
 * @fileoverview Full E2E — a pad's light (docs/product/features/light.md G3, C1, C4; ADR-0091)
 *
 * The PAD editor has two tabs, SOUND and LIGHT (WAI-ARIA tabs: arrow keys choose). In LIGHT a pad
 * names a preset of the lamps; TRY sends it at once, and the pad sends it whenever it starts in
 * GAME. A combo has no light of its own. Playwright stands in for the lamp at its address and
 * records what it receives. Playback starts the pad — Chromium only (headless WebKit cannot decode
 * audio).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  createPadAtCell00,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  openMainMenu,
  padCells,
  uploadTestAudio,
  waitForSaves,
} from './helpers';

const LAMP = 'http://192.168.1.50';

/** The bodies the lamp received at /json/state, as WLED answers (CORS for every origin). */
async function standInLamp(page: Page): Promise<string[]> {
  const bodies: string[] = [];
  await page.route(`${LAMP}/json/state`, (route) => {
    if (route.request().method() === 'POST') bodies.push(route.request().postData() ?? '');
    return route.fulfill({
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'application/json',
      },
      body: '{"success":true}',
    });
  });
  return bodies;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await uploadTestAudio(page);
  // A lamp in Settings → LIGHT
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await page.getByRole('textbox', { name: 'Lamp name', exact: true }).fill('Floor lamp');
  await page.getByRole('textbox', { name: 'Lamp address', exact: true }).fill('192.168.1.50');
  await page.getByRole('button', { name: 'ADD LAMP', exact: true }).click();
  await expect(page.getByText('192.168.1.50', { exact: true })).toBeVisible();
  await waitForSaves(page); // the lamp is written before the page goes
  // A board with one pad, its editor open
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page); // through TAP TO START, which unlocks the audio
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
  await padCells(page).first().click();
});

test('LIGHT names a preset; TRY sends it, and the pad sends it when it plays', async ({ page }) => {
  const bodies = await standInLamp(page);
  const sound = page.getByRole('tab', { name: 'SOUND', exact: true });
  await expect(sound).toHaveAttribute('aria-selected', 'true');
  // WAI-ARIA tabs: the arrow key chooses the next tab
  await sound.focus();
  await page.keyboard.press('ArrowRight');
  const light = page.getByRole('tab', { name: 'LIGHT', exact: true });
  await expect(light).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'LIGHT', exact: true })).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'SOUND', exact: true })).toBeHidden();

  // A radio group by keyboard (WAI-ARIA APG): the arrow key moves the choice from None to Preset
  await page.getByRole('radio', { name: 'None', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Preset', exact: true })).toBeChecked();
  const preset = page.getByRole('spinbutton', { name: 'Preset number', exact: true });
  await preset.fill('5');
  await preset.press('Enter');
  await page.getByRole('button', { name: 'TRY', exact: true }).click();
  await expect(page.getByText('Connected.', { exact: true })).toBeVisible();
  expect(bodies).toEqual(['{"ps":5}']);

  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByTestId('pad-editor-panel-close-button').click();
  await enterGameMode(page);
  await padCells(page).first().getByRole('button').click();
  await expect.poll(() => bodies).toEqual(['{"ps":5}', '{"ps":5}']);
});

test('a combo has no light of its own', async ({ page }) => {
  await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'SWITCH', exact: true }).click();
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await expect(page.getByText(/A combo has no light of its own/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'TRY', exact: true })).toHaveCount(0);
});
