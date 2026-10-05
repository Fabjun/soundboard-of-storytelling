/**
 * @fileoverview PWA — production build only (project `pwa`, E2E_TARGET=prod)
 *
 * The dev server has no service worker, so none of this was ever tested before
 * 2026-09-29 (T5). Checks the promises of the shipped app at the game table:
 * the service worker installs and controls the page, the manifest is correct,
 * and the app loads — with its stored data and its fonts — without network after a first
 * visit. It also loads nothing from other origins (fonts are self-hosted, audit A2).
 * Run: `npm run test:e2e:prod` (builds, then serves dist/ via vite preview).
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { createBoardAndNavigate, goToBoardList, reloadApp, waitForSaves } from './helpers';

const APP = '/soundboard-of-storytelling/';

/** Load the app and wait until the service worker is active AND controls the page. */
async function loadControlled(page: Page): Promise<void> {
  await page.goto(APP);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first worker activates at once but controls only pages loaded after it (no clientsClaim,
  // ADR-0066); the reload is such a page.
  await reloadApp(page);
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
  // Read from the bundle: a dev dependency that ships through a virtual module, and what its
  // prebuilt file carries inside (ADR-0066)
  expect(text).toContain('workbox-window@');
  expect(text).toContain('workbox-core@');
  // The service worker ships Workbox modules too: each `workbox:<name>:` marker in the files it
  // loads names a package that must be in the notices
  const dist = new URL('../../dist/', import.meta.url);
  const workerFiles = readdirSync(dist).filter((f) => /^(sw|workbox-[\w-]+)\.js$/.test(f));
  const shipped = new Set(
    workerFiles.flatMap((f) =>
      [...readFileSync(new URL(f, dist), 'utf8').matchAll(/workbox:([a-z-]+):\d/g)].map(
        ([, name]) => `workbox-${name}`,
      ),
    ),
  );
  expect(shipped.size).toBeGreaterThanOrEqual(3); // sanity: the markers are found
  for (const name of shipped) expect(text, name).toContain(`${name}@`);
  // Every third-party icon set names its author and license; MIT ships its text (ADR-0070); the
  // project's own UI set is no third party and is not listed (ADR-0072)
  const iconSets = new URL('../../src/icons/sets/', import.meta.url);
  const sets = readdirSync(iconSets)
    .filter((f) => f.endsWith('.json'))
    .map(
      (file) =>
        JSON.parse(readFileSync(new URL(file, iconSets), 'utf8')) as {
          prefix: string;
          info: { author: { name: string }; license: { title: string; spdx: string } };
        },
    );
  const own = sets.filter((s) => s.info.license.spdx === 'LicenseRef-Proprietary');
  for (const { prefix, info } of sets.filter((s) => !own.includes(s))) {
    expect(text, prefix).toContain(`(${prefix}) by ${info.author.name} — ${info.license.title}`);
  }
  for (const { prefix } of own) expect(text, prefix).not.toContain(`(${prefix})`);
  expect(text).toContain('Copyright (c) 2019 Gerrit Halfmann');
});

test('service worker installs and controls the page', async ({ page }) => {
  await loadControlled(page);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/soundboard-of-storytelling\/$/);
});

test('a new version waits until RELOAD, then takes over (ADR-0066)', async ({ page }) => {
  await loadControlled(page);
  // A deploy, simulated: dist/sw.js gets other bytes. Playwright's routes do not reach the
  // browser's fetch of a service worker script (measured 2026-10-03: 0 requests routed), so the
  // file itself changes — one character, same length (the preview server knows each file's
  // size) — and is restored afterwards. The pwa project runs one test at a time (workers: 1).
  const swFile = new URL('../../dist/sw.js', import.meta.url);
  const original = readFileSync(swFile, 'utf8');
  const at = original.indexOf('revision:"') + 'revision:"'.length;
  const flipped = (parseInt(original[at], 16) ^ 1).toString(16); // another hex digit, always
  writeFileSync(swFile, original.slice(0, at) + flipped + original.slice(at + 1));
  try {
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });

    // The new version waits; the page is not reloaded on its own
    await expect(page.getByTestId('update-prompt')).toBeVisible();
    // A mark on this document: it is gone once the page has reloaded
    await page.evaluate(() => document.documentElement.setAttribute('data-old-page', ''));
    const waiting = () =>
      page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting);
    expect(await waiting()).toBe(true);

    await page.getByTestId('update-prompt-reload-button').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-old-page'); // reloaded
    await expect(page.getByTestId('update-prompt')).toBeHidden();
    await expect.poll(waiting).toBe(false); // the new version took over
  } finally {
    writeFileSync(swFile, original);
  }
});

test('the UPDATE button says when this is the newest version', async ({ page }) => {
  await loadControlled(page);
  await page.getByRole('button', { name: 'UPDATE' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'newest version' })).toBeVisible();
  await expect(page.getByTestId('update-prompt')).toBeHidden();
});

test('the UPDATE button finds a new version and brings back a prompt put off with LATER', async ({
  page,
}) => {
  await loadControlled(page);
  // A deploy, simulated as in "a new version waits until RELOAD" above
  const swFile = new URL('../../dist/sw.js', import.meta.url);
  const original = readFileSync(swFile, 'utf8');
  const at = original.indexOf('revision:"') + 'revision:"'.length;
  const flipped = (parseInt(original[at], 16) ^ 1).toString(16);
  writeFileSync(swFile, original.slice(0, at) + flipped + original.slice(at + 1));
  try {
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'new version was found' }),
    ).toBeVisible();
    await expect(page.getByTestId('update-prompt')).toBeVisible();

    // Put off with LATER, then the button again: the waiting version is offered once more
    await page.getByTestId('update-prompt-later-button').click();
    await expect(page.getByTestId('update-prompt')).toBeHidden();
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByTestId('update-prompt')).toBeVisible();
  } finally {
    writeFileSync(swFile, original);
  }
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
  await reloadApp(page);
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
  await reloadApp(page);
  for (const family of FONTS) expect(await fontLoaded(page, family), family).toBe(true);
});

test('stored boards are still there offline', async ({ page, context }) => {
  await loadControlled(page);
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await waitForSaves(page); // the new board shows before it is stored

  await context.setOffline(true);
  await page.goto(APP);
  await goToBoardList(page);
  // Count titles: '[data-testid^="board-list-screen-row-"]' would also match board-row-title-*.
  const titles = page.locator('[data-testid^="board-list-screen-name-text-"]');
  await expect(titles).toHaveCount(1);
  await expect(titles.first()).toHaveText('Board 1');
});
