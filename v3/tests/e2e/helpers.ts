// ─────────────────────────────────────────────────────────────────────────────
// E2E test helpers — shared setup flows for the full Slice-3 suite
//
// All helpers are self-contained (no cross-helper state). Callers are
// responsible for starting from a fresh page.goto('/soundboard-of-storytelling/')
// if they need clean IndexedDB state.
// ─────────────────────────────────────────────────────────────────────────────

import type { Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the 1-second WAV fixture (8-bit mono 8kHz, silence). */
export const TEST_AUDIO_PATH = path.join(__dirname, '../fixtures/test-audio-1s.wav');
export const TEST_AUDIO_NAME = 'test-audio-1s';

// ── Navigation helpers ────────────────────────────────────────────────────────

/** Navigate to the LibraryScreen from StartScreen. */
export async function goToLibrary(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'LIBRARY' }).click();
  await page.getByRole('button', { name: /IMPORT/ }).waitFor();
}

/** Navigate to the BoardListScreen from StartScreen. */
export async function goToBoardList(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'BOARD' }).click();
  await page.getByTestId('new-board-button').waitFor();
}

// ── Library helpers ───────────────────────────────────────────────────────────

/**
 * Upload the test WAV file to the library.
 * Caller must already be on the LibraryScreen (goToLibrary called first).
 * Waits for the file name to appear in the list (upload + decode complete).
 */
export async function uploadTestAudio(page: Page): Promise<void> {
  // The file input is hidden (display: none). Playwright can set files on it
  // directly without interacting with the visible IMPORT button.
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TEST_AUDIO_PATH);
  // Wait for the filename to appear in the library list (decode complete).
  await page.getByText(TEST_AUDIO_NAME, { exact: false }).waitFor({
    timeout: 10_000,
  });
}

// ── Board helpers ─────────────────────────────────────────────────────────────

/**
 * Create one board and navigate into its BoardScreen.
 * Caller must already be on the BoardListScreen.
 */
export async function createBoardAndNavigate(page: Page): Promise<void> {
  await page.getByTestId('new-board-button').click();
  // Board row appears in the list
  const boardRow = page.locator('[data-testid^="board-row-"]').first();
  await boardRow.waitFor();
  // Click the row title to open the board (action buttons stop propagation)
  await boardRow.locator('[data-testid^="board-row-title-"]').click();
  // ModeToggle is always present in BoardScreen
  await page.getByTestId('mode-toggle').waitFor();
}

// ── Deck helpers ─────────────────────────────────────────────────────────────

/**
 * Create a new deck in the current BoardScreen.
 * Returns the deck's data-testid ID part (e.g. "abc123").
 */
export async function createDeck(page: Page): Promise<string> {
  await page.getByTestId('new-deck-button').click();
  const deckTab = page.locator('[data-testid^="deck-tab-"]').first();
  await deckTab.waitFor();
  const testid = await deckTab.getAttribute('data-testid');
  return testid!.replace('deck-tab-', '');
}

// ── Mode helpers ──────────────────────────────────────────────────────────────

/** Switch the ModeToggle to SETUP mode. No-op if already in SETUP. */
export async function enterSetupMode(page: Page): Promise<void> {
  const toggle = page.getByTestId('mode-toggle');
  const cls = await toggle.getAttribute('class');
  if (cls?.includes('is-setup')) return;
  await page.getByTestId('mode-toggle-setup').click();
  await page.locator('.sb-mode-toggle.is-setup').waitFor();
}

/** Switch the ModeToggle to GAME mode. No-op if already in GAME. */
export async function enterGameMode(page: Page): Promise<void> {
  const toggle = page.getByTestId('mode-toggle');
  const cls = await toggle.getAttribute('class');
  if (cls?.includes('is-game')) return;
  await page.getByTestId('mode-toggle-game').click();
  await page.locator('.sb-mode-toggle.is-game').waitFor();
}

// ── Compound helpers ──────────────────────────────────────────────────────────

/**
 * Full setup: library audio → board → deck.
 * Starts from a fresh page (page.goto('/soundboard-of-storytelling/') already called).
 * After this call, the page is on a BoardScreen in SETUP mode with one deck.
 */
export async function setupBoardAndDeck(page: Page): Promise<void> {
  await goToLibrary(page);
  await uploadTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
}

/**
 * Create one pad at grid position (col=0, row=0) via Path A (tap-empty-cell).
 * Requires: BoardScreen in SETUP mode, deck exists, audio in library.
 * After this call, a pad occupying cell 0,0 exists.
 */
export async function createPadAtCell00(page: Page): Promise<string> {
  await page.getByTestId('pad-cell-empty-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();
  // Select the first source item in the RECENT tab
  const sourceItem = page.locator('[data-testid^="creation-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();
  // Add the pad
  await page.getByTestId('creation-add-pad').click();
  // Wait for the occupied cell (no longer pad-cell-empty-0-0)
  await page
    .locator('[data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])')
    .first()
    .waitFor();
  // Return the pad ID from the testid
  const padCell = page
    .locator('[data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])')
    .first();
  const testid = await padCell.getAttribute('data-testid');
  return testid!.replace('pad-cell-', '');
}
