/**
 * @fileoverview Full E2E — the UPDATE button on the start screen says how its check went
 *
 * Owner decision 2026-10-05. The dev server has no service worker, so here the button can only
 * say why it cannot check; the cases with a service worker (newest version, a new one found, a
 * put-off one shown again) run against the production build in tests/e2e/pwa.spec.ts.
 */

import { test, expect } from '@playwright/test';

const APP = '/soundboard-of-storytelling/';

test('without a service worker the check says it cannot check here', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'UPDATE' }).click();
  await expect(page.getByRole('status')).toContainText('cannot check for updates');
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
