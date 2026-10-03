/**
 * @fileoverview App — Root component
 *
 * Top-level screen routing via the currentScreen signal. The stored state (library list,
 * boards) is already loaded when App first renders — see src/state/boot.ts and main.tsx.
 * On mount it asks once for persistent storage (ADR-0061). The update prompt shows on every screen
 * (ADR-0066).
 */

import { useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import { currentScreen } from './state/store';
import { requestPersistentStorage } from './db/persistentStorage';
import { StartScreen } from './screens/StartScreen';
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

  if (screen === 'library') return <LibraryScreen />;
  if (screen === 'board-list') return <BoardListScreen />;
  if (screen === 'board') return <BoardScreen />;
  return <StartScreen />;
}
