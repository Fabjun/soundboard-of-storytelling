/**
 * @fileoverview SettingsScreen — the app's settings, one screen with groups (Slice 14a)
 *
 * docs/product/features/settings.md (owner decisions 2026-10-11): one screen with group headings
 * (S11); as few settings as possible, none that repeats a system setting (S12); each control by
 * kind, applied and stored at once — no SAVE (S13); reached from the main menu and the board list
 * (S14), and BACK returns there. The groups, in V1's order (S1):
 *   - CONTROLS — what Enter stops (S2, Slice 14d);
 *   - APPEARANCE — theme (S5), content width (S3), pad size per board or for every board (S4);
 *   - VISUALS — the Animations switch (S6, Slice 14c);
 *   - DATA — the backup reminder (S7);
 *   - ABOUT — the version and the license notices (S9).
 */

import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { UiIcon } from '../components/UiIcon';
import { SegmentedChoice } from '../components/SegmentedChoice';
import { Switch } from '../components/Switch';
import { currentScreen, settingsReturn } from '../state/store';
import {
  getAnimationsSwitch,
  getBackupReminderDays,
  getContentWidth,
  getEnterStop,
  getPadSizeScope,
  getTheme,
  prefsVersion,
  setAnimationsSwitch,
  setBackupReminderDays,
  setContentWidth,
  setEnterStop,
  setPadSizeScope,
  setTheme,
  type EnterStop,
} from '../state/prefs';
import { BACKUP_REMINDER_CHOICES } from '../lib/backupExport';
import { THEMES } from '../lib/theme';
import { CONTENT_WIDTHS } from '../lib/contentWidth';
import { systemPrefersReducedMotion } from '../lib/motion';
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
/** What Enter stops (S2, V1's ENTER KEY STOP: SERIAL / TOTAL). */
const ENTER_STOP_OPTIONS: { value: EnterStop; label: string }[] = [
  { value: 'last', label: 'STOP LAST' },
  { value: 'all', label: 'STOP ALL' },
];
/** The backup reminder's choices (S7). */
const REMINDER_OPTIONS = BACKUP_REMINDER_CHOICES.map((d) => ({ value: d, label: `${d} days` }));

/** Shows the settings; every change applies and is stored at once. */
export function SettingsScreen(): JSX.Element {
  void prefsVersion.value; // re-render when a setting changes
  const reminderDays = getBackupReminderDays();
  const systemReduce = systemPrefersReducedMotion();

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
            <UiIcon name="back" size={11} />
            BACK
          </button>
        }
      />

      <div class="sb-settings">
        {/* The groups in V1's order (settings.md S1) */}
        <section class="sb-settings-group" aria-labelledby="settings-screen-controls-title">
          <h2 class="sb-settings-group-title" id="settings-screen-controls-title">
            CONTROLS
          </h2>
          <SegmentedChoice
            legend="Enter key"
            caption="In GAME: stop the sound started last, or stop all sounds as STOP ALL does."
            name="enter-stop"
            options={ENTER_STOP_OPTIONS}
            value={getEnterStop()}
            onChange={setEnterStop}
            testid="settings-screen-enter-stop-region"
          />
        </section>

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

        <section class="sb-settings-group" aria-labelledby="settings-screen-visuals-title">
          <h2 class="sb-settings-group-title" id="settings-screen-visuals-title">
            VISUALS
          </h2>
          {/* S6 + WCAG 2.2.2: one control stops all motion; S12: it only adds to the system's
              "reduce motion", so it is off and fixed while the system asks for less */}
          <Switch
            label="Animations"
            caption={
              systemReduce
                ? 'Off, because the device asks for reduced motion.'
                : 'The moving flame and the sparks of the mode switch.'
            }
            checked={!systemReduce && getAnimationsSwitch()}
            disabled={systemReduce}
            onChange={setAnimationsSwitch}
            testid="settings-screen-animations-switch"
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
