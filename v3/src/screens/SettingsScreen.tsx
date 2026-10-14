/**
 * @fileoverview SettingsScreen — the app's settings, one screen with groups (Slice 14a)
 *
 * docs/product/features/settings.md (owner decisions 2026-10-11): one screen with group headings
 * (S11); as few settings as possible, none that repeats a system setting (S12); each control by
 * kind, applied and stored at once — no SAVE (S13); reached from the main menu and the board list
 * (S14), and BACK returns there. Groups so far: DATA — the backup reminder (S7) — and ABOUT — the
 * version and the license notices (S9).
 */

import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { PixelIcon } from '../components/PixelIcon';
import { currentScreen, settingsReturn } from '../state/store';
import { getBackupReminderDays, prefsVersion, setBackupReminderDays } from '../state/prefs';
import { BACKUP_REMINDER_CHOICES } from '../lib/backupExport';
import { APP_VERSION } from '../lib/changelog';

declare const __BUILD_DATE__: string;

/** Shows the settings; every change applies and is stored at once. */
export function SettingsScreen(): JSX.Element {
  void prefsVersion.value; // re-render when a setting changes
  const reminderDays = getBackupReminderDays();

  return (
    <div class="sb-screen">
      <TopBar
        title="Settings"
        right={
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost"
            data-testid="settings-screen-back-button"
            onClick={() => {
              currentScreen.value = settingsReturn.value;
            }}
          >
            <PixelIcon name="flame" size={11} />
            BACK
          </button>
        }
      />

      <div class="sb-settings">
        <section class="sb-settings-group" aria-labelledby="settings-screen-data-title">
          <h2 class="sb-settings-group-title" id="settings-screen-data-title">
            DATA
          </h2>
          {/* A few fixed values: a segmented choice of radio buttons (settings.md S13) */}
          <fieldset class="sb-settings-row">
            <legend class="sb-settings-label">Backup reminder</legend>
            <div class="sb-caption">
              The board list reminds to export a backup when the last one is older than this.
            </div>
            <div class="sb-segmented" data-testid="settings-screen-reminder-region">
              {BACKUP_REMINDER_CHOICES.map((days) => (
                <label
                  key={days}
                  class={`sb-segmented-option${days === reminderDays ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="backup-reminder"
                    class="sb-visually-hidden"
                    value={days}
                    checked={days === reminderDays}
                    onChange={() => setBackupReminderDays(days)}
                  />
                  {days} days
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section class="sb-settings-group" aria-labelledby="settings-screen-about-title">
          <h2 class="sb-settings-group-title" id="settings-screen-about-title">
            ABOUT
          </h2>
          <div class="sb-settings-row">
            <div class="sb-settings-label">Soundboard of Storytelling</div>
            <div class="sb-caption" data-testid="settings-screen-version-text">
              Version {APP_VERSION} · build {__BUILD_DATE__}
            </div>
          </div>
          <div class="sb-settings-row">
            <div class="sb-settings-label">Licenses</div>
            {/* Every build ships the notices of the libraries and icons it contains (ADR-0057) */}
            <a
              class="sb-settings-link"
              href="third-party-licenses.txt"
              target="_blank"
              rel="noopener"
            >
              Third-party licenses
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
