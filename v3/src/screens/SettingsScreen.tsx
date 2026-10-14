/**
 * @fileoverview SettingsScreen — the app's settings, one screen with groups (Slice 14a)
 *
 * docs/product/features/settings.md (owner decisions 2026-10-11): one screen with group headings
 * (S11); as few settings as possible, none that repeats a system setting (S12); each control by
 * kind, applied and stored at once — no SAVE (S13); reached from the main menu and the board list
 * (S14), and BACK returns there. The groups, in V1's order (S1):
 *   - CONTROLS — what Enter stops, the keys of STOP ALL and PAUSE (S2, Slice 14d);
 *   - APPEARANCE — theme (S5), content width (S3), pad size per board or for every board (S4);
 *   - VISUALS — the Animations switch (S6, Slice 14c);
 *   - DATA — the backup reminder (S7);
 *   - DEVELOPER — the debug log and the developer view: stats, cache, log (S8, Slice 14e);
 *   - ABOUT — the version and the license notices (S9).
 */

import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { TopBar } from '../components/TopBar';
import { UiIcon } from '../components/UiIcon';
import { SegmentedChoice } from '../components/SegmentedChoice';
import { Switch } from '../components/Switch';
import { DeveloperDialog } from '../components/DeveloperDialog';
import { KeyField, type KeyCheck } from '../components/KeyField';
import { boards, currentScreen, settingsReturn } from '../state/store';
import {
  getAnimationsSwitch,
  getBackupReminderDays,
  getContentWidth,
  getControlKeys,
  getDebugLogSwitch,
  setDebugLogSwitch,
  getEnterStop,
  getPadSizeScope,
  getTheme,
  prefsVersion,
  resetControlKeys,
  setAnimationsSwitch,
  setBackupReminderDays,
  setContentWidth,
  setControlKey,
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
import {
  DEFAULT_CONTROL_KEYS,
  keyLabel,
  padUsingKey,
  reservedKeys,
  type ControlAction,
} from '../lib/padKeys';

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
/** The live controls whose key can be moved (S2, K12), as their key fields name them. */
const CONTROL_KEY_FIELDS: readonly {
  action: ControlAction;
  slug: 'stop-all' | 'pause';
  label: string;
  subject: string;
}[] = [
  { action: 'stopAll', slug: 'stop-all', label: 'STOP ALL key', subject: 'STOP ALL' },
  { action: 'pause', slug: 'pause', label: 'PAUSE key', subject: 'PAUSE' },
];

/** Says which pad plays the key, on which board — or null when no pad on any board does. */
function padUse(code: string): string | null {
  const use = padUsingKey(boards.value, code);
  return use && `${keyLabel(code)} plays ${use.pad.name} on ${use.board.name}`;
}

/** Refuses a key a pad plays on any board — the live control would take it from the pad. */
function checkControlKey(code: string): KeyCheck {
  const use = padUse(code);
  return use ? { kind: 'refused', reason: `${use} — pick another key` } : { kind: 'free' };
}

/**
 * Why the default keys cannot come back, or null when they can: a pad may have taken a default key
 * while it was moved away.
 */
function resetRefusal(): string | null {
  for (const code of Object.values(DEFAULT_CONTROL_KEYS)) {
    const use = padUse(code);
    if (use) return `${use} — give that pad another key first`;
  }
  return null;
}

/** The backup reminder's choices (S7). */
const REMINDER_OPTIONS = BACKUP_REMINDER_CHOICES.map((d) => ({ value: d, label: `${d} days` }));

/** Shows the settings; every change applies and is stored at once. */
export function SettingsScreen(): JSX.Element {
  void prefsVersion.value; // re-render when a setting changes
  const reminderDays = getBackupReminderDays();
  const systemReduce = systemPrefersReducedMotion();
  const [developerOpen, setDeveloperOpen] = useState(false);
  const [resetNote, setResetNote] = useState<string | null>(null);
  const controlKeys = getControlKeys();
  const keysMoved =
    controlKeys.stopAll !== DEFAULT_CONTROL_KEYS.stopAll ||
    controlKeys.pause !== DEFAULT_CONTROL_KEYS.pause;

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
          {/* K12: a key is moved by pressing it; a fixed key, the other control's key or a key a
              pad plays is refused with its reason */}
          {CONTROL_KEY_FIELDS.map(({ action, slug, label, subject }) => (
            <div key={action} data-testid={`settings-screen-${slug}-key-region`}>
              <KeyField
                id={`settings-screen-${slug}-key-field`}
                label={label}
                hotkey={controlKeys[action]}
                reserved={reservedKeys(controlKeys, action)}
                subject={subject}
                clearable={false}
                check={checkControlKey}
                onAssign={(code) => code && setControlKey(action, code)}
              />
            </div>
          ))}
          <div class="sb-settings-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              data-testid="settings-screen-reset-keys-button"
              disabled={!keysMoved}
              onClick={() => {
                const refusal = resetRefusal();
                setResetNote(refusal);
                if (!refusal) resetControlKeys();
              }}
            >
              RESET KEYS TO DEFAULT
            </button>
          </div>
          {resetNote && (
            <div class="sb-hint-text" role="status" data-testid="settings-screen-reset-keys-text">
              {resetNote}
            </div>
          )}
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

        <section class="sb-settings-group" aria-labelledby="settings-screen-developer-title">
          <h2 class="sb-settings-group-title" id="settings-screen-developer-title">
            DEVELOPER
          </h2>
          <Switch
            label="Debug log"
            caption="Keeps the app's last messages, to read and copy when something went wrong."
            checked={getDebugLogSwitch()}
            onChange={setDebugLogSwitch}
            testid="settings-screen-debug-log-switch"
          />
          <div class="sb-settings-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              data-testid="settings-screen-developer-button"
              onClick={() => setDeveloperOpen(true)}
            >
              VIEW LOG AND STATS
            </button>
          </div>
        </section>
        {developerOpen && (
          <DeveloperDialog
            debugLogOn={getDebugLogSwitch()}
            onClose={() => setDeveloperOpen(false)}
          />
        )}

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
