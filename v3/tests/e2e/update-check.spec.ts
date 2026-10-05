/**
 * @fileoverview Full E2E — the UPDATE button on the start screen says how its check went
 *
 * Owner decision 2026-10-05. The cases without a working check — no service worker (blocked by the
 * test itself, so it holds on the dev server and on the production build alike) and offline. The
 * cases with a service worker (newest version, a new one found, a put-off one shown again) run
 * against the production build in tests/e2e/pwa.spec.ts.
 */

import { test, expect } from '@playwright/test';

const APP = '/soundboard-of-storytelling/';

test.describe('without a service worker', () => {
  // The test makes its own precondition: e2e-prod runs this spec against the production build,
  // where the app registers a service worker (found in CI 2026-10-05: it reported the newest
  // version instead)
  test.use({ serviceWorkers: 'block' });

  test('the check says it cannot check here', async ({ page }) => {
    await page.goto(APP);
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByRole('status')).toContainText('cannot check for updates');
  });
});

test('offline the check says there is no connection and asks nothing', async ({
  page,
  context,
}) => {
  await page.goto(APP);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'UPDATE' }).click();
  await expect(page.getByRole('status')).toContainText('No internet connection');
});
