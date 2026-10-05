/**
 * @fileoverview escapeKey — the one way a dialog closes on Escape (ADR-0074)
 *
 * Two races were found in CI on 2026-10-05, both from a document listener added or removed in a
 * passive effect (`useEffect`), which Preact runs only after the browser has painted: a key
 * pressed right after a dialog appeared reached the dialog below (the PAD editor closed with the
 * icon list), or no dialog at all (the icon list stayed open). This hook adds the listener in a
 * layout effect — before the dialog is painted, so before it can be seen — and reads the handler
 * and whether it is active from refs set on every render, so the answer is the one of the moment
 * the key is pressed.
 */

import { useLayoutEffect, useRef } from 'preact/hooks';

/**
 * Calls `onEscape` when Escape is pressed while `active` is true — from the first paint of the
 * component on. A dialog below another passes `active: false` while the one on top is open, so
 * only the top one closes.
 */
export function useEscapeKey(onEscape: () => void, active = true): void {
  const latest = useRef({ onEscape, active });
  latest.current = { onEscape, active };
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !latest.current.active) return;
      e.preventDefault();
      latest.current.onEscape();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
