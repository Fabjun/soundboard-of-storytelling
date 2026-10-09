/**
 * @fileoverview Full E2E — the Lock keeps GAME (Slice 12c)
 *
 * docs/product/README.md#lock (owner decisions 2026-09-28): a separate toggle with a lock icon,
 * shown in GAME only; one tap locks, one unlocks; it locks only the mode switch; off by default
 * and after every reload. Its place next to the mode toggle is provisional (review pending).
 * Needs no playback — runs in WebKit too.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  reloadApp,
} from './helpers';

const lock = (page: Page) => page.getByRole('button', { name: /lock the mode switch/i });
const setupHalf = (page: Page) => page.getByTestId('mode-toggle-setup-button');
const gameOn = (page: Page) => page.getByRole('button', { name: 'GAME', pressed: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
});

test('the Lock shows in GAME only and starts off', async ({ page }) => {
  await expect(gameOn(page)).toBeVisible();
  await expect(lock(page)).toHaveAttribute('aria-pressed', 'false');
  await enterSetupMode(page);
  await expect(lock(page)).toHaveCount(0);
});

test('while locked the mode stays GAME; unlocked it switches again', async ({ page }) => {
  await lock(page).click();
  await expect(lock(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(setupHalf(page)).toHaveAttribute('aria-disabled', 'true');
  // force: Playwright waits for an aria-disabled control to be enabled — here the tap itself is
  // the point, and it must change nothing
  await setupHalf(page).click({ force: true });
  await expect(gameOn(page)).toBeVisible();

  await lock(page).click();
  await expect(lock(page)).toHaveAttribute('aria-pressed', 'false');
  await setupHalf(page).click();
  await expect(page.getByRole('button', { name: 'SETUP', pressed: true })).toBeVisible();
});

test('a reload turns the Lock off', async ({ page }) => {
  await lock(page).click();
  await expect(lock(page)).toHaveAttribute('aria-pressed', 'true');
  await reloadApp(page);
  await goToBoardList(page);
  await page.locator('[data-testid^="board-list-screen-name-text-"]').first().click();
  await expect(lock(page)).toHaveAttribute('aria-pressed', 'false');
});
