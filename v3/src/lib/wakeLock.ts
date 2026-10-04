/**
 * @fileoverview wakeLock — keeps the screen on while the app wants it (Screen Wake Lock API)
 *
 * In GAME the screen stays on, always (owner decision 2026-10-04; docs/product/README.md K11): a
 * dark screen ends the Bluetooth numpad's input and hides the pads mid-game. The pattern is the
 * one Chrome's guide gives and V1 used: request the lock in a try/catch (the browser may refuse,
 * e.g. on low battery), and request it again when the page becomes visible — the browser releases
 * it whenever the page is hidden (https://developer.chrome.com/docs/capabilities/web-apis/wake-lock).
 * Safari and every iOS browser support it from iOS 16.4; a browser without it keeps its own
 * screen timeout.
 */

/** The part of `navigator.wakeLock` this module uses. */
export interface WakeLockApi {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

/** The part of a `WakeLockSentinel` this module uses. */
export interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

/** A screen keeper: `set(true)` keeps the screen on until `set(false)`. */
export interface ScreenKeeper {
  set(wanted: boolean): void;
}

/**
 * Creates a screen keeper. `api` is the browser's `navigator.wakeLock` (undefined where it does
 * not exist); `onChange` hears whether the lock is held — for the "SCREEN ON" hint.
 */
export function createScreenKeeper(
  api: WakeLockApi | undefined,
  doc: Pick<Document, 'visibilityState' | 'addEventListener'>,
  onChange: (held: boolean) => void,
): ScreenKeeper {
  let wanted = false;
  let held: WakeLockSentinelLike | null = null;
  let requesting = false;

  const acquire = async (): Promise<void> => {
    if (!api || !wanted || held || requesting || doc.visibilityState !== 'visible') return;
    requesting = true;
    try {
      const sentinel = await api.request('screen');
      if (!wanted) {
        // Not wanted any more while the request ran (GAME left meanwhile)
        void sentinel.release();
        return;
      }
      held = sentinel;
      sentinel.addEventListener('release', () => {
        if (held !== sentinel) return;
        held = null;
        onChange(false);
      });
      onChange(true);
    } catch {
      // Refused (low battery, power saving, no permission): the device's own timeout applies
    } finally {
      requesting = false;
    }
  };

  // The browser releases the lock when the page is hidden; back on screen, take it again
  doc.addEventListener('visibilitychange', () => void acquire());

  return {
    set(next) {
      wanted = next;
      if (wanted) {
        void acquire();
        return;
      }
      const sentinel = held;
      held = null;
      if (sentinel) {
        void sentinel.release();
        onChange(false);
      }
    },
  };
}
