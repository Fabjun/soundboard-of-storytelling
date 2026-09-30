// ─────────────────────────────────────────────────────────────────────────────
// PWA — production build only (project `pwa`, E2E_TARGET=prod)
//
// The dev server has no service worker, so none of this was ever tested before
// 2026-09-29 (T5). Checks the promises of the shipped app at the game table:
// the service worker installs and controls the page, the manifest is correct,
// and the app loads — with its stored data — without network after a first visit.
// Run: `npm run test:e2e:prod` (builds, then serves dist/ via vite preview).
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect, type Page } from '@playwright/test';
import { createBoardAndNavigate, goToBoardList } from './helpers';

const APP = '/soundboard-of-storytelling/';

/** Load the app and wait until the service worker is active AND controls the page. */
async function loadControlled(page: Page): Promise<void> {
  await page.goto(APP);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // clientsClaim: the active worker takes control; a reload guarantees a controlled load.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

test('service worker installs and controls the page', async ({ page }) => {
  await loadControlled(page);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/soundboard-of-storytelling\/$/);
});

test('manifest is linked with the app name and start URL', async ({ page }) => {
  await page.goto(APP);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await page.evaluate(async (url) => (await fetch(url!)).json(), href);
  expect(manifest.name).toBe('Soundboard of Storytelling');
  expect(manifest.start_url).toBe(APP);
  expect(manifest.scope).toBe(APP);
});

test('app starts offline after the first visit', async ({ page, context }) => {
  await loadControlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'TAP TO UNLOCK' })).toBeVisible();
});

test('stored boards are still there offline', async ({ page, context }) => {
  await loadControlled(page);
  await goToBoardList(page);
  await createBoardAndNavigate(page);

  await context.setOffline(true);
  await page.goto(APP);
  await goToBoardList(page);
  // Count titles: '[data-testid^="board-list-screen-row-"]' would also match board-row-title-*.
  const titles = page.locator('[data-testid^="board-list-screen-name-text-"]');
  await expect(titles).toHaveCount(1);
  await expect(titles.first()).toHaveText('Board 1');
});
