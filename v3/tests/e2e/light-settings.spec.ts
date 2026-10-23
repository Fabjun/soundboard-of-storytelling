/**
 * @fileoverview Full E2E — the lamps in Settings → LIGHT (docs/product/features/light.md C2, C5, C6;
 * ADR-0091)
 *
 * A lamp is added with a name and an address, kept over a reload, tested and removed after the
 * question. No lamp is needed: Playwright answers at the lamp's address as WLED does (JSON with
 * `Access-Control-Allow-Origin: *`), or refuses it as a browser does that blocks the call. Runs in
 * WebKit too.
 */

import { test, expect, type Page } from '@playwright/test';
import { openMainMenu, reloadApp } from './helpers';

const lampName = (page: Page) => page.getByRole('textbox', { name: 'Lamp name', exact: true });
const lampAddress = (page: Page) =>
  page.getByRole('textbox', { name: 'Lamp address', exact: true });
const addLamp = (page: Page) => page.getByRole('button', { name: 'ADD LAMP', exact: true });

async function openSettings(page: Page): Promise<void> {
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'LIGHT', exact: true })).toBeVisible();
}

async function add(page: Page, name: string, address: string): Promise<void> {
  await lampName(page).fill(name);
  await lampAddress(page).fill(address);
  await addLamp(page).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await openSettings(page);
});

test('a lamp is added, kept over a reload, and TEST names it as the lamp answers', async ({
  page,
}) => {
  // The lamp, as WLED answers /json/info
  await page.route('http://192.168.1.50/json/info', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Floor lamp WLED', ver: '0.15.0' }),
    }),
  );
  await add(page, 'Floor lamp', '192.168.1.50');
  await expect(page.getByText('192.168.1.50', { exact: true })).toBeVisible();
  await expect(lampName(page)).toHaveValue('');

  await reloadApp(page);
  await openSettings(page);
  await page.getByRole('button', { name: 'Test Floor lamp', exact: true }).click();
  await expect(page.getByText('Connected to Floor lamp WLED.', { exact: true })).toBeVisible();
});

test('a call the browser refuses says what to do; a wrong address is refused at once', async ({
  page,
}) => {
  await page.route('http://192.168.1.60/json/info', (route) => route.abort('failed'));
  await add(page, 'Strip', '192.168.1.60');
  await page.getByRole('button', { name: 'Test Strip', exact: true }).click();
  await expect(page.getByText(/does not let the app reach the lamp/)).toBeVisible();

  await add(page, 'Typo', '192.168.1.60/json');
  await expect(page.getByRole('alert')).toContainText('This is no lamp address');
  await add(page, 'Twice', 'http://192.168.1.60/');
  await expect(page.getByRole('alert')).toContainText('already in the list');
});

test('REMOVE asks first: CANCEL keeps the lamp, REMOVE takes it out', async ({ page }) => {
  await add(page, 'Floor lamp', '192.168.1.50');
  const remove = page.getByRole('button', { name: 'Remove Floor lamp', exact: true });
  await remove.click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByRole('button', { name: 'CANCEL', exact: true }).click();
  await expect(page.getByText('192.168.1.50', { exact: true })).toBeVisible();
  await remove.click();
  await dialog.getByRole('button', { name: 'REMOVE', exact: true }).click();
  await expect(page.getByText('192.168.1.50', { exact: true })).toHaveCount(0);
});
