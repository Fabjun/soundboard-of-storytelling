/**
 * @fileoverview Full E2E — the Settings screen (Slice 14a, docs/product/features/settings.md)
 *
 * - Reached from the main menu and from the board list; BACK returns to where it was opened (S14)
 * - APPEARANCE: the theme applies at once to the whole app and from the first screen on (S5); the
 *   content width limits every screen on a large window (S3)
 * - VISUALS: the Animations switch stops the flame (S6, WCAG 2.2.2); with the system asking for
 *   reduced motion the flame stands still and the switch is off and fixed (S12)
 * - DATA: the backup reminder's days apply at once and are kept after a reload (S7, S13)
 * - DEVELOPER: the debug log keeps the app's messages while on; the developer view shows them with
 *   stats and the audio cache, clears them, and Escape takes the focus back (S8)
 * - ABOUT: the version and the link to the license notices (S9)
 *
 * The backup's age comes from Playwright's clock: an EXPORT today, then the clock moves ten days on.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { goToBoardList, openMainMenu, waitForSaves } from './helpers';
import { APP_VERSION } from '../../src/lib/changelog';

const APP = '/soundboard-of-storytelling/';
const DAY_MS = 24 * 60 * 60 * 1000;

/** BACK in the Settings top bar — one screen shows at a time, so the name is unique. */
const back = (page: Page) => page.getByRole('button', { name: 'BACK', exact: true });
/** The board list's Settings button (an icon button named by its aria-label). */
const settingsButton = (page: Page) => page.getByRole('button', { name: 'Settings', exact: true });

/** The right edge of a visible element, in px; fails the test when it has no box. */
async function rightEdge(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return box.x + box.width;
}

/** What the flame's canvas shows now — compared over time, it tells whether the flame moves. */
const flameFrame = (page: Page) =>
  page
    .getByRole('img', { name: 'Animated flame', exact: true })
    .evaluate((c) => (c as HTMLCanvasElement).toDataURL());

/**
 * Tells whether the flame draws anything new over half a second. The first frame is taken only
 * after the flame has drawn once — a canvas mounted a moment ago may still be blank.
 */
async function flameMoves(page: Page): Promise<boolean> {
  const blank = await page
    .getByRole('img', { name: 'Animated flame', exact: true })
    .evaluate((c) => {
      const empty = document.createElement('canvas');
      empty.width = (c as HTMLCanvasElement).width;
      empty.height = (c as HTMLCanvasElement).height;
      return empty.toDataURL();
    });
  await expect.poll(() => flameFrame(page)).not.toBe(blank);
  const before = await flameFrame(page);
  await page.waitForTimeout(500); // the flame draws ~45 frames a second; half a second is many
  return (await flameFrame(page)) !== before;
}

test('the Animations switch stops the flame, and it stays still after a reload', async ({
  page,
}) => {
  await page.goto(APP);
  await openMainMenu(page);
  expect(await flameMoves(page)).toBe(true);

  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  const animations = page.getByRole('switch', { name: 'Animations', exact: true });
  await expect(animations).toHaveAttribute('aria-checked', 'true');
  await animations.click();
  await expect(animations).toHaveAttribute('aria-checked', 'false');
  await back(page).click();
  expect(await flameMoves(page)).toBe(false);

  await waitForSaves(page);
  await page.goto(APP);
  await expect(page.getByRole('button', { name: 'TAP TO START', exact: true })).toBeVisible();
  expect(await flameMoves(page)).toBe(false);
});

test.describe('with the system asking for reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the flame stands still and the switch is off and fixed', async ({ page }) => {
    await page.goto(APP);
    await openMainMenu(page);
    expect(await flameMoves(page)).toBe(false);
    await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
    const animations = page.getByRole('switch', { name: 'Animations', exact: true });
    await expect(animations).toHaveAttribute('aria-checked', 'false');
    await expect(animations).toBeDisabled();
    await expect(animations).toHaveAccessibleDescription(/reduced motion/);
  });
});

