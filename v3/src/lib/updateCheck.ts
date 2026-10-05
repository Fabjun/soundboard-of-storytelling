/**
 * @fileoverview updateCheck — the UPDATE button's check for a new version (owner decision 2026-10-05)
 *
 * The app already looks for a new version every hour and then shows the update prompt with RELOAD
 * (ADR-0066). This check runs the same service worker update at once, on request, and says how it
 * went; the prompt stays the one way to switch to the new version.
 */

import { signal } from '@preact/signals';

/** How a check went: a new version was found, this is the newest, or why nothing was checked. */
export type UpdateCheckResult = 'found' | 'newest' | 'offline' | 'unavailable' | 'failed';

/** The part of a service worker registration the check needs. */
export type UpdatableRegistration = Pick<
  ServiceWorkerRegistration,
  'update' | 'installing' | 'waiting'
>;

/**
 * Counts requests to show the update prompt again — a check that finds a version already waiting
 * (its prompt was put off with LATER) raises it; UpdatePrompt shows itself when it changes.
 */
export const updatePromptRequests = signal(0);

/**
 * Checks the server for a new version through the app's service worker registration. Offline or
 * without a registration (the dev server, a browser that blocks service workers) nothing is
 * asked. A version that is already waiting counts as found and brings the prompt back.
 */
export async function checkForUpdateNow(
  registration: UpdatableRegistration | null | undefined,
  online: boolean,
): Promise<UpdateCheckResult> {
  if (!online) return 'offline';
  if (!registration) return 'unavailable';
  if (registration.waiting) {
    updatePromptRequests.value++;
    return 'found';
  }
  try {
    await registration.update();
  } catch {
    return 'failed';
  }
  // A version that installs shows the prompt on its own once it is ready (vite-plugin-pwa)
  return registration.installing || registration.waiting ? 'found' : 'newest';
}

/** Returns the message a check result shows on the start screen, in plain words. */
export function updateCheckMessage(result: UpdateCheckResult, version: string): string {
  switch (result) {
    case 'found':
      return 'A new version was found. RELOAD appears as soon as it is loaded.';
    case 'newest':
      return `This is the newest version (v ${version}).`;
    case 'offline':
      return 'No internet connection. Connect and check again.';
    case 'unavailable':
      return 'This window cannot check for updates. Open the app from the home screen or the website.';
    case 'failed':
      return 'The update server did not answer. Check again later.';
  }
}
