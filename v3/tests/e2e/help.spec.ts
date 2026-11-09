/**
 * @fileoverview Full E2E — the help (Slice 17a, BACKLOG "Help screen and context help")
 *
 * HELP in the main menu opens the help at the main menu's topic, open; a topic opens and closes by
 * its button (WAI-ARIA disclosure); a search lists the topics holding every word, opened, and says
 * how many; BACK returns to the main menu.
 */

import { test, expect } from '@playwright/test';
import { openMainMenu } from './helpers';

test('HELP opens the topic of the main menu; topics open and close; BACK returns', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: 'HELP', exact: true }).click();
  const menu = page.getByRole('button', { name: 'Main menu', exact: true });
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/^BOARD opens your boards\./)).toBeVisible();

  const keys = page.getByRole('button', { name: 'Keys and numpad', exact: true });
  await expect(keys).toHaveAttribute('aria-expanded', 'false');
  await keys.click();
  await expect(keys).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/The numpad’s decimal key is STOP ALL/)).toBeVisible();
  await keys.click();
  await expect(page.getByText(/The numpad’s decimal key is STOP ALL/)).toBeHidden();

  await page.getByRole('button', { name: 'BACK', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Main menu', exact: true })).toBeVisible();
});

test('the search lists the topics holding every word, open, and says how many', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: 'HELP', exact: true }).click();
  const search = page.getByRole('searchbox', { name: 'Search the help', exact: true });
  await search.fill('bluetooth');
  await expect(page.getByRole('status').filter({ hasText: 'topic' })).toHaveText(
    '1 topic matches.',
  );
  await expect(page.getByRole('button', { name: 'Keys and numpad', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Main menu', exact: true })).toHaveCount(0);
  await search.fill('zebra');
  await expect(page.getByRole('status').filter({ hasText: 'topic' })).toHaveText(
    'No topic matches. Try another word, e.g. "deck", "key" or "backup".',
  );
});
