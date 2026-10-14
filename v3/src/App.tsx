/**
 * @fileoverview App — Root component
 *
 * Top-level screen routing via the currentScreen signal. The stored state (library list,
 * boards) is already loaded when App first renders — see src/state/boot.ts and main.tsx.
 * On mount it asks once for persistent storage (ADR-0061) and puts the chosen theme and content
 * width on the root element (docs/product/features/settings.md S5, S3). The update prompt shows on every screen
 * (ADR-0066). In GAME on a board the screen stays on (docs/product/README.md K11).
 */

import { useEffect, useLayoutEffect } from 'preact/hooks';
import { effect } from '@preact/signals';
import type { JSX } from 'preact';
import { currentMode, currentScreen, screenKeptOn } from './state/store';
import { getContentWidth, getDebugLogSwitch, getTheme, prefsVersion } from './state/prefs';
import { applyTheme } from './lib/theme';
import { startDebugLog, stopDebugLog } from './lib/debugLog';
import { applyContentWidth } from './lib/contentWidth';
import { requestPersistentStorage } from './db/persistentStorage';
import { createScreenKeeper } from './lib/wakeLock';
import { StartScreen } from './screens/StartScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { BoardListScreen } from './screens/BoardListScreen';
import { BoardScreen } from './screens/BoardScreen';
import { UpdatePrompt } from './components/UpdatePrompt';

/**
 * Renders the screen `currentScreen` names and, on every screen, the update prompt; asks once for
 * persistent storage on mount.
 */
export function App(): JSX.Element {
  // D4: ask the browser to keep boards and audio (invisible to the user; ADR-0061)
  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  // S5 / S3: the theme and the content width chosen in Settings, on the root element — a layout
  // effect, so the first frame already shows them; re-applied whenever a preference changes
  useLayoutEffect(
    () =>
      effect(() => {
        void prefsVersion.value;
        applyTheme(document.documentElement, getTheme());
        applyContentWidth(document.documentElement, getContentWidth());
      }),
    [],
  );

  // S8: the debug log keeps the console's messages while it is switched on in Settings
  useLayoutEffect(
    () =>
      effect(() => {
        void prefsVersion.value;
        if (getDebugLogSwitch()) startDebugLog();
        else stopDebugLog();
      }),
    [],
  );

  // K11: in GAME on a board the screen stays on — not switchable (owner decision 2026-10-04)
  useEffect(() => {
    const keeper = createScreenKeeper(
      'wakeLock' in navigator ? navigator.wakeLock : undefined,
      document,
      (held) => (screenKeptOn.value = held),
    );
    const stop = effect(() =>
      keeper.set(currentScreen.value === 'board' && currentMode.value === 'play'),
    );
    return () => {
      stop();
      keeper.set(false);
    };
  }, []);

  return (
    <>
      <Screen />
      <UpdatePrompt />
    </>
  );
}

/** The screen `currentScreen` names. */
function Screen(): JSX.Element {
  const screen = currentScreen.value;

  if (screen === 'menu') return <MainMenuScreen />;
  if (screen === 'settings') return <SettingsScreen />;
  if (screen === 'library') return <LibraryScreen />;
  if (screen === 'board-list') return <BoardListScreen />;
  if (screen === 'board') return <BoardScreen />;
  return <StartScreen />;
}
