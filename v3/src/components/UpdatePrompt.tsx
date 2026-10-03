/**
 * @fileoverview UpdatePrompt — "A new version is ready" with RELOAD / LATER (ADR-0066)
 *
 * The service worker caches the app, so a new version is installed in the background and waits
 * (vite-plugin-pwa `registerType: 'prompt'`). This toast says so; RELOAD waits for running saves,
 * then lets the new version take over and reloads — never on its own, so a game is never cut off
 * (vite-plugin-pwa: an automatic reload can lose data; Chrome/Workbox: offer a reload button for
 * precached HTML). LATER hides it; the new version then starts with the next launch. An app that
 * stays open checks for a new version every hour while online (vite-plugin-pwa, periodic service
 * worker updates).
 */

import type { JSX } from 'preact';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { whenSaved } from '../state/boardWrites';

/** How often an open app asks the server for a new version. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Shows the update prompt while a new version waits; renders nothing otherwise. */
export function UpdatePrompt(): JSX.Element | null {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration)
        setInterval(() => void checkForUpdate(swUrl, registration), CHECK_INTERVAL_MS);
    },
  });

  if (!needRefresh) return null;

  async function handleReload() {
    await whenSaved();
    await updateServiceWorker(true);
  }

  return (
    <div class="sb-toast" role="status" data-testid="update-prompt">
      <span class="sb-toast-message">A new version is ready.</span>
      <button
        class="sb-btn sb-btn-sm sb-btn-primary sb-toast-btn"
        data-testid="update-prompt-reload-button"
        onClick={() => void handleReload()}
      >
        RELOAD
      </button>
      <button
        class="sb-btn sb-btn-sm sb-btn-ghost sb-toast-btn"
        data-testid="update-prompt-later-button"
        onClick={() => setNeedRefresh(false)}
      >
        LATER
      </button>
    </div>
  );
}

/**
 * Asks the server for a new service worker — skipped while one installs or the device is
 * offline; a server that does not answer is asked again next time.
 */
async function checkForUpdate(swUrl: string, registration: ServiceWorkerRegistration) {
  if (registration.installing || !navigator.onLine) return;
  try {
    const response = await fetch(swUrl, { cache: 'no-store' });
    if (response.status === 200) await registration.update();
  } catch {
    // Offline or server down: the next check tries again
  }
}
