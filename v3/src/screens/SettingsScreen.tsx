/**
 * @fileoverview SettingsScreen — the app's settings, one screen with groups (Slice 14a)
 *
 * docs/product/features/settings.md (owner decisions 2026-10-11): one screen with group headings
 * (S11); as few settings as possible, none that repeats a system setting (S12); each control by
 * kind, applied and stored at once — no SAVE (S13); reached from the main menu and the board list
 * (S14), and BACK returns there. Groups so far: APPEARANCE — the theme (S5, Slice 14b) — DATA —
 * the backup reminder (S7) — and ABOUT — the version and the license notices (S9).
 */

import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { PixelIcon } from '../components/PixelIcon';
import { SegmentedChoice } from '../components/SegmentedChoice';
import { currentScreen, settingsReturn } from '../state/store';
import {
  getBackupReminderDays,
  getContentWidth,
  getPadSizeScope,
  getTheme,
  prefsVersion,
  setBackupReminderDays,
  setContentWidth,
  setPadSizeScope,
  setTheme,
} from '../state/prefs';
import { BACKUP_REMINDER_CHOICES } from '../lib/backupExport';
import { THEMES } from '../lib/theme';
import { CONTENT_WIDTHS } from '../lib/contentWidth';
import type { PadSizeScope } from '../lib/padSize';
import { APP_VERSION } from '../lib/changelog';

declare const __BUILD_DATE__: string;

/** The themes as Settings names them (S5). */
const THEME_OPTIONS = THEMES.map((t) => ({ value: t, label: t.toUpperCase() }));
/** The content widths as V1 named them (S3). */
const CONTENT_WIDTH_OPTIONS = CONTENT_WIDTHS.map((w) => ({ value: w, label: w.toUpperCase() }));
/** Where PAD SIZE lives (S4). */
const PAD_SIZE_SCOPE_OPTIONS: { value: PadSizeScope; label: string }[] = [
  { value: 'board', label: 'Per board' },
  { value: 'app', label: 'Same on every board' },
];
/** The backup reminder's choices (S7). */
const REMINDER_OPTIONS = BACKUP_REMINDER_CHOICES.map((d) => ({ value: d, label: `${d} days` }));

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
        {/* The groups in V1's order (settings.md S1) */}
        <section class="sb-settings-group" aria-labelledby="settings-screen-appearance-title">
          <h2 class="sb-settings-group-title" id="settings-screen-appearance-title">
            APPEARANCE
          </h2>
          <SegmentedChoice
            legend="Theme"
            caption="The colors of the whole app."
            name="theme"
            options={THEME_OPTIONS}
            value={getTheme()}
            onChange={setTheme}
            testid="settings-screen-theme-region"
          />
          <SegmentedChoice
            legend="Content width"
            caption="How wide the screens get on a large window: 900, 1100 or 1400 px — or AUTO, the whole window."
            name="content-width"
            options={CONTENT_WIDTH_OPTIONS}
            value={getContentWidth()}
            onChange={setContentWidth}
            testid="settings-screen-content-width-region"
          />
          <SegmentedChoice
            legend="Pad size"
            caption="The PAD SIZE slider in a board's deck list sets it for that board, or once for every board."
            name="pad-size-scope"
            options={PAD_SIZE_SCOPE_OPTIONS}
            value={getPadSizeScope()}
            onChange={setPadSizeScope}
            testid="settings-screen-pad-size-region"
          />
        </section>

        <section class="sb-settings-group" aria-labelledby="settings-screen-data-title">
          <h2 class="sb-settings-group-title" id="settings-screen-data-title">
            DATA
          </h2>
          <SegmentedChoice
            legend="Backup reminder"
            caption="The board list reminds to export a backup when the last one is older than this."
            name="backup-reminder"
            options={REMINDER_OPTIONS}
            value={reminderDays}
            onChange={setBackupReminderDays}
            testid="settings-screen-reminder-region"
          />
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
