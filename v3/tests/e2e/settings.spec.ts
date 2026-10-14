/**
 * @fileoverview Full E2E — the Settings screen (Slice 14a, docs/product/features/settings.md)
 *
 * - Reached from the main menu and from the board list; BACK returns to where it was opened (S14)
 * - APPEARANCE: the theme applies at once to the whole app and from the first screen on (S5)
 * - DATA: the backup reminder's days apply at once and are kept after a reload (S7, S13)
 * - ABOUT: the version and the link to the license notices (S9)
 *
 * The backup's age comes from Playwright's clock: an EXPORT today, then the clock moves ten days on.
 */

import { test, expect } from '@playwright/test';
import { goToBoardList, openMainMenu, waitForSaves } from './helpers';
import { APP_VERSION } from '../../src/lib/changelog';

const APP = '/soundboard-of-storytelling/';
const DAY_MS = 24 * 60 * 60 * 1000;

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
