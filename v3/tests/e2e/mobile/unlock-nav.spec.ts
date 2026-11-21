/**
 * @fileoverview Mobile E2E — Unlock + Navigation (Playwright WebKit, iPhone 13 Pro profile)
 *
 * SCOPE: Verifies that the primary navigation gestures work with real touch
 * events (tap()) on a 390×844 viewport with hasTouch: true.
 *
 *   A. TAP TO START button tap → the main menu (settings.md S15) and, in a fresh browser, the
 *      welcome over it (Slice 17d)
 *   B. LIBRARY button tap in the menu → LibraryScreen
 *   C. BOARD button tap in the menu → BoardListScreen; new-board-button visible
 *   B and C tap the welcome's SKIP first, as a phone user would.
 *
 * OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
 *   File upload via iOS native picker, audio output, Ringer Switch, backgrounding.
 *   Playwright's setInputFiles() bypasses the native picker — an automated upload
 *   test would be green while the real device could fail.
 */

import { test, expect, type Page } from '@playwright/test';

/** TAP TO START, then SKIP on the welcome of the fresh browser — both with touch. */
async function startAndSkipWelcome(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'TAP TO START', exact: true }).tap();
  const welcome = page.getByRole('dialog', { name: 'Welcome', exact: true });
  await welcome.getByRole('button', { name: 'SKIP', exact: true }).tap();
  await expect(welcome).toBeHidden();
}

test('A — TAP TO START button tap opens the main menu', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await expect(page.getByRole('button', { name: 'TAP TO START', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'TAP TO START', exact: true }).tap();

  // The menu is a screen without a role, inert behind the welcome — found by its test ID
  await expect(page.getByTestId('main-menu-screen')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Welcome', exact: true })).toBeVisible();
});

test('B — LIBRARY button tap opens LibraryScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await startAndSkipWelcome(page);

  await page.getByRole('button', { name: 'LIBRARY', exact: true }).tap();

  // IMPORT button signals we're on LibraryScreen
  await expect(page.getByRole('button', { name: /IMPORT/ })).toBeVisible();
});

test('C — BOARD button tap opens BoardListScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await startAndSkipWelcome(page);

  await page.getByRole('button', { name: 'BOARD', exact: true }).tap();

  await expect(page.getByRole('button', { name: 'NEW BOARD', exact: true })).toBeVisible();
});