test('the debug log keeps messages while on; the developer view shows, clears and closes', async ({
  page,
}) => {
  await page.goto(APP);
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  const debugLog = page.getByRole('switch', { name: 'Debug log', exact: true });
  await expect(debugLog).toHaveAttribute('aria-checked', 'false');
  await page.evaluate(() => console.warn('before the switch'));
  await debugLog.click();
  await expect(debugLog).toHaveAttribute('aria-checked', 'true');
  await page.evaluate(() => console.warn('a message for the log'));

  const open = page.getByRole('button', { name: 'VIEW LOG AND STATS', exact: true });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'DEVELOPER', exact: true });
  // Each part of the view is a section named by its heading
  const section = (name: string) => dialog.getByRole('region', { name, exact: true });
  const log = section('LOG');
  await expect(log).toContainText('WARN a message for the log');
  await expect(log).not.toContainText('before the switch');
  await expect(section('STATS')).toContainText(APP_VERSION);
  await expect(section('CACHE')).toContainText('No audio decoded');
  await expect(
    dialog.getByRole('button', { name: 'Close the developer view', exact: true }),
  ).toBeFocused();

  await log.getByRole('button', { name: 'CLEAR', exact: true }).click();
  await expect(log.getByText('No messages.', { exact: true })).toBeVisible();
  await expect(log).not.toContainText('WARN');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test('Settings opens from the main menu and goes back there', async ({ page }) => {
  await page.goto(APP);
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'DATA', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'ABOUT', exact: true })).toContainText(
    `Version ${APP_VERSION}`,
  );
  await expect(
    page.getByRole('link', { name: 'Third-party licenses', exact: true }),
  ).toHaveAttribute('href', 'third-party-licenses.txt');
  await back(page).click();
  await expect(page.getByRole('navigation', { name: 'Main menu', exact: true })).toBeVisible();
});

test('the theme applies at once, to the whole app, and from the first screen after a reload', async ({
  page,
}) => {
  // The palette as the page resolves it: the base color every screen is drawn on
  const night = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--night').trim(),
    );
  await page.goto(APP);
  await openMainMenu(page);
  const hearthNight = await night();
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'HEARTH', exact: true })).toBeChecked();
  await page.getByText('NEON', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'NEON', exact: true })).toBeChecked();
  await expect.poll(night).not.toBe(hearthNight);
  const neonNight = await night();

  // Kept: the start screen already shows it, before TAP TO START
  await waitForSaves(page);
  await page.goto(APP);
  await expect(page.getByRole('button', { name: 'TAP TO START', exact: true })).toBeVisible();
  expect(await night()).toBe(neonNight);

  // Back to Hearth
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await page.getByText('HEARTH', { exact: true }).click();
  await expect.poll(night).toBe(hearthNight);
});

test('the content width limits the screens on a large window, centered, also after a reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  // The right edge of the top bar's last button — the ? since Slice 17b — marks the screen's right
  // edge
  const right = (name: string) => rightEdge(page.getByRole('button', { name, exact: true }));
  await page.goto(APP);
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'AUTO', exact: true })).toBeChecked();
  expect(await right('Help')).toBeGreaterThan(1550); // the whole window

  await page.getByText('COMPACT', { exact: true }).click();
  await expect.poll(() => right('Help')).toBeLessThanOrEqual((1600 + 900) / 2); // 900 px, centered
  expect(await right('Help')).toBeGreaterThan((1600 + 900) / 2 - 30);

  // Kept, and on every screen: the board list after a reload
  await waitForSaves(page);
  await page.goto(APP);
  await goToBoardList(page);
  expect(await rightEdge(settingsButton(page))).toBeLessThanOrEqual((1600 + 900) / 2);
});

test('the backup reminder follows the days chosen in Settings, also after a reload', async ({
  page,
}) => {
  const start = Date.UTC(2026, 9, 1, 12);
  // clock flows: only the date matters here — the reminder counts whole days, which the seconds
  // of the run cannot reach; setSystemTime jumps the days
  await page.clock.install({ time: start });
  await page.goto(APP);
  await goToBoardList(page);
  await page.getByRole('button', { name: 'NEW BOARD', exact: true }).click();
  await waitForSaves(page);
  await page.getByRole('button', { name: 'EXPORT', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page
    .getByRole('region', { name: 'Backup export', exact: true })
    .getByRole('button', { name: 'SAVE', exact: true })
    .click();
  await downloading;
  // The board list's line about the last backup (a caption without a role)
  const backupText = page.getByText(/^(No backup yet|Last backup:)/);
  await expect(backupText).toHaveText('Last backup: today');

  // Ten days later (and an hour, as the backup was saved a few seconds after `start`) the default
  // of seven days reminds
  await page.clock.setSystemTime(start + 10 * DAY_MS + 60 * 60 * 1000);
  await waitForSaves(page);
  await page.goto(APP);
  await goToBoardList(page);
  await expect(backupText).toHaveText(
    'Last backup: 10 days ago — EXPORT saves your boards and audio in one file.',
  );

  // 14 days in Settings, opened from the board list: no reminder, and BACK returns there
  await settingsButton(page).click();
  const days14 = page.getByRole('radio', { name: '14 days', exact: true });
  await expect(page.getByRole('radio', { name: '7 days', exact: true })).toBeChecked();
  await page.getByText('14 days', { exact: true }).click();
  await expect(days14).toBeChecked();
  await back(page).click();
  await expect(backupText).toHaveText('Last backup: 10 days ago');

  // The choice is kept
  await waitForSaves(page);
  await page.goto(APP);
  await goToBoardList(page);
  await expect(backupText).toHaveText('Last backup: 10 days ago');
});
