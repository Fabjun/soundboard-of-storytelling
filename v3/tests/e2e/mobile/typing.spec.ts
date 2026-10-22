/**
 * @fileoverview Mobile E2E — typing works in every kind of text field (WebKit, iPhone 13 Pro profile)
 *
 * Simulates "Typing in text fields still works" of docs/development/manual-iphone-checklist.md: the
 * app turns text selection off everywhere (ADR-0067), and a WebKit fault can then block typing. The
 * test types key by key, as a keyboard sends it, in the Safari engine — into the library search, a
 * pad name and a trim value — and reads back what arrived.
 * Not simulated: the phone's on-screen keyboard itself (checklist, "Why manual").
 */

import { test, expect } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  padCells as pads,
  seedTestAudio,
  TEST_AUDIO_SEED,
} from '../helpers';

test.beforeEach(async ({ page }) => {
  await seedTestAudio(page, { ...TEST_AUDIO_SEED, duration: 2 });
});

test('the library search takes typed keys', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  const search = page.getByRole('textbox', { name: /^Search/ });
  await search.tap();
  await search.pressSequentially('xyz');
  await expect(search).toHaveValue('xyz');
  // The app took the keys, not only the field: the list filters by them
  await expect(page.getByText('No files matching "xyz"', { exact: true })).toBeVisible();
});

test('a pad name and a trim value take typed keys', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').tap();
  await page.locator('[data-testid^="pad-creation-popover-source-item-"]').first().tap();
  await page.getByTestId('pad-creation-popover-add-button').tap();
  await expect(pads(page)).toHaveCount(1);
  await pads(page).nth(0).getByRole('button').first().tap();

  const name = page.getByTestId('pad-editor-panel-name-input');
  await name.tap();
  await name.press('ControlOrMeta+a');
  await name.press('Backspace');
  await name.pressSequentially('Owl');
  await expect(name).toHaveValue('Owl');
  await page.getByTestId('pad-editor-panel-save-button').tap(); // a draft until SAVE (ADR-0084)
  await expect(pads(page).nth(0)).toContainText('Owl'); // the app took the keys

  const start = page.getByTestId('pad-editor-panel-trim-start-input');
  await start.tap();
  await start.press('ControlOrMeta+a');
  await start.pressSequentially('0.5');
  await start.press('Enter');
  await expect(page.getByTestId('waveform-editor-trim-start-slider')).toHaveAttribute(
    'aria-valuenow',
    '0.5',
  );
});
