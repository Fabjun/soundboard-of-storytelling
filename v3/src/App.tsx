// ─────────────────────────────────────────────────────────────────────────────
// App — Root component
//
// Responsibilities:
//  1. Bootstrap: load library metadata + all boards from IDB on first mount
//  2. Top-level screen routing via currentScreen signal
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import { currentScreen, libraryItems, boards } from './state/store';
import { libGetAllMeta, boardGetAll } from './db/idb';
import { StartScreen } from './screens/StartScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { BoardListScreen } from './screens/BoardListScreen';
import { BoardScreen } from './screens/BoardScreen';

export function App(): JSX.Element {
  // Bootstrap: populate libraryItems and boards signals from IDB once on mount.
  // libGetAllMeta() uses a cursor — safe for any library size (no Blob in RAM).
  // boardGetAll() loads plain JSON documents — no blobs, no cursor trick needed.
  useEffect(() => {
    libGetAllMeta()
      .then((items) => {
        libraryItems.value = items;
      })
      .catch((err) => console.error('Library bootstrap failed:', err));

    boardGetAll()
      .then((all) => {
        boards.value = all;
      })
      .catch((err) => console.error('Board bootstrap failed:', err));
  }, []);

  const screen = currentScreen.value;

  if (screen === 'library') return <LibraryScreen />;
  if (screen === 'board-list') return <BoardListScreen />;
  if (screen === 'board') return <BoardScreen />;
  return <StartScreen />;
}
