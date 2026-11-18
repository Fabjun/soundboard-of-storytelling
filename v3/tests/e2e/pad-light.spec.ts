/**
 * @fileoverview Full E2E — a pad's light (docs/product/features/light.md G3, C1, C4; ADR-0091)
 *
 * The PAD editor has two tabs, SOUND and LIGHT (WAI-ARIA tabs: arrow keys choose). In LIGHT a pad
 * names a preset of the lamps; TRY sends it at once, and the pad sends it whenever it starts in
 * GAME. A lamp that does not answer shows LIGHT ✕ in the status bar until a pad reaches it again
 * (C6). A combo has no light of its own. An effect (C1 B) is chosen from the effects the lamp
 * lists, with its color, speed, intensity and brightness; a lamp that lists none leaves the effect's
 * number to type. A pad played from the quick-access bar sends its light as from the grid (the
 * audio bridge starts it for every pad). Playwright stands in for the lamp at its address and
 * records what it receives.
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
  openDeckRail,
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

test("a number typed while the lamp's effects are read is kept when the answer comes", async ({
  page,
}) => {
  const bodies = await standInLamp(page);
  // The lamp answers only when told to, so the answer comes between the typing and the Enter
  let answer: () => void = () => {};
  const answered = new Promise<void>((resolve) => (answer = resolve));
  await page.route(`${LAMP}/json/eff`, async (route) => {
    await answered;
    await route.abort('connectionrefused');
  });
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page.getByText('Effect', { exact: true }).click();
  await expect(page.getByText('Reading the effects from the lamp…', { exact: true })).toBeVisible();
  const number = page.getByRole('spinbutton', { name: 'Effect number', exact: true });
  await number.fill('57');
  answer(); // the panel draws again with the lamp's answer
  await expect(page.getByText(/This browser does not let the app reach the lamp/)).toBeVisible();
  await expect(number).toHaveValue('57');
  await number.press('Enter');
  await page.getByRole('button', { name: 'TRY', exact: true }).click();
  await expect
    .poll(() => bodies)
    .toEqual(['{"on":true,"bri":128,"seg":{"fx":57,"sx":128,"ix":128,"col":[[255,138,31]]}}']);
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

/**
 * Moves the simulated clock `count` steps of `ms`, waiting for each step's call to reach the lamp —
 * one long jump would also run out each call's 1 s time limit before the stand-in lamp takes it.
 */
async function clockSteps(page: Page, bodies: string[], count: number, ms: number) {
  for (let i = 0; i < count; i++) {
    const before = bodies.length;
    await page.clock.runFor(ms);
    await expect.poll(() => bodies.length).toBeGreaterThan(before);
  }
}

test('a course goes from its start to its end light: TRY in 10 s, the pad over its minutes, the status bar counts them', async ({
  page,
}) => {
  // The course's timer starts after this, on the simulated clock; paused, so only the steps below
  // move it — real time between them would add steps
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 60_000);
  const bodies = await standInLamp(page);
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page.getByText('Course', { exact: true }).click();
  await page.getByLabel('Color at the start', { exact: true }).fill('#ffffff');
  await page.getByLabel('Color at the end', { exact: true }).fill('#ff0000');
  const minutes = page.getByRole('spinbutton', { name: 'Minutes', exact: true });
  await minutes.fill('2');
  await minutes.press('Enter');
  const steps = (count: number, ms: number) => clockSteps(page, bodies, count, ms);
  await page.getByRole('button', { name: 'TRY', exact: true }).click();
  // The start at once, without a transition (WLED tt in tenths of a second)
  const start = '{"on":true,"bri":255,"tt":0,"seg":{"fx":0,"col":[[255,255,255]]}}';
  await expect.poll(() => bodies).toEqual([start]);
  // Nine steps of 1 s, the last one the end light
  await steps(9, 1_000);
  expect(bodies).toHaveLength(10);
  expect(bodies.slice(1).every((b) => b.includes('"tt":10,'))).toBe(true);
  expect(bodies.at(-1)).toBe('{"on":true,"bri":90,"tt":10,"seg":{"fx":0,"col":[[255,0,0]]}}');

  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByTestId('pad-editor-panel-close-button').click();
  await enterGameMode(page);
  bodies.length = 0;
  await padCells(page).first().getByRole('button').click();
  await expect.poll(() => bodies).toEqual([start]);
  const left = page.getByTestId('status-bar-course-text');
  await expect(left).toHaveText('LIGHT 2 min left');
  // Steps of 10 s, each with a transition of 10 s
  await steps(7, 10_000);
  await expect(left).toHaveText('LIGHT 1 min left');
  expect(bodies[1]).toContain('"tt":100,');
  // The step at 110 s sends the end light, reached at 120 s
  await steps(4, 10_000);
  await expect(left).toHaveCount(0);
  expect(bodies).toHaveLength(12);
  expect(bodies.at(-1)).toBe('{"on":true,"bri":90,"tt":100,"seg":{"fx":0,"col":[[255,0,0]]}}');
});

