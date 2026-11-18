/**
 * @fileoverview Full E2E — a pad's light (docs/product/features/light.md G3, C1, C4; ADR-0091)
 *
 * The PAD editor has two tabs, SOUND and LIGHT (WAI-ARIA tabs: arrow keys choose). In LIGHT a pad
 * names a preset of the lamps; TRY sends it at once, and the pad sends it whenever it starts in
 * GAME. A lamp that does not answer shows LIGHT ✕ in the status bar until a pad reaches it again
 * (C6). A combo has no light of its own. An effect (C1 B) is chosen from the effects the lamp
 * lists, with its color, speed, intensity and brightness; a lamp that lists none leaves the effect's
 * number to type. Playwright stands in for the lamp at its address and records what it receives.
 * Playback starts the pad — Chromium only (headless WebKit cannot decode audio).
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

/** A lamp that refuses every call until `answer()` — then it answers as WLED does. */
async function lampThatStartsOff(page: Page): Promise<{ answer: () => void }> {
  let answering = false;
  await page.route(`${LAMP}/json/state`, (route) => {
    if (!answering) return route.abort('connectionrefused');
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
  return { answer: () => (answering = true) };
}

test('a lamp that does not answer shows LIGHT ✕ until a pad reaches it again (C6)', async ({
  page,
}) => {
  const lamp = await lampThatStartsOff(page);
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page
    .getByRole('tabpanel', { name: 'LIGHT', exact: true })
    .getByText('Preset', { exact: true })
    .click();
  await page.getByRole('spinbutton', { name: 'Preset number', exact: true }).fill('5');
  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByTestId('pad-editor-panel-close-button').click();
  await enterGameMode(page);

  const light = page.getByTestId('status-bar-light-text');
  await expect(light).toHaveText('');
  const pad = padCells(page).first().getByRole('button');
  await pad.click();
  await expect(light.getByText('LIGHT', { exact: true })).toBeVisible();
  // Read out in plain words: what happened and where to look
  await expect(light).toContainText('A lamp did not answer. Settings → LIGHT → TEST says why.');

  lamp.answer();
  // The one-second sound has ended
  await expect(padCells(page).first().getByRole('button', { pressed: true })).toHaveCount(0);
  await pad.click();
  await expect(light).toHaveText('');
});

/** The lamp's effect list at /json/eff, as WLED answers it (an index is an id; RSVD is left out). */
async function lampEffects(page: Page, names: string[] | null): Promise<void> {
  await page.route(`${LAMP}/json/eff`, (route) =>
    names === null
      ? route.abort('connectionrefused')
      : route.fulfill({
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify(names),
        }),
  );
}

test('LIGHT sets an effect from the list of the lamp, with its color and speed; the pad sends it when it plays', async ({
  page,
}) => {
  const bodies = await standInLamp(page);
  await lampEffects(page, ['Solid', 'Blink', 'RSVD', 'Fire 2012']);
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page.getByText('Effect', { exact: true }).click();
  const effect = page.getByRole('combobox', { name: 'Effect', exact: true });
  await expect(effect.getByRole('option')).toHaveText(['Solid', 'Blink', 'Fire 2012']);
  await effect.selectOption({ label: 'Fire 2012' });
  await page.getByRole('slider', { name: 'SPEED', exact: true }).fill('40');
  await page.getByLabel('Color', { exact: true }).fill('#00ff80');
  await page.getByRole('button', { name: 'TRY', exact: true }).click();
  await expect(page.getByText('Connected.', { exact: true })).toBeVisible();
  const sent = '{"on":true,"bri":128,"seg":{"fx":3,"sx":40,"ix":128,"col":[[0,255,128]]}}';
  expect(bodies).toEqual([sent]);

  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByTestId('pad-editor-panel-close-button').click();
  await enterGameMode(page);
  await padCells(page).first().getByRole('button').click();
  await expect.poll(() => bodies).toEqual([sent, sent]);
});

test('a lamp that lists no effects leaves the effect number to type', async ({ page }) => {
  const bodies = await standInLamp(page);
  await lampEffects(page, null);
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page.getByText('Effect', { exact: true }).click();
  await expect(page.getByText(/This browser does not let the app reach the lamp/)).toBeVisible();
  const number = page.getByRole('spinbutton', { name: 'Effect number', exact: true });
  await number.fill('66');
  await number.press('Enter');
  await page.getByRole('button', { name: 'TRY', exact: true }).click();
  await expect
    .poll(() => bodies)
    .toEqual(['{"on":true,"bri":128,"seg":{"fx":66,"sx":128,"ix":128,"col":[[255,138,31]]}}']);
});

test('a combo has no light of its own', async ({ page }) => {
  await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'SWITCH', exact: true }).click();
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await expect(page.getByText(/A combo has no light of its own/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'TRY', exact: true })).toHaveCount(0);
});
