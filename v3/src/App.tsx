// ─────────────────────────────────────────────────────────────────────────────
// App — Root component
//
// Top-level screen routing via the currentScreen signal. The stored state (library list,
// boards) is already loaded when App first renders — see src/state/boot.ts and main.tsx.
// ─────────────────────────────────────────────────────────────────────────────

import type { JSX } from 'preact';
import { currentScreen } from './state/store';
import { StartScreen } from './screens/StartScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { BoardListScreen } from './screens/BoardListScreen';
import { BoardScreen } from './screens/BoardScreen';

export function App(): JSX.Element {
  const screen = currentScreen.value;

  if (screen === 'library') return <LibraryScreen />;
  if (screen === 'board-list') return <BoardListScreen />;
  if (screen === 'board') return <BoardScreen />;
  return <StartScreen />;
}
