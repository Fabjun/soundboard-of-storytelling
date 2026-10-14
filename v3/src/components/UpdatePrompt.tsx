/**
 * @fileoverview UpdatePrompt — "A new version is ready" with BACKUP / RELOAD / LATER (ADR-0066)
 *
 * The service worker caches the app, so a new version is installed in the background and waits
 * (vite-plugin-pwa `registerType: 'prompt'`). This toast says so; RELOAD waits for running saves,
 * then lets the new version take over and reloads — never on its own, so a game is never cut off
 * (vite-plugin-pwa: an automatic reload can lose data; Chrome/Workbox: offer a reload button for
 * precached HTML). LATER hides it; the new version then starts with the next launch. An app that
 * stays open checks for a new version every hour while online (vite-plugin-pwa, periodic service
 * worker updates). The UPDATE button in the main menu checks at once (src/lib/updateCheck.ts) and
 * brings this prompt back when a version put off with LATER still waits. BACKUP opens the backup
 * export inside the prompt, so a backup can be saved before the reload — V1's "BACKUP NOW"
 * (docs/product/features/settings.md S10).
 */

import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import { whenSaved } from '../state/boardWrites';
import { updatePromptRequests } from '../lib/updateCheck';
import { BackupExportPanel } from './BackupExportPanel';

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

  /** The backup panel is open inside the prompt (S10). */
  const [backingUp, setBackingUp] = useState(false);

  // A check from the UPDATE button found a version that waits: show the prompt again
  const requests = updatePromptRequests.value;
  useEffect(() => {
    if (requests > 0) setNeedRefresh(true);
  }, [requests, setNeedRefresh]);

  if (!needRefresh) return null;

  async function handleReload() {
    await whenSaved();
    await updateServiceWorker(true);
  }

  return (
    <div class="sb-toast sb-update-prompt" role="status" data-testid="update-prompt">
      <span class="sb-toast-message">
        A new version is ready. Boards and sounds stay on this device — a backup first is a safe
        precaution.
      </span>
      <div class="sb-row">
        {/* S10: a backup before the reload, as V1 offered (BACKUP NOW) — the one export path */}
        {!backingUp && (
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost sb-toast-btn"
            data-testid="update-prompt-backup-button"
            onClick={() => setBackingUp(true)}
          >
            BACKUP
          </button>
        )}
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
      {backingUp && <BackupExportPanel onClose={() => setBackingUp(false)} onSaved={() => {}} />}
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
