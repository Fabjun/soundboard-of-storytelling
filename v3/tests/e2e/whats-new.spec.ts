/**
 * @fileoverview Full E2E — What's new (ADR-0063)
 *
 * The version in the start screen footer opens the release notes: versions with their groups
 * (New / Improved / Fixed / Removed / Behind the scenes) in plain sentences, each with its full
 * developer changelog folded under "Details"; the close button returns to the start.
 */

import { test, expect } from '@playwright/test';
import { CHANGELOG } from '../../src/lib/changelog';
import { WHATS_NEW, WHATS_NEW_GROUPS } from '../../src/lib/whatsNew';

test("the version link opens What's new, grouped per version, and closes again", async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: "Open What's new" }).click();

  const notes = page.getByTestId('start-screen-whats-new-region');
  await expect(notes).toBeVisible();
  const newest = WHATS_NEW[0];
  const firstSection = notes.getByRole('region', { name: `Version ${newest.version}` });
  await expect(firstSection).toBeVisible();
  // The newest entry's first sentence is shown, under its group heading
  const [firstGroup] = WHATS_NEW_GROUPS.filter(([key]) => newest[key]?.length);
  const [key, heading] = firstGroup;
  await expect(firstSection.getByRole('heading', { name: heading })).toBeVisible();
  await expect(firstSection.getByText(newest[key]?.[0] ?? '')).toBeVisible();

  // "Details" folds out the version's full developer changelog; it starts folded
  const firstItem = CHANGELOG.find((c) => c.version === newest.version)?.items[0] ?? '';
  await expect(firstSection.getByText(firstItem)).toBeHidden();
  await firstSection.getByText('Details', { exact: true }).click();
  await expect(firstSection.getByText(firstItem)).toBeVisible();

  await page.getByRole('button', { name: "Close What's new" }).click();
  await expect(notes).toBeHidden();
});
