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

/** The right edge of a visible element, in px; fails the test when it has no box. */
async function rightEdge(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return box.x + box.width;
}

/** What the flame's canvas shows now — compared over time, it tells whether the flame moves. */
const flameFrame = (page: Page) =>
  page
    .getByRole('img', { name: 'Animated flame' })
    .evaluate((c) => (c as HTMLCanvasElement).toDataURL());

/**
 * Tells whether the flame draws anything new over half a second. The first frame is taken only
 * after the flame has drawn once — a canvas mounted a moment ago may still be blank.
 */
async function flameMoves(page: Page): Promise<boolean> {
  const blank = await page.getByRole('img', { name: 'Animated flame' }).evaluate((c) => {
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

  await page.getByRole('button', { name: 'SETTINGS' }).click();
  const animations = page.getByRole('switch', { name: 'Animations' });
  await expect(animations).toHaveAttribute('aria-checked', 'true');
  await animations.click();
  await expect(animations).toHaveAttribute('aria-checked', 'false');
  await page.getByTestId('settings-screen-back-button').click();
  expect(await flameMoves(page)).toBe(false);

  await waitForSaves(page);
  await page.goto(APP);
  await expect(page.getByRole('button', { name: 'TAP TO START' })).toBeVisible();
  expect(await flameMoves(page)).toBe(false);
});

test.describe('with the system asking for reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the flame stands still and the switch is off and fixed', async ({ page }) => {
    await page.goto(APP);
    await openMainMenu(page);
    expect(await flameMoves(page)).toBe(false);
    await page.getByRole('button', { name: 'SETTINGS' }).click();
    const animations = page.getByRole('switch', { name: 'Animations' });
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
  await page.getByRole('button', { name: 'SETTINGS' }).click();
  const debugLog = page.getByRole('switch', { name: 'Debug log' });
  await expect(debugLog).toHaveAttribute('aria-checked', 'false');
  await page.evaluate(() => console.warn('before the switch'));
  await debugLog.click();
  await expect(debugLog).toHaveAttribute('aria-checked', 'true');
  await page.evaluate(() => console.warn('a message for the log'));

  const open = page.getByTestId('settings-screen-developer-button');
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'DEVELOPER' });
  const log = dialog.getByTestId('developer-dialog-log-text');
  await expect(log).toContainText('WARN a message for the log');
  await expect(log).not.toContainText('before the switch');
  await expect(dialog.getByTestId('developer-dialog-stats-region')).toContainText(APP_VERSION);
  await expect(dialog.getByTestId('developer-dialog-cache-text')).toContainText('No audio decoded');
  await expect(dialog.getByTestId('developer-dialog-close-button')).toBeFocused();

  await dialog.getByTestId('developer-dialog-clear-button').click();
  await expect(log).toHaveText('No messages.');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test('Settings opens from the main menu and goes back there', async ({ page }) => {
  await page.goto(APP);
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS' }).click();
  await expect(page.getByRole('heading', { name: 'DATA' })).toBeVisible();
  await expect(page.getByTestId('settings-screen-version-text')).toContainText(
    `Version ${APP_VERSION}`,
  );
  await expect(page.getByRole('link', { name: 'Third-party licenses' })).toHaveAttribute(
    'href',
    'third-party-licenses.txt',
  );
  await page.getByTestId('settings-screen-back-button').click();
  await expect(page.getByTestId('main-menu-screen')).toBeVisible();
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
  await page.getByRole('button', { name: 'SETTINGS' }).click();
  await expect(page.getByRole('radio', { name: 'HEARTH' })).toBeChecked();
  await page.getByText('NEON', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'NEON' })).toBeChecked();
  await expect.poll(night).not.toBe(hearthNight);
  const neonNight = await night();

  // Kept: the start screen already shows it, before TAP TO START
  await waitForSaves(page);
  await page.goto(APP);
  await expect(page.getByRole('button', { name: 'TAP TO START' })).toBeVisible();
  expect(await night()).toBe(neonNight);

  // Back to Hearth
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS' }).click();
  await page.getByText('HEARTH', { exact: true }).click();
  await expect.poll(night).toBe(hearthNight);
});

test('the content width limits the screens on a large window, centered, also after a reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  // The right edge of the top bar's BACK button marks the screen's right edge
  const right = (name: string) => rightEdge(page.getByRole('button', { name }));
  await page.goto(APP);
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS' }).click();
  await expect(page.getByRole('radio', { name: 'AUTO' })).toBeChecked();
  expect(await right('BACK')).toBeGreaterThan(1550); // the whole window

  await page.getByText('COMPACT', { exact: true }).click();
  await expect.poll(() => right('BACK')).toBeLessThanOrEqual((1600 + 900) / 2); // 900 px, centered
  expect(await right('BACK')).toBeGreaterThan((1600 + 900) / 2 - 30);

  // Kept, and on every screen: the board list after a reload
  await waitForSaves(page);
  await page.goto(APP);
  await goToBoardList(page);
  expect(
    await rightEdge(page.getByTestId('board-list-screen-settings-button')),
  ).toBeLessThanOrEqual((1600 + 900) / 2);
});

test('the backup reminder follows the days chosen in Settings, also after a reload', async ({
  page,
}) => {
  const start = Date.UTC(2026, 9, 1, 12);
  await page.clock.install({ time: start });
  await page.goto(APP);
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  await waitForSaves(page);
  await page.getByTestId('board-list-screen-export-button').click();
  const downloading = page.waitForEvent('download');
  await page.getByTestId('backup-export-panel-save-button').click();
  await downloading;
  const backupText = page.getByTestId('board-list-screen-backup-text');
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
  await page.getByTestId('board-list-screen-settings-button').click();
  const days14 = page.getByRole('radio', { name: '14 days' });
  await expect(page.getByRole('radio', { name: '7 days' })).toBeChecked();
  await page.getByText('14 days').click();
  await expect(days14).toBeChecked();
  await page.getByTestId('settings-screen-back-button').click();
  await expect(backupText).toHaveText('Last backup: 10 days ago');

  // The choice is kept
  await waitForSaves(page);
  await page.goto(APP);
  await goToBoardList(page);
  await expect(backupText).toHaveText('Last backup: 10 days ago');
});
