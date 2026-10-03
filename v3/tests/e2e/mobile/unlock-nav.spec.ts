/**
 * @fileoverview Mobile E2E — Unlock + Navigation (Playwright WebKit, iPhone 13 Pro profile)
 *
 * SCOPE: Verifies that the primary navigation gestures work with real touch
 * events (tap()) on a 390×844 viewport with hasTouch: true.
 *
 *   A. TAP TO UNLOCK button tap → navigates to board-list
 *   B. LIBRARY button tap → LibraryScreen; back to start
 *   C. BOARD button tap → BoardListScreen; new-board-button visible
 *
 * OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
 *   File upload via iOS native picker, audio output, Ringer Switch, backgrounding.
 *   Playwright's setInputFiles() bypasses the native picker — an automated upload
 *   test would be green while the real device could fail.
 */

import { test, expect } from '@playwright/test';

test('A — TAP TO UNLOCK button tap navigates to board-list', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await expect(page.getByRole('button', { name: 'TAP TO UNLOCK' })).toBeVisible();

  await page.getByRole('button', { name: 'TAP TO UNLOCK' }).tap();

  await expect(page.getByTestId('board-list-screen-new-button')).toBeVisible();
});

test('B — LIBRARY button tap opens LibraryScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');

  await page.getByRole('button', { name: 'LIBRARY' }).tap();

  // IMPORT button signals we're on LibraryScreen
  await expect(page.getByRole('button', { name: /IMPORT/ })).toBeVisible();
});

test('C — BOARD button tap opens BoardListScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');

  await page.getByRole('button', { name: 'BOARD' }).tap();

  await expect(page.getByTestId('board-list-screen-new-button')).toBeVisible();
});
