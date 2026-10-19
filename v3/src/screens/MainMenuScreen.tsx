/**
 * @fileoverview MainMenuScreen — the main menu behind TAP TO START (owner decision 2026-10-11)
 *
 * docs/product/features/settings.md S15: the start screen has one action; its tap unlocks the
 * audio and opens this menu — BOARD, LIBRARY, SETTINGS, UPDATE — with the flame still burning, and
 * the version that opens What's new (ADR-0063). UPDATE checks for a new version at once and says
 * how it went (owner decision 2026-10-05).
 */

import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { useEscapeKey } from '../lib/escapeKey';
import { useModalDialog } from '../lib/modalDialog';
import { UiIcon } from '../components/UiIcon';
import { AnimatedFlame } from '../components/AnimatedFlame';
import { audioContextState, currentScreen, settingsReturn } from '../state/store';
import { APP_VERSION, CHANGELOG } from '../lib/changelog';
import { versionLine, WHATS_NEW, WHATS_NEW_GROUPS, withEarlyVersions } from '../lib/whatsNew';
import { checkForUpdateNow, updateCheckMessage } from '../lib/updateCheck';

declare const __BUILD_DATE__: string;

/** The developer changelog items of each version, shown under "Details" (owner decision 2026-10-03). */
const DETAILS = new Map(CHANGELOG.map((c) => [c.version, c.items]));
/** Every version's notes, the early development included (ADR-0063 amendment). */
const NOTES = withEarlyVersions(WHATS_NEW, CHANGELOG);

// ── WhatsNewOverlay ───────────────────────────────────────────────────────────

/** Folds out every change of one version, as recorded for developers; nothing if none is. */
function VersionDetails({ version }: { version: string }): JSX.Element | null {
  const items = DETAILS.get(version);
  if (!items?.length) return null;
  return (
    <details data-testid={`main-menu-screen-whats-new-details-region-${version}`}>
      <summary class="sb-whats-new-group sb-whats-new-details-toggle">Details</summary>
      <ul class="sb-whats-new-items">
        {items.map((item) => (
          <li key={item} class="sb-mono sb-whats-new-item">
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * The release notes for the people who use the app, newest version first (ADR-0063); each version
 * folds out its full developer changelog under "Details" (HTML disclosure element). A modal
 * dialog (ADR-0074): the menu behind is inert, the focus starts on the close button, Escape
 * closes it and the focus goes back to the version that opened it.
 */
function WhatsNewOverlay({ onClose }: { onClose: () => void }): JSX.Element {
  const dialog = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose);
  useModalDialog(dialog);
  return (
    <div
      ref={dialog}
      class="sb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="main-menu-screen-whats-new-title"
      data-testid="main-menu-screen-whats-new-region"
    >
      <div class="sb-overlay-header">
        <h2 class="sb-overlay-title" id="main-menu-screen-whats-new-title">
          WHAT'S NEW
        </h2>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          onClick={onClose}
          aria-label="Close What's new"
          data-autofocus
        >
          <UiIcon name="close" />
        </button>
      </div>

      <div class="sb-overlay-body">
        <div class="sb-caption" data-testid="main-menu-screen-whats-new-version-text">
          {versionLine(APP_VERSION, NOTES)}
        </div>
        {NOTES.map((entry) => (
          <section key={entry.version} aria-label={`Version ${entry.version}`}>
            <div class="sb-row sb-whats-new-entry-header">
              <span class="sb-whats-new-version">v {entry.version}</span>
              <span class="sb-caption">{entry.date}</span>
            </div>

            {/* Only the groups this version has, in a fixed order */}
            {WHATS_NEW_GROUPS.map(([key, heading]) => {
              const sentences = entry[key];
              if (!sentences?.length) return null;
              return (
                <div key={key}>
                  <h3 class="sb-whats-new-group">{heading}</h3>
                  <ul class="sb-whats-new-items">
                    {sentences.map((text) => (
                      <li key={text} class="sb-mono sb-whats-new-item">
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <VersionDetails version={entry.version} />
          </section>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function describeAudioState(): string {
  switch (audioContextState.value) {
    case 'locked':
      return 'audio context idle · tap to activate';
    case 'running':
      return 'audio context running · ready';
    case 'suspended':
      return 'audio context suspended';
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

/**
 * Shows the main menu: the flame, BOARD, LIBRARY, SETTINGS and UPDATE, and the version in the
 * footer, which opens What's new.
 */
export function MainMenuScreen(): JSX.Element {
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  async function handleUpdateCheck() {
    setChecking(true);
    setUpdateMessage(null);
    const registration = await navigator.serviceWorker?.getRegistration();
    const result = await checkForUpdateNow(registration, navigator.onLine);
    setUpdateMessage(updateCheckMessage(result, APP_VERSION));
    setChecking(false);
  }

  return (
    <div class="sb sb-scanlines sb-start-screen" data-testid="main-menu-screen">
      {showWhatsNew && <WhatsNewOverlay onClose={() => setShowWhatsNew(false)} />}

      {/* The flame keeps burning in the menu (owner decision 2026-10-11) */}
      <div class="sb-flame-well" data-testid="main-menu-screen-flame-region">
        <AnimatedFlame size={120} />
      </div>

      <h1 class="sb-display sb-start-title">
        SOUNDBOARD
        <br />
        OF STORYTELLING
      </h1>

      <nav class="sb-menu-nav" aria-label="Main menu">
        <button
          class="sb-btn sb-btn-primary"
          onClick={() => {
            currentScreen.value = 'board-list';
          }}
        >
          <UiIcon name="board" size={14} />
          BOARD
        </button>
        <button
          class="sb-btn sb-btn-ghost"
          onClick={() => {
            currentScreen.value = 'library';
          }}
        >
          <UiIcon name="library" size={14} />
          LIBRARY
        </button>
        <button
          class="sb-btn sb-btn-ghost"
          onClick={() => {
            settingsReturn.value = 'menu';
            currentScreen.value = 'settings';
          }}
        >
          <UiIcon name="settings" size={14} />
          SETTINGS
        </button>
        <button
          class="sb-btn sb-btn-ghost"
          disabled={checking}
          onClick={() => void handleUpdateCheck()}
        >
          <UiIcon name="update" size={14} />
          {checking ? 'CHECKING…' : 'UPDATE'}
        </button>
      </nav>
      {/* The result of the update check, read out by screen readers */}
      <div class="sb-caption sb-start-status" role="status">
        {updateMessage}
      </div>

      {/* Footer: the version opens What's new; the audio state */}
      <div class="sb-start-footer" data-testid="main-menu-screen-footer-region">
        <button
          class="sb-version-link"
          onClick={() => setShowWhatsNew(true)}
          // WCAG 2.5.3 Label in Name: the visible version first, then what the button does
          aria-label={`v ${APP_VERSION}, open What's new`}
        >
          v {APP_VERSION}
        </button>
        <span>· build {__BUILD_DATE__} ·</span>
        <span>{describeAudioState()}</span>
      </div>
    </div>
  );
}
