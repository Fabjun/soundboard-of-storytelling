// ─────────────────────────────────────────────────────────────────────────────
// PWA — production build only (project `pwa`, E2E_TARGET=prod)
//
// The dev server has no service worker, so none of this was ever tested before
// 2026-09-29 (T5). Checks the promises of the shipped app at the game table:
// the service worker installs and controls the page, the manifest is correct,
// and the app loads — with its stored data and its fonts — without network after a first
// visit. It also loads nothing from other origins (fonts are self-hosted, audit A2).
// Run: `npm run test:e2e:prod` (builds, then serves dist/ via vite preview).
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
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

const FONTS = ['Press Start 2P', 'VT323', 'Share Tech Mono'];

/** True only if the face is declared AND its file loaded (document.fonts.check() would also
 *  return true for a family that is not declared at all). */
function fontLoaded(page: Page, family: string): Promise<boolean> {
  return page.evaluate(async (f) => {
    try {
      const faces = await document.fonts.load(`16px "${f}"`);
      return faces.length > 0 && faces.every((face) => face.status === 'loaded');
    } catch {
      return false;
    }
  }, family);
}

test('loads nothing from other origins', async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on('request', (req) => {
    if (new URL(req.url()).origin !== new URL(baseURL!).origin) foreign.push(req.url());
  });
  await page.goto(APP);
  await expect(page.getByRole('button', { name: 'TAP TO UNLOCK' })).toBeVisible();
  for (const family of FONTS) await fontLoaded(page, family);
  expect(foreign).toEqual([]);
});

test('ships the license notices of every production dependency', async ({ page }) => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    dependencies: Record<string, string>;
  };
  const res = await page.request.get(`${APP}third-party-licenses.txt`);
  expect(res.ok()).toBe(true);
  const text = await res.text();
  for (const dep of Object.keys(pkg.dependencies)) expect(text, dep).toContain(`${dep}@`);
  expect(text).toContain('SIL Open Font License');
});

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

test('fonts are available offline', async ({ page, context }) => {
  await loadControlled(page);
  // Only the service worker may serve them: empty the HTTP cache first (Chromium DevTools
  // protocol; the pwa project runs in Chromium). iOS evicts that cache readily, so a font
  // that is merely HTTP-cached is not reliably there at the game table.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.clearBrowserCache');
  await context.setOffline(true);
  await page.reload();
  for (const family of FONTS) expect(await fontLoaded(page, family), family).toBe(true);
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
