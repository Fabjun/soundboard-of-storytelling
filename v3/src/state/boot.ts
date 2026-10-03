/**
 * @fileoverview boot — load the stored state into the store before the first render
 *
 * The app renders only once the library list and the boards are loaded (main.tsx), like
 * redux-persist's PersistGate ("delays the rendering of your app's UI until your persisted
 * state has been retrieved"). Loaded after the first render, a late result replaced what the
 * user had created meanwhile — a board added right after the start vanished ("Board not
 * found", 2026-10-02).
 */

import { boardGetAll, libGetAllMeta } from '../db/idb';
import { boards, libraryItems } from './store';

/**
 * Library list (metadata only — a cursor, no audio in RAM) and boards (JSON documents) into
 * the store. One failing load does not stop the other; the app still starts.
 */
export async function loadStoredState(): Promise<void> {
  const [items, all] = await Promise.allSettled([libGetAllMeta(), boardGetAll()]);
  if (items.status === 'fulfilled') libraryItems.value = items.value;
  else console.error('Library bootstrap failed:', items.reason);
  if (all.status === 'fulfilled') boards.value = all.value;
  else console.error('Board bootstrap failed:', all.reason);
}