test('a pause holds the course: the lamp stands where it got to, the minutes stand, and it goes on after', async ({
  page,
}) => {
  await page.clock.install(); // paused below, as in the course test above
  await page.clock.pauseAt(Date.now() + 60_000);
  const bodies = await standInLamp(page);
  // A Loop, so a sound plays to pause (with nothing playing, Space does nothing)
  await page.getByTestId('pad-editor-panel-type-button-loop').click();
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page.getByText('Course', { exact: true }).click();
  const minutes = page.getByRole('spinbutton', { name: 'Minutes', exact: true });
  await minutes.fill('2');
  await minutes.press('Enter');
  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByTestId('pad-editor-panel-close-button').click();
  await enterGameMode(page);
  await padCells(page).first().getByRole('button').click();
  await expect.poll(() => bodies.length).toBe(1);
  await clockSteps(page, bodies, 3, 10_000);
  // Space with no control focused — a tapped pad would take Space itself
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'PAUSED', exact: true })).toBeVisible();
  // The point at 30 s, at once: a quarter of the way from #fff4e0, 255 to #c2401a, 90 (the default)
  await expect.poll(() => bodies.length).toBe(5);
  expect(bodies[4]).toBe('{"on":true,"bri":214,"tt":0,"seg":{"fx":0,"col":[[240,199,175]]}}');
  await page.clock.runFor(60_000);
  expect(bodies).toHaveLength(5); // nothing while paused
  const left = page.getByTestId('status-bar-course-text');
  await expect(left).toHaveText('LIGHT 2 min left');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'PAUSED', exact: true })).toHaveCount(0);
  await clockSteps(page, bodies, 1, 10_000);
  expect(bodies[5]).toContain('"tt":100,'); // and on it goes
});

test('a pad played from the quick-access bar sends its light too', async ({ page }) => {
  const bodies = await standInLamp(page);
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page.getByText('Preset', { exact: true }).click();
  const preset = page.getByRole('spinbutton', { name: 'Preset number', exact: true });
  await preset.fill('7');
  await preset.press('Enter');
  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByRole('button', { name: 'In quick access', exact: true }).click();
  await page.getByTestId('pad-editor-panel-close-button').click();
  await enterGameMode(page);
  // Only the bar's button — not the pad in the grid
  await page.getByRole('group', { name: 'Quick access', exact: true }).getByRole('button').click();
  await expect.poll(() => bodies).toEqual(['{"ps":7}']);
});

test("the board's base light, set in the deck list, goes out when the board switches to GAME", async ({
  page,
}) => {
  const bodies = await standInLamp(page);
  await page.getByTestId('pad-editor-panel-close-button').click();
  await openDeckRail(page);
  const disclosure = page.getByRole('button', { name: /^BOARD LIGHT/ });
  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await page.getByText('Preset', { exact: true }).click();
  const preset = page.getByRole('spinbutton', { name: 'Preset number', exact: true });
  await preset.fill('9');
  await preset.press('Enter');
  expect(bodies).toEqual([]); // nothing is sent while setting it up
  await enterGameMode(page);
  await expect.poll(() => bodies).toEqual(['{"ps":9}']);
});

test("a short light lasts while its pad plays; then the board's base light comes back", async ({
  page,
}) => {
  const bodies = await standInLamp(page);
  await lampEffects(page, null);
  // The pad: an effect, short
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await page.getByText('Effect', { exact: true }).click();
  const number = page.getByRole('spinbutton', { name: 'Effect number', exact: true });
  await number.fill('57');
  await number.press('Enter');
  await page.getByRole('checkbox', { name: /^Short/ }).check();
  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByTestId('pad-editor-panel-close-button').click();
  // The board: preset 9 as its base light
  await openDeckRail(page);
  await page.getByRole('button', { name: /^BOARD LIGHT/ }).click();
  await page.getByText('Preset', { exact: true }).click();
  const preset = page.getByRole('spinbutton', { name: 'Preset number', exact: true });
  await preset.fill('9');
  await preset.press('Enter');
  await expect(page.getByRole('checkbox', { name: /^Short/ })).toHaveCount(0); // a pad's only
  await enterGameMode(page);
  await expect.poll(() => bodies).toEqual(['{"ps":9}']);
  // The flash while the sound plays; the test sound is short, and when it ends the base comes back
  await padCells(page).first().getByRole('button').click();
  const flash = '{"on":true,"bri":128,"seg":{"fx":57,"sx":128,"ix":128,"col":[[255,138,31]]}}';
  await expect.poll(() => bodies).toEqual(['{"ps":9}', flash, '{"ps":9}']);
});

test('a combo has no light of its own', async ({ page }) => {
  await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'SWITCH', exact: true }).click();
  await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
  await expect(page.getByText(/A combo has no light of its own/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'TRY', exact: true })).toHaveCount(0);
});
