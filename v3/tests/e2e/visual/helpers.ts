// ─────────────────────────────────────────────────────────────────────────────
// Visual regression helpers — anti-flakiness setup for screenshot tests
//
// Must be called before every toHaveScreenshot() call.
// ─────────────────────────────────────────────────────────────────────────────

import type { Page } from '@playwright/test';

/**
 * Stabilise the page before taking a screenshot:
 * - Disable CSS animations / transitions
 * - Disable prefers-reduced-motion media query emulation (use emulateMedia)
 * - Wait for network idle (fonts, images loaded)
 * - Wait for custom fonts to be ready
 */
export async function stableScreenshot(page: Page): Promise<void> {
  // Disable motion so animated elements render in their final state
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle');
  // Ensure Web Fonts are fully loaded (Press Start 2P, VT323, Share Tech Mono)
  await page.evaluate(() => document.fonts.ready);
  // Tiny settle time for any last paint/layout tick
  await page.waitForTimeout(100);
}
