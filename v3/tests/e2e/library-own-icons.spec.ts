/**
 * @fileoverview Full E2E — own pad icons in the library's ICONS tab (Slice 16e, library.md L7,
 * ADR-0092)
 *
 * ADD ICONS takes SVG files and says in plain words what it refused; an icon is kept over a reload;
 * the PAD editor's picker offers it first, as OWN, and the pad draws it as an image; a script in the
 * file never runs (the security decision of L7); delete in one tap with UNDO, and a pad whose icon
 * is gone shows its placeholder. The backup round trip of own icons is in backup.spec.ts (Chromium:
 * WebKit hands the export to the share sheet).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  createPadAtCell00,
  enterSetupMode,
  ensureTestAudio,
  goToBoardList,
  goToLibrary,
  padCells,
  reloadApp,
  reopenFirstBoard,
  waitForSaves,
} from './helpers';

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="red"/></svg>';
/** A drawing that would set a mark on the page if its script ran. */
const SCRIPTED = SVG.replace('</svg>', '<script>window.parent.__ownIconRan = true</script></svg>');

const iconsTab = (page: Page) => page.getByRole('tab', { name: /^ICONS\s*\d+$/ });
const svgFile = (name: string, text: string) => ({
  name,
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(text),
});

async function addIcons(page: Page, files: ReturnType<typeof svgFile>[]): Promise<void> {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await iconsTab(page).click();
  await page.getByTestId('own-icons-tab-file-input').setInputFiles(files);
}

test('ADD ICONS takes SVG files, says what it refused, and keeps them over a reload', async ({
  page,
}) => {
  await addIcons(page, [
    svgFile('Owl.svg', SVG),
    svgFile('notes.svg', 'not a drawing'),
    { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('png') },
  ]);
  await expect(page.getByRole('status').filter({ hasText: 'Added 1 icon.' })).toHaveText(
    'Added 1 icon. notes.svg: this file is no SVG drawing the app can read. photo.png: only SVG files can be icons.',
  );
  await expect(iconsTab(page)).toHaveText(/ICONS\s*1/);
  await waitForSaves(page);
  await reloadApp(page);
  await goToLibrary(page);
  await iconsTab(page).click();
  await expect(page.getByText('Owl', { exact: true })).toBeVisible();
});

test('the picker offers an own icon first; the pad draws it as an image, and its script never runs', async ({
  page,
}) => {
  await ensureTestAudio(page);
  await addIcons(page, [svgFile('Wolf.svg', SCRIPTED)]);
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
  await padCells(page).first().click();
  await page.getByTestId('pad-editor-panel-add-icon-button').click();
  await page.getByTestId('icon-picker-category-button-own').click();
  await page.getByRole('button', { name: 'Wolf', exact: true }).click();
  await page.getByTestId('pad-editor-panel-save-button').click();
  await page.getByTestId('pad-editor-panel-close-button').click();

  const picture = padCells(page).first().getByTestId('pad-icons').locator('img');
  await expect(picture).toHaveAttribute('src', /^blob:/);
  // The image has loaded (a broken one has no natural width) — and nothing in it ran
  await expect
    .poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(() => (window as { __ownIconRan?: boolean }).__ownIconRan),
  ).toBeUndefined();

  // The icon deleted in the library: the pad keeps its key but draws its placeholder
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await iconsTab(page).click();
  await page.getByRole('button', { name: 'Delete icon Wolf', exact: true }).click();
  await waitForSaves(page);
  await reopenFirstBoard(page);
  const icons = padCells(page).first().getByTestId('pad-icons');
  await expect(icons.locator('img')).toHaveCount(0);
  await expect(icons.locator('svg')).toHaveCount(1); // the placeholder of its type, not a gap
});

test('delete is one tap with UNDO in the toast', async ({ page }) => {
  await addIcons(page, [svgFile('Owl.svg', SVG)]);
  await page.getByRole('button', { name: 'Delete icon Owl', exact: true }).click();
  await expect(page.getByText('Owl', { exact: true })).toHaveCount(0);
  await expect(iconsTab(page)).toHaveText(/ICONS\s*0/);
  await page.getByTestId('undo-toast').getByRole('button', { name: 'UNDO', exact: true }).click();
  await expect(page.getByText('Owl', { exact: true })).toBeVisible();
  await expect(iconsTab(page)).toHaveText(/ICONS\s*1/);
});
