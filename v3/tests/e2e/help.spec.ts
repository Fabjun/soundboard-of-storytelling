/**
 * @fileoverview Full E2E — the help (Slice 17a and 17b, BACKLOG "Help screen and context help")
 *
 * HELP in the main menu opens the help at the main menu's topic, open; a topic opens and closes by
 * its button (WAI-ARIA disclosure); a search lists the topics holding every word, opened, and says
 * how many; BACK returns to the main menu. The ? of a header opens the topic of its place — on a
 * board the topic of its mode —, and in the PAD editor the help opens as a dialog on top: Escape
 * closes only the help, and the editor is still there.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  openMainMenu,
} from './helpers';

const help = (page: Page) => page.getByRole('button', { name: 'Help', exact: true });
const topic = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('the ? of a screen opens the topic of its place, a board by its mode; BACK returns', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await help(page).click();
  await expect(topic(page, 'Library')).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'BACK', exact: true }).click();
  await expect(page.getByRole('tablist', { name: 'Library', exact: true })).toBeVisible();

  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterGameMode(page);
  await help(page).click();
  await expect(topic(page, 'A board in GAME')).toHaveAttribute('aria-expanded', 'true');
  await expect(topic(page, 'A board in SETUP')).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'BACK', exact: true }).click();
  await enterSetupMode(page);
  await help(page).click();
  await expect(topic(page, 'A board in SETUP')).toHaveAttribute('aria-expanded', 'true');
});

test('in the PAD editor the help opens on top; Escape closes only the help', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
  await page.getByRole('button', { name: 'NEW DECK', exact: true }).first().click();
  await page.getByText('ADD PAD', { exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Pad editor', exact: true });
  await editor.getByRole('textbox', { name: 'Pad name…', exact: true }).fill('Owl');
  await editor.getByRole('button', { name: 'Help', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Help', exact: true });
  await expect(dialog.getByRole('button', { name: 'PAD editor', exact: true })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(editor).toBeVisible();
  await expect(editor.getByRole('textbox', { name: 'Pad name…', exact: true })).toHaveValue('Owl');
});

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

// Found 2026-11-09: in the narrow frame a ? in the board's top bar pushed its right side over the
// mode toggle, which no longer took a tap — there the ? sits at the end of the deck tab row
test('on a phone the board ? sits in the tab row, and the mode toggle still takes a tap', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
  await enterGameMode(page);
  const row = page.getByTestId('deck-rail');
  await expect(row.getByRole('button', { name: 'Help', exact: true })).toBeVisible();
  await expect(help(page)).toHaveCount(1); // one ?, not a second in the top bar
  await help(page).click();
  await expect(topic(page, 'A board in GAME')).toHaveAttribute('aria-expanded', 'true');
});
