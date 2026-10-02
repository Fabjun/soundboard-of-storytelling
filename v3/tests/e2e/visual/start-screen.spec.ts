import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';

test('StartScreen — flame logo, TAP TO UNLOCK', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await stableScreenshot(page);
  // The AnimatedFlame runs continuously (canvas animation, random flicker) — mask its
  // well and its (larger) canvas field so the rest of the screen stays pixel-compared. The flame's own fidelity is
  // covered by tests/unit/flameMath.test.ts and docs/design/imports/animated-flame.md.
  // The footer shows the app version, which changes with every push — and the line is centred,
  // so a longer version (3.0.99 → 3.0.100) moves all of it. Hidden for the comparison; a mask
  // would not do, its box grows with the text.
  await page.addStyleTag({
    content: '[data-testid="start-screen-footer-region"] { visibility: hidden; }',
  });
  await expect(page).toHaveScreenshot('start-screen.png', {
    fullPage: false,
    mask: [
      page.getByTestId('start-screen-flame-region'),
      page.getByRole('img', { name: 'Animated flame' }),
    ],
  });
});
