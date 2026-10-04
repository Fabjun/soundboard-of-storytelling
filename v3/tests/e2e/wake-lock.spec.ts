/**
 * @fileoverview Full E2E — the screen stays on in GAME on a board (docs/product/README.md K11)
 *
 * In GAME the app holds a screen wake lock and the status bar says SCREEN ON; SETUP and leaving
 * the board release it. Not switchable (owner decision 2026-10-04). The browser's
 * navigator.wakeLock is replaced by a recorder before the app loads — headless browsers grant or
 * refuse the real one unpredictably. Taking the lock again after the page was hidden is covered by
 * tests/unit/wakeLock.test.ts.
 */

import { test, expect, type Page } from '@playwright/test';
import { createBoardAndNavigate, enterGameMode, enterSetupMode, goToBoardList } from './helpers';

/** What the recorder saw: 'request' and 'release', in order. */
const log = (page: Page) =>
  page.evaluate(() => (window as unknown as { wakeLog: string[] }).wakeLog);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const record: string[] = [];
    (window as unknown as { wakeLog: string[] }).wakeLog = record;
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          record.push('request');
          return {
            release: async () => {
              record.push('release');
            },
            addEventListener: () => {},
          };
        },
      },
    });
  });
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
});

test('GAME on a board keeps the screen on; SETUP and leaving the board release it', async ({
  page,
}) => {
  const screenOn = page.getByTestId('status-bar-screen-on-text');
  expect(await log(page)).toEqual([]); // the board list never asks

  await createBoardAndNavigate(page);
  await enterGameMode(page);
  await expect(screenOn).toHaveText('SCREEN ON');
  expect(await log(page)).toEqual(['request']);

  await enterSetupMode(page);
  await expect(screenOn).toBeHidden();
  expect(await log(page)).toEqual(['request', 'release']);

  await enterGameMode(page);
  await expect(screenOn).toBeVisible();
  await page.getByTestId('board-top-bar-back-button').click();
  await expect.poll(() => log(page)).toEqual(['request', 'release', 'request', 'release']);
});
