import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';

test('StartScreen — flame logo, TAP TO UNLOCK', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await stableScreenshot(page);
  // The AnimatedFlame runs continuously (canvas animation, random flicker) — mask its
  // well and its (larger) canvas field so the rest of the screen stays pixel-compared. The flame's own fidelity is
  // covered by tests/unit/flameMath.test.ts and docs/design/imports/animated-flame.md.
  await expect(page).toHaveScreenshot('start-screen.png', {
    fullPage: false,
    mask: [
      page.getByTestId('start-screen-flame-region'),
      page.getByRole('img', { name: 'Animated flame' }),
    ],
  });
});
