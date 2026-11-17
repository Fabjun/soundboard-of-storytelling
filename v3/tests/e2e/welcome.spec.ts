/**
 * @fileoverview Full E2E — the welcome (Slice 17d, BACKLOG "Help screen and context help")
 *
 * The first start of a fresh browser shows three cards over the main menu: NEXT and BACK move
 * between them, the focus stays on NEXT, the last card has DONE and no SKIP; once closed the next
 * start does not show it. SKIP and Escape close it too, and WELCOME in the help shows it again,
 * the focus back on WELCOME afterwards. That an installation in use does not get it is a unit
 * test (tests/unit/help.test.ts) — every E2E helper start skips the welcome.
 */

import { test, expect, type Page } from '@playwright/test';
import { reloadApp } from './helpers';

const APP = '/soundboard-of-storytelling/';
const card = (page: Page, title: string) => page.getByRole('dialog', { name: title, exact: true });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const step = (page: Page) => page.getByTestId('welcome-dialog-step-text');

/** TAP TO START, without the helper that skips the welcome. */
async function tapToStart(page: Page): Promise<void> {
  await button(page, 'TAP TO START').click();
  await expect(page.getByTestId('main-menu-screen')).toBeVisible();
}

test('the first start shows the welcome card by card; DONE closes it for good', async ({
  page,
}) => {
  await page.goto(APP);
  await tapToStart(page);
  await expect(card(page, 'Welcome')).toBeVisible();
  await expect(step(page)).toHaveText('1 of 3');
  await expect(button(page, 'NEXT')).toBeFocused();
  await expect(button(page, 'BACK')).toHaveCount(0);

  await button(page, 'NEXT').click();
  await expect(card(page, 'How it works')).toBeVisible();
  await expect(step(page)).toHaveText('2 of 3');
  // BACK goes away on the first card; the focus moves to NEXT, not to the page
  await button(page, 'BACK').click();
  await expect(card(page, 'Welcome')).toBeVisible();
  await expect(button(page, 'NEXT')).toBeFocused();

  await button(page, 'NEXT').click();
  await button(page, 'NEXT').click();
  await expect(card(page, 'Get started')).toBeVisible();
  await expect(step(page)).toHaveText('3 of 3');
  await expect(button(page, 'SKIP')).toHaveCount(0);
  await button(page, 'DONE').click();
  await expect(page.getByTestId('welcome-dialog')).toHaveCount(0);
  // The menu behind takes taps again
  await button(page, 'BOARD').click();
  await expect(page.getByTestId('board-list-screen-new-button')).toBeVisible();

  await reloadApp(page);
  await tapToStart(page);
  await expect(page.getByTestId('welcome-dialog')).toHaveCount(0);
});

test('SKIP and Escape close it; WELCOME in the help shows it again', async ({ page }) => {
  await page.goto(APP);
  await tapToStart(page);
  await expect(card(page, 'Welcome')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('welcome-dialog')).toHaveCount(0);

  await button(page, 'HELP').click();
  const welcome = button(page, 'WELCOME');
  await welcome.focus(); // the keyboard user the focus return is for (WebKit's click focuses nothing)
  await page.keyboard.press('Enter');
  await expect(card(page, 'Welcome')).toBeVisible();
  await button(page, 'SKIP').click();
  await expect(page.getByTestId('welcome-dialog')).toHaveCount(0);
  await expect(page.getByTestId('help-screen')).toBeVisible();
  await expect(welcome).toBeFocused();
});
