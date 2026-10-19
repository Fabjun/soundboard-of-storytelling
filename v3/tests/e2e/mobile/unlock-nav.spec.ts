/**
 * @fileoverview Mobile E2E — Unlock + Navigation (Playwright WebKit, iPhone 13 Pro profile)
 *
 * SCOPE: Verifies that the primary navigation gestures work with real touch
 * events (tap()) on a 390×844 viewport with hasTouch: true.
 *
 *   A. TAP TO START button tap → the main menu (settings.md S15)
 *   B. LIBRARY button tap in the menu → LibraryScreen
 *   C. BOARD button tap in the menu → BoardListScreen; new-board-button visible
 *
 * OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
 *   File upload via iOS native picker, audio output, Ringer Switch, backgrounding.
 *   Playwright's setInputFiles() bypasses the native picker — an automated upload
 *   test would be green while the real device could fail.
 */

import { test, expect } from '@playwright/test';

test('A — TAP TO START button tap opens the main menu', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await expect(page.getByRole('button', { name: 'TAP TO START', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'TAP TO START', exact: true }).tap();

  await expect(page.getByTestId('main-menu-screen')).toBeVisible();
});

test('B — LIBRARY button tap opens LibraryScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'TAP TO START', exact: true }).tap();

  await page.getByRole('button', { name: 'LIBRARY', exact: true }).tap();

  // IMPORT button signals we're on LibraryScreen
  await expect(page.getByRole('button', { name: /IMPORT/ })).toBeVisible();
});

test('C — BOARD button tap opens BoardListScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'TAP TO START', exact: true }).tap();

  await page.getByRole('button', { name: 'BOARD', exact: true }).tap();

  await expect(page.getByTestId('board-list-screen-new-button')).toBeVisible();
});
