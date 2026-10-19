/**
 * @fileoverview Full E2E — What's new (ADR-0063)
 *
 * The version in the main menu's footer opens the release notes: versions with their groups
 * (New / Improved / Fixed / Removed / Behind the scenes) in plain sentences, each with its full
 * developer changelog folded under "Details"; the close button returns to the menu. A modal dialog
 * (ADR-0074): the menu behind is inert, the focus starts on the close button, Escape closes it and
 * the focus goes back to the version.
 */

import { test, expect } from '@playwright/test';
import { openMainMenu } from './helpers';
import { CHANGELOG } from '../../src/lib/changelog';
import { WHATS_NEW, WHATS_NEW_GROUPS } from '../../src/lib/whatsNew';

test("the version link opens What's new, grouped per version, and closes again", async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: /^v [\d.]+, open What's new$/ }).click();

  const notes = page.getByTestId('main-menu-screen-whats-new-region');
  await expect(notes).toBeVisible();
  const newest = WHATS_NEW[0];
  const firstSection = notes.getByRole('region', {
    name: `Version ${newest.version}`,
    exact: true,
  });
  await expect(firstSection).toBeVisible();
  // The newest entry's first sentence is shown, under its group heading
  const [firstGroup] = WHATS_NEW_GROUPS.filter(([key]) => newest[key]?.length);
  const [key, heading] = firstGroup;
  await expect(firstSection.getByRole('heading', { name: heading })).toBeVisible();
  await expect(firstSection.getByText(newest[key]?.[0] ?? '')).toBeVisible();

  // "Details" folds out the version's full developer changelog; it starts folded
  const firstItem = CHANGELOG.find((c) => c.version === newest.version)?.items[0] ?? '';
  await expect(firstSection.getByText(firstItem)).toBeHidden();
  await firstSection.getByText('Details', { exact: true }).click();
  await expect(firstSection.getByText(firstItem)).toBeVisible();

  // The early development is there too, version by version: the oldest one with its details
  const oldest = CHANGELOG[CHANGELOG.length - 1];
  const oldestSection = notes.getByRole('region', {
    name: `Version ${oldest.version}`,
    exact: true, // "Version 3.0.1" would also match 3.0.10 … 3.0.199
  });
  await oldestSection.scrollIntoViewIfNeeded();
  await oldestSection.getByText('Details', { exact: true }).click();
  await expect(oldestSection.getByText(oldest.items[0])).toBeVisible();

  await page.getByRole('button', { name: "Close What's new", exact: true }).click();
  await expect(notes).toBeHidden();
});

test("What's new is a modal dialog: the menu behind is inert, Escape closes, the focus goes back", async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  const version = page.getByRole('button', { name: /^v [\d.]+, open What's new$/ });
  await version.focus(); // the keyboard user the focus return is for
  await page.keyboard.press('Enter');

  const notes = page.getByRole('dialog', { name: "WHAT'S NEW", exact: true });
  await expect(notes).toBeVisible();
  await expect(page.getByRole('button', { name: "Close What's new", exact: true })).toBeFocused();
  const menu = page.locator('nav[aria-label="Main menu"]');
  expect(await menu.evaluate((el) => el.closest('[inert]') !== null)).toBe(true);

  await page.keyboard.press('Escape');
  await expect(notes).toBeHidden();
  await expect(version).toBeFocused();
  expect(await menu.evaluate((el) => el.closest('[inert]') !== null)).toBe(false);
});
